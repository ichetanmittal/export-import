-- Create user_connections table to store relationships between importers and exporters
CREATE TABLE IF NOT EXISTS user_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  importer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(importer_id, exporter_id)
);

-- Create connection_invitations table for pending invitations
CREATE TABLE IF NOT EXISTS connection_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL,
  receiver_email VARCHAR(255) NOT NULL,
  receiver_role VARCHAR(50) NOT NULL CHECK (receiver_role IN ('importer', 'exporter')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sender_id, receiver_email)
);

-- Create indexes for better query performance
CREATE INDEX idx_user_connections_importer ON user_connections(importer_id);
CREATE INDEX idx_user_connections_exporter ON user_connections(exporter_id);
CREATE INDEX idx_connection_invitations_sender ON connection_invitations(sender_id);
CREATE INDEX idx_connection_invitations_receiver ON connection_invitations(receiver_id);
CREATE INDEX idx_connection_invitations_email ON connection_invitations(receiver_email);
CREATE INDEX idx_connection_invitations_status ON connection_invitations(status);

-- Disable RLS since we use custom JWT authentication
ALTER TABLE user_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE connection_invitations DISABLE ROW LEVEL SECURITY;
