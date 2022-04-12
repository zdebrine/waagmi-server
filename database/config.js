require('dotenv').config();
var pg = require("pg");
var config = {
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  // ssl: { rejectUnauthorized: false },
};

var pool = new pg.Pool(config);
console.log("DATABASE CONNECTED");

module.exports = { pool };
