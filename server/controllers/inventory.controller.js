const Inventory = require('../models/inventory.model');
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