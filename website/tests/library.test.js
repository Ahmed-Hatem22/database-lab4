const { test, describe, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

process.env.USE_MOCK_DB = 'true';

const libraryDb = require('../src/libraryDb');

let authors;
let books;
let nextAuthorId;
let nextBookId;

const mockCategories = [
  { category_id: 1, name: 'Fiction' },
  { category_id: 2, name: 'Classic Literature' },
  { category_id: 3, name: 'History' },
  { category_id: 4, name: 'Philosophy' }
];

const mockPublishers = [
  { publisher_id: 1, name: 'Dar El Shorouk', country: 'Egypt' },
  { publisher_id: 2, name: 'Penguin Books', country: 'England' },
  { publisher_id: 3, name: 'HarperCollins', country: 'USA' },
  { publisher_id: 4, name: 'Oxford University Press', country: 'England' }
];

libraryDb.execute = async (sql, params = []) => {
  // Category lookups
  if (sql.includes('FROM category ORDER BY')) {
    return [mockCategories, []];
  }

  // Publisher lookups
  if (sql.includes('FROM publisher ORDER BY')) {
    return [mockPublishers, []];
  }

  // F2.3 Reports queries
  if (sql.includes('GROUP BY c.category_id, c.name')) {
    return [[
      { category_id: 1, category_name: 'Fiction', book_count: 5, average_price: 14.50 },
      { category_id: 2, category_name: 'Classic Literature', book_count: 3, average_price: 18.33 }
    ], []];
  }
  if (sql.includes('HAVING COUNT(b.book_id) >= 2')) {
    return [[
      { author_id: 1, author_name: 'Naguib Mahfouz', country: 'Egypt', book_count: 3 },
      { author_id: 2, author_name: 'Jane Austen', country: 'England', book_count: 2 }
    ], []];
  }
  if (sql.includes('COALESCE(SUM(price), 0) AS total_price')) {
    return [[
      { total_price: '185.50', smallest_price: '11.50', largest_price: '25.00' }
    ], []];
  }

  // F2.4 Loans queries
  if (sql.includes('WHERE l.return_date IS NULL')) {
    return [[
      { loan_id: 3, book_title: 'Palace Walk', member_name: 'Mariam Ali', loan_date: '2024-03-01' },
      { loan_id: 5, book_title: 'Palace of Desire', member_name: 'Sara Ibrahim', loan_date: '2024-02-10' }
    ], []];
  }
  if (sql.includes('FROM member m') && sql.includes('WHERE l.loan_id IS NULL')) {
    return [[
      { member_id: 6, member_name: 'Nour Mahmoud', email: 'nour@example.com', join_date: '2023-11-01' }
    ], []];
  }
  if (sql.includes('FROM book b') && sql.includes('WHERE l.loan_id IS NULL')) {
    return [[
      { book_id: 11, title: 'David Copperfield', price: '25.00', publish_year: 1850 }
    ], []];
  }

  // F2.5 Most borrowed queries
  if (sql.includes('GROUP BY b.book_id, b.title') && sql.includes('LIMIT 3')) {
    return [[
      { book_id: 4, title: 'Pride and Prejudice', loan_count: 4 },
      { book_id: 1, title: 'Palace Walk', loan_count: 3 },
      { book_id: 2, title: 'Palace of Desire', loan_count: 2 }
    ], []];
  }
  if (sql.includes('FROM member m') && sql.includes('LIMIT 1')) {
    return [[
      { member_id: 1, member_name: 'Ahmed Hatem', email: 'ahmed@example.com', loan_count: 5 }
    ], []];
  }

  // F2.6 Authors & Books queries
  if (sql.includes('FROM author a') && sql.includes('LEFT JOIN book b') && sql.includes('GROUP BY a.author_id')) {
    return [[
      { author_id: 1, author_name: 'Naguib Mahfouz', country: 'Egypt', book_count: 3 },
      { author_id: 5, author_name: 'Gabriel Garcia Marquez', country: 'Colombia', book_count: 0 }
    ], []];
  }
  if (sql.includes('WHERE a.country = p.country')) {
    return [[
      { book_id: 1, title: 'Palace Walk', author_name: 'Naguib Mahfouz', author_country: 'Egypt', publisher_name: 'Dar El Shorouk', publisher_country: 'Egypt' }
    ], []];
  }

  // F2.1 Search & F2.2 Catalogue (JOIN book + author + publisher + category)
  if (sql.includes('FROM book b') && sql.includes('JOIN author a') && sql.includes('JOIN publisher p')) {
    let result = [
      {
        book_id: 1,
        title: 'Palace Walk',
        price: '18.50',
        publish_year: 1956,
        author_name: 'Naguib Mahfouz',
        publisher_name: 'Dar El Shorouk',
        category_name: 'Classic Literature',
        cover_image: null
      },
      {
        book_id: 4,
        title: 'Pride and Prejudice',
        price: '14.50',
        publish_year: 1813,
        author_name: 'Jane Austen',
        publisher_name: 'Penguin Books',
        category_name: 'Fiction',
        cover_image: null
      }
    ];

    if (params.length > 0) {
      if (typeof params[0] === 'string' && params[0].startsWith('%') && params[0].endsWith('%')) {
        const keyword = params[0].slice(1, -1).toLowerCase();
        result = result.filter(b => b.title.toLowerCase().includes(keyword));
      }
    }

    return [result, []];
  }

  // Lab 3 & 4 Book queries
  if (sql.startsWith('SELECT book_id, title, price, author_id, cover_image FROM book ORDER BY') || sql.startsWith('SELECT book_id, title, price, publish_year')) {
    return [[...books].sort((a, b) => a.book_id - b.book_id), []];
  }
  if (sql.startsWith('SELECT author_id, name, country, photo_image FROM author ORDER BY')) {
    return [[...authors].sort((a, b) => a.author_id - b.author_id), []];
  }
  if (sql.startsWith('SELECT book_id, title, price, author_id, cover_image FROM book WHERE') || sql.startsWith('SELECT book_id, title, price, publish_year, author_id')) {
    return [books.filter(book => book.book_id === params[0]), []];
  }
  if (sql.startsWith('SELECT author_id, name, country, photo_image FROM author WHERE')) {
    return [authors.filter(author => author.author_id === params[0]), []];
  }
  if (sql.startsWith('SELECT book_id, cover_image FROM book WHERE')) {
    return [books.filter(book => book.book_id === params[0]), []];
  }
  if (sql.startsWith('SELECT author_id, photo_image FROM author WHERE')) {
    return [authors.filter(author => author.author_id === params[0]), []];
  }
  if (sql.startsWith('SELECT photo_image FROM author WHERE')) {
    return [authors.filter(author => author.author_id === params[0]), []];
  }
  if (sql.startsWith('SELECT cover_image FROM book WHERE author_id')) {
    return [books.filter(book => book.author_id === params[0]), []];
  }
  if (sql.startsWith('SELECT cover_image FROM book WHERE')) {
    return [books.filter(book => book.book_id === params[0]), []];
  }
  if (sql.startsWith('INSERT INTO author')) {
    const author = { author_id: nextAuthorId++, name: params[0], country: params[1], photo_image: params[2] };
    authors.push(author);
    return [{ insertId: author.author_id, affectedRows: 1 }, []];
  }
  if (sql.startsWith('INSERT INTO book')) {
    let book;
    if (params.length === 7) {
      book = { book_id: nextBookId++, title: params[0], price: params[1], publish_year: params[2], author_id: params[3], publisher_id: params[4], category_id: params[5], cover_image: params[6] };
    } else {
      book = { book_id: nextBookId++, title: params[0], price: params[1], author_id: params[2], cover_image: params[3] };
    }
    books.push(book);
    return [{ insertId: book.book_id, affectedRows: 1 }, []];
  }
  if (sql.startsWith('UPDATE author')) {
    const author = authors.find(item => item.author_id === params[3]);
    if (!author) return [{ affectedRows: 0 }, []];
    author.name = params[0];
    author.country = params[1];
    author.photo_image = params[2] || author.photo_image;
    return [{ affectedRows: 1 }, []];
  }
  if (sql.startsWith('UPDATE book')) {
    const bookId = params[params.length - 1];
    const book = books.find(item => item.book_id === bookId);
    if (!book) return [{ affectedRows: 0 }, []];
    book.title = params[0];
    book.price = params[1];
    if (params.length === 8) {
      book.publish_year = params[2];
      book.author_id = params[3];
      book.publisher_id = params[4];
      book.category_id = params[5];
      book.cover_image = params[6] || book.cover_image;
    } else {
      book.author_id = params[2];
      book.cover_image = params[3] || book.cover_image;
    }
    return [{ affectedRows: 1 }, []];
  }
  if (sql.startsWith('DELETE FROM author')) {
    const authorId = params[0];
    const previousLength = authors.length;
    authors = authors.filter(author => author.author_id !== authorId);
    books = books.filter(book => book.author_id !== authorId);
    return [{ affectedRows: previousLength - authors.length }, []];
  }
  if (sql.startsWith('DELETE FROM book')) {
    const previousLength = books.length;
    books = books.filter(book => book.book_id !== params[0]);
    return [{ affectedRows: previousLength - books.length }, []];
  }
  throw new Error(`Unexpected library query in test: ${sql}`);
};

const app = require('../src/server');
let server;
let baseUrl;

describe('Lab 3 & Lab 4 Library system', () => {
  before(async () => {
    server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  beforeEach(() => {
    authors = [
      { author_id: 1, name: 'Naguib Mahfouz', country: 'Egypt', photo_image: null },
      { author_id: 2, name: 'Jane Austen', country: 'England', photo_image: null }
    ];
    books = [
      { book_id: 1, title: 'Palace Walk', price: '14.99', author_id: 1, cover_image: null }
    ];
    nextAuthorId = 3;
    nextBookId = 2;
  });

  after(async () => {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  });

  test('shows both tables and each book author_id without requiring login', async () => {
    const response = await fetch(`${baseUrl}/library`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /Palace Walk/);
    assert.match(html, /Naguib Mahfouz/);
    assert.match(html, /#1/);
    assert.match(html, /#2/);
  });

  test('shows image upload fields and the accepted formats on both forms', async () => {
    const [bookFormResponse, authorFormResponse] = await Promise.all([
      fetch(`${baseUrl}/library/books/new`),
      fetch(`${baseUrl}/library/authors/new`)
    ]);

    const [bookFormHtml, authorFormHtml] = await Promise.all([
      bookFormResponse.text(),
      authorFormResponse.text()
    ]);

    assert.equal(bookFormResponse.status, 200);
    assert.equal(authorFormResponse.status, 200);
    assert.match(bookFormHtml, /enctype="multipart\/form-data"/);
    assert.match(bookFormHtml, /name="image" accept="image\/jpeg,image\/png,image\/webp"/);
    assert.match(authorFormHtml, /name="image" accept="image\/jpeg,image\/png,image\/webp"/);
  });

  test('adds, edits, and removes a book', async () => {
    let response = await fetch(`${baseUrl}/library/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        title: 'Emma',
        price: '19.99',
        author_id: '2'
      }),
      redirect: 'manual'
    });
    assert.equal(response.status, 302);
    assert.equal(books.length, 2);

    const book = books.find(item => item.title === 'Emma');
    assert.ok(book);

    response = await fetch(`${baseUrl}/library/books/${book.book_id}/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        title: 'Emma Revised',
        price: '21.50',
        author_id: '2'
      }),
      redirect: 'manual'
    });
    assert.equal(response.status, 302);
    assert.equal(book.title, 'Emma Revised');

    response = await fetch(`${baseUrl}/library/books/${book.book_id}/delete`, {
      method: 'POST',
      redirect: 'manual'
    });
    assert.equal(response.status, 302);
    assert.equal(books.length, 1);
  });

  test('adds, edits, and removes an author and cascades their books', async () => {
    let response = await fetch(`${baseUrl}/library/authors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        name: 'George Orwell',
        country: 'United Kingdom'
      }),
      redirect: 'manual'
    });
    assert.equal(response.status, 302);
    assert.equal(authors.length, 3);

    const author = authors.find(item => item.name === 'George Orwell');
    assert.ok(author);

    response = await fetch(`${baseUrl}/library/authors/${author.author_id}/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        name: 'Eric Blair',
        country: 'United Kingdom'
      }),
      redirect: 'manual'
    });
    assert.equal(response.status, 302);
    assert.equal(author.name, 'Eric Blair');

    books.push({ book_id: nextBookId++, title: '1984', price: '15.00', author_id: author.author_id, cover_image: null });
    assert.equal(books.length, 2);

    response = await fetch(`${baseUrl}/library/authors/${author.author_id}/delete`, {
      method: 'POST',
      redirect: 'manual'
    });
    assert.equal(response.status, 302);
    assert.equal(authors.length, 2);
    assert.equal(books.length, 1);
    assert.equal(books[0].title, 'Palace Walk');
  });

  test('rejects invalid form values without inserting records', async () => {
    const response = await fetch(`${baseUrl}/library/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        title: '',
        price: 'not-a-number',
        author_id: '999'
      })
    });
    const html = await response.text();

    assert.equal(response.status, 400);
    assert.match(html, /Book title is required/);
    assert.match(html, /Price must be a non-negative amount/);
    assert.equal(books.length, 1);
  });

  test('uploads a cover and author photo, serves them, and removes them with their records', async () => {
    const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);

    const authorForm = new FormData();
    authorForm.append('name', 'Virginia Woolf');
    authorForm.append('country', 'England');
    authorForm.append('image', new Blob([pngBytes], { type: 'image/png' }), 'author.png');

    let response = await fetch(`${baseUrl}/library/authors`, {
      method: 'POST',
      body: authorForm,
      redirect: 'manual'
    });
    assert.equal(response.status, 302);
    const author = authors.find(item => item.name === 'Virginia Woolf');
    assert.ok(author);
    assert.ok(author.photo_image);

    const uploadedAuthorPhoto = await fs.readFile(path.join(__dirname, '..', 'public', 'uploads', 'library', author.photo_image));
    assert.deepEqual(uploadedAuthorPhoto, pngBytes);

    const photoResponse = await fetch(`${baseUrl}/uploads/library/${author.photo_image}`);
    assert.equal(photoResponse.status, 200);

    response = await fetch(`${baseUrl}/library/authors/${author.author_id}/delete`, {
      method: 'POST',
      redirect: 'manual'
    });
    assert.equal(response.status, 302);
    await assert.rejects(fs.access(path.join(__dirname, '..', 'public', 'uploads', 'library', author.photo_image)));
  });

  test('rejects an image whose contents do not match an allowed image format', async () => {
    const form = new FormData();
    form.append('title', 'Not an image');
    form.append('price', '2.00');
    form.append('author_id', '1');
    form.append('image', new Blob(['not really png'], { type: 'image/png' }), 'fake.png');

    const response = await fetch(`${baseUrl}/library/books`, {
      method: 'POST',
      body: form
    });
    const html = await response.text();

    assert.equal(response.status, 400);
    assert.match(html, /not a valid JPEG, PNG, or WebP image/);
    assert.equal(books.length, 1);
  });

  // ==========================================================================
  // Lab 4 Tests: F2.1 to F2.6 & Prepared Statements (Bonus)
  // ==========================================================================

  test('F2.1: search books page renders form, category options, and bonus prepared statements tag', async () => {
    const response = await fetch(`${baseUrl}/library/search`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /Search Books/);
    assert.match(html, /Title Keyword \(LIKE\)/);
    assert.match(html, /Min Price/);
    assert.match(html, /Max Price/);
    assert.match(html, /All Categories/);
    assert.match(html, /Bonus: Prepared Statements/);
  });

  test('F2.1: filters books by title keyword via parameterized query', async () => {
    const response = await fetch(`${baseUrl}/library/search?title=Walk`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /Palace Walk/);
  });

  test('F2.2: catalogue page shows books with author, publisher, and category names (JOIN)', async () => {
    const response = await fetch(`${baseUrl}/library/catalogue`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /Library Catalogue/);
    assert.match(html, /Palace Walk/);
    assert.match(html, /Naguib Mahfouz/);
    assert.match(html, /Dar El Shorouk/);
    assert.match(html, /Classic Literature/);
  });

  test('F2.3: reports page displays category breakdown, prolific authors, and price statistics', async () => {
    const response = await fetch(`${baseUrl}/library/reports`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /Books &amp; Average Price by Category/);
    assert.match(html, /Authors Who Wrote at Least 2 Books/);
    assert.match(html, /Total Collection Value/);
    assert.match(html, /Fiction/);
    assert.match(html, /Naguib Mahfouz/);
    assert.match(html, /\$185\.50/);
  });

  test('F2.4: loans page shows unreturned loans, members with no loans, and unborrowed books', async () => {
    const response = await fetch(`${baseUrl}/library/loans`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /Loans Not Returned Yet/);
    assert.match(html, /Members Who Never Borrowed a Book/);
    assert.match(html, /Books That Were Never Borrowed/);
    assert.match(html, /Mariam Ali/);
    assert.match(html, /Nour Mahmoud/);
    assert.match(html, /David Copperfield/);
  });

  test('F2.5: most borrowed page displays top 3 books and top borrower member', async () => {
    const response = await fetch(`${baseUrl}/library/most-borrowed`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /The 3 Books with the Most Loans/);
    assert.match(html, /The Member with the Most Loans/);
    assert.match(html, /Pride and Prejudice/);
    assert.match(html, /Ahmed Hatem/);
  });

  test('F2.6: authors and books page displays all authors with book counts and domestic publishing', async () => {
    const response = await fetch(`${baseUrl}/library/authors-books`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /All Authors and Their Book Counts/);
    assert.match(html, /Books Where Author and Publisher Share the Same Country/);
    assert.match(html, /Gabriel Garcia Marquez/);
    assert.match(html, /0 Books/);
    assert.match(html, /Palace Walk/);
  });
});
