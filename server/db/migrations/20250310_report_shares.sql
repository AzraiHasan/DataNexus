-- Migration: Create report_shares table for collaborative features

-- Create table for report sharing
CREATE TABLE IF NOT EXISTS report_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES users(id),
  shared_with UUID REFERENCES users(id),
  access_level TEXT NOT NULL CHECK (access_level IN ('viewer', 'editor', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure a user can't share a report with themselves
  CONSTRAINT no_self_share CHECK (shared_by != shared_with),
  
  -- Ensure unique shares (one user can only have one access level to a report)
  CONSTRAINT unique_report_share UNIQUE (report_id, shared_with)
);

-- Create index for faster lookups
CREATE INDEX idx_report_shares_report_id ON report_shares(report_id);
CREATE INDEX idx_report_shares_shared_with ON report_shares(shared_with);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_report_shares_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row update
CREATE TRIGGER update_report_shares_updated_at
BEFORE UPDATE ON report_shares
FOR EACH ROW
EXECUTE FUNCTION update_report_shares_updated_at();

-- Create RLS (Row Level Security) policies
ALTER TABLE report_shares ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow users to see shares they created or shares they have access to
CREATE POLICY report_shares_select_policy ON report_shares 
  FOR SELECT USING (
    shared_by = auth.uid() OR 
    shared_with = auth.uid() OR
    EXISTS (
      SELECT 1 FROM reports r 
      WHERE r.id = report_id AND r.created_by = auth.uid()
    )
  );

-- Policy: Only report owners or company admins can create shares
CREATE POLICY report_shares_insert_policy ON report_shares 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM reports r 
      WHERE r.id = report_id AND r.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN reports r ON p.company_id = r.company_id
      WHERE p.id = auth.uid() AND r.id = report_id AND p.role = 'admin'
    )
  );

-- Policy: Only the person who created the share can update it
CREATE POLICY report_shares_update_policy ON report_shares 
  FOR UPDATE USING (
    shared_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM reports r 
      WHERE r.id = report_id AND r.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN reports r ON p.company_id = r.company_id
      WHERE p.id = auth.uid() AND r.id = report_id AND p.role = 'admin'
    )
  );

-- Policy: Only the share creator, report owner, or company admin can delete a share
CREATE POLICY report_shares_delete_policy ON report_shares 
  FOR DELETE USING (
    shared_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM reports r 
      WHERE r.id = report_id AND r.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN reports r ON p.company_id = r.company_id
      WHERE p.id = auth.uid() AND r.id = report_id AND p.role = 'admin'
    )
  );

-- Create view for easier querying of shared reports with user information
CREATE OR REPLACE VIEW shared_reports_view AS
SELECT 
  rs.id,
  rs.report_id,
  rs.access_level,
  rs.expires_at,
  rs.created_at,
  r.title as report_title,
  r.report_type,
  shared_by.email as shared_by_email,
  shared_by.full_name as shared_by_name,
  shared_with.email as shared_with_email,
  shared_with.full_name as shared_with_name
FROM 
  report_shares rs
JOIN 
  reports r ON rs.report_id = r.id
JOIN 
  profiles shared_by ON rs.shared_by = shared_by.id
JOIN 
  profiles shared_with ON rs.shared_with = shared_with.id;
