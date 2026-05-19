const Product = require('../models/product.model');
const path = require("path");
const fs = require("fs");

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
        const { productID } = req.params;
        const updates = req.body;

        const updatedProduct = await Product.findByIdAndUpdate(productID, updates, { new: true });
        if (!updatedProduct) return res.status(404).json({ message: 'Product not found.' });

        res.status(200).json({ message: 'Product updated successfully.', product: updatedProduct });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update product.' });
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

    await product.remove();
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
exports.listAllProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to list products.' });
    }
};
