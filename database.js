
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

  // Add the borrowings table here
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS borrowings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookId INTEGER NOT NULL,
      borrowerName TEXT NOT NULL,
      borrowerContact TEXT,
      borrowedDate TEXT NOT NULL,
      dueDate TEXT NOT NULL,
      returnDate TEXT,
      status TEXT DEFAULT 'Borrowed'
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


export async function addBorrowing(
  bookId,
  borrowerName,
  borrowerContact,
  borrowedDate,
  dueDate
) {
  await db.runAsync(
    `INSERT INTO borrowings
     (bookId, borrowerName, borrowerContact, borrowedDate, dueDate)
     VALUES (?, ?, ?, ?, ?);`,
    [
      bookId,
      borrowerName,
      borrowerContact || null,
      borrowedDate,
      dueDate,
    ]
  );
}


export async function getAvailableBooks() {
  return await db.getAllAsync(`
    SELECT * FROM books
    WHERE id NOT IN (
      SELECT bookId FROM borrowings
      WHERE status = 'Borrowed'
    )
    ORDER BY title ASC;
  `);
}
