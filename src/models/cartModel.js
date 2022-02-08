const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId;

const cartSchema = new mongoose.Schema({
    userId: { type: ObjectId, required: true, ref: 'user', unique: true },
    items: [{_id:false,
        productId: { type: ObjectId, required: true, ref: 'product' },
        quantity: { type: Number, required: true,  }
    }],
    totalPrice: { type: Number, required: false },
    totalItems: { type: Number, required: false },

}, { timestamps: true })
module.exports = mongoose.model('myCart', cartSchema,)


