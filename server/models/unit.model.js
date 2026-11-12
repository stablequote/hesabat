const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    abbreviation: { type: String, trim: true },
  },
  { timestamps: true }
);

// case-insensitive uniqueness ("box" and "Box" are the same unit)
unitSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

module.exports = mongoose.model('Unit', unitSchema);