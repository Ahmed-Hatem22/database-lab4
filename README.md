# Database Lab 4: Search Queries in SQL & Library Web Application

**Student:** Ahmed Hatem  
**Student ID:** 2304158

**Student:** Yussef Amr 
**Student ID:** 2304193  
**Course:** Introduction to Database Systems — Alexandria National University, Faculty of Engineering  
**Term:** Fall 2026  

---

## Deliverables in this Repository

All assignment deliverables are placed in this folder according to the lab specification:

```
lab4-2304158/
├── problem1_DDL.sql      # DDL script creating the extended COMPANY database and tables
├── problem1_DML.sql      # Seed INSERT statements for all 5 COMPANY tables
├── problem1_Answers.txt  # SQL queries, execution output/errors, and explanations for Q1.1-Q1.12
├── problem2_DDL.sql      # DDL script creating the 6-table LIBRARY database
├── problem2_DML.sql      # Seed INSERT data satisfying all 8 required testing conditions
├── problem2_Queries.sql  # SQL queries for website pages F2.1-F2.6 (runnable in MySQL client)
├── website/              # Extended Node.js/Express/EJS web application with all new search pages
└── README.md             # Complete step-by-step execution and testing documentation
```

---

## Part I: Problem 1 — The COMPANY Database (Extended)

### Schema Overview
The relational schema extends Lab 3 with supervisor tracking, projects, assignments, and dependents:
- `EMPLOYEE (ssn, fname, lname, bdate, address, gender, salary, super_ssn, Dno)`
- `DEPARTMENT (Dnumber, Dname, mgr_ssn, mgr_start_date)`
- `PROJECT (Pnumber, Pname, Plocation, Dno)`
- `WORKS_ON (essn, Pno, hours)` — Composite PK `(essn, Pno)`
- `DEPENDENT (essn, dependent_name, gender, bdate, relationship)` — Composite PK `(essn, dependent_name)`

### Running Problem 1 Scripts
```sh
# 1. Build database and tables
mysql -u root -p < problem1_DDL.sql

# 2. Insert rows into all 5 tables
mysql -u root -p < problem1_DML.sql
```
*(On Windows PowerShell, you can also run `Get-Content .\problem1_DDL.sql | mysql -u root -p`)*

### Problem 1 Queries and Explanations
Refer to `problem1_Answers.txt` for full SQL, outputs, and explanations:
- **A. Change the Data:**
  - **Q1.1 INSERT:** Insert new employee and project in Department 1; demonstration of foreign key constraint violation (Error 1452) when inserting an invalid `Dno`.
  - **Q1.2 UPDATE:** 10% department-wide salary raise; updating project location; foreign key constraint violation (Error 1452) when updating `Dno`.
  - **Q1.3 DELETE:** Deleting dependent and works_on rows; foreign key restriction (Error 1451) when deleting a department with active references; demonstration of `START TRANSACTION`, `DELETE without WHERE`, and `ROLLBACK`.
- **B. Search the Data:**
  - **Q1.4 WHERE, DISTINCT:** Employees earning 3000–6000 in Alexandria sorted descending; employees without supervisor (`super_ssn IS NULL`); distinct departments with employees.
  - **Q1.5 Aggregation:** Single query computing `COUNT(*)`, `SUM(salary)`, `AVG(salary)`, `MIN(salary)`, `MAX(salary)`.
  - **Q1.6 GROUP BY:** Number of employees and average salary per department (`Dno`).
  - **Q1.7 HAVING:** Departments with `COUNT(*) > 2`; filtered count where `salary > 3000`; one-sentence distinction between `WHERE` (filters individual rows before grouping) and `HAVING` (filters aggregated groups after grouping).
  - **Q1.8 JOIN:** Full employee names with department names.
  - **Q1.9 3-Table JOIN:** Employee last name, project name, and hours worked.
  - **Q1.10 LEFT JOIN:** All departments with employee counts (including 0-employee departments); projects with no assigned workers (`w.essn IS NULL`).
  - **Q1.11 Self Join:** Each employee paired with the name of their supervisor.
  - **Q1.12 JOIN + GROUP BY + HAVING:** Projects with over 20 total worked hours, ordered largest first.

---

## Part II: Problem 2 — Library Database & Web Application

### Schema Overview
The Library database models books, authors, publishers, categories, members, and loans:
- `author (author_id, name, country, photo_image)`
- `publisher (publisher_id, name, country)`
- `category (category_id, name)`
- `book (book_id, title, price, publish_year, author_id, publisher_id, category_id, cover_image)`
  - Foreign key: `author_id` REFERENCES `author(author_id)` `ON DELETE CASCADE`
  - Foreign key: `publisher_id` REFERENCES `publisher(publisher_id)`
  - Foreign key: `category_id` REFERENCES `category(category_id)`
- `member (member_id, name, email, join_date)`
- `loan (loan_id, book_id, member_id, loan_date, return_date)`
  - Foreign key: `book_id` REFERENCES `book(book_id)` `ON DELETE CASCADE`
  - Foreign key: `member_id` REFERENCES `member(member_id)`
  - `return_date IS NULL` indicates the book is currently borrowed.

### Running Problem 2 Scripts
```sh
# 1. Build library schema
mysql -u root -p < problem2_DDL.sql

# 2. Populate seed data satisfying all 8 rubric conditions
mysql -u root -p < problem2_DML.sql

# 3. Test standalone queries F2.1 to F2.6
mysql -u root -p < problem2_Queries.sql
```

