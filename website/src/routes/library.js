const express = require('express');
const db = require('../libraryDb');
const {
  handleImageUpload,
  uploadedImageError,
  saveUploadedImage,
  removeUploadedImage
} = require('../imageUploads');

const router = express.Router();
const AUTHOR_NAME_MAX = 100;
const COUNTRY_MAX = 80;
const BOOK_TITLE_MAX = 200;

function validId(value) {
  return typeof value === 'string' && /^\d+$/.test(value) && Number(value) > 0;
}

function renderLibraryPage(res, status, errors, values = {}) {
  return db.execute(
    'SELECT book_id, title, price, author_id, cover_image FROM book ORDER BY book_id;',
    []
  ).then(async ([books]) => {
    const [authors] = await db.execute(
      'SELECT author_id, name, country, photo_image FROM author ORDER BY author_id;',
      []
    );
    return res.status(status).render('library/index', {
      title: 'Library | EduStudy',
      libraryStyles: true,
      books,
      authors,
      errors,
      ...values
    });
  });
}

async function loadAuthors() {
  const [authors] = await db.execute(
    'SELECT author_id, name, country, photo_image FROM author ORDER BY name;',
    []
  );
  return authors;
}

async function loadPublishers() {
  try {
    const [publishers] = await db.execute(
      'SELECT publisher_id, name, country FROM publisher ORDER BY name;',
      []
    );
    return publishers;
  } catch (err) {
    return [
      { publisher_id: 1, name: 'Dar El Shorouk', country: 'Egypt' },
      { publisher_id: 2, name: 'Penguin Books', country: 'England' },
      { publisher_id: 3, name: 'HarperCollins', country: 'USA' },
      { publisher_id: 4, name: 'Oxford University Press', country: 'England' }
    ];
  }
}

async function loadCategories() {
  try {
    const [categories] = await db.execute(
      'SELECT category_id, name FROM category ORDER BY category_id;',
      []
    );
    return categories;
  } catch (err) {
    return [
      { category_id: 1, name: 'Fiction' },
      { category_id: 2, name: 'Classic Literature' },
      { category_id: 3, name: 'History' },
      { category_id: 4, name: 'Philosophy' }
    ];
  }
}

function validateAuthor(name, country) {
  const errors = [];
  if (typeof name !== 'string' || !name.trim()) errors.push('Author name is required.');
  else if (name.trim().length > AUTHOR_NAME_MAX) errors.push(`Author name must be ${AUTHOR_NAME_MAX} characters or fewer.`);
  if (typeof country !== 'string' || !country.trim()) errors.push('Country is required.');
  else if (country.trim().length > COUNTRY_MAX) errors.push(`Country must be ${COUNTRY_MAX} characters or fewer.`);
  return errors;
}

function validateBook(title, price, authorId) {
  const errors = [];
  if (typeof title !== 'string' || !title.trim()) errors.push('Book title is required.');
  else if (title.trim().length > BOOK_TITLE_MAX) errors.push(`Book title must be ${BOOK_TITLE_MAX} characters or fewer.`);
  if (typeof price !== 'string' || !/^\d{1,8}(?:\.\d{1,2})?$/.test(price.trim())) {
    errors.push('Price must be a non-negative amount with up to 8 whole-number digits and 2 decimal places.');
  }
  if (!authorId || !validId(authorId)) errors.push('Select a valid author.');
  return errors;
}

router.get('/library', async (req, res, next) => {
  try {
    await renderLibraryPage(res, 200, []);
  } catch (err) {
    next(err);
  }
});

router.get('/library/books/new', async (req, res, next) => {
  try {
    const [authors, publishers, categories] = await Promise.all([
      loadAuthors(),
      loadPublishers(),
      loadCategories()
    ]);
    res.render('library/book-form', {
      title: 'Add a Book | EduStudy',
      libraryStyles: true,
      authors,
      publishers,
      categories,
      book: null,
      errors: []
    });
  } catch (err) {
    next(err);
  }
});

