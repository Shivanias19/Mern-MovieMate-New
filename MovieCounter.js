
const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: { type: Number, required: true },
  sequence: { type: Number, default: 0 },
});

module.exports = mongoose.model("MovieCounter", counterSchema);
