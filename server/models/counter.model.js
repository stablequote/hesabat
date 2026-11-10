const mongoose = require('mongoose');

// no default on seq on purpose: a default would conflict with $max on upsert
const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number } });

module.exports = mongoose.model('Counter', counterSchema);