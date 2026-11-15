const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function init() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'ahmed227#',
    multipleStatements: true
  });

  console.log('Connected to MySQL server.');

  const p1DDL = fs.readFileSync(path.join(__dirname, '../../problem1_DDL.sql'), 'utf8');
  const p1DML = fs.readFileSync(path.join(__dirname, '../../problem1_DML.sql'), 'utf8');
  const p2DDL = fs.readFileSync(path.join(__dirname, '../../problem2_DDL.sql'), 'utf8');
  const p2DML = fs.readFileSync(path.join(__dirname, '../../problem2_DML.sql'), 'utf8');

  console.log('Executing Problem 1 DDL...');
  await connection.query(p1DDL);
  console.log('Executing Problem 1 DML...');
  await connection.query(p1DML);

  console.log('Executing Problem 2 DDL...');
  await connection.query(p2DDL);
  console.log('Executing Problem 2 DML...');
  await connection.query(p2DML);

  console.log('✅ Both Problem 1 (company) and Problem 2 (library) initialized successfully!');
  await connection.end();
}

init().catch(err => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});
