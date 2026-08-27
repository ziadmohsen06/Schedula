const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  passwordHistory: {
    type: [String],
    default: [],
    select: false
  },
  passwordStrengthScore: {
    type: Number,
    default: 0
  },
  passwordResetOtp: {
    type: String,
    select: false
  },
  passwordResetOtpExpiresAt: {
    type: Date,
    select: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  photoUrl: {
    type: String,
    default: ''
  },
  dailyStartPreference: {
    type: String,
    enum: ['early', 'mid', 'late', 'flexible'],
    default: 'flexible'
  },
  lastStartPreferenceUpdate: {
    type: Date,
    default: null
  },
  hasSeenDailyPrompt: {
    type: Boolean,
    default: false
  },
  lastMoodCheckIn: {
    mood: { type: String, enum: ['great', 'okay', 'tired', 'stressed'] },
    date: { type: String }
  },
  accountabilityPartnerEmail: {
    type: String,
    trim: true,
    default: ''
  },
  themePreference: {
    name: { type: String, enum: ['garden', 'ocean', 'space', 'minimal'], default: 'garden' },
    darkMode: { type: Boolean, default: false }
  },
  semester: {
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  if (typeof this.password === 'string' && this.password.startsWith('$2')) {
    return;
  }

  const salt = await bcryptjs.genSalt(10);
  this.password = await bcryptjs.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);