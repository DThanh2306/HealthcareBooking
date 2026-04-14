const mysql = require('mysql2');

// Create connection pool để tránh connection timeout
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // nếu bạn chưa đặt mật khẩu XAMPP
  database: 'bookingmedical',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  idleTimeout: 300000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    return;
  }
  console.log('✅ MySQL connected with pool ID:', connection.threadId);
  connection.release(); // Release connection back to pool
});

// Export promise version for async/await (default - dùng cho services/controllers)
const promisePool = pool.promise();

module.exports = promisePool;