const mongoose = require('mongoose');

const unitLevelSchema = new mongoose.Schema(
  {
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    // number of BASE units contained in 1 of this unit (base unit itself = 1)
    factor: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: 'factor must be a whole number' },
    },
    purchasePrice: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    manufacturer: { type: String, trim: true },
    category: { type: String },
    unitLevels: { type: [unitLevelSchema], required: true },
    image: { type: String },
  },
  { timestamps: true }
);

productSchema.path('unitLevels').validate(function (levels) {
  if (!levels || levels.length === 0) return false;
  if (levels.filter((l) => l.factor === 1).length !== 1) return false; // exactly one base unit
  const ids = levels.map((l) => String(l.unit));
  return new Set(ids).size === ids.length; // no duplicate units
}, 'A product needs unique units, with exactly one base unit (factor 1).');

module.exports = mongoose.model('Product', productSchema);