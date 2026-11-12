const Counter = require('../models/counter.model');

async function nextInvoiceId({ Model, counterKey, prefix, session }) {
  const latest = await Model.findOne({ invoiceID: new RegExp(`^${prefix}-`) })
    .sort({ invoiceID: -1 })
    .select('invoiceID')
    .session(session)
    .lean();
  const highest = latest ? parseInt(latest.invoiceID.split('-')[1], 10) || 0 : 0;

  // never let the counter fall behind existing invoices (only matters on first use)
  await Counter.updateOne({ _id: counterKey }, { $max: { seq: highest } }, { upsert: true, session });
  const counter = await Counter.findOneAndUpdate(
    { _id: counterKey },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', session }
  );
  return `${prefix}-${String(counter.seq).padStart(5, '0')}`;
}

module.exports = { nextInvoiceId };