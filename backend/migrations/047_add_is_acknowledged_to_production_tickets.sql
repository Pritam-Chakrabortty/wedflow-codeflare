-- Migration 047: Add is_acknowledged column to production_tickets
ALTER TABLE production_tickets ADD COLUMN IF NOT EXISTS is_acknowledged BOOLEAN DEFAULT false;

