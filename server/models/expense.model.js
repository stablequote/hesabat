const mongoose = require("mongoose");

const expenseSchema = mongoose.Schema(
  {
    amount: Number,

    description: String,

    category: {
      type: String,
      enum: ["Salary", "Food", "Transportation", "Rent", "Governmental fees"],
    },

    paymentMethod: {
      type: String,
      enum: ["Cash", "Bankak"],
      default: "Cash",
    },

    transactionNumber: {
      type: String,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Expense", expenseSchema);