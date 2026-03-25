const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// Database connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // nếu bạn chưa đặt mật khẩu XAMPP
  database: 'bookingmedical',
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }
  console.log('✅ Connected to MySQL database');
});

// Read and execute SQL file
async function setupFeedbackTables() {
  try {
    const sqlPath = path.join(__dirname, 'sql', 'create_feedback_tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL content by semicolon and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log('🔄 Setting up feedback tables...');
    
    for (const statement of statements) {
      if (statement.trim()) {
        await new Promise((resolve, reject) => {
          connection.execute(statement, (err, results) => {
            if (err) {
              console.error('❌ Error executing statement:', err.message);
              console.error('Statement:', statement);
              reject(err);
            } else {
              console.log('✅ Statement executed successfully');
              resolve(results);
            }
          });
        });
      }
    }

    console.log('🎉 Feedback tables setup completed successfully!');
    console.log('\n📋 Created tables:');
    console.log('   - doctor_ratings (for doctor feedback)');
    console.log('   - hospital_ratings (for hospital feedback)');
    console.log('   - Added average_rating and total_ratings columns to doctors and hospitals tables');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    connection.end();
  }
}

// Run the setup
setupFeedbackTables();







