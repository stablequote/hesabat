const Product = require('../models/product.model');
const Unit = require('../models/unit.model');
const { deductStock, toBase } = require('./stock.service');
const HttpError = require('../utils/httpError');
const { round2 } = require('../utils/money');

// Validates lines, deducts stock atomically, returns lines in the invoice schema's shape.
async function processSaleLines({ lines, invoiceId, session }) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new HttpError('At least one product is required.');
  }

  const result = [];
  let subtotal = 0;

  for (const line of lines) {
    if (!line.product || !line.unit) throw new HttpError('Each line needs a product and a unit.');

    const product = await Product.findById(line.product).session(session); // unpopulated: toBase matches unit ids
    if (!product) throw new HttpError('Product not found.', 404);

    const quantity = Number(line.quantity);
    const { base, level } = toBase(product, line.unit, quantity);

    const unitDoc = await Unit.findById(line.unit).select('name').session(session).lean();

    const hasPrice = line.salePrice !== undefined && line.salePrice !== null && line.salePrice !== '';
    const salePrice = hasPrice ? Number(line.salePrice) : level.salePrice;
    if (!(salePrice >= 0)) throw new HttpError(`Invalid price for "${product.name}".`);

    await deductStock({
      product,
      unitId: line.unit,
      quantity,
      reference: { kind: 'saleInvoice', id: invoiceId },
      session,
    });

    const unitTotalPrice = round2(quantity * salePrice);
    subtotal += unitTotalPrice;

    result.push({
      product: product._id,
      unit: line.unit,
      unitName: unitDoc?.name ?? '',
      quantity,
      factor: level.factor,
      baseQuantity: base,
      unitTotalPrice,
      productSnapShot: {
        name: product.name,
        salePrice,
        purchasePrice: level.purchasePrice, // per sold unit, so profit per line is computable
      },
    });
  }

  return { lines: result, subtotal: round2(subtotal) };
}

module.exports = { processSaleLines };