const mongoose = require('mongoose');

const clientSchema = mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    contactDetails: {
        phone: {type: String},
        email: {type: String},
        location: {type: String},
    },
    invoices: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'saleInvoice', // Relates to the Order Schema
        },
    ],
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);