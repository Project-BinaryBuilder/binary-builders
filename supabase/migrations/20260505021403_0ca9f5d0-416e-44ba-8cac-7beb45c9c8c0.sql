
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'teacher', 'student');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  class_grade INT,
  class_range_min INT,
  class_range_max INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- get current user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Profile policies
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Super admin views all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Super admin updates all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin inserts profiles" ON public.profiles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR auth.uid() = id);
CREATE POLICY "Super admin deletes profiles" ON public.profiles FOR DELETE USING (public.has_role(auth.uid(), 'super_admin'));

-- user_roles policies
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admin views all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin manages roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Trigger: auto profile + first user becomes super admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count INT;
  v_username TEXT;
  v_role public.app_role;
  v_grade INT;
  v_range_min INT;
  v_range_max INT;
BEGIN
  v_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'student');
  v_grade := NULLIF(NEW.raw_user_meta_data->>'class_grade','')::INT;
  v_range_min := NULLIF(NEW.raw_user_meta_data->>'class_range_min','')::INT;
  v_range_max := NULLIF(NEW.raw_user_meta_data->>'class_range_max','')::INT;

  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    v_role := 'super_admin';
  END IF;

  INSERT INTO public.profiles (id, username, full_name, class_grade, class_range_min, class_range_max)
  VALUES (NEW.id, v_username, NEW.raw_user_meta_data->>'full_name', v_grade, v_range_min, v_range_max);

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Notices
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads notices" ON public.notices FOR SELECT USING (true);
CREATE POLICY "Super admin writes notices" ON public.notices FOR ALL USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Super admin writes events" ON public.events FOR ALL USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
