// Load environment variables first
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const hospitalRoutes = require("./routes/hospital.routes");
const path = require("path");
const app = express();
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
// Mount API router
app.use("/api", hospitalRoutes);

const doctorRoutes = require("./routes/doctor.routes");
app.use("/api", doctorRoutes);

const patientRoutes = require("./routes/patients.routes");
app.use("/api", patientRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

const userRoutes = require("./routes/user.routes");
app.use("/api/users", userRoutes);

const setupSwagger = require("./config/swagger");
setupSwagger(app);

const searchRoutes = require("./routes/search.routes");
app.use("/api/search", searchRoutes);

const feedbackRoutes = require("./routes/feedback.routes");
app.use("/api/feedback", feedbackRoutes);

const adminRoutes = require("./routes/admin.routes");
app.use("/api/admin", adminRoutes);


const revenueTargetRoutes = require("./routes/revenueTarget.routes");
app.use("/api/admin/revenue-targets", revenueTargetRoutes);

const specialtyRoutes = require("./routes/specialty.routes");
app.use("/api", specialtyRoutes);

// Notification routes (doctor)
const notificationRoutes = require("./routes/notification.routes");
app.use("/api", notificationRoutes);

// Admin doctor alerts routes
const adminNotificationRoutes = require("./routes/admin.notification.routes");
app.use("/api", adminNotificationRoutes);

const botpressRoutes = require("./routes/botpress.routes");
app.use("/api/bot", botpressRoutes);

// Ensure DB columns for rescheduling exist using async/await (promise pool)
const db = require("./config/db");

(async function ensureSchema() {
  try {
    // Schema migrations removed - new table structure (patient_profiles, appointments, appointment_reschedules) is used

    // Ensure doctor_notifications table exists (already create if not exists)
    await db.query(`CREATE TABLE IF NOT EXISTS doctor_notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      doctor_id INT NOT NULL,
      doctor_user_id INT NOT NULL,
      doctor_name VARCHAR(255),
      average_rating DECIMAL(3,2),
      message TEXT NOT NULL,
      type ENUM('low_rating','general') DEFAULT 'low_rating',
      status ENUM('unread','read') DEFAULT 'unread',
      created_by_admin INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (doctor_id) REFERENCES doctors(dr_id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_user_id) REFERENCES users(id_u) ON DELETE CASCADE
    )`);

    // Ensure revenue_targets table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS revenue_targets (
        id INT PRIMARY KEY AUTO_INCREMENT,
        item_id VARCHAR(50) NOT NULL,
        item_type ENUM('doctor', 'hospital', 'specialty') NOT NULL,
        monthly_target DECIMAL(15,2) NOT NULL,
        target_month VARCHAR(7) NOT NULL,
        note TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_item (item_id, item_type),
        INDEX idx_month (target_month),
        INDEX idx_type (item_type),
        UNIQUE KEY unique_target (item_id, item_type, target_month)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log("✅ Database schema ensured");
  } catch (err) {
    console.error("❌ Failed to ensure database schema:", err.message);
  }
})();

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
