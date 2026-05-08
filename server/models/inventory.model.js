const mongoose = require('mongoose');

const inventorySchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    unit: {
        type: String,
        enum: ["Kilo", "Barrel", "Piece"]
    },
    unitPurchasePrice: {
        type: Number,
        required: true,
    },
    unitSalePrice: {
        type: Number,
        required: true,
    },
    location: {
        type: String, // Specifies where the product is stored
    },
}, {timestamps: true});

module.exports = mongoose.model('Inventory', inventorySchema);