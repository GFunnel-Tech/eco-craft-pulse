-- Create sync_logs table for N8N/Lightspeed integration tracking
CREATE TABLE public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  source TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  local_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  payload JSONB,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage sync logs
CREATE POLICY "Admins can manage sync logs"
ON public.sync_logs
FOR ALL
USING (is_admin());

-- Create index for faster queries
CREATE INDEX idx_sync_logs_event_type ON public.sync_logs(event_type);
CREATE INDEX idx_sync_logs_status ON public.sync_logs(status);
CREATE INDEX idx_sync_logs_created_at ON public.sync_logs(created_at DESC);

-- Enable realtime for monitoring
ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_logs;