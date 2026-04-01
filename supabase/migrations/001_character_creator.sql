-- Characters table
CREATE TABLE characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'analyzed', 'generating', 'completed', 'failed')),
  identity_block JSONB,
  body_block JSONB,
  style_config JSONB,
  turnaround_url TEXT,
  portrait_url TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Photo uploads tracking
CREATE TABLE character_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('face', 'body')),
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('character-photos', 'character-photos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('character-avatars', 'character-avatars', true);

-- RLS policies
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_photos ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for now (MVP)
CREATE POLICY "Allow all on characters" ON characters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on character_photos" ON character_photos FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow upload to character-photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'character-photos');
CREATE POLICY "Allow read character-photos" ON storage.objects FOR SELECT USING (bucket_id = 'character-photos');
CREATE POLICY "Allow upload to character-avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'character-avatars');
CREATE POLICY "Allow read character-avatars" ON storage.objects FOR SELECT USING (bucket_id = 'character-avatars');
