-- Migration: Create lead_activities table for DRV Studios Wedding CRM
-- Description: Track all interactions and activities with leads
-- Created: 2026-10-06

-- ============================================
-- LEAD ACTIVITIES TABLE
-- ============================================
CREATE TABLE lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'note', 'reminder', 'follow_up', 'proposal_sent', 'status_change')),
    description TEXT,
    outcome VARCHAR(255),
    next_follow_up_date DATE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX idx_lead_activities_activity_type ON lead_activities(activity_type);
CREATE INDEX idx_lead_activities_created_at ON lead_activities(created_at);
CREATE INDEX idx_lead_activities_next_follow_up ON lead_activities(next_follow_up_date);
