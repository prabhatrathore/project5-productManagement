const mongoose = require('mongoose')
//const ObjectId = mongoose.Schema.Types.ObjectId;

const productSchema = new mongoose.Schema({
    title: { type: String, required: " title is necessary", trim: true, unique: true },
    description: { type: String, required: "description is necessary", trim: true },

    price: { type: Number, required: "price should be valid no." },
    
    currencyId: { type: String, required: "currency accept in INR only." },
    currencyFormat: { type: String, required: true, currency: 'Rupee' },
    
    isFreeShipping: { type: Boolean, default: false },
    productImage: { type: String, required: true },
    style: { type: String },
    bookCover: { type: String, trim: true },
    availableSizes: { type: [String], required: true },
    installments: { type: Number },
    deletedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true })
module.exports = mongoose.model('myproducts', productSchema,)
