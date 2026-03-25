const mysql = require('mysql2');

// Database connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bookingmedical',
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }
  console.log('✅ Connected to MySQL database');
});

async function debugFeedback() {
  try {
    console.log('🔍 Debugging feedback system...\n');

    // Test 1: Check if tables exist
    console.log('1. Checking if feedback tables exist...');
    execute(
      "SHOW TABLES LIKE 'doctor_ratings'"
    );
    console.log('doctor_ratings table exists:', tables.length > 0);

    const [hospitalTables] = await connection.execute(
      "SHOW TABLES LIKE 'hospital_ratings'"
    );
    console.log('hospital_ratings table exists:', hospitalTables.length > 0);

    // Test 2: Check if doctors table has data
    console.log('\n2. Checking doctors table...');
    const [doctors] = await connection.execute(
      'SELECT id_bs, name FROM doctors LIMIT 3'
    );
    console.log('Doctors found:', doctors.length);
    if (doctors.length > 0) {
      console.log('First doctor:', doctors[0]);
    }

    // Test 3: Check if hospitals table has data
    console.log('\n3. Checking hospitals table...');
    const [hospitals] = await connection.execute(
      'SELECT id_bv, ten_bv FROM hospitals LIMIT 3'
    );
    console.log('Hospitals found:', hospitals.length);
    if (hospitals.length > 0) {
      console.log('First hospital:', hospitals[0]);
    }

    // Test 4: Check if users table has data
    console.log('\n4. Checking users table...');
    const [users] = await connection.execute(
      'SELECT id_u, name_u, email_u FROM users LIMIT 3'
    );
    console.log('Users found:', users.length);
    if (users.length > 0) {
      console.log('First user:', users[0]);
    }

    // Test 5: Try to get doctor feedbacks
    console.log('\n5. Testing doctor feedbacks query...');
    try {
      const [ratings] = await connection.execute(
        `SELECT dr.*, u.name_u as user_name, u.email_u as user_email 
         FROM doctor_ratings dr 
         LEFT JOIN users u ON dr.user_id = u.id_u 
         WHERE dr.doctor_id = ? 
         ORDER BY dr.created_at DESC 
         LIMIT ? OFFSET ?`,
        [1, 10, 0]
      );
      console.log('Doctor feedbacks query successful, found:', ratings.length);
    } catch (error) {
      console.log('❌ Doctor feedbacks query error:', error.message);
    }

    console.log('\n🎉 Debug completed!');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    connection.end();
  }
}

// Run the debug
debugFeedback();







