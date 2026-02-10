-- Add public access fields to materials table
ALTER TABLE materials ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE materials ADD COLUMN share_id UUID DEFAULT gen_random_uuid();

-- Policy to allow anyone to read public materials
CREATE POLICY "Public materials are viewable by everyone"
ON materials FOR SELECT
USING (is_public = true);

-- Index for faster lookups
CREATE INDEX materials_share_id_idx ON materials (share_id);
