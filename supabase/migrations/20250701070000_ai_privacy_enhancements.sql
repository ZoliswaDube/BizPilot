-- Additional AI Chat Privacy Enhancements
-- Ensures complete isolation of conversations between users

-- Add additional security indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id_updated ON public.ai_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_created ON public.ai_messages(conversation_id, created_at ASC);

-- Add audit trail for conversation access
CREATE TABLE IF NOT EXISTS public.ai_conversation_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL, -- 'create', 'read', 'update', 'delete'
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.ai_conversation_audit ENABLE ROW LEVEL SECURITY;

-- RLS policy for audit table - users can only see their own audit logs
CREATE POLICY "Users can view their own AI audit logs"
  ON public.ai_conversation_audit
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to log AI conversation access
CREATE OR REPLACE FUNCTION public.log_ai_conversation_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log conversation access
  INSERT INTO public.ai_conversation_audit (
    conversation_id,
    user_id,
    action,
    ip_address
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      WHEN TG_OP = 'DELETE' THEN 'delete'
      ELSE 'read'
    END,
    inet_client_addr()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for conversation audit logging
DROP TRIGGER IF EXISTS ai_conversation_audit_trigger ON public.ai_conversations;
CREATE TRIGGER ai_conversation_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.log_ai_conversation_access();

-- Additional constraint to ensure conversation belongs to authenticated user
ALTER TABLE public.ai_conversations 
ADD CONSTRAINT ai_conversations_user_check 
CHECK (user_id IS NOT NULL);

-- Additional constraint to ensure messages have valid conversation
ALTER TABLE public.ai_messages 
ADD CONSTRAINT ai_messages_conversation_check 
CHECK (conversation_id IS NOT NULL);

-- Enhanced RLS policy for conversations with additional checks
DROP POLICY IF EXISTS "Enhanced AI conversation privacy" ON public.ai_conversations;
CREATE POLICY "Enhanced AI conversation privacy"
  ON public.ai_conversations
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND user_id IS NOT NULL
    AND auth.uid() IS NOT NULL
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND user_id IS NOT NULL
    AND auth.uid() IS NOT NULL
  );

-- Enhanced RLS policy for messages with additional conversation ownership check
DROP POLICY IF EXISTS "Enhanced AI message privacy" ON public.ai_messages;
CREATE POLICY "Enhanced AI message privacy"
  ON public.ai_messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = ai_messages.conversation_id 
      AND c.user_id = auth.uid()
      AND c.user_id IS NOT NULL
      AND auth.uid() IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = ai_messages.conversation_id 
      AND c.user_id = auth.uid()
      AND c.user_id IS NOT NULL
      AND auth.uid() IS NOT NULL
    )
  );

-- Function to validate conversation ownership before message insertion
CREATE OR REPLACE FUNCTION public.validate_ai_message_ownership()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure the conversation belongs to the current user
  IF NOT EXISTS (
    SELECT 1 FROM public.ai_conversations 
    WHERE id = NEW.conversation_id 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: You can only add messages to your own conversations';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to validate message ownership
DROP TRIGGER IF EXISTS validate_ai_message_ownership_trigger ON public.ai_messages;
CREATE TRIGGER validate_ai_message_ownership_trigger
  BEFORE INSERT ON public.ai_messages
  FOR EACH ROW EXECUTE FUNCTION public.validate_ai_message_ownership();

-- Function to clean up orphaned conversations (no user_id)
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_ai_conversations()
RETURNS void AS $$
BEGIN
  DELETE FROM public.ai_conversations 
  WHERE user_id IS NULL 
  OR NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = ai_conversations.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON public.ai_conversation_audit TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_ai_conversations() TO service_role;

-- Create view for user's conversation summary (with privacy)
CREATE OR REPLACE VIEW public.user_ai_conversation_summary AS
SELECT 
  c.id,
  c.title,
  c.created_at,
  c.updated_at,
  COUNT(m.id) as message_count,
  MAX(m.created_at) as last_message_at
FROM public.ai_conversations c
LEFT JOIN public.ai_messages m ON c.id = m.conversation_id
WHERE c.user_id = auth.uid()
GROUP BY c.id, c.title, c.created_at, c.updated_at
ORDER BY c.updated_at DESC;

-- RLS for the view
ALTER VIEW public.user_ai_conversation_summary SET (security_barrier = true);
GRANT SELECT ON public.user_ai_conversation_summary TO authenticated;

COMMENT ON TABLE public.ai_conversation_audit IS 'Audit trail for AI conversation access and modifications';
COMMENT ON VIEW public.user_ai_conversation_summary IS 'Privacy-safe summary of user AI conversations';
COMMENT ON FUNCTION public.validate_ai_message_ownership() IS 'Ensures users can only add messages to their own conversations';
COMMENT ON FUNCTION public.cleanup_orphaned_ai_conversations() IS 'Maintenance function to remove orphaned conversations';

-- Insert audit record for this migration
DO $$
BEGIN
  INSERT INTO public.ai_conversation_audit (
    conversation_id,
    user_id,
    action
  ) VALUES (
    NULL,
    auth.uid(),
    'system_upgrade_privacy_enhanced'
  );
EXCEPTION WHEN OTHERS THEN
  -- Ignore if audit table doesn't exist yet or user not authenticated
  NULL;
END $$; 