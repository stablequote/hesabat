const mongoose = require('mongoose');
const SaleInvoice = require('../models/saleInvoice.model');
const Client = require('../models/client.model');
const Counter = require('../models/counter.model');
const { processSaleLines } = require('../services/invoiceLines.service');
const { restoreBase, StockError } = require('../services/stock.service');
const HttpError = require('../utils/httpError');
const { round2 } = require('../utils/money');

const METHODS = ['Cash', 'Bankak'];

// ---------- helpers ----------

function handleError(res, error, label) {
  if (error instanceof HttpError || error instanceof StockError) {
    return res.status(error.status).json({ message: error.message });
  }
  if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid id supplied.' });
  console.error(`${label} failed:`, error);
  return res.status(500).json({ message: 'Something went wrong.' });
}

// totalAmount is computed here, never trusted from the client; zero-amount rows are dropped
function normalizePayments(payments, userId) {
  const out = [];
  for (const p of payments ?? []) {
    const transactions = [];
    for (const t of p.transactions ?? []) {
      const amount = round2(Number(t.amount) || 0);
      if (amount < 0) throw new HttpError('Payment amounts cannot be negative.');
      if (amount === 0) continue;
      if (!METHODS.includes(t.method)) throw new HttpError('Invalid payment method.');
      const transactionNumber = t.method === 'Bankak' ? String(t.transactionNumber ?? '').trim() : undefined;
      if (t.method === 'Bankak' && !transactionNumber) {
        throw new HttpError('Bankak payments require a transaction number.');
      }
      transactions.push({ amount, method: t.method, transactionNumber });
    }
    if (transactions.length === 0) continue;
    out.push({
      totalAmount: round2(transactions.reduce((s, t) => s + t.amount, 0)),
      transactions,
      notes: p.notes,
      createdBy: userId,
    });
  }
  return out;
}

const sumPayments = (payments) => round2(payments.reduce((s, p) => s + p.totalAmount, 0));

function parseDiscount(raw, subtotal) {
  const discount = round2(Number(raw) || 0);
  if (discount < 0 || discount - subtotal > 0.005) {
    throw new HttpError('Discount must be between 0 and the invoice subtotal.');
  }
  return discount;
}

// Atomic sequential number: SI-00001, SI-00002, ...
// async function nextInvoiceId(session) {
//   const latest = await SaleInvoice.findOne().sort({ invoiceID: -1 }).select('invoiceID').session(session).lean();
//   const highest = latest ? parseInt(latest.invoiceID.split('-')[1], 10) || 0 : 0;

//   // makes sure the counter is never behind existing invoices (idempotent, only matters on first use)
//   await Counter.updateOne(
//     { _id: 'saleInvoice' },
//     { $max: { seq: highest } },
//     { upsert: true, session, setDefaultsOnInsert: false }
//   );
//   const counter = await Counter.findOneAndUpdate(
//     { _id: 'saleInvoice' },
//     { $inc: { seq: 1 } },
//     { returnDocument: 'after', session }
//   );
//   return `SI-${String(counter.seq).padStart(5, '0')}`;
// }

// GPT version
// Atomic sequential number: SI-00001, SI-00002, ...
async function nextInvoiceId(session) {
  const latest = await SaleInvoice.findOne()
    .sort({ invoiceID: -1 })
    .select('invoiceID')
    .session(session)
    .lean();

  const highest = latest
    ? parseInt(latest.invoiceID.split('-')[1], 10) || 0
    : 0;

  // Ensure the counter is never behind existing invoices.
  await Counter.updateOne(
    { _id: 'saleInvoice' },
    { $max: { seq: highest } },
    {
      upsert: true,
      session,
      setDefaultsOnInsert: false
    }
  );

  const counter = await Counter.findOneAndUpdate(
    { _id: 'saleInvoice' },
    { $inc: { seq: 1 } },
    {
      returnDocument: 'after',
      session
    }
  );

  if (!counter) {
    throw new Error('Failed to generate sale invoice number.');
  }

  return `SI-${String(counter.seq).padStart(5, '0')}`;
}

// Puts the stock of every line back. Legacy lines have no baseQuantity: their quantity was already in the product's unit.
async function restoreInvoiceStock({ invoice, note, session }) {
  for (const line of invoice.products) {
    await restoreBase({
      productId: line.product,
      baseQty: line.baseQuantity ?? line.quantity,
      unit: line.unit,
      enteredQuantity: line.quantity,
      factor: line.factor,
      type: 'return',
      reference: { kind: 'saleInvoice', id: invoice._id },
      note,
      session,
    });
  }
}

// ---------- create ----------

