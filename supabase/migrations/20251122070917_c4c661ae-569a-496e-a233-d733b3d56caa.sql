-- Step 1: Create user_roles table with proper security
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 2: Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT exists (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Step 3: Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 4: Update RLS policies to use has_role function

-- Update courses policies
DROP POLICY IF EXISTS "Admins can create courses" ON public.courses;
CREATE POLICY "Admins can create courses"
  ON public.courses FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Instructors can update their courses" ON public.courses;
CREATE POLICY "Instructors can update their courses"
  ON public.courses FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Update lessons policies
DROP POLICY IF EXISTS "Instructors can manage lessons" ON public.lessons;
CREATE POLICY "Instructors can manage lessons"
  ON public.lessons FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Update assignments policies
DROP POLICY IF EXISTS "Instructors can manage assignments" ON public.assignments;
CREATE POLICY "Instructors can manage assignments"
  ON public.assignments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Update submissions grading policy
DROP POLICY IF EXISTS "Instructors can grade submissions" ON public.submissions;
CREATE POLICY "Instructors can grade submissions"
  ON public.submissions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Step 5: Create helper function to assign admin role
CREATE OR REPLACE FUNCTION public.assign_admin_role(_user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
BEGIN
  -- Get user ID from email
  SELECT id INTO _user_id FROM auth.users WHERE email = _user_email;
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', _user_email;
  END IF;
  
  -- Insert admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;