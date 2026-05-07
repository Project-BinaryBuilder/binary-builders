
-- 1) AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_username TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  summary TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin reads audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin inserts audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR auth.uid() IS NULL);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs (entity, entity_id);

-- 2) AUDIT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.write_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_username TEXT;
  v_entity TEXT := TG_TABLE_NAME;
  v_action TEXT := lower(TG_OP);
  v_id TEXT;
  v_summary TEXT;
  v_meta JSONB;
BEGIN
  SELECT username INTO v_username FROM public.profiles WHERE id = v_actor;

  IF TG_OP = 'DELETE' THEN
    v_id := COALESCE((to_jsonb(OLD)->>'id'), (to_jsonb(OLD)->>'user_id'), (to_jsonb(OLD)->>'key'));
    v_meta := jsonb_build_object('old', to_jsonb(OLD));
    v_summary := 'Deleted ' || v_entity;
  ELSIF TG_OP = 'INSERT' THEN
    v_id := COALESCE((to_jsonb(NEW)->>'id'), (to_jsonb(NEW)->>'user_id'), (to_jsonb(NEW)->>'key'));
    v_meta := jsonb_build_object('new', to_jsonb(NEW));
    v_summary := 'Created ' || v_entity;
  ELSE
    v_id := COALESCE((to_jsonb(NEW)->>'id'), (to_jsonb(NEW)->>'user_id'), (to_jsonb(NEW)->>'key'));
    v_meta := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
    v_summary := 'Updated ' || v_entity;
  END IF;

  -- title hints
  IF v_entity IN ('notices','events','exams','content_pdfs') THEN
    v_summary := v_summary || ' — ' || COALESCE((to_jsonb(COALESCE(NEW, OLD))->>'title'), '');
  ELSIF v_entity = 'feature_flags' THEN
    v_summary := v_summary || ' — ' || COALESCE((to_jsonb(COALESCE(NEW, OLD))->>'key'), '');
  ELSIF v_entity = 'user_roles' THEN
    v_summary := v_summary || ' — role ' || COALESCE((to_jsonb(COALESCE(NEW, OLD))->>'role'), '');
  END IF;

  INSERT INTO public.audit_logs (actor_id, actor_username, action, entity, entity_id, summary, metadata)
  VALUES (v_actor, v_username, v_action, v_entity, v_id, v_summary, v_meta);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 3) ATTACH TRIGGERS
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['user_roles','profiles','notices','events','exams','content_pdfs','feature_flags']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%1$s ON public.%1$s', t);
    EXECUTE format('CREATE TRIGGER audit_%1$s AFTER INSERT OR UPDATE OR DELETE ON public.%1$s FOR EACH ROW EXECUTE FUNCTION public.write_audit()', t);
  END LOOP;
END $$;

-- 4) LOCK DOWN SECURITY DEFINER FUNCTIONS (linter fix)
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_exam_for_student(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.submit_exam_attempt(uuid, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_submitted(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.write_audit() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_exam_for_student(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_exam_attempt(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_submitted(uuid) TO authenticated;
