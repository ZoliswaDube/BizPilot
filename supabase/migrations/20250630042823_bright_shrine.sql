/*
  # Fix user signup database error

  1. Updates
    - Fix search path issue in handle_new_user function
    - Fix search path issue in handle_user_update function
    - Ensure functions can properly access public schema tables

  2. Changes
    - Add explicit search_path setting in trigger functions
    - This resolves the "Database error saving new user" issue during signup
*/

-- Function to handle new user registration (fixed version)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  SET search_path = public;
  
  INSERT INTO public.user_profiles (
    user_id,
    email,
    full_name,
    avatar_url,
    provider,
    email_verified
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE 
      WHEN NEW.app_metadata->>'provider' = 'google' THEN 'google'
      WHEN NEW.app_metadata->>'provider' = 'github' THEN 'github'
      ELSE 'email'
    END,
    COALESCE((NEW.email_confirmed_at IS NOT NULL), false)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle user updates (fixed version)
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS trigger AS $$
BEGIN
  SET search_path = public;
  
  UPDATE public.user_profiles
  SET
    email = NEW.email,
    email_verified = COALESCE((NEW.email_confirmed_at IS NOT NULL), false),
    updated_at = now()
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;