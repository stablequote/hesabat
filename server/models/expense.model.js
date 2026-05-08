const mongoose = require('mongoose');

const expenseSchema = mongoose.Schema({
  amount: Number,
  description: String,
  category: {
    type: String,
    enum: ["fuel", "elecricity", "meal", "other"]
  },
  paymentMethod: {
    type: String,
    enum: ["Cash", "Bankak"],
    default: "Cash"
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    // required: true
  }
}, { timestaps: true })

module.exports = mongoose.model('Expense', expenseSchema);