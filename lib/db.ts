import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'data', 'database.sqlite');

declare global {
  // eslint-disable-next-line no-var
  var db: Database.Database | undefined;
}

const db = global.db || new Database(dbPath);

if (process.env.NODE_ENV !== 'production') {
  global.db = db;
}

// Enable foreign keys and WAL mode
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Ensure basic tables exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    image TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    user_id TEXT DEFAULT 'global',
    key TEXT, 
    value TEXT,
    PRIMARY KEY(user_id, key),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS degree_categories (
    user_id TEXT DEFAULT 'global',
    id TEXT, 
    name TEXT, 
    required INTEGER,
    PRIMARY KEY(user_id, id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS degree_courses (
    user_id TEXT DEFAULT 'global',
    category_id TEXT, 
    course_code TEXT, 
    PRIMARY KEY(user_id, category_id, course_code),
    FOREIGN KEY(user_id, category_id) REFERENCES degree_categories(user_id, id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT DEFAULT 'global',
    title TEXT NOT NULL,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    type TEXT NOT NULL,
    region TEXT NOT NULL,
    dateStr TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS completed_courses (
    user_id TEXT DEFAULT 'global',
    course_code TEXT, 
    grade TEXT,
    PRIMARY KEY(user_id, course_code),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS courses (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    credit INTEGER NOT NULL,
    day TEXT,
    time TEXT,
    room TEXT,
    examDate TEXT,
    examTime TEXT
  );

  CREATE TABLE IF NOT EXISTS planner_courses (
    user_id TEXT DEFAULT 'global',
    course_code TEXT,
    PRIMARY KEY(user_id, course_code),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

export default db;
