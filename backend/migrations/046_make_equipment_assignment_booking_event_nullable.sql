-- Migration 046: Allow null booking_event_id in equipment_assignments
ALTER TABLE equipment_assignments ALTER COLUMN booking_event_id DROP NOT NULL;

