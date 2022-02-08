const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  fname: { type: String, required: 'fname is necessary', trim: true },
  lname: { type: String, required: ' lName is required', trim: true },
  email: {
    type: String, trim: true, lowercase: true, unique: true,
    required: 'Email address is necessary'
  },
  profileImage: { type: String, required: 'profileImage is required1' },
  phone: {
    type: Number, required: 'phone number is required1', unique: true, trim: true,
  },
  password: {
    type: String, required: 'Password is required', trim: true,
  },
  address: {
    shipping: {
      street: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      pincode: { type: Number, required: true, trim: true },
    },
    billing: {
      street: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      pincode: { type: Number, required: true, trim: true },
    }
  }

}, { timestamps: true })
module.exports = mongoose.model('user', userSchema,)