exports.createSaleInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let invoice;
    await session.withTransaction(async () => {
      const { products, client, notes } = req.body;

      if (!client) throw new HttpError('Client is required.');
      const existingClient = await Client.findById(client).session(session);
      if (!existingClient) throw new HttpError('Client not found.', 404);

      const invoiceId = new mongoose.Types.ObjectId();
      const { lines, subtotal } = await processSaleLines({ lines: products, invoiceId, session });

      const discount = parseDiscount(req.body.discount, subtotal);
      const totalSalePrice = round2(subtotal - discount);

      const payments = normalizePayments(req.body.payments, req.user._id);
      const paidAmount = sumPayments(payments);
      if (paidAmount - totalSalePrice > 0.005) throw new HttpError('Overpayment not allowed.');

      // const invoiceID = await nextInvoiceId({ Model: SaleInvoice, counterKey: 'saleInvoice', prefix: 'SI', session });
      const invoiceID = await nextInvoiceId(session);

      [invoice] = await SaleInvoice.create(
        [{
          _id: invoiceId,
          invoiceID,
          products: lines,
          client,
          payments,
          subtotal,
          discount,
          totalSalePrice,
          paidAmount,
          remainingAmount: round2(totalSalePrice - paidAmount),
          notes,
          createdBy: req.user._id,
        }],
        { session }
      );

      // Populate client information
      await invoice.populate({
        path: 'client',
        select: 'fullName',
        options: { session },
      });
    });

    return res.status(201).json({ success: true, invoice });
  } catch (error) {
    return handleError(res, error, 'createSaleInvoice');
  } finally {
    session.endSession();
  }
};

// ---------- read ----------

exports.getAllSaleInvoices = async (req, res) => {
  try {
    const invoices = await SaleInvoice.find()
      .populate('client', 'fullName')
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    return handleError(res, error, 'getAllSaleInvoices');
  }
};

exports.getInvoicesByClient = async (req, res) => {
  try {
    const { clientID } = req.params;
    const invoices = await SaleInvoice.find({ client: clientID })
      .populate('client', 'fullName')
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    return handleError(res, error, 'getInvoicesByClient');
  }
};

// ---------- installments ----------

exports.addInstallmentPayment = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let invoice;
    await session.withTransaction(async () => {
      const { invoiceID } = req.params;

      invoice = await SaleInvoice.findOne({ invoiceID }).populate('client', 'fullName').session(session);
      if (!invoice) throw new HttpError('Invoice not found.', 404);
      if (['cancelled', 'refunded'].includes(invoice.status)) {
        throw new HttpError(`Cannot add a payment to a ${invoice.status} invoice.`, 409);
      }

      const [payment] = normalizePayments([req.body.payment], req.user._id);
      if (!payment) throw new HttpError('Payment amount must be greater than zero.');

      if (round2(invoice.paidAmount + payment.totalAmount) - invoice.totalSalePrice > 0.005) {
        throw new HttpError('Overpayment not allowed.');
      }

      invoice.payments.push(payment);
      await invoice.save({ session }); // the pre-save hook recomputes paid, remaining and status
    });

    return res.json({ success: true, invoice });
  } catch (error) {
    return handleError(res, error, 'addInstallmentPayment');
  } finally {
    session.endSession();
  }
};

// ---------- edit ----------

exports.editSaleInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let invoice;
    await session.withTransaction(async () => {
      const { invoiceID } = req.params;

      invoice = await SaleInvoice.findOne({ invoiceID }).session(session);
      if (!invoice) throw new HttpError('Invoice not found.', 404);
      if (['cancelled', 'refunded'].includes(invoice.status)) {
        throw new HttpError(`A ${invoice.status} invoice cannot be edited.`, 409);
      }

      // 1) put the old stock back, 2) deduct the new lines. All rolls back together on any failure.
      await restoreInvoiceStock({ invoice, note: `Edit of ${invoice.invoiceID}`, session });

      const { lines, subtotal } = await processSaleLines({
        lines: req.body.products,
        invoiceId: invoice._id,
        session,
      });

      const discount = parseDiscount(
        req.body.discount !== undefined ? req.body.discount : invoice.discount,
        subtotal
      );
      const totalSalePrice = round2(subtotal - discount);

      if (invoice.paidAmount - totalSalePrice > 0.005) {
        throw new HttpError('Existing payments exceed the new total.');
      }

      invoice.products = lines;
      invoice.subtotal = subtotal;
      invoice.discount = discount;
      invoice.totalSalePrice = totalSalePrice;
      if (req.body.notes !== undefined) invoice.notes = req.body.notes;

      await invoice.save({ session });
    });

    return res.json({ success: true, invoice });
  } catch (error) {
    return handleError(res, error, 'editSaleInvoice');
  } finally {
    session.endSession();
  }
};

// ---------- delete ----------

exports.deleteSaleInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { invoiceId } = req.params;

      const invoice = await SaleInvoice.findById(invoiceId).session(session);
      if (!invoice) throw new HttpError('Invoice not found.', 404);

      await restoreInvoiceStock({ invoice, note: `Deleted ${invoice.invoiceID}`, session });
      await invoice.deleteOne({ session });
    });

    return res.json({ success: true, message: 'Invoice deleted' });
  } catch (error) {
    return handleError(res, error, 'deleteSaleInvoice');
  } finally {
    session.endSession();
  }
};