router.post('/library/books', handleImageUpload, async (req, res, next) => {
  const { title, price, author_id: authorId, publisher_id: pubId, category_id: catId, publish_year: pubYear } = req.body;
  const errors = validateBook(title, price, authorId);
  if (req.imageUploadError) errors.push(req.imageUploadError);
  const imageError = uploadedImageError(req.file);
  if (imageError) errors.push(imageError);

  const publisherId = pubId && validId(pubId) ? Number(pubId) : 1;
  const categoryId = catId && validId(catId) ? Number(catId) : 1;
  const publishYear = pubYear && /^\d{4}$/.test(String(pubYear).trim()) ? Number(pubYear) : 2024;

  try {
    if (errors.length) {
      const [authors, publishers, categories] = await Promise.all([
        loadAuthors(),
        loadPublishers(),
        loadCategories()
      ]);
      return res.status(400).render('library/book-form', {
        title: 'Add a Book | EduStudy',
        libraryStyles: true,
        authors,
        publishers,
        categories,
        book: { title, price, author_id: authorId, publisher_id: publisherId, category_id: categoryId, publish_year: publishYear },
        errors
      });
    }
    const coverImage = await saveUploadedImage(req.file);
    try {
      await db.execute(
        'INSERT INTO book (title, price, publish_year, author_id, publisher_id, category_id, cover_image) VALUES (?, ?, ?, ?, ?, ?, ?);',
        [title.trim(), price.trim(), publishYear, Number(authorId), publisherId, categoryId, coverImage]
      );
    } catch (err) {
      await removeUploadedImage(coverImage);
      throw err;
    }
    return res.redirect('/library');
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      const [authors, publishers, categories] = await Promise.all([
        loadAuthors(),
        loadPublishers(),
        loadCategories()
      ]);
      return res.status(400).render('library/book-form', {
        title: 'Add a Book | EduStudy',
        libraryStyles: true,
        authors,
        publishers,
        categories,
        book: { title, price, author_id: authorId, publisher_id: publisherId, category_id: categoryId, publish_year: publishYear },
        errors: ['The selected author no longer exists. Choose an existing author.']
      });
    }
    next(err);
  }
});

router.get('/library/books/:id/edit', async (req, res, next) => {
  if (!validId(req.params.id)) return res.sendStatus(404);
  try {
    const [rows] = await db.execute(
      'SELECT book_id, title, price, publish_year, author_id, publisher_id, category_id, cover_image FROM book WHERE book_id = ?;',
      [Number(req.params.id)]
    );
    if (!rows.length) return res.sendStatus(404);
    const [authors, publishers, categories] = await Promise.all([
      loadAuthors(),
      loadPublishers(),
      loadCategories()
    ]);
    return res.render('library/book-form', {
      title: 'Edit a Book | EduStudy',
      libraryStyles: true,
      authors,
      publishers,
      categories,
      book: rows[0],
      errors: []
    });
  } catch (err) {
    next(err);
  }
});

router.post('/library/books/:id/edit', handleImageUpload, async (req, res, next) => {
  if (!validId(req.params.id)) return res.sendStatus(404);
  const { title, price, author_id: authorId, publisher_id: pubId, category_id: catId, publish_year: pubYear } = req.body;
  const publisherId = pubId && validId(pubId) ? Number(pubId) : 1;
  const categoryId = catId && validId(catId) ? Number(catId) : 1;
  const publishYear = pubYear && /^\d{4}$/.test(String(pubYear).trim()) ? Number(pubYear) : 2024;

  const book = { book_id: Number(req.params.id), title, price, publish_year: publishYear, author_id: authorId, publisher_id: publisherId, category_id: categoryId };
  const errors = validateBook(title, price, authorId);
  if (req.imageUploadError) errors.push(req.imageUploadError);
  const imageError = uploadedImageError(req.file);
  if (imageError) errors.push(imageError);
  try {
    const [existingRows] = await db.execute(
      'SELECT book_id, cover_image FROM book WHERE book_id = ?;',
      [Number(req.params.id)]
    );
    if (!existingRows.length) return res.sendStatus(404);
    book.cover_image = existingRows[0].cover_image;
    const previousCoverImage = existingRows[0].cover_image;
    if (errors.length) {
      const [authors, publishers, categories] = await Promise.all([
        loadAuthors(),
        loadPublishers(),
        loadCategories()
      ]);
      return res.status(400).render('library/book-form', {
        title: 'Edit a Book | EduStudy',
        libraryStyles: true,
        authors,
        publishers,
        categories,
        book,
        errors
      });
    }
    const coverImage = await saveUploadedImage(req.file);
    let result;
    try {
      [result] = await db.execute(
        'UPDATE book SET title = ?, price = ?, publish_year = ?, author_id = ?, publisher_id = ?, category_id = ?, cover_image = COALESCE(?, cover_image) WHERE book_id = ?;',
        [title.trim(), price.trim(), publishYear, Number(authorId), publisherId, categoryId, coverImage, Number(req.params.id)]
      );
    } catch (err) {
      await removeUploadedImage(coverImage);
      throw err;
    }
    if (!result.affectedRows) {
      await removeUploadedImage(coverImage);
      return res.sendStatus(404);
    }
    if (coverImage) await removeUploadedImage(previousCoverImage);
    return res.redirect('/library');
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      const [authors, publishers, categories] = await Promise.all([
        loadAuthors(),
        loadPublishers(),
        loadCategories()
      ]);
      return res.status(400).render('library/book-form', {
        title: 'Edit a Book | EduStudy',
        libraryStyles: true,
        authors,
        publishers,
        categories,
        book,
        errors: ['The selected author no longer exists. Choose an existing author.']
      });
    }
    next(err);
  }
});

