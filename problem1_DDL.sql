DROP DATABASE IF EXISTS company;
CREATE DATABASE company;
USE company;

CREATE TABLE EMPLOYEE (
    ssn INT NOT NULL,
    fname VARCHAR(50) NOT NULL,
    lname VARCHAR(50) NOT NULL,
    bdate DATE,
    address VARCHAR(100),
    gender CHAR(1),
    salary DECIMAL(10, 2),
    super_ssn INT,
    Dno INT,
    PRIMARY KEY (ssn),
    FOREIGN KEY (super_ssn) REFERENCES EMPLOYEE(ssn)
);

CREATE TABLE DEPARTMENT (
    Dnumber INT NOT NULL,
    Dname VARCHAR(50) NOT NULL,
    mgr_ssn INT,
    mgr_start_date DATE,
    PRIMARY KEY (Dnumber),
    FOREIGN KEY (mgr_ssn) REFERENCES EMPLOYEE(ssn)
);

CREATE TABLE PROJECT (
    Pnumber INT NOT NULL,
    Pname VARCHAR(50) NOT NULL,
    Plocation VARCHAR(50),
    Dno INT,
    PRIMARY KEY (Pnumber),
    FOREIGN KEY (Dno) REFERENCES DEPARTMENT(Dnumber)
);

CREATE TABLE WORKS_ON (
    essn INT NOT NULL,
    Pno INT NOT NULL,
    hours DECIMAL(5, 1) NOT NULL,
    PRIMARY KEY (essn, Pno),
    FOREIGN KEY (essn) REFERENCES EMPLOYEE(ssn),
    FOREIGN KEY (Pno) REFERENCES PROJECT(Pnumber)
);

CREATE TABLE DEPENDENT (
    essn INT NOT NULL,
    dependent_name VARCHAR(50) NOT NULL,
    gender CHAR(1),
    bdate DATE,
    relationship VARCHAR(50),
    PRIMARY KEY (essn, dependent_name),
    FOREIGN KEY (essn) REFERENCES EMPLOYEE(ssn)
);

ALTER TABLE EMPLOYEE
    ADD CONSTRAINT fk_emp_dept FOREIGN KEY (Dno) REFERENCES DEPARTMENT(Dnumber);
