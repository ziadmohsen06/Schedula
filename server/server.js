const dns = require('dns');
const dotenv = require('dotenv');

dns.setServers(['8.8.8.8', '1.1.1.1']);
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const aiRoutes = require('./routes/aiRoutes');
const twoFactorRoutes = require('./routes/twoFactorRoutes');
const chatRoutes = require('./routes/chatRoutes');
const digestRoutes = require('./routes/digestRoutes');
const securityRoutes = require('./routes/securityRoutes');
const accountRoutes = require('./routes/accountRoutes');
const courseRoutes = require('./routes/courseRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const classScheduleRoutes = require('./routes/classScheduleRoutes');
const goalRoutes = require('./routes/goalRoutes');
const habitRoutes = require('./routes/habitRoutes');
const socialRoutes = require('./routes/socialRoutes');
const { sendWeeklyDigests } = require('./utils/digest');

connectDB();

const app = express();

// Security HTTP headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again after 15 minutes' }
});
app.use('/api/', limiter);

// Stricter limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many login attempts, please try again after 15 minutes' }
});
app.use('/api/auth/login', authLimiter);

app.use(cors());
app.use(express.json());

const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/digest', digestRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/class-schedule', classScheduleRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/social', socialRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Schedula API is running' });
});

// Weekly digest: every Sunday at 8am
cron.schedule('0 8 * * 0', () => {
  sendWeeklyDigests().catch(err => console.error('Weekly digest cron failed:', err.message));
}, { timezone: process.env.DIGEST_TIMEZONE || 'UTC' });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});