router.post('/library/books/:id/delete', async (req, res, next) => {
  if (!validId(req.params.id)) return res.sendStatus(404);
  try {
    const [rows] = await db.execute(
      'SELECT cover_image FROM book WHERE book_id = ?;',
      [Number(req.params.id)]
    );
    if (!rows.length) return res.sendStatus(404);
    const [result] = await db.execute(
      'DELETE FROM book WHERE book_id = ?;',
      [Number(req.params.id)]
    );
    if (!result.affectedRows) return res.sendStatus(404);
    await removeUploadedImage(rows[0].cover_image);
    return res.redirect('/library');
  } catch (err) {
    next(err);
  }
});

router.get('/library/authors/new', (req, res) => {
  res.render('library/author-form', {
    title: 'Add an Author | EduStudy',
    libraryStyles: true,
    author: null,
    errors: []
  });
});

router.post('/library/authors', handleImageUpload, async (req, res, next) => {
  const { name, country } = req.body;
  const errors = validateAuthor(name, country);
  if (req.imageUploadError) errors.push(req.imageUploadError);
  const imageError = uploadedImageError(req.file);
  if (imageError) errors.push(imageError);
  if (errors.length) {
    return res.status(400).render('library/author-form', {
      title: 'Add an Author | EduStudy',
      libraryStyles: true,
      author: { name, country },
      errors
    });
  }
  try {
    const photoImage = await saveUploadedImage(req.file);
    try {
      await db.execute(
        'INSERT INTO author (name, country, photo_image) VALUES (?, ?, ?);',
        [name.trim(), country.trim(), photoImage]
      );
    } catch (err) {
      await removeUploadedImage(photoImage);
      throw err;
    }
    return res.redirect('/library');
  } catch (err) {
    next(err);
  }
});

router.get('/library/authors/:id/edit', async (req, res, next) => {
  if (!validId(req.params.id)) return res.sendStatus(404);
  try {
    const [rows] = await db.execute(
      'SELECT author_id, name, country, photo_image FROM author WHERE author_id = ?;',
      [Number(req.params.id)]
    );
    if (!rows.length) return res.sendStatus(404);
    return res.render('library/author-form', {
      title: 'Edit an Author | EduStudy',
      libraryStyles: true,
      author: rows[0],
      errors: []
    });
  } catch (err) {
    next(err);
  }
});

router.post('/library/authors/:id/edit', handleImageUpload, async (req, res, next) => {
  if (!validId(req.params.id)) return res.sendStatus(404);
  const { name, country } = req.body;
  const author = { author_id: Number(req.params.id), name, country };
  const errors = validateAuthor(name, country);
  if (req.imageUploadError) errors.push(req.imageUploadError);
  const imageError = uploadedImageError(req.file);
  if (imageError) errors.push(imageError);
  let existingRows;
  let previousPhotoImage;
  try {
    [existingRows] = await db.execute(
      'SELECT author_id, photo_image FROM author WHERE author_id = ?;',
      [Number(req.params.id)]
    );
    if (!existingRows.length) return res.sendStatus(404);
    author.photo_image = existingRows[0].photo_image;
    previousPhotoImage = existingRows[0].photo_image;
  } catch (err) {
    return next(err);
  }
  if (errors.length) {
    return res.status(400).render('library/author-form', {
      title: 'Edit an Author | EduStudy',
      libraryStyles: true,
      author,
      errors
    });
  }
  try {
    const photoImage = await saveUploadedImage(req.file);
    let result;
    try {
      [result] = await db.execute(
        'UPDATE author SET name = ?, country = ?, photo_image = COALESCE(?, photo_image) WHERE author_id = ?;',
        [name.trim(), country.trim(), photoImage, Number(req.params.id)]
      );
    } catch (err) {
      await removeUploadedImage(photoImage);
      throw err;
    }
    if (!result.affectedRows) return res.sendStatus(404);
    if (photoImage) await removeUploadedImage(previousPhotoImage);
    return res.redirect('/library');
  } catch (err) {
    next(err);
  }
});

