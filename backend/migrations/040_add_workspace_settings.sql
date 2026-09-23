```sql
-- ============================================
-- DRV STUDIOS WEDDING CRM
-- Migration: 040_add_workspace_settings.sql
-- Description: Add notification mode, logo URL, and other settings to workspace table
-- Created: 2026-09-20
-- ============================================

-- Add notification_mode field
ALTER TABLE workspace 
ADD COLUMN IF NOT EXISTS notification_mode VARCHAR(20) DEFAULT 'email' 
CHECK (notification_mode IN ('email', 'whatsapp', 'both'));

-- Add logo_url field
ALTER TABLE workspace 
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);

-- Add crew_assignment_days field for automation rules
ALTER TABLE workspace 
ADD COLUMN IF NOT EXISTS crew_assignment_days INTEGER DEFAULT 10 CHECK (crew_assignment_days > 0);

-- Add whatsapp_enabled field
ALTER TABLE workspace 
ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT false;

-- Add email_formats_count field
ALTER TABLE workspace 
ADD COLUMN IF NOT EXISTS email_formats_count INTEGER DEFAULT 16 CHECK (email_formats_count >= 0);

-- Update existing DRV Studios workspace with default values
UPDATE workspace 
SET 
    notification_mode = 'email',
    logo_url = '/assests/images/drv.jpg',
    crew_assignment_days = 10,
    whatsapp_enabled = false,
    email_formats_count = 16
WHERE company_name = 'DRV Studios';

-- Add index for notification_mode for better query performance
CREATE INDEX IF NOT EXISTS idx_workspace_notification_mode 
ON workspace(notification_mode);
```