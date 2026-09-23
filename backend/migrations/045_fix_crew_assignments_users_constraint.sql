-- Migration: Fix crew_assignments staff_id foreign key constraint to reference users table
-- Description: Align crew_assignments staff_id with users table where staff members are defined
-- Created: 2026-09-23

-- Step 1: Update any existing crew_assignments referencing staff.id to reference staff.user_id
UPDATE crew_assignments ca
SET staff_id = s.user_id
FROM staff s
WHERE ca.staff_id = s.id AND s.user_id IS NOT NULL;

-- Step 2: Delete orphan assignments that do not match valid users
DELETE FROM crew_assignments
WHERE staff_id NOT IN (SELECT id FROM users);

-- Step 3: Drop existing constraint referencing staff table
ALTER TABLE crew_assignments DROP CONSTRAINT IF EXISTS crew_assignments_staff_id_fkey;

-- Step 4: Add foreign key constraint referencing users table
ALTER TABLE crew_assignments
ADD CONSTRAINT crew_assignments_staff_id_fkey
FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE;

