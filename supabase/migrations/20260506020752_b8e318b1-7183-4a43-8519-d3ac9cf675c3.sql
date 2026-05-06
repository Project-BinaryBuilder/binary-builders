
CREATE TYPE public.pdf_audience AS ENUM ('student', 'teacher');

CREATE TABLE public.feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads flags" ON public.feature_flags FOR SELECT USING (true);
CREATE POLICY "Super admin writes flags" ON public.feature_flags FOR ALL
  USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));

INSERT INTO public.feature_flags (key, enabled) VALUES
  ('notices', true), ('events', true), ('content_library', true), ('examinations', true);

CREATE TABLE public.content_pdfs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audience public.pdf_audience NOT NULL,
  grade INT NOT NULL CHECK (grade BETWEEN 4 AND 7),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.content_pdfs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin manages pdfs" ON public.content_pdfs FOR ALL
  USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Students read student pdfs for their grade" ON public.content_pdfs FOR SELECT
  USING (audience = 'student' AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.class_grade = content_pdfs.grade
  ));

CREATE POLICY "Teachers read teacher pdfs within their range" ON public.content_pdfs FOR SELECT
  USING (audience = 'teacher' AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND content_pdfs.grade BETWEEN p.class_range_min AND p.class_range_max
  ));

INSERT INTO storage.buckets (id, name, public) VALUES ('pdfs', 'pdfs', false);

CREATE POLICY "Super admin manages pdf files" ON storage.objects FOR ALL
  USING (bucket_id = 'pdfs' AND has_role(auth.uid(), 'super_admin'))
  WITH CHECK (bucket_id = 'pdfs' AND has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Students read student grade pdf files" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'pdfs' AND (storage.foldername(name))[1] = 'student'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND (storage.foldername(name))[2] = ('grade-' || p.class_grade))
  );

CREATE POLICY "Teachers read teacher grade pdf files" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'pdfs' AND (storage.foldername(name))[1] = 'teacher'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.class_range_min IS NOT NULL
      AND CAST(REPLACE((storage.foldername(name))[2], 'grade-', '') AS INT)
          BETWEEN p.class_range_min AND p.class_range_max)
  );

CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  grade INT NOT NULL CHECK (grade BETWEEN 4 AND 7),
  is_active BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin manages exams" ON public.exams FOR ALL
  USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Students see active exams for their grade" ON public.exams FOR SELECT
  USING (is_active = true AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.class_grade = exams.grade
  ));
CREATE POLICY "Teachers see exams in their range" ON public.exams FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND exams.grade BETWEEN p.class_range_min AND p.class_range_max
  ));

CREATE TABLE public.exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  q_position INT NOT NULL DEFAULT 0,
  prompt TEXT NOT NULL,
  choices JSONB NOT NULL,
  correct_index INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin manages questions" ON public.exam_questions FOR ALL
  USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE TABLE public.exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  score INT,
  total INT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  UNIQUE (exam_id, student_id)
);
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin views attempts" ON public.exam_attempts FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Teachers view attempts in range" ON public.exam_attempts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.exams e JOIN public.profiles p ON p.id = auth.uid()
    WHERE e.id = exam_attempts.exam_id
      AND e.grade BETWEEN p.class_range_min AND p.class_range_max
  ));

CREATE TABLE public.exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  selected_index INT NOT NULL,
  is_correct BOOLEAN
);
ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin views answers" ON public.exam_answers FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

CREATE OR REPLACE FUNCTION public.get_exam_for_student(_exam_id UUID)
RETURNS TABLE(id UUID, q_position INT, prompt TEXT, choices JSONB)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.exams e JOIN public.profiles p ON p.id = auth.uid()
    WHERE e.id = _exam_id AND e.is_active = true AND e.grade = p.class_grade
  ) THEN
    RAISE EXCEPTION 'Exam not available';
  END IF;
  RETURN QUERY
  SELECT q.id, q.q_position, q.prompt, q.choices FROM public.exam_questions q
  WHERE q.exam_id = _exam_id ORDER BY q.q_position;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_exam_attempt(_exam_id UUID, _answers JSONB)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _student UUID := auth.uid();
  _attempt_id UUID;
  _q RECORD;
  _sel INT;
  _correct INT := 0;
  _total INT := 0;
BEGIN
  IF _student IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.exams e JOIN public.profiles p ON p.id = _student
    WHERE e.id = _exam_id AND e.is_active = true AND e.grade = p.class_grade
  ) THEN
    RAISE EXCEPTION 'Exam not available';
  END IF;
  IF EXISTS (SELECT 1 FROM public.exam_attempts WHERE exam_id = _exam_id AND student_id = _student AND submitted_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Already submitted';
  END IF;

  INSERT INTO public.exam_attempts (exam_id, student_id) VALUES (_exam_id, _student)
    ON CONFLICT (exam_id, student_id) DO UPDATE SET started_at = exam_attempts.started_at
    RETURNING id INTO _attempt_id;

  FOR _q IN SELECT id, correct_index FROM public.exam_questions WHERE exam_id = _exam_id LOOP
    _total := _total + 1;
    _sel := COALESCE((_answers ->> _q.id::text)::INT, -1);
    INSERT INTO public.exam_answers (attempt_id, question_id, selected_index, is_correct)
    VALUES (_attempt_id, _q.id, _sel, _sel = _q.correct_index);
    IF _sel = _q.correct_index THEN _correct := _correct + 1; END IF;
  END LOOP;

  UPDATE public.exam_attempts SET score = _correct, total = _total, submitted_at = now()
    WHERE id = _attempt_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_submitted(_exam_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.exam_attempts
    WHERE exam_id = _exam_id AND student_id = auth.uid() AND submitted_at IS NOT NULL
  );
$$;
