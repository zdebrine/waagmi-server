require('dotenv').config();
var pg = require("pg");
var config = {
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false },
};

console.log("DATABASE CONNECTED");
var pool = new pg.Pool(config);

module.exports = { pool };
