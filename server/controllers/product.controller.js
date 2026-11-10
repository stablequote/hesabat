const mongoose = require('mongoose');
const Product = require('../models/product.model');
const Inventory = require('../models/inventory.model');
const Unit = require('../models/unit.model');
const { addStock, StockError } = require('../services/stock.service');
const path = require("path");
const fs = require("fs");


// if the route uses multer/multipart, nested fields arrive as JSON strings
const parse = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

exports.createProduct = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { name, manufacturer, category } = req.body;
    const unitLevels = parse(req.body.unitLevels);
    const openingStock = req.body.openingStock ? parse(req.body.openingStock) : null;

    if (!name?.trim() || !Array.isArray(unitLevels) || unitLevels.length === 0) {
      return res.status(400).json({ message: 'Name and at least one unit are required.' });
    }

    const unitIds = unitLevels.map((l) => l.unit);
    if ((await Unit.countDocuments({ _id: { $in: unitIds } })) !== new Set(unitIds.map(String)).size) {
      return res.status(400).json({ message: 'One or more units do not exist.' });
    }

    let product;
    await session.withTransaction(async () => {
      [product] = await Product.create(
        [{ name, manufacturer, category, unitLevels /*, image: ... your existing upload handling */ }],
        { session }
      );
      await Inventory.create([{ product: product._id, quantityBase: 0 }], { session });

      if (openingStock?.quantity > 0) {
        await addStock({
          product, unitId: openingStock.unit, quantity: Number(openingStock.quantity),
          type: 'opening', session,
        });
      }
    });

    return res.status(201).json({ message: 'Product created.', product });
  } catch (error) {
    if (error instanceof StockError) return res.status(error.status).json({ message: error.message });
    if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
    console.error('createProduct failed:', error);
    return res.status(500).json({ error: 'Failed to create product.' });
  } finally {
    session.endSession();
  }
};

// Add a product
exports.addProduct = async (req, res) => {
    try {
        const { name, manufacturer, category, unit, expiryDate, unitPurchasePrice, unitSalePrice } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : undefined;

        const newProduct = new Product({
            name,
            manufacturer,
            category,
            unit,
            expiryDate,
            unitPurchasePrice,
            unitSalePrice,
            image,
        });
        await newProduct.save();

        res.status(201).json({ message: 'Product added successfully.', product: newProduct });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    const { name, manufacturer, category } = req.body;
    const incoming = parse(req.body.unitLevels);
    if (!name?.trim() || !Array.isArray(incoming) || incoming.length === 0) {
      return res.status(400).json({ message: 'Name and at least one unit are required.' });
    }

    // existing units may not be removed or have their factor changed
    const incomingByUnit = new Map(incoming.map((l) => [String(l.unit), l]));
    for (const existing of product.unitLevels) {
      const match = incomingByUnit.get(String(existing.unit));
      if (!match) return res.status(400).json({ message: 'An existing unit cannot be removed.' });
      if (Number(match.factor) !== existing.factor) {
        return res.status(400).json({ message: 'The conversion of an existing unit cannot be changed.' });
      }
    }

    product.name = name.trim();
    product.manufacturer = manufacturer;
    product.category = category;
    product.unitLevels = incoming;
    // if (req.file) product.image = <the same line your create controller uses>;

    await product.save(); // runs the unitLevels validator

    await product.populate('unitLevels.unit', 'name abbreviation');
    const inv = await Inventory.findOne({ product: product._id }).select('quantityBase').lean();

    return res.status(200).json({
      message: 'Product updated.',
      product: { ...product.toObject(), quantityBase: inv?.quantityBase ?? 0 },
    });
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
    console.error('updateProduct failed:', error);
    return res.status(500).json({ error: 'Failed to update product.' });
  }
};

// Delete a single product
exports.deleteSingleProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Delete image file if exists
    if (product.image) {
      const imagePath = path.join("public", product.image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await product.deleteOne({_id: req.params.id});
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete multiple products
exports.deleteMultipleProducts = async (req, res) => {
    try {
        const { productIDs } = req.body; // Array of product IDs to delete

        const result = await Product.deleteMany({ _id: { $in: productIDs } });
        res.status(200).json({ message: `${result.deletedCount} products deleted successfully.` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete products.' });
    }
};

// List all products
exports.listProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .populate('unitLevels.unit', 'name abbreviation')
      .lean();

    const inventories = await Inventory.find({ product: { $in: products.map((p) => p._id) } })
      .select('product quantityBase')
      .lean();
    const stockByProduct = new Map(inventories.map((i) => [String(i.product), i.quantityBase]));

    const result = products.map((p) => ({
      ...p,
      quantityBase: stockByProduct.get(String(p._id)) ?? 0,
    }));

    return res.status(200).json({ products: result }); // keep the key your page already uses
  } catch (error) {
    console.error('listProducts failed:', error);
    return res.status(500).json({ error: 'Failed to fetch products.' });
  }
};