const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const cartModel = require('../models/cartModel')
const productModel = require('../models/productModel')
const validator = require('../utils/validator')
const userModel = require('../models/userModel')


const cart = async (req, res) => {
   try {
        let requestbody = req.body
     //   const cartId = req.body.cartId;
        const userId = req.params.userId;
        TokenDetail = req.user;

        if (!(validator.isValidObjectId(userId))) {
            return res.status(400).send({ status: false, message: 'Please provide valid userId' })
        };
        let userFound = await userModel.findOne({_id:userId}) 
        if(!userFound){
            return res.status(400).send({status:false,msg:"user not found"})
        }
        if (TokenDetail != userId) {
            return res.status(401).send({ status: false, message: "userId in url param and in token is not same" })
        };
        if (!validator.isValidRequestBody(requestbody)) {
            res.status(400).send({ status: false, message: 'Please provide Cart(Items) details' })
            return
        };
        if (!validator.isValid(requestbody.items[0].productId)) {
            return res.status(400).send({ status: false, message: ' Please provide productId' })
        };
        if (!validator.isValid(requestbody.items[0].quantity)) {
            return res.status(400).send({ status: false, message: ' Please provide quantity' })
        };

        let findCart = await cartModel.findOne({ userId: userId });
        if (findCart) {
            const { items } = requestbody;
            for (let i = 0; i < items.length; i++) {
                const product = await productModel.findOne({ _id: (items[i].productId) })
                //  console.log(product)
                let ProductIndex = findCart.items.findIndex(p => p.productId == items[i].productId)
                if (ProductIndex > -1) {
                    findCart.items[ProductIndex].quantity = findCart.items[ProductIndex].quantity + items[i].quantity;
                    await findCart.save();
                    findCart.totalPrice = findCart.totalPrice + ((items[i].quantity) * (product.price))
                    await findCart.save();
                    return res.status(200).send({ status: true, data: findCart })
                } else {
                    TotalPrice = findCart.totalPrice + ((items[i].quantity) * (product.price))
                    TotalItems = findCart.totalItems + 1;
                    const cartdetail = await cartModel.findOneAndUpdate({ userId: findCart.userId }, { $addToSet: { items: { $each: items } }, totalPrice: TotalPrice, totalItems: TotalItems }, { new: true })
                    return res.status(200).send({ status: true, data: cartdetail })
                }
            }
        };
        if (!findCart) {
            const { items } = requestbody;
            for (let i = 0; i < items.length; i++) {
                const product = await productModel.findOne({ _id: (items[i].productId) })
                let price = product.price;
                let total = (items[i].quantity) * price;
                let TotalItems = 1
                const newCart = {
                    userId: userId,
                    items: [{ productId: items[i].productId, quantity: items[i].quantity }],
                    totalPrice: total,
                    totalItems: TotalItems
                };
                const data = await cartModel.create(newCart);
                return res.status(201).send({ status: true, data: data })
            }
        }
    } catch (err) {
        res.status(500).send({ status: false, message: err.message });
    }
};

