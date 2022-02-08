const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const cartModel = require('../models/cartModel')
const validator = require('../utils/validator')
const orderModel = require('../models/orderModel')
const userModel=require('../models/userModel')

const createOrder = async (req, res) => {
    try {
        var UserId = req.params.userId;
        const requestBody = req.body;
        let TokenDetail = req.user;

        if (!(validator.isValidObjectId(UserId))) {
            return res.status(400).send({ status: false, message: 'Please provide valid userId' })
        };
        let UserFound = await userModel.findOne({ _id: UserId });
        if (!UserFound) {
            return res.status(404).send({ status: false, message: `User Details not found with given UserId` })
        };
        if (TokenDetail != UserId) {
          return  res.status(401).send({ status: false, message: "userId in url param and in token is not same" })
        };
       
        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: 'Invalid params received in request body' })
        };
        let { cartId, cancellable, status } = requestBody

        let cart = await cartModel.findOne({ _id: cartId, userId: UserId });

        let TotalPrice = cart.totalPrice;
        let TotalItems = cart.totalItems;
       let Arr = cart.items.toObject()
        status = status.toLowerCase()
        if (status) {
            if (!validator.isValidStatus(status)) {
                return res.status(400).send({ status: false, message: `Status should be among confirmed, pending and cancelled` })
            }
        };
        if (requestBody.status == "completed") {
            var Cart = cart.items
           cart.totalPrice = 0;
           cart.totalItems = 0;
           Cart.splice(0)
            await cart.save()
        };    

        if (!cart) {
            return res.status(404).send({ status: false, message: `this User is not the owner of this cart` })
        };
        if (cancellable) {
            if (!(typeof (cancellable) == 'boolean')) {
                return res.status(404).send({ status: false, message: `Cancellable should be a boolean value` })
            }
        }
        if (!(Arr.length)) {
            return res.status(202).send({ status: true, message: `order has been accepted, please add more product in the cart` })
        };
        let totalQuantity = 0;
        for (let i = 0; i < Arr.length; i++) {
            totalQuantity = totalQuantity + Arr[i].quantity
        }

        let addToOrder = {  userId: UserId,  items: Arr, totalPrice: TotalPrice, totalItems: TotalItems,
            totalQuantity: totalQuantity,   cancellable, status
        }
        
        let order = await orderModel.create(addToOrder)
        return res.status(201).send({ status: true, message: "success", data: order })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

const updateOrder = async (req, res) => {
    try {
        const UserId = req.params.userId;
        requestbody = req.body;
        TokenDetail = req.user

        if (!(validator.isValidObjectId(UserId))) {
            return res.status(400).send({ status: false, message: 'Please provide valid userId' })
        };
        const UserFound = await userModel.findOne({ _id: UserId })
        if (!UserFound) {
            return res.status(404).send({ status: false, message: `User Details not found with given UserId` })
        };
        if (TokenDetail != UserId) {
            res.status(401).send({ status: false, message: "userId in url param and in token is not same" })
        };

        if (!validator.isValidRequestBody(requestbody)) {
            return res.status(400).send({ status: false, message: 'Invalid params received in request body' })
        };
        let { orderId, status } = requestbody
        status = status.toLowerCase().trim()
        if (!validator.isValidStatus(status)) {
            return res.status(400).send({ status: false, message: `Status should be among confirmed, pending and cancelled` })
        };
        orderId=orderId.trim();
        let OrderFound = await orderModel.findOne({ _id: orderId })
      
        
        if (!OrderFound) {
            return res.status(400).send({ status: false, message: `Order not found with given OrderId` })
        };
        if (!OrderFound.userId == UserId) {
            return res.status(400).send({ status: false, message: `Order does not belong to given userId` })
        };       
      if(OrderFound.cancellable==false)
        {
            return res.status(400).send({ status: false, message: ` only a cancellable order could be canceled` })
        }
        if (["completed", "canceled"].includes(OrderFound.status)) {
            return res.status(400).send({ status: false, message: `Can not update order which have status canceled or completed` })
        }

        const Cart=await cartModel.findOne({userId:OrderFound.userId})
        if (requestbody.status == "completed") {
            Cart.totalPrice = 0;
            Cart.totalItems = 0;
            Cart.items.splice(0,Cart.length)
            await Cart.save()
        };
        OrderFound.status = status.toLowerCase();
        await OrderFound.save()
         return res.status(200).send({ status: true, message: `Order Updated Successfully`, data: OrderFound })
 

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}
module.exports = {createOrder,updateOrder}