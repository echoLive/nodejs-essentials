

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderSchema = Schema({

    products: [{
        product: {
            type: Object,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        }
    }],
    user: {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        email: {
            type: String,
            required: true
        }
    }
});

module.exports = mongoose.model('Order', orderSchema);