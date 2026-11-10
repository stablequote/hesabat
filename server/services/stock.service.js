const Inventory = require('../models/inventory.model');
const StockMovement = require('../models/stockMovement.model');

class StockError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// Convert "quantity of unit X" into base units, using the product's unitLevels.
function toBase(product, unitId, quantity) {
  const level = product.unitLevels.find((l) => String(l.unit) === String(unitId));
  if (!level) throw new StockError('This unit is not defined for the product.');
  if (!(quantity > 0)) throw new StockError('Quantity must be greater than zero.');
  const base = quantity * level.factor;
  if (!Number.isInteger(base)) {
    throw new StockError('Quantity does not convert to a whole number of base units.');
  }
  return { base, level };
}

// Break a base quantity into readable parts, e.g. 340 -> [{unit, qty: 3}, {unit, qty: 4}]
function fromBase(product, base) {
  let remaining = base;
  const parts = [];
  [...product.unitLevels]
    .sort((a, b) => b.factor - a.factor)
    .forEach((l) => {
      const qty = Math.floor(remaining / l.factor);
      if (qty > 0) parts.push({ unit: l.unit, qty });
      remaining -= qty * l.factor;
    });
  return parts;
}

// add stock update for purchase invoices
const baseLevelCost = (product) =>
  product.unitLevels.find((l) => l.factor === 1)?.purchasePrice ?? 0;

async function addStock({ product, unitId, quantity, type, reference, note, costPerBase, session }) {
  const { base, level } = toBase(product, unitId, quantity);

  const update = { $inc: { quantityBase: base } };

  if (costPerBase !== undefined) {
    if (!session) throw new Error('Cost averaging requires a transaction session.');
    // read and write both happen inside the transaction; a concurrent change
    // causes a write conflict and withTransaction retries with fresh numbers
    const current = await Inventory.findOne({ product: product._id }).session(session).lean();
    const oldQty = current?.quantityBase ?? 0;
    const oldCost = current?.avgCostBase ?? baseLevelCost(product);
    update.$set = { avgCostBase: (oldQty * oldCost + base * costPerBase) / (oldQty + base) };
  }

  const inv = await Inventory.findOneAndUpdate(
    { product: product._id },
    update,
    { returnDocument: 'after', upsert: true, session }
  );
  await StockMovement.create(
    [{ product: product._id, type, quantityBaseDelta: base, unit: unitId,
       enteredQuantity: quantity, factor: level.factor, reference, note }],
    { session }
  );
  return inv;
}


// async function addStock({ product, unitId, quantity, type, reference, note, session }) {
//   const { base, level } = toBase(product, unitId, quantity);
//   const inv = await Inventory.findOneAndUpdate(
//     { product: product._id },
//     { $inc: { quantityBase: base } },
//     { returnDocument: 'after', upsert: true, session }
//   );
//   await StockMovement.create(
//     [{ product: product._id, type, quantityBaseDelta: base, unit: unitId,
//        enteredQuantity: quantity, factor: level.factor, reference, note }],
//     { session }
//   );
//   return inv;
// }

async function deductStock({ product, unitId, quantity, reference, session }) {
  const { base, level } = toBase(product, unitId, quantity);
  // atomic: the filter and the decrement happen in one operation,
  // so two simultaneous sales can never oversell the same stock
  const inv = await Inventory.findOneAndUpdate(
    { product: product._id, quantityBase: { $gte: base } },
    { $inc: { quantityBase: -base } },
    { returnDocument: 'after', session }
  );
  if (!inv) throw new StockError(`Insufficient stock for "${product.name}".`, 409);
  await StockMovement.create(
    [{ product: product._id, type: 'sale', quantityBaseDelta: -base, unit: unitId,
       enteredQuantity: quantity, factor: level.factor, reference }],
    { session }
  );
  return { inventory: inv, base, level };
}

async function restoreBase({ productId, baseQty, unit, enteredQuantity, factor, type = 'return', reference, note, session }) {
  if (!(baseQty > 0)) return null;
  // no upsert: if the product/inventory row no longer exists, nothing is created (same as your old `if (inventory)`)
  const inv = await Inventory.findOneAndUpdate(
    { product: productId },
    { $inc: { quantityBase: baseQty } },
    { returnDocument: 'after', session }
  );
  if (!inv) return null;
  await StockMovement.create(
    [{ product: productId, type, quantityBaseDelta: baseQty, unit, enteredQuantity, factor, reference, note }],
    { session }
  );
  return inv;
}

module.exports = { StockError, toBase, fromBase, addStock, deductStock, restoreBase };