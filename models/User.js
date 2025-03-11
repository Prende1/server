const mongoose = require("mongoose");


const userSchema = new mongoose.Schema({
  username: {
    type: String,
  },
  phone: {
    type: String,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  premium: {
    type: Boolean,
    default: false
  },
  paymentDetails: {
    type: Object,
    default: {}
  },
  createdTS: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;

