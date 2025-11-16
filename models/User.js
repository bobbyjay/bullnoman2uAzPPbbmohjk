const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const DeviceSchema = new mongoose.Schema({
  token: { type: String },
  addedAt: { type: Date, default: Date.now },
}, { _id: false });

const LimitsSchema = new mongoose.Schema({
  dailyDeposit: { type: Number, default: 10000 },
  dailyWithdrawal: { type: Number, default: 5000 },
}, { _id: false });

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },
  isAdmin: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  limits: { type: LimitsSchema, default: () => ({}) },
  profilePictureId: { type: String },
  devices: [DeviceSchema],

  // ==============================
  // 📌 EMAIL VERIFICATION FIELDS
  // ==============================
  isVerified: { type: Boolean, default: false },

  verificationToken: {
    type: String,
    trim: true,             // prevent accidental spaces
  },

  // Expires in ~2 minutes (controller sets this)
  verificationExpires: {
    type: Date,
    index: true,            // improves lookup & cleanup
  },

  createdAt: { type: Date, default: Date.now },
});

// 🔐 Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔑 Compare entered password with stored hash
UserSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', UserSchema);
