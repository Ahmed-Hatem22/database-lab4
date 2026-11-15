USE company;

-- 1. Insert employees (with Dno as NULL to resolve circular foreign key dependency)
INSERT INTO EMPLOYEE (ssn, fname, lname, bdate, address, gender, salary, super_ssn, Dno) VALUES
(101, 'Ahmed', 'Hassan', '1985-01-15', '45 Cornish St, Alexandria', 'M', 5500.00, NULL, NULL),
(102, 'Sara', 'Ibrahim', '1990-07-20', '12 Stanley St, Alexandria', 'F', 4800.00, 101, NULL),
(103, 'Mohamed', 'Ali', '1988-11-03', '78 Horreya Ave, Alexandria', 'M', 3500.00, 101, NULL),
(104, 'Mona', 'Farouk', '1995-04-12', '15 Tahrir St, Cairo', 'F', 2800.00, 102, NULL),
(105, 'Omar', 'Khaled', '1992-09-25', '22 Gleem St, Alexandria', 'M', 3200.00, 102, NULL),
(106, 'Youssef', 'Nabil', '1994-06-18', '33 Mansheya Sq, Alexandria', 'M', 4200.00, 103, NULL);

-- 2. Insert departments referencing the managers
INSERT INTO DEPARTMENT (Dnumber, Dname, mgr_ssn, mgr_start_date) VALUES
(1, 'Research', 101, '2020-01-01'),
(2, 'Administration', 102, '2021-03-15'),
(3, 'Headquarters', 103, '2019-06-01'),
(4, 'Human Resources', NULL, NULL);

-- 3. Update employees with their assigned department numbers
-- Department 1 has 3 employees (> 2 employees)
-- Department 2 has 2 employees
-- Department 3 has 1 employee
-- Department 4 has 0 employees
UPDATE EMPLOYEE SET Dno = 1 WHERE ssn = 101;
UPDATE EMPLOYEE SET Dno = 1 WHERE ssn = 102;
UPDATE EMPLOYEE SET Dno = 1 WHERE ssn = 103;
UPDATE EMPLOYEE SET Dno = 2 WHERE ssn = 104;
UPDATE EMPLOYEE SET Dno = 2 WHERE ssn = 105;
UPDATE EMPLOYEE SET Dno = 3 WHERE ssn = 106;

-- 4. Insert projects referencing departments
INSERT INTO PROJECT (Pnumber, Pname, Plocation, Dno) VALUES
(10, 'ProductX', 'Alexandria', 1),
(20, 'ProductY', 'Alexandria', 1),
(30, 'ProductZ', 'Cairo', 2),
(40, 'Computerization', 'Alexandria', 3);

-- 5. Insert WORKS_ON records (8 records)
-- Employee 101 works on two projects (10 and 20)
-- Employee 102 works on two projects (10 and 20)
-- Project 10 total hours: 15.0 + 10.0 + 8.0 = 33.0 (> 20 hrs)
-- Project 20 total hours: 20.0 + 12.0 + 5.0 = 37.0 (> 20 hrs)
-- Project 30 total hours: 10.0 + 8.0 = 18.0 (<= 20 hrs)
-- Project 40 has nobody working on it (0 hrs)
INSERT INTO WORKS_ON (essn, Pno, hours) VALUES
(101, 10, 15.0),
(101, 20, 20.0),
(102, 10, 10.0),
(102, 20, 12.0),
(103, 10, 8.0),
(104, 30, 10.0),
(105, 30, 8.0),
(106, 20, 5.0);

-- 6. Insert DEPENDENT records (3 records)
INSERT INTO DEPENDENT (essn, dependent_name, gender, bdate, relationship) VALUES
(101, 'Kareem', 'M', '2015-02-10', 'Son'),
(101, 'Mariam', 'F', '2018-05-14', 'Daughter'),
(102, 'Nour', 'F', '2019-11-23', 'Daughter');
