-- Create User Role RPC Function
-- This function creates a new user role and returns the created role

CREATE OR REPLACE FUNCTION public.create_user_role(
  p_business_id uuid,
  p_name text,
  p_description text,
  p_created_by uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  business_id uuid,
  name text,
  description text,
  is_default boolean,
  created_at timestamptz,
  updated_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_role_id uuid;
BEGIN
  -- Validate input parameters
  IF p_business_id IS NULL THEN
    RAISE EXCEPTION 'Business ID cannot be null';
  END IF;
  
  IF p_name IS NULL OR p_name = '' THEN
    RAISE EXCEPTION 'Role name cannot be empty';
  END IF;
  
  IF p_description IS NULL OR p_description = '' THEN
    RAISE EXCEPTION 'Role description cannot be empty';
  END IF;

  -- Check if user has permission to create roles for this business
  IF NOT EXISTS (
    SELECT 1 FROM public.business_users 
    WHERE business_users.business_id = p_business_id 
    AND business_users.user_id = auth.uid() 
    AND business_users.role = 'admin'
    AND business_users.is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Only business admins can create roles';
  END IF;

  -- Check if role name already exists for this business
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.business_id = p_business_id 
    AND LOWER(user_roles.name) = LOWER(p_name)
  ) THEN
    RAISE EXCEPTION 'Role name "%" already exists for this business', p_name;
  END IF;

  -- Insert the new role
  INSERT INTO public.user_roles (
    business_id,
    name,
    description,
    is_default
  ) VALUES (
    p_business_id,
    p_name,
    p_description,
    false
  ) RETURNING user_roles.id INTO new_role_id;

  -- Return the created role
  RETURN QUERY
  SELECT 
    ur.id,
    ur.business_id,
    ur.name,
    ur.description,
    ur.is_default,
    ur.created_at,
    ur.updated_at
  FROM public.user_roles ur
  WHERE ur.id = new_role_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_role(uuid, text, text, uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.create_user_role(uuid, text, text, uuid) IS 
'Creates a new user role for a business. Only business admins can create roles. Returns the created role data.';

-- Create helper function to get role with permissions
CREATE OR REPLACE FUNCTION public.get_role_with_permissions(role_id_param uuid)
RETURNS TABLE (
  id uuid,
  business_id uuid,
  name text,
  description text,
  is_default boolean,
  permissions jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has permission to view this role
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.business_users bu ON bu.business_id = ur.business_id
    WHERE ur.id = role_id_param
    AND bu.user_id = auth.uid() 
    AND bu.is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: You do not have permission to view this role';
  END IF;

  RETURN QUERY
  SELECT 
    ur.id,
    ur.business_id,
    ur.name,
    ur.description,
    ur.is_default,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', up.id,
          'resource', up.resource,
          'action', up.action
        )
      ) FILTER (WHERE up.id IS NOT NULL),
      '[]'::jsonb
    ) as permissions,
    ur.created_at,
    ur.updated_at
  FROM public.user_roles ur
  LEFT JOIN public.user_permissions up ON up.role_id = ur.id
  WHERE ur.id = role_id_param
  GROUP BY ur.id, ur.business_id, ur.name, ur.description, ur.is_default, ur.created_at, ur.updated_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_role_with_permissions(uuid) TO authenticated; 