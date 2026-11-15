USE library;

-- 1. Insert Authors (at least 4: we insert 5)
-- Two authors from Egypt (Mahfouz, Hussein), two from England (Austen, Dickens), one from Colombia (Marquez)
-- Marquez has no books (author with no books)
-- Mahfouz, Austen, Dickens wrote >= 2 books
INSERT INTO author (author_id, name, country) VALUES
(1, 'Naguib Mahfouz', 'Egypt'),
(2, 'Jane Austen', 'England'),
(3, 'Charles Dickens', 'England'),
(4, 'Taha Hussein', 'Egypt'),
(5, 'Gabriel Garcia Marquez', 'Colombia');

-- 2. Insert Publishers (at least 3: we insert 4)
-- Dar El Shorouk is from Egypt (same country as Mahfouz & Hussein)
-- Penguin Books & Oxford are from England (same country as Austen & Dickens)
INSERT INTO publisher (publisher_id, name, country) VALUES
(1, 'Dar El Shorouk', 'Egypt'),
(2, 'Penguin Books', 'England'),
(3, 'HarperCollins', 'USA'),
(4, 'Oxford University Press', 'England');

-- 3. Insert Categories (at least 3: we insert 4)
INSERT INTO category (category_id, name) VALUES
(1, 'Fiction'),
(2, 'Classic Literature'),
(3, 'History'),
(4, 'Philosophy');

-- 4. Insert Books (at least 10: we insert 11)
-- Books priced between 15 and 20: Palace Walk (18.50), Palace of Desire (19.50), Sugar Street (17.00), Great Expectations (16.00), Oliver Twist (15.50)
-- Book 11 (David Copperfield) is never borrowed
INSERT INTO book (book_id, title, price, publish_year, author_id, publisher_id, category_id) VALUES
(1, 'Palace Walk', 18.50, 1956, 1, 1, 2),
(2, 'Palace of Desire', 19.50, 1957, 1, 1, 2),
(3, 'Sugar Street', 17.00, 1957, 1, 1, 2),
(4, 'Pride and Prejudice', 14.50, 1813, 2, 2, 1),
(5, 'Sense and Sensibility', 12.00, 1811, 2, 2, 1),
(6, 'Great Expectations', 16.00, 1861, 3, 2, 1),
(7, 'Oliver Twist', 15.50, 1838, 3, 4, 1),
(8, 'The Days', 13.00, 1929, 4, 1, 3),
(9, 'A Passage to France', 11.50, 1945, 4, 1, 3),
(10, 'The Future of Culture in Egypt', 22.00, 1938, 4, 1, 4),
(11, 'David Copperfield', 25.00, 1850, 3, 3, 1);

-- 5. Insert Members (at least 5: we insert 6)
-- Member 6 (Nour Mahmoud) never borrowed a book
-- Member 1 (Ahmed Hatem) has the most loans (5 loans)
INSERT INTO member (member_id, name, email, join_date) VALUES
(1, 'Ahmed Hatem', 'ahmed@example.com', '2023-09-01'),
(2, 'Omar Farouk', 'omar@example.com', '2023-09-15'),
(3, 'Mariam Ali', 'mariam@example.com', '2023-10-01'),
(4, 'Sara Ibrahim', 'sara@example.com', '2023-10-10'),
(5, 'Karim Mostafa', 'karim@example.com', '2023-10-20'),
(6, 'Nour Mahmoud', 'nour@example.com', '2023-11-01');

-- 6. Insert Loans (at least 12: we insert 13)
-- Loans with return_date IS NULL: loans 3, 5, 9, 12 (not returned yet)
-- Most borrowed books:
-- Book 4 (Pride and Prejudice): 4 loans
-- Book 1 (Palace Walk): 3 loans
-- Book 2 (Palace of Desire): 2 loans
INSERT INTO loan (loan_id, book_id, member_id, loan_date, return_date) VALUES
(1, 1, 1, '2024-01-10', '2024-01-24'),
(2, 1, 2, '2024-02-01', '2024-02-15'),
(3, 1, 3, '2024-03-01', NULL),
(4, 2, 1, '2024-01-15', '2024-01-29'),
(5, 2, 4, '2024-02-10', NULL),
(6, 4, 1, '2024-01-20', '2024-02-05'),
(7, 4, 2, '2024-02-12', '2024-02-26'),
(8, 4, 3, '2024-03-05', '2024-03-20'),
(9, 4, 5, '2024-04-01', NULL),
(10, 6, 1, '2024-02-18', '2024-03-02'),
(11, 7, 2, '2024-03-01', '2024-03-15'),
(12, 8, 1, '2024-03-10', NULL),
(13, 9, 3, '2024-03-12', '2024-03-26');
