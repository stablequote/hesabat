const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["Cash", "Bankak", "Cash + Bankak"]},
  transactionNumber: { type: String },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  notes: {type: String}
}, { timestamps: true });

const purchaseInvoiceSchema = mongoose.Schema({
    invoiceID: {
        type: String,
        unique: true,
        required: true,
    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        unit: {
            type: String,
            enum: ["Kilo", "Barrel", "Piece"],
            required: true,
        },
        unitPurchasePrice: {
            type: Number,
            required: true,
        },
        unitTotalPrice: {
            type: Number,
            required: true,
        },
    }],
    vendor: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    }, // Vendor per order
    paymentType: {
        type: String,
        enum: ["advanced", "later"]
    },
    totalOrderPrice: {
        type: Number,
        required: true,
    },
    paidAmount: {
        type: Number, 
        default: 0
    },
    remainingAmount: { 
        type: Number, 
        default: 0 
    },
    isOrderPaid: {
        type: Boolean,
        default: false,
    },
    payments: [paymentSchema],
    orderDate: {
        type: Date,
        default: Date.now(),
        required: true,
    },
    deliveryDate: {
        type: Date,
        required: false,
    },
    status: {
        type: String,
        enum: ["paid", "cancelled", "received"]
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    notes: {
        type: String,
    },
}, {timestamps: true});

purchaseInvoiceSchema.pre("save", function (next) {
  // auto-update status and remaining balance
  this.paidAmount = this.payments.reduce((sum, p) => sum + p.amount, 0);
  this.remainingAmount = this.totalAmount - this.paidAmount;
  if (this.paidAmount === 0) this.status = "unpaid";
  else if (this.paidAmount < this.totalAmount) this.status = "partial";
  else this.status = "paid";
//   next();
});

module.exports = mongoose.model('PurchaseInvoice', purchaseInvoiceSchema);