const updateCart = async function (req, res) {
    try {
        const userId = req.params.userId;
        const cartId = req.body.cartId;
        const productId = req.body.productId;
        const removeProduct = req.body.removeProduct;
        const userIdFromToken = req.user;

        if (!validator.isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, msg: `${cartId} is valid cart id` })
        };
        let cart = await cartModel.findById({ _id: cartId });
        if (!cart) {
            return res.status(400).send({ status: false, msg: "Cart not found" })
        };
        if (cart.totalPrice == 0 && cart.totalItems == 0) {
            return res.status(400).send({ status: false, msg: "product has been already deleted" })
        };
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: `${userId} is not valid userId` })
        };
        let user = await userModel.findOne({ _id: userId, isDeleted: false })
        if (!user) {
            return res.status(400).send({ status: false, msg: " User not found or deleted" })
        };
        if (!validator.isValidObjectId(productId)) {
            return res.status(40).send({ status: false, msg: `${productId} is not valid product id` })
        };
        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) {
            return res.status(400).send({ status: false, msg: "Product not found or deleted" })
        };
        if ((userId !== userIdFromToken) && (cart.userId !== userId)) {
            res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
            return
        };
        if (cart.items.length <= 0) {
            return res.status(400).send({ status: false, message: "No Product is available in cart to update" });
        };
        if (removeProduct === 0) {
            for (let i = 0; i < cart.items.length; i++) {
                if (cart.items[i].productId == productId) {
                    const productPrice = product.price * cart.items[i].quantity
                    const updatePrice = cart.totalPrice - productPrice
                    //cart.items = cart.items.splice(i, 1)
                    // cart.items.splice(removeProduct,1)
                    cart.items.splice(i, 1)
                    //   console.log("line 131",cart.items)
                    const updateItems = cart.totalItems - 1
                    const updateItemsAndPrice = await cartModel.findOneAndUpdate({ userId: userId }, { items: cart.items, totalPrice: updatePrice, totalItems: updateItems }, { new: true })
                    return res.status(200).send({ status: true, msg: "Succesfully Updated in the cart", data: updateItemsAndPrice })
                }
            }
        } else {
            for (let i = 0; i < cart.items.length; i++) {
                if (cart.items[i].productId == productId) {
                    const updateQuantity = cart.items[i].quantity - removeProduct
                    if (updateQuantity < 1) {
                        const updateItems = cart.totalItems - 1
                        const productPrice = product.price * cart.items[i].quantity
                        const updatePrice = cart.totalPrice - productPrice
                        cart.items.splice(i, 1)
                        //   console.log("line 146",cart.items)
                        const updateItemsAndPrice = await cartModel.findOneAndUpdate({ userId: userId }, { items: cart.items, totalPrice: updatePrice, totalItems: updateItems }, { new: true })
                        return res.status(200).send({ status: true, msg: "Product has been removed successfully from the cart", data: updateItemsAndPrice })
                    } else {
                        cart.items[i].quantity = updateQuantity
                        const updatedPrice = cart.totalPrice - (product.price * removeProduct)
                        const updatedQuantityAndPrice = await cartModel.findOneAndUpdate({ userId: userId }, { items: cart.items, totalPrice: updatedPrice }, { new: true })
                        return res.status(200).send({ status: true, msg: "Quantity has been updated successfully in the cart", data: updatedQuantityAndPrice })
                    }
                }
            }
        }
    } catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}
const getCart = async (req, res) => {
    try {
        let UserId = req.params.userId;
        let TokenDetail = req.user

        if (!(validator.isValidObjectId(UserId))) {
            return res.status(400).send({ status: false, message: 'Please provide valid UserId' })
        }

        const userFound = await userModel.findOne({ _id: UserId })
        if (!userFound) {
            return res.status(404).send({ status: false, message: `User Details not found with given userId` })
        }

        if (!TokenDetail == UserId) {
            res.status(401).send({ status: false, message: "userId in url param and in token is not same" })
        };

        const CartFound = await cartModel.findOne({ userId: UserId })
        if (!CartFound) {
            return res.status(404).send({ status: false, message: `No Cart found for given User` })
        }

        return res.status(200).send({ status: true, message: "Success", data: CartFound })

    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}

const deleteCart = async (req, res) => {
    try {
        let UserId = req.params.userId;
        TokenDetail = req.user
        if (!(validator.isValidObjectId(UserId))) {
            return res.status(400).send({ status: false, message: 'Please provide valid UserId' })
        };
        const userFound = await userModel.findOne({ _id: UserId })
        if (!userFound) {
            return res.status(404).send({ status: false, message: `User Details not found with given userId` })
        };
        if (!TokenDetail == UserId) {
            res.status(401).send({ status: false, message: "userId in url param and in token is not same" })
        };
        const CartFound = await cartModel.findOne({ userId: UserId })
        if (!CartFound) {
            return res.status(404).send({ status: false, message: `No Cart found for given User` })
        };
        let Cart = CartFound.items
        CartFound.totalItems = 0;
        CartFound.totalPrice = 0;
        Cart.splice(0, Cart.length)
        CartFound.updatedAt = new Date();
        await CartFound.save()
        res.status(204).send({ status: true, message: "Success", data: CartFound })
    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}

module.exports = { cart, updateCart, getCart, deleteCart }