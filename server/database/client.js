const { Client } = require("pg");

require("dotenv").config();

let client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: process.env.DB_HOST !== "localhost" ? { rejectUnauthorized: false } : false,
});

module.exports = { client };