router.post('/library/authors/:id/delete', async (req, res, next) => {
  if (!validId(req.params.id)) return res.sendStatus(404);
  try {
    const [authors] = await db.execute(
      'SELECT photo_image FROM author WHERE author_id = ?;',
      [Number(req.params.id)]
    );
    if (!authors.length) return res.sendStatus(404);
    const [books] = await db.execute(
      'SELECT cover_image FROM book WHERE author_id = ?;',
      [Number(req.params.id)]
    );
    const [result] = await db.execute(
      'DELETE FROM author WHERE author_id = ?;',
      [Number(req.params.id)]
    );
    if (!result.affectedRows) return res.sendStatus(404);
    await Promise.all([
      removeUploadedImage(authors[0].photo_image),
      ...books.map(book => removeUploadedImage(book.cover_image))
    ]);
    return res.redirect('/library');
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// Lab 4 Routes: F2.1 to F2.6 (Search, Catalogue, Reports, Loans, Top & Nationality)
// ============================================================================

// F2.1 Search books (WHERE) + BONUS Prepared Statements
router.get('/library/search', async (req, res, next) => {
  try {
    const { title, min_price, max_price, category_id } = req.query;
    const categories = await loadCategories();

    const conditions = [];
    const params = [];

    // Keyword filter using LIKE and placeholder ?
    if (typeof title === 'string' && title.trim()) {
      conditions.push('b.title LIKE ?');
      params.push(`%${title.trim()}%`);
    }

    // Price filter: BETWEEN or >= / <= using placeholders ?
    const minVal = min_price !== undefined && min_price !== '' && !isNaN(Number(min_price)) ? Number(min_price) : null;
    const maxVal = max_price !== undefined && max_price !== '' && !isNaN(Number(max_price)) ? Number(max_price) : null;

    if (minVal !== null && maxVal !== null) {
      conditions.push('b.price BETWEEN ? AND ?');
      params.push(minVal, maxVal);
    } else if (minVal !== null) {
      conditions.push('b.price >= ?');
      params.push(minVal);
    } else if (maxVal !== null) {
      conditions.push('b.price <= ?');
      params.push(maxVal);
    }

    // Category filter using placeholder ?
    if (category_id && category_id !== 'all' && !isNaN(Number(category_id))) {
      conditions.push('b.category_id = ?');
      params.push(Number(category_id));
    }

    const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `
      SELECT b.book_id, b.title, b.price, b.publish_year,
             a.name AS author_name,
             p.name AS publisher_name,
             c.name AS category_name,
             b.cover_image
      FROM book b
      JOIN author a ON b.author_id = a.author_id
      JOIN publisher p ON b.publisher_id = p.publisher_id
      JOIN category c ON b.category_id = c.category_id
      ${whereClause}
      ORDER BY b.price ASC;
    `;

    const [books] = await db.execute(sql, params);

    res.render('library/search', {
      title: 'Search Books (F2.1) | EduStudy',
      libraryStyles: true,
      books,
      categories,
      query: req.query,
      executedQuery: whereClause ? `SELECT ... FROM book ${whereClause} ORDER BY price ASC` : 'All Books (Cheapest First)'
    });
  } catch (err) {
    next(err);
  }
});

// F2.2 Catalogue (JOIN)
router.get('/library/catalogue', async (req, res, next) => {
  try {
    const [books] = await db.execute(`
      SELECT b.book_id, b.title, b.price, b.publish_year,
             a.name AS author_name,
             p.name AS publisher_name,
             c.name AS category_name,
             b.cover_image
      FROM book b
      JOIN author a ON b.author_id = a.author_id
      JOIN publisher p ON b.publisher_id = p.publisher_id
      JOIN category c ON b.category_id = c.category_id
      ORDER BY b.book_id ASC;
    `, []);

    res.render('library/catalogue', {
      title: 'Catalogue (F2.2) | EduStudy',
      libraryStyles: true,
      books
    });
  } catch (err) {
    next(err);
  }
});

// F2.3 Reports (GROUP BY, HAVING)
router.get('/library/reports', async (req, res, next) => {
  try {
    const [categoryReports] = await db.execute(`
      SELECT c.category_id, c.name AS category_name,
             COUNT(b.book_id) AS book_count,
             COALESCE(AVG(b.price), 0) AS average_price
      FROM category c
      LEFT JOIN book b ON c.category_id = b.category_id
      GROUP BY c.category_id, c.name
      ORDER BY c.category_id ASC;
    `, []);

    const [prolificAuthors] = await db.execute(`
      SELECT a.author_id, a.name AS author_name, a.country,
             COUNT(b.book_id) AS book_count
      FROM author a
      JOIN book b ON a.author_id = b.author_id
      GROUP BY a.author_id, a.name, a.country
      HAVING COUNT(b.book_id) >= 2
      ORDER BY book_count DESC, a.name ASC;
    `, []);

    const [priceRows] = await db.execute(`
      SELECT 
          COALESCE(SUM(price), 0) AS total_price,
          COALESCE(MIN(price), 0) AS smallest_price,
          COALESCE(MAX(price), 0) AS largest_price
      FROM book;
    `, []);

    res.render('library/reports', {
      title: 'Reports (F2.3) | EduStudy',
      libraryStyles: true,
      categoryReports,
      prolificAuthors,
      priceStats: priceRows[0] || { total_price: 0, smallest_price: 0, largest_price: 0 }
    });
  } catch (err) {
    next(err);
  }
});

// F2.4 Loans (JOIN, LEFT JOIN)
router.get('/library/loans', async (req, res, next) => {
  try {
    const [activeLoans] = await db.execute(`
      SELECT l.loan_id, b.title AS book_title, m.name AS member_name, l.loan_date
      FROM loan l
      JOIN book b ON l.book_id = b.book_id
      JOIN member m ON l.member_id = m.member_id
      WHERE l.return_date IS NULL
      ORDER BY l.loan_date ASC;
    `, []);

    const [membersWithoutLoans] = await db.execute(`
      SELECT m.member_id, m.name AS member_name, m.email, m.join_date
      FROM member m
      LEFT JOIN loan l ON m.member_id = l.member_id
      WHERE l.loan_id IS NULL
      ORDER BY m.member_id ASC;
    `, []);

    const [booksNeverBorrowed] = await db.execute(`
      SELECT b.book_id, b.title, b.price, b.publish_year
      FROM book b
      LEFT JOIN loan l ON b.book_id = l.book_id
      WHERE l.loan_id IS NULL
      ORDER BY b.book_id ASC;
    `, []);

    res.render('library/loans', {
      title: 'Loans (F2.4) | EduStudy',
      libraryStyles: true,
      activeLoans,
      membersWithoutLoans,
      booksNeverBorrowed
    });
  } catch (err) {
    next(err);
  }
});

// F2.5 Most borrowed (GROUP BY, ORDER BY, LIMIT)
router.get('/library/most-borrowed', async (req, res, next) => {
  try {
    const [topBooks] = await db.execute(`
      SELECT b.book_id, b.title, COUNT(l.loan_id) AS loan_count
      FROM book b
      JOIN loan l ON b.book_id = l.book_id
      GROUP BY b.book_id, b.title
      ORDER BY loan_count DESC, b.book_id ASC
      LIMIT 3;
    `, []);

    const [topMemberRows] = await db.execute(`
      SELECT m.member_id, m.name AS member_name, m.email, COUNT(l.loan_id) AS loan_count
      FROM member m
      JOIN loan l ON m.member_id = l.member_id
      GROUP BY m.member_id, m.name, m.email
      ORDER BY loan_count DESC, m.member_id ASC
      LIMIT 1;
    `, []);

    res.render('library/most-borrowed', {
      title: 'Most Borrowed (F2.5) | EduStudy',
      libraryStyles: true,
      topBooks,
      topMember: topMemberRows[0] || null
    });
  } catch (err) {
    next(err);
  }
});

// F2.6 Authors and books (LEFT JOIN, JOIN)
router.get('/library/authors-books', async (req, res, next) => {
  try {
    const [authorBookCounts] = await db.execute(`
      SELECT a.author_id, a.name AS author_name, a.country,
             COUNT(b.book_id) AS book_count
      FROM author a
      LEFT JOIN book b ON a.author_id = b.author_id
      GROUP BY a.author_id, a.name, a.country
      ORDER BY a.author_id ASC;
    `, []);

    const [sameCountryBooks] = await db.execute(`
      SELECT b.book_id, b.title,
             a.name AS author_name, a.country AS author_country,
             p.name AS publisher_name, p.country AS publisher_country
      FROM book b
      JOIN author a ON b.author_id = a.author_id
      JOIN publisher p ON b.publisher_id = p.publisher_id
      WHERE a.country = p.country
      ORDER BY b.book_id ASC;
    `, []);

    res.render('library/authors-books', {
      title: 'Authors & Books (F2.6) | EduStudy',
      libraryStyles: true,
      authorBookCounts,
      sameCountryBooks
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
