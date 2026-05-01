const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  name: { type: String, required: true },
  avatar: { type: String },
  bio: { type: String },
  phone: { type: String }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password_hash);
};

// Remove password_hash when converting to JSON
userSchema.set('toJSON', {
  transform: function(doc, ret, opt) {
    delete ret.password_hash;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
