import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

class MySQLDB {
  static instance;

  constructor() {
    if (MySQLDB.instance) {
      return MySQLDB.instance;
    }

    this.pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      waitForConnections: true,
      connectionLimit: 20,
      queueLimit: 0,
    });

    MySQLDB.instance = this;
  }

  getPool() {
    return this.pool;
  }
}

export const mySQLDB = new MySQLDB().getPool();
