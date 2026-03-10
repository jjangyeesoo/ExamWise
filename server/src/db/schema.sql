-- server/src/db/schema.sql

-- Create base tables if they don't exist
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create PMP questions table
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number INTEGER, -- Follows the max numbering sequence
  type TEXT NOT NULL, -- 'SINGLE' or 'MULTIPLE'
  category TEXT NOT NULL,
  question_en TEXT NOT NULL,
  question_ko TEXT NOT NULL,
  options TEXT NOT NULL, -- Stored as JSON array: ["A...", "B..."]
  answer TEXT NOT NULL, -- Stored as JSON array: ["A"] or ["B", "D"]
  explanation TEXT,
  keywords TEXT, -- Stored as JSON array: ["keyword1", "keyword2"]
  is_deleted INTEGER DEFAULT 0, -- Soft delete flag (0=active, 1=deleted)
  is_bookmarked INTEGER DEFAULT 0, -- Bookmark flag (0=normal, 1=bookmarked)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