### Seed Data Verification
`problem2_DML.sql` contains verified data satisfying all 8 constraints:
1. **Two authors from the same country:** Naguib Mahfouz & Taha Hussein (Egypt); Jane Austen & Charles Dickens (England).
2. **Author with no books:** Gabriel Garcia Marquez (Colombia).
3. **Author who wrote at least 2 books:** Naguib Mahfouz (3 books), Jane Austen (2 books), Charles Dickens (3 books).
4. **Author and publisher from the same country:** Naguib Mahfouz & Dar El Shorouk (Egypt); Jane Austen & Penguin Books (England).
5. **Book priced between 15 and 20:** Palace Walk ($18.50), Palace of Desire ($19.50), Sugar Street ($17.00), Great Expectations ($16.00), Oliver Twist ($15.50).
6. **Book never borrowed:** David Copperfield (Book #11).
7. **Member with no loans:** Nour Mahmoud (Member #6).
8. **Loan not returned yet:** Loans #3, #5, #9, and #12 (`return_date IS NULL`).

---

## Website Features & New Search Pages (F2.1 – F2.6)

The web application has been extended with dedicated pages, clean UI tabs, and robust server-side queries:

### 🌟 Bonus Requirement: Prepared Statements in F2.1
The book search form uses parameterized queries (`connection.execute(sql, params)` with `?` placeholders) instead of string concatenation. This prevents SQL injection attacks:
```js
// Parameterized WHERE clause using placeholders ?
if (title) {
  conditions.push('b.title LIKE ?');
  params.push(`%${title.trim()}%`);
}
if (minVal !== null && maxVal !== null) {
  conditions.push('b.price BETWEEN ? AND ?');
  params.push(minVal, maxVal);
}
if (categoryId && categoryId !== 'all') {
  conditions.push('b.category_id = ?');
  params.push(Number(categoryId));
}
await db.execute(sql, params);
```

### Pages Overview
- **F2.1 Search Books (`/library/search`)**: Interactive filter form by title (`LIKE`), price range (`BETWEEN`), and category. Displays matching books ordered cheapest first. Highlights the Bonus Prepared Statements implementation.
- **F2.2 Catalogue (`/library/catalogue`)**: Table of all books utilizing SQL `JOIN`s to display author name, publisher name, and category name in place of foreign key IDs.
- **F2.3 Reports (`/library/reports`)**:
  - *(a)* Category analytics showing book counts and average prices (`GROUP BY`, `COALESCE(AVG(price), 0)`).
  - *(b)* Prolific authors who wrote at least 2 books (`GROUP BY`, `HAVING COUNT(*) >= 2`).
  - *(c)* Metrics cards displaying total library value, smallest price, and largest price (`SUM`, `MIN`, `MAX`).
- **F2.4 Loans (`/library/loans`)**:
  - *(a)* Active/unreturned loans showing book title, borrower name, and loan date (`return_date IS NULL`).
  - *(b)* Inactive members who have never borrowed a book (`LEFT JOIN` where `loan_id IS NULL`).
  - *(c)* Books that have never been borrowed (`LEFT JOIN` where `loan_id IS NULL`).
- **F2.5 Most Borrowed (`/library/most-borrowed`)**:
  - *(a)* Top 3 most borrowed books with gold/silver/bronze rank badges (`GROUP BY`, `ORDER BY COUNT(*) DESC LIMIT 3`).
  - *(b)* Top library reader card highlighting the member with the most loans (`LIMIT 1`).
- **F2.6 Authors & Books (`/library/authors-books`)**:
  - *(a)* Full author bibliography counts including authors who wrote 0 books (`LEFT JOIN`, `GROUP BY`).
  - *(b)* Books where author and publisher originate from the same country (`JOIN` with `author.country = publisher.country`).
- **Collection Management (`/library`)**: All Lab 3 features remain fully functional (Add/Edit/Delete books and authors with `ON DELETE CASCADE` and image upload support).

---

## How to Run the Website Step by Step

### 1. Prerequisites
- Node.js 18 or newer
- MySQL Server 8.0+

### 2. Install Dependencies
```sh
cd website
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env` (or update existing `.env`):
```sh
# Windows PowerShell
Copy-Item .env.example .env
```
Ensure your MySQL database credentials in `.env` are correct:
```env
PORT=3000
SESSION_SECRET=student_study_secret_key_lab4_2304158
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=registration
LIBRARY_DB_NAME=library
```

### 4. Initialize Database
Execute the DDL and DML scripts to create and seed the `library` database:
```sh
mysql -u root -p < ../problem2_DDL.sql
mysql -u root -p < ../problem2_DML.sql
```

### 5. Start the Server
```sh
npm start
```

### 6. Access in Browser
Navigate to `http://localhost:3000/library` to view the application:
- Search books: `http://localhost:3000/library/search`
- Catalogue: `http://localhost:3000/library/catalogue`
- Reports: `http://localhost:3000/library/reports`
- Loans: `http://localhost:3000/library/loans`
- Most Borrowed: `http://localhost:3000/library/most-borrowed`
- Authors & Books: `http://localhost:3000/library/authors-books`

---

## Running the Automated Test Suite

To run the automated unit and integration tests:

```sh
npm test
```

All 26 automated tests pass:
- **12 unit tests:** Password hashing (bcrypt), registration validation, login validation, study task rules, and SQL parameter isolation.
- **7 Lab 3 integration tests:** Library page rendering, image upload format validation, book CRUD, author CRUD with cascade deletion, invalid input handling, and file cleanup.
- **7 Lab 4 integration tests:**
  - F2.1 search form rendering, category loading, and bonus prepared statements tag
  - F2.1 title keyword filtering via parameterized placeholders `?`
  - F2.2 catalogue rendering with author, publisher, and category names
  - F2.3 category averages, prolific authors, and collection price metrics
  - F2.4 active unreturned loans, members with 0 loans, and unborrowed books
  - F2.5 top 3 borrowed books and top borrower member
  - F2.6 bibliography with 0-book authors and same-country publishing
