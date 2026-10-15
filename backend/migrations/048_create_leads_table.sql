-- Migration: Create leads table for DRV Studios Wedding CRM
-- Description: Lead management for tracking potential clients before booking
-- Created: 2026-10-06

-- ============================================
-- LEADS TABLE
-- ============================================
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(255),
    event_date DATE,
    event_type VARCHAR(100),
    venue VARCHAR(255),
    estimated_budget DECIMAL(12,2),
    source VARCHAR(100) DEFAULT 'direct' CHECK (source IN ('direct', 'referral', 'social_media', 'website', 'advertisement', 'wedding_expo', 'other')),
    status VARCHAR(30) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'follow_up', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost', 'inactive')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    notes TEXT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    converted_to_client_id UUID REFERENCES client(id) ON DELETE SET NULL,
    converted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_leads_workspace_id ON leads(workspace_id);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_priority ON leads(priority);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_event_date ON leads(event_date);
CREATE INDEX idx_leads_created_at ON leads(created_at);

-- ============================================
-- TRIGGER FOR UPDATED_AT TIMESTAMP
-- ============================================
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_leads_updated_at();
