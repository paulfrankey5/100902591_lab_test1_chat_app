const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  firstname: {
    type: String
  },
  lastname: {
    type: String
  },
  password: {
    type: String,
    required: true
  },
  createdon: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", userSchema);
