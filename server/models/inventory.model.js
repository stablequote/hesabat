const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
    quantityBase: {
      type: Number,
      required: true,
      default: 0,
      min: 0, // stock can never go negative
      validate: { validator: Number.isInteger, message: 'quantityBase must be a whole number' },
    },
    avgCostBase: { type: Number, min: 0 },
    location: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inventory', inventorySchema);