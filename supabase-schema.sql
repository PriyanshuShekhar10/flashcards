-- Supabase Database Schema for Flashcards App
-- Run this SQL in your Supabase SQL Editor

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id SERIAL PRIMARY KEY,
  "imageUrl" TEXT NOT NULL,
  "thumbUrl" TEXT,
  notes TEXT DEFAULT '',
  "folderId" INTEGER REFERENCES folders(id) ON DELETE SET NULL,
  starred INTEGER DEFAULT 0,
  "lastVisited" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_flashcards_folderId ON flashcards("folderId");
CREATE INDEX IF NOT EXISTS idx_flashcards_createdAt ON flashcards("createdAt");
CREATE INDEX IF NOT EXISTS idx_flashcards_starred ON flashcards(starred);
CREATE INDEX IF NOT EXISTS idx_flashcards_lastVisited ON flashcards("lastVisited");

-- Enable Row Level Security (RLS) - for now, allow all operations
-- You can add RLS policies later if you add authentication
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (since we don't have auth yet)
CREATE POLICY "Allow all operations on folders" ON folders
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on flashcards" ON flashcards
  FOR ALL USING (true) WITH CHECK (true);

