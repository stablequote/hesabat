// models/FinanceTransfer.js
const mongoose = require('mongoose');

const financeTransferSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  from: {
    type: String,
    enum: ['Cash', 'Bankak'],
    default: 'Cash', // You give cash
  },
  to: {
    type: String,
    enum: ['Cash', 'Bankak'],
    default: 'Bankak', // You receive bank
  },
  description: {
    type: String,
    default: '',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('FinanceTransfer', financeTransferSchema);