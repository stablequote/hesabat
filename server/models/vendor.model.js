const mongoose = require('mongoose');

const vendorSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    vendorID: {
        type: String,
        unique: true,
    },
    contactDetails: {
        phone: {type: String},
        email: {type: String},
        location: {type: String},
    },
    invoices: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PurchaseInvoice', // Relates to the PurchaseInvoice Schema
        },
    ],
});

module.exports = mongoose.model('Vendor', vendorSchema);