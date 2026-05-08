const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    manufacturer: {
        type: String,
        required: true,
    },
    // vendor: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Vendor',
    // },
    category: {
        type: String,
    },
    unit: {
        type: String,
        enum: ["Kilo", "Barrel", "Piece"],
        required: true,
    },
    expiryDate: {
        type: Date,
        required: true,
    },
    unitPurchasePrice: {
        type: Number,
        required: true,
    },
    unitSalePrice: {
        type: Number,
        required: true,
    },
    image: {
        type: String, // URL of the product image
        required: false,
    },
}, {timestamps: true});

module.exports = mongoose.model('Product', productSchema);