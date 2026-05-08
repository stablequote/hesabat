const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  method: {
    type: String,
    enum: ["Cash", "Bankak"],
    required: true,
  },
  transactionNumber: {
    type: String,
    // only required for Bankak
  },
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  totalAmount: { type: Number, required: true },
  transactions: {
    type: [transactionSchema],
    validate: {
      validator: function (transactions) {
        const sum = transactions.reduce((acc, t) => acc + t.amount, 0);
        return sum === this.totalAmount;
      },
      message: "Sum of transactions must equal totalAmount",
    },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  notes: { type: String },
}, { timestamps: true });

const saleInvoiceSchema = new mongoose.Schema({
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

        unitTotalPrice: {
            type: Number,
            required: true,
        },
        
        productSnapShot: {
            name: { type: String, required: true },
            salePrice: { type: Number, required: true },
            purchasePrice: { type: Number, required: true },
        },
    }],
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    payments: [paymentSchema],
    totalSalePrice: {
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
    status: {
        type: String,
        enum: ["unpaid", "partial", "paid", "cancelled", "refunded"],
        default: "unpaid",
    },
    saleDate: {
        type: Date,
        default: Date.now,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    notes: {
        type: String,
    },
}, { timestamps: true });


// const saleInvoiceSchema = mongoose.Schema({
//     saleID: {
//         type: String,
//         unique: true,
//         required: true,
//     },
//     products: [{
//         product: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'Product',
//             required: true,
//         },
//         name: String,   // snapshot at sale time
//         price: Number,  // snapshot at sale time
//         quantity: Number,
//         unit: {
//             type: String,
//             enum: ["Kilo", "Barrel", "Piece"],
//             required: true,
//         },
//         unitPurchasePrice: {
//             type: Number,
//             required: true,
//         },
//         unitTotalPrice: {
//             type: Number,
//             required: true,
//         },
//     }],
//     client: { 
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Client',
//         required: true
//     }, // client per order
//     paymentType: {
//         type: String,
//         enum: ["advanced", "later", "partial"]
//     },
//     payments: [paymentSchema],
//     totalSalePrice: {
//         type: Number,
//         required: true,
//     },
//     paidAmount: {
//         type: Number, 
//         default: 0
//     },
//     remainingAmount: { 
//         type: Number, 
//         default: 0 
//     },
//     isSalePaid: {
//         type: Boolean,
//         default: false,
//     },
//     saleDate: {
//         type: Date,
//         default: Date.now,
//         required: true,
//     },
//     cartRevenue: {  // Sum of all unitRevenue
//         type: Number,
//     },
//     status: {
//         type: String,
//         enum: ["paid", "cancelled", "refunded"]
//     },
//     createdBy: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//     },
//     notes: {
//         type: String,
//     },
// }, {timestamps: true});

saleInvoiceSchema.pre("save", function (next) {
    // total paid from all installments
    this.paidAmount = this.payments.reduce(
        (sum, payment) => sum + payment.totalAmount,
        0
    );
    this.remainingAmount = this.totalSalePrice - this.paidAmount;
    
    // status logic
    if (this.paidAmount === 0) {
        this.status = "unpaid";
    } else if (this.paidAmount < this.totalSalePrice) {
        this.status = "partial";
    } else {
        this.status = "paid";
    }
    // next();
});

module.exports = mongoose.model('saleInvoice', saleInvoiceSchema);