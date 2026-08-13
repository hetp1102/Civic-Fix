const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false }, // only used for officer/admin email-password login
    googleId: { type: String, index: true, sparse: true },
    avatar: { type: String },
    phone: { type: String, trim: true },

    role: {
      type: String,
      enum: ['citizen', 'officer', 'admin'],
      default: 'citizen',
      required: true,
    },

    // Officers are assigned to exactly one department
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },

    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
