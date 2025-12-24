
// models/authorModel.js
const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  middleName: String,
  lastName: { type: String, required: true },
  photo: { type: String, required: true },
  createdDate: { type: Date, default: Date.now },
});

const Author = mongoose.model('Author', authorSchema);

module.exports = Author;