const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    type: {
      type: String,
      enum: ['opening', 'purchase', 'sale', 'return', 'adjustment'],
      required: true,
    },
    quantityBaseDelta: { type: Number, required: true }, // signed: + in, - out
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' }, // unit the user entered
    enteredQuantity: { type: Number }, // quantity in that unit
    factor: { type: Number }, // factor at the time (snapshot)
    reference: { kind: String, id: mongoose.Schema.Types.ObjectId }, // e.g. { kind: 'Invoice', id }
    note: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockMovement', stockMovementSchema);