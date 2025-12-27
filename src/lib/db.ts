import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'flashcards.db');
const db = new Database(dbPath);

// Initialize database schema
export function initDatabase() {
  // Create folders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Create flashcards table
  db.exec(`
    CREATE TABLE IF NOT EXISTS flashcards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      imageUrl TEXT NOT NULL,
      thumbUrl TEXT,
      notes TEXT DEFAULT '',
      folderId INTEGER,
      starred INTEGER DEFAULT 0,
      lastVisited INTEGER,
      createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE SET NULL
    )
  `);
  
  // Add new columns if they don't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE flashcards ADD COLUMN starred INTEGER DEFAULT 0`);
  } catch (e) {
    // Column already exists, ignore
  }
  try {
    db.exec(`ALTER TABLE flashcards ADD COLUMN lastVisited INTEGER`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_flashcards_folderId ON flashcards(folderId);
    CREATE INDEX IF NOT EXISTS idx_flashcards_createdAt ON flashcards(createdAt);
    CREATE INDEX IF NOT EXISTS idx_flashcards_starred ON flashcards(starred);
    CREATE INDEX IF NOT EXISTS idx_flashcards_lastVisited ON flashcards(lastVisited);
  `);
}

// Initialize on import
initDatabase();

// Folder operations
export const folders = {
  create: (name: string) => {
    const stmt = db.prepare('INSERT INTO folders (name) VALUES (?)');
    const result = stmt.run(name);
    return { id: result.lastInsertRowid as number, name, createdAt: Date.now() };
  },
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM folders ORDER BY createdAt DESC');
    return stmt.all() as Array<{ id: number; name: string; createdAt: number }>;
  },
  getById: (id: number) => {
    const stmt = db.prepare('SELECT * FROM folders WHERE id = ?');
    return stmt.get(id) as { id: number; name: string; createdAt: number } | undefined;
  },
  update: (id: number, name: string) => {
    const stmt = db.prepare('UPDATE folders SET name = ? WHERE id = ?');
    stmt.run(name, id);
  },
  delete: (id: number) => {
    const stmt = db.prepare('DELETE FROM folders WHERE id = ?');
    stmt.run(id);
  },
};

// Flashcard operations
export const flashcards = {
  create: (imageUrl: string, notes: string = '', folderId: number | null = null, thumbUrl?: string) => {
    const stmt = db.prepare('INSERT INTO flashcards (imageUrl, thumbUrl, notes, folderId, starred) VALUES (?, ?, ?, ?, 0)');
    const result = stmt.run(imageUrl, thumbUrl || null, notes, folderId);
    return { 
      id: result.lastInsertRowid as number, 
      imageUrl, 
      thumbUrl: thumbUrl || null, 
      notes, 
      folderId, 
      starred: 0,
      lastVisited: null,
      createdAt: Date.now() 
    };
  },
  getAll: (folderId?: number | null, starred?: boolean, dateFilter?: string) => {
    let query = 'SELECT * FROM flashcards WHERE 1=1';
    const params: any[] = [];
    
    if (folderId !== null && folderId !== undefined) {
      query += ' AND folderId = ?';
      params.push(folderId);
    }
    
    if (starred === true) {
      query += ' AND starred = 1';
    }
    
    if (dateFilter) {
      // dateFilter format: "YYYY-MM-DD"
      const startOfDay = new Date(dateFilter).setHours(0, 0, 0, 0) / 1000;
      const endOfDay = new Date(dateFilter).setHours(23, 59, 59, 999) / 1000;
      query += ' AND lastVisited >= ? AND lastVisited <= ?';
      params.push(startOfDay, endOfDay);
    }
    
    query += ' ORDER BY createdAt DESC';
    
    const stmt = db.prepare(query);
    return stmt.all(...params) as Array<{
      id: number;
      imageUrl: string;
      thumbUrl: string | null;
      notes: string;
      folderId: number | null;
      starred: number;
      lastVisited: number | null;
      createdAt: number;
    }>;
  },
  
  getStarred: () => {
    const stmt = db.prepare('SELECT * FROM flashcards WHERE starred = 1 ORDER BY createdAt DESC');
    return stmt.all() as Array<{
      id: number;
      imageUrl: string;
      thumbUrl: string | null;
      notes: string;
      folderId: number | null;
      starred: number;
      lastVisited: number | null;
      createdAt: number;
    }>;
  },
  
  getByDate: (date: string) => {
    // date format: "YYYY-MM-DD"
    const startOfDay = new Date(date).setHours(0, 0, 0, 0) / 1000;
    const endOfDay = new Date(date).setHours(23, 59, 59, 999) / 1000;
    const stmt = db.prepare('SELECT * FROM flashcards WHERE lastVisited >= ? AND lastVisited <= ? ORDER BY lastVisited DESC');
    return stmt.all(startOfDay, endOfDay) as Array<{
      id: number;
      imageUrl: string;
      thumbUrl: string | null;
      notes: string;
      folderId: number | null;
      starred: number;
      lastVisited: number | null;
      createdAt: number;
    }>;
  },
  
  getVisitedDates: () => {
    const stmt = db.prepare(`
      SELECT DISTINCT date(lastVisited, 'unixepoch') as visitDate 
      FROM flashcards 
      WHERE lastVisited IS NOT NULL 
      ORDER BY visitDate DESC
    `);
    return stmt.all() as Array<{ visitDate: string }>;
  },
  getById: (id: number) => {
    const stmt = db.prepare('SELECT * FROM flashcards WHERE id = ?');
    return stmt.get(id) as {
      id: number;
      imageUrl: string;
      thumbUrl: string | null;
      notes: string;
      folderId: number | null;
      starred: number;
      lastVisited: number | null;
      createdAt: number;
    } | undefined;
  },
  update: (id: number, updates: { notes?: string; folderId?: number | null; starred?: boolean; lastVisited?: number }) => {
    if (updates.notes !== undefined) {
      const stmt = db.prepare('UPDATE flashcards SET notes = ? WHERE id = ?');
      stmt.run(updates.notes, id);
    }
    if (updates.folderId !== undefined) {
      const stmt = db.prepare('UPDATE flashcards SET folderId = ? WHERE id = ?');
      stmt.run(updates.folderId, id);
    }
    if (updates.starred !== undefined) {
      const stmt = db.prepare('UPDATE flashcards SET starred = ? WHERE id = ?');
      stmt.run(updates.starred ? 1 : 0, id);
    }
    if (updates.lastVisited !== undefined) {
      const stmt = db.prepare('UPDATE flashcards SET lastVisited = ? WHERE id = ?');
      stmt.run(updates.lastVisited, id);
    }
  },
  toggleStar: (id: number) => {
    const card = flashcards.getById(id);
    if (!card) return null;
    const newStarred = (card.starred === 1) ? 0 : 1;
    const stmt = db.prepare('UPDATE flashcards SET starred = ? WHERE id = ?');
    stmt.run(newStarred, id);
    const updatedCard = flashcards.getById(id);
    return updatedCard || null;
  },
  delete: (id: number) => {
    const stmt = db.prepare('DELETE FROM flashcards WHERE id = ?');
    stmt.run(id);
  },
  count: (folderId?: number | null) => {
    if (folderId === null || folderId === undefined) {
      const stmt = db.prepare('SELECT COUNT(*) as count FROM flashcards');
      return (stmt.get() as { count: number }).count;
    }
    const stmt = db.prepare('SELECT COUNT(*) as count FROM flashcards WHERE folderId = ?');
    return (stmt.get(folderId) as { count: number }).count;
  },
};

export default db;

