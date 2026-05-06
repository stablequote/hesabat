const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        // unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['owner', 'manager', 'staff'], // Define roles for the users
        default: 'staff',
    },
    // branch: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Branch', // Links users to their branch
    //     required: function () {
    //         return this.role !== 'owner'; // Only non-owners need a branch
    //     },
    // },
    contactDetails: [{
        phone: String,
        email: String,
        location: String,
    }],
    // sales: [
    //     {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'Sales', // Links to the sales made by the user
    //     },
    // ],
    refreshToken: {
        type: String, // The refresh token is stored as a string
        default: null, // Default to null if no refresh token exists yet
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);