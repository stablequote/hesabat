const mongoose = require('mongoose');

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const transactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0 },
  method: { type: String, enum: ['Cash', 'Bankak'], required: true },
  transactionNumber: { type: String }, // enforced for Bankak in the controller
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  totalAmount: { type: Number, required: true },
  transactions: {
    type: [transactionSchema],
    validate: {
      validator: function (transactions) {
        const sum = transactions.reduce((acc, t) => acc + t.amount, 0);
        return Math.abs(sum - this.totalAmount) < 0.005; // tolerance instead of exact float equality
      },
      message: 'Sum of transactions must equal totalAmount',
    },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
}, { timestamps: true });

const lineSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' }, // absent on legacy invoices
  unitName: { type: String, required: true },                   // snapshot, used for display
  quantity: { type: Number, required: true, min: 0 },           // in the unit that was sold
  factor: { type: Number },                                     // snapshot (legacy: absent = 1)
  baseQuantity: { type: Number },                               // quantity * factor
  unitTotalPrice: { type: Number, required: true },             // line total
  productSnapShot: {
    name: { type: String, required: true },
    salePrice: { type: Number, required: true },     // per sold unit
    purchasePrice: { type: Number, required: true }, // per sold unit
  },
});

const saleInvoiceSchema = new mongoose.Schema({
  invoiceID: { type: String, unique: true, required: true },
  products: [lineSchema],
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  payments: [paymentSchema],
  subtotal: { type: Number },                         // sum of lines, before discount
  discount: { type: Number, default: 0, min: 0 },
  totalSalePrice: { type: Number, required: true },   // amount payable = subtotal - discount
  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['unpaid', 'partial', 'paid', 'cancelled', 'refunded'],
    default: 'unpaid',
  },
  saleDate: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
}, { timestamps: true });

saleInvoiceSchema.pre('save', function () {
  this.paidAmount = round2(this.payments.reduce((sum, p) => sum + p.totalAmount, 0));
  this.remainingAmount = round2(this.totalSalePrice - this.paidAmount);

  if (['cancelled', 'refunded'].includes(this.status)) return; // don't overwrite these

  if (this.paidAmount === 0 && this.totalSalePrice > 0) this.status = 'unpaid';
  else if (this.remainingAmount > 0) this.status = 'partial';
  else this.status = 'paid';
});

module.exports = mongoose.model('saleInvoice', saleInvoiceSchema);