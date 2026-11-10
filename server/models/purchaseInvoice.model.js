const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['Cash', 'Bankak', 'Cash + Bankak'] },
  transactionNumber: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
}, { timestamps: true });

const lineSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String },                                 // snapshot (absent on legacy lines)
  unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },   // absent on legacy lines
  unitName: { type: String, required: true },                    // snapshot for display
  quantity: { type: Number, required: true },                    // in the unit that was bought
  factor: { type: Number },                                      // snapshot (legacy: absent = 1)
  baseQuantity: { type: Number },                                // quantity * factor
  unitPurchasePrice: { type: Number, required: true },           // per bought unit
  unitTotalPrice: { type: Number, required: true },
});

const purchaseInvoiceSchema = new mongoose.Schema({
  invoiceID: { type: String, unique: true, required: true },
  products: [lineSchema],
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  paymentType: { type: String, enum: ['advanced', 'later'] },
  totalOrderPrice: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  isOrderPaid: { type: Boolean, default: false },
  payments: [paymentSchema],
  orderDate: { type: Date, default: Date.now, required: true }, // was Date.now() (evaluated once at startup)
  deliveryDate: { type: Date },
  status: { type: String, enum: ['paid', 'cancelled', 'received', 'pending', 'partial'] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('PurchaseInvoice', purchaseInvoiceSchema);