const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const productController = require('../controllers/productController')
const userAuthh = require('../middlewares/userAuth')
const cartController = require('../controllers/cartController')
const orderController = require('../controllers/orderController')

// user routes 
router.post('/register', userController.createUser);
router.post('/login', userController.loginAuthor);
router.get('/user/:userId/profile',userController.getUserById);
router.put('/user/:userId/profile',userController.updateUser);

// products routes
router.post('/products',productController.createProduct);
router.get('/products',  productController.getProduct);
router.get('/products/:productId', productController.productById);
router.put('/products/:productId',  productController.updateproduct);
router.delete('/products/:productId',  productController.deleteById);

//cart
router.post('/users/:userId/cart', userAuthh.userAuth, cartController.cart);
router.put('/users/:userId/cart', userAuthh.userAuth, cartController.updateCart);
router.get('/users/:userId/cart',userAuthh.userAuth, cartController.getCart);
router.delete('/users/:userId/cart', userAuthh.userAuth,cartController.deleteCart);

//order
router.post('/users/:userId/orders', userAuthh.userAuth, orderController.createOrder);
router.put('/users/:userId/orders', userAuthh.userAuth, orderController.updateOrder);
module.exports = router;