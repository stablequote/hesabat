const Inventory = require('../models/inventory.model');
const Product = require('../models/product.model');
const { fromBase } = require('../services/stock.service');
// const Sales = require('../models/sales.model');

// Add a product
exports.addProduct = async (req, res) => {
    try {
        const { product, quantity, unit, expiryDate, unitPurchasePrice, unitSalePrice, location } = req.body;

        const addedProduct = new Inventory({
            product,
            quantity,
            unit,
            expiryDate,
            unitPurchasePrice,
            unitSalePrice,
            location,
        }); 

        await addedProduct.save();
        res.status(201).json({ message: 'Product added successfully.', addedProduct });
    } catch (error) {
        res.status(500).json({ error: error.message});
        console.log(error)
    }
};

// List all products
exports.listAllProducts = async (req, res) => {
    try {
        const products = await Inventory.find({})
        .populate("product")
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to list products.' });
    }
};

exports.receiveStock = async (req, res) => {
  try {
    const { productId, unit, quantity, note } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    const inventory = await addStock({
      product, unitId: unit, quantity: Number(quantity), type: 'purchase', note,
    });
    return res.status(200).json({ message: 'Stock received.', inventory });
  } catch (error) {
    if (error instanceof StockError) return res.status(error.status).json({ message: error.message });
    console.error('receiveStock failed:', error);
    return res.status(500).json({ error: 'Failed to receive stock.' });
  }
};

exports.listInventory = async (req, res) => {
  try {
    const rows = await Inventory.find().populate({
      path: 'product',
      populate: { path: 'unitLevels.unit', select: 'name abbreviation' },
    });
    const inventory = rows
      .filter((r) => r.product)
      .map((r) => ({
        _id: r._id,
        product: r.product,
        quantityBase: r.quantityBase,
        breakdown: fromBase(r.product, r.quantityBase), // unit ids; match to unitLevels for names
      }));
    return res.status(200).json({ inventory });
  } catch (error) {
    console.error('listInventory failed:', error);
    return res.status(500).json({ error: 'Failed to fetch inventory.' });
  }
};