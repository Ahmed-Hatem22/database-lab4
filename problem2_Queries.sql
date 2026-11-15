USE library;

-- F2.1
-- Search books (WHERE): title keyword (LIKE), minimum and maximum price (BETWEEN) and category filter, cheapest first.
SELECT 
    b.book_id,
    b.title,
    b.price,
    b.publish_year,
    a.name AS author_name,
    p.name AS publisher_name,
    c.name AS category_name
FROM book b
JOIN author a ON b.author_id = a.author_id
JOIN publisher p ON b.publisher_id = p.publisher_id
JOIN category c ON b.category_id = c.category_id
WHERE b.title LIKE '%Walk%'
  AND b.price BETWEEN 10.00 AND 25.00
  AND b.category_id IN (1, 2)
ORDER BY b.price ASC;


-- F2.2
-- Catalogue (JOIN): table of all books showing author name, publisher name and category name instead of IDs.
SELECT 
    b.book_id,
    b.title,
    b.price,
    b.publish_year,
    a.name AS author_name,
    p.name AS publisher_name,
    c.name AS category_name
FROM book b
JOIN author a ON b.author_id = a.author_id
JOIN publisher p ON b.publisher_id = p.publisher_id
JOIN category c ON b.category_id = c.category_id
ORDER BY b.book_id ASC;


-- F2.3
-- Reports (GROUP BY, HAVING):
-- (a) The number of books and the average price of each category
SELECT 
    c.category_id,
    c.name AS category_name,
    COUNT(b.book_id) AS book_count,
    AVG(b.price) AS average_price
FROM category c
LEFT JOIN book b ON c.category_id = b.category_id
GROUP BY c.category_id, c.name;

-- (b) The authors who wrote at least 2 books
SELECT 
    a.author_id,
    a.name AS author_name,
    COUNT(b.book_id) AS book_count
FROM author a
JOIN book b ON a.author_id = b.author_id
GROUP BY a.author_id, a.name
HAVING COUNT(b.book_id) >= 2;

-- (c) The total, smallest and largest price of the whole library
SELECT 
    SUM(price) AS total_price,
    MIN(price) AS smallest_price,
    MAX(price) AS largest_price
FROM book;


-- F2.4
-- Loans (JOIN, LEFT JOIN):
-- (a) The loans not returned yet, with the book title and the member name
SELECT 
    l.loan_id,
    b.title AS book_title,
    m.name AS member_name,
    l.loan_date
FROM loan l
JOIN book b ON l.book_id = b.book_id
JOIN member m ON l.member_id = m.member_id
WHERE l.return_date IS NULL;

-- (b) The members who never borrowed a book
SELECT 
    m.member_id,
    m.name AS member_name,
    m.email,
    m.join_date
FROM member m
LEFT JOIN loan l ON m.member_id = l.member_id
WHERE l.loan_id IS NULL;

-- (c) The books that were never borrowed
SELECT 
    b.book_id,
    b.title,
    b.price,
    b.publish_year
FROM book b
LEFT JOIN loan l ON b.book_id = l.book_id
WHERE l.loan_id IS NULL;


-- F2.5
-- Most borrowed (GROUP BY, ORDER BY, LIMIT):
-- (a) The 3 books with the most loans
SELECT 
    b.book_id,
    b.title,
    COUNT(l.loan_id) AS loan_count
FROM book b
JOIN loan l ON b.book_id = l.book_id
GROUP BY b.book_id, b.title
ORDER BY loan_count DESC, b.book_id ASC
LIMIT 3;

-- (b) The member with the most loans
SELECT 
    m.member_id,
    m.name AS member_name,
    COUNT(l.loan_id) AS loan_count
FROM member m
JOIN loan l ON m.member_id = l.member_id
GROUP BY m.member_id, m.name
ORDER BY loan_count DESC, m.member_id ASC
LIMIT 1;


-- F2.6
-- Authors and books (LEFT JOIN, JOIN):
-- (a) Every author with the number of books he or she wrote, including the authors who wrote 0
SELECT 
    a.author_id,
    a.name AS author_name,
    a.country,
    COUNT(b.book_id) AS book_count
FROM author a
LEFT JOIN book b ON a.author_id = b.author_id
GROUP BY a.author_id, a.name, a.country
ORDER BY a.author_id ASC;

-- (b) The books whose author and publisher come from the same country
SELECT 
    b.book_id,
    b.title,
    a.name AS author_name,
    a.country AS author_country,
    p.name AS publisher_name,
    p.country AS publisher_country
FROM book b
JOIN author a ON b.author_id = a.author_id
JOIN publisher p ON b.publisher_id = p.publisher_id
WHERE a.country = p.country
ORDER BY b.book_id ASC;
