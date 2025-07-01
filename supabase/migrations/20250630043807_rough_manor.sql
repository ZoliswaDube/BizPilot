/*
  # Fix user signup trigger with robust error handling

  1. Enhanced Error Handling
    - Add proper null checks for JSON fields
    - Handle constraint violations gracefully
    - Add fallback values for required fields
    - Add exception handling with logging

  2. Fixes Applied
    - Prevent JSON operator errors on null metadata
    - Handle duplicate user_id scenarios
    - Ensure email field is never null
    - Add proper error logging
*/

-- Drop existing triggers to recreate them
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Function to handle new user registration (robust version)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_email text;
    user_full_name text;
    user_avatar_url text;
    user_provider text;
    user_email_verified boolean;
BEGIN
    -- Set search path explicitly
    SET search_path = public;
    
    -- Extract and validate email (required field)
    user_email := COALESCE(NEW.email, '');
    IF user_email = '' THEN
        RAISE LOG 'handle_new_user: Email is empty for user %', NEW.id;
        RETURN NEW; -- Continue without creating profile if no email
    END IF;
    
    -- Safely extract metadata with null checks
    user_full_name := NULL;
    user_avatar_url := NULL;
    user_provider := 'email';
    
    -- Extract full name from metadata
    IF NEW.raw_user_meta_data IS NOT NULL THEN
        user_full_name := COALESCE(
            NEW.raw_user_meta_data->>'full_name', 
            NEW.raw_user_meta_data->>'name'
        );
        user_avatar_url := NEW.raw_user_meta_data->>'avatar_url';
    END IF;
    
    -- Extract provider from app metadata
    IF NEW.app_metadata IS NOT NULL THEN
        user_provider := CASE 
            WHEN NEW.app_metadata->>'provider' = 'google' THEN 'google'
            WHEN NEW.app_metadata->>'provider' = 'github' THEN 'github'
            ELSE 'email'
        END;
    END IF;
    
    -- Determine email verification status
    user_email_verified := (NEW.email_confirmed_at IS NOT NULL);
    
    -- Insert user profile with error handling
    BEGIN
        INSERT INTO public.user_profiles (
            user_id,
            email,
            full_name,
            avatar_url,
            provider,
            email_verified
        ) VALUES (
            NEW.id,
            user_email,
            user_full_name,
            user_avatar_url,
            user_provider,
            user_email_verified
        );
        
        RAISE LOG 'handle_new_user: Successfully created profile for user % with email %', NEW.id, user_email;
        
    EXCEPTION 
        WHEN unique_violation THEN
            RAISE LOG 'handle_new_user: Profile already exists for user %', NEW.id;
            -- Update existing profile instead
            UPDATE public.user_profiles
            SET
                email = user_email,
                full_name = COALESCE(user_full_name, full_name),
                avatar_url = COALESCE(user_avatar_url, avatar_url),
                provider = user_provider,
                email_verified = user_email_verified,
                updated_at = now()
            WHERE user_id = NEW.id;
            
        WHEN OTHERS THEN
            RAISE LOG 'handle_new_user: Error creating profile for user %: %', NEW.id, SQLERRM;
            -- Don't fail the auth process, just log the error
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle user updates (robust version)
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS trigger AS $$
BEGIN
    SET search_path = public;
    
    -- Only update if email is not empty
    IF COALESCE(NEW.email, '') != '' THEN
        UPDATE public.user_profiles
        SET
            email = NEW.email,
            email_verified = COALESCE((NEW.email_confirmed_at IS NOT NULL), false),
            updated_at = now()
        WHERE user_id = NEW.id;
        
        RAISE LOG 'handle_user_update: Updated profile for user %', NEW.id;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'handle_user_update: Error updating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW; -- Don't fail the auth process
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- Test the function manually (optional, for debugging)
-- You can run this to test if the function works:
-- SELECT public.handle_new_user();