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

// SQL for new appointment system with queue numbers
const appointmentTablesSQL = `
-- ================= DOCTOR QUEUE =================
CREATE TABLE IF NOT EXISTS doctor_queue (
  dr_id INT,
  queue_date DATE,
  current_number INT DEFAULT 0,
  PRIMARY KEY (dr_id, queue_date),
  FOREIGN KEY (dr_id) REFERENCES doctors(dr_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ================= APPOINTMENTS (Updated) =================
-- Modify existing appointments table to use queue_number instead of time_slot
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS queue_number INT NULL,
CHANGE COLUMN queue_number queue_number INT NULL,
ADD UNIQUE KEY IF NOT EXISTS unique_queue (dr_id, appointment_date, queue_number),
DROP COLUMN IF EXISTS time_slot;

-- Update status enum to include new statuses
ALTER TABLE appointments
MODIFY COLUMN status ENUM(
  'pending',
  'approved',
  'in_progress',
  'done',
  'skipped',
  'cancelled'
) DEFAULT 'pending';

-- ================= APPOINTMENT RESCHEDULES (Updated) =================
-- Modify appointment_reschedules to use queue_number
ALTER TABLE appointment_reschedules
ADD COLUMN IF NOT EXISTS proposed_queue_number INT,
DROP COLUMN IF EXISTS proposed_time_slot;

-- ================= SCHEDULES =================
CREATE TABLE IF NOT EXISTS schedules (
  id_schedule INT AUTO_INCREMENT PRIMARY KEY,
  dr_id INT,
  time_slot VARCHAR(50),
  day_of_week INT,
  specific_date DATE,
  is_recurring BOOLEAN DEFAULT TRUE,

  FOREIGN KEY (dr_id) REFERENCES doctors(dr_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ================= DOCTOR NOTIFICATIONS =================
CREATE TABLE IF NOT EXISTS doctor_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  doctor_user_id INT NOT NULL,
  doctor_name VARCHAR(255),
  average_rating DECIMAL(3,2),
  total_ratings INT,
  message TEXT NOT NULL,
  type ENUM('low_rating','improvement_needed','critical_rating','feedback_reminder','general'),
  status ENUM('unread','read','acknowledged') DEFAULT 'unread',
  severity ENUM('low','medium','high','critical') DEFAULT 'medium',
  alert_level INT DEFAULT 1,
  created_by_admin INT,
  auto_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  acknowledged_at TIMESTAMP NULL,

  FOREIGN KEY (doctor_id) REFERENCES doctors(dr_id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_user_id) REFERENCES users(id_u) ON DELETE CASCADE,
  FOREIGN KEY (created_by_admin) REFERENCES users(id_u) ON DELETE SET NULL,

  CHECK (alert_level BETWEEN 1 AND 4)
) ENGINE=InnoDB;

-- ================= DOCTOR ALERT HISTORY =================
CREATE TABLE IF NOT EXISTS doctor_alert_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  alert_type VARCHAR(50),
  rating_threshold DECIMAL(2,1),
  total_ratings INT,
  alert_level INT,
  sent_by_admin INT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  message_sent TEXT,

  FOREIGN KEY (doctor_id) REFERENCES doctors(dr_id) ON DELETE CASCADE,
  FOREIGN KEY (sent_by_admin) REFERENCES users(id_u) ON DELETE SET NULL,

  CHECK (alert_level BETWEEN 1 AND 4)
) ENGINE=InnoDB;

-- ================= ADMIN ALERT SETTINGS =================
CREATE TABLE IF NOT EXISTS admin_alert_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_name VARCHAR(100) UNIQUE,
  setting_value VARCHAR(255),
  description TEXT,
  updated_by INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ================= REVENUE TARGETS =================
CREATE TABLE IF NOT EXISTS revenue_targets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id VARCHAR(50) NOT NULL,
  item_type ENUM('doctor','hospital','specialty') NOT NULL,
  monthly_target DECIMAL(15,2) NOT NULL,
  target_month VARCHAR(7) NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE (item_id, item_type, target_month)
) ENGINE=InnoDB;
`;

async function setupAppointmentTables() {
  try {
    console.log('🔄 Setting up appointment tables for queue system...');

    // Split SQL content by semicolon and execute each statement
    const statements = appointmentTablesSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        await new Promise((resolve, reject) => {
          connection.execute(statement, (err, results) => {
            if (err) {
              // Ignore errors for ALTER TABLE if column already exists
              if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                console.log('⚠️  Column already exists or cannot be dropped, skipping...');
                resolve();
              } else {
                console.error('❌ Error executing statement:', err.message);
                console.error('Statement:', statement);
                reject(err);
              }
            } else {
              console.log('✅ Statement executed successfully');
              resolve(results);
            }
          });
        });
      }
    }

    console.log('🎉 Appointment tables setup completed!');
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    connection.end();
  }
}

// Run the setup
setupAppointmentTables();