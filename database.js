
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('borrowbook.db');

export async function initializeDatabase() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      category TEXT NOT NULL,
      isbn TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('BorrowBook database initialized successfully!');
}

export async function addBook(title, author, category, isbn) {
  await db.runAsync(
    `INSERT INTO books (title, author, category, isbn)
     VALUES (?, ?, ?, ?);`,
    [title, author, category, isbn || null]
  );
}

export async function getBooks() {
  return await db.getAllAsync(
    'SELECT * FROM books ORDER BY id DESC;'
  );
}


export async function updateBook(id, title, author, category, isbn) {
  await db.runAsync(
    `UPDATE books
     SET title = ?, author = ?, category = ?, isbn = ?
     WHERE id = ?;`,
    [title, author, category, isbn || null, id]
  );
}

export async function deleteBook(id) {
  await db.runAsync(
    'DELETE FROM books WHERE id = ?;',
    [id]
  );
}
