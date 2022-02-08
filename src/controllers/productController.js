
const userModel = require('../models/userModel')
const productModel = require('../models/productModel')

const validator = require('../utils/validator')
const awsFile = require('../utils/ams-sdk')
const { json } = require('body-parser')

const createProduct = async (req, res) => {
    try {
        let files = req.files;
        const requestBody = req.body;
        if (!validator.isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters.provide product details' })
            return
        };        // Extract params
        let { title, description, price, currencyId, currencyFormat, style, availableSizes } = requestBody;
        // Validation starts
        if (files && files.length > 0) {
            var productImage = await awsFile.uploadFile(files[0]);
        } else {
            return res.status(400).send({ status: false, message: "Noting to write" })
        }
        if (!validator.isValid(title)) return res.status(400).send({ status: false, message: 'title is required' })

        const TitleinUse = await productModel.findOne({ title })

        if (TitleinUse) return res.status(400).send({ status: false, message: "Title is already registered." })
        if (!validator.isValid(description)) return res.status(400).send({ status: false, message: ' description is required' })
        // console.log(price) 
        if (!validator.isValid(price)) return res.status(400).send({ status: false, message: ' price is required' })
        // console.log(price)
        if (!(!isNaN(Number(price)))) {
            return res.status(400).send({ status: false, message: `Price should be a valid number` })
        }
        if (!validator.isValid(currencyId)) {
            res.status(400).send({ status: false, message: 'currencyId is required' })
            return
        };
        currencyId = currencyId.toUpperCase().trim()
        if (!(currencyId == 'INR')) return res.status(400).send({ status: false, msg: "currency should be 'INR'" })
        if (!validator.isValid(currencyFormat)) {
            res.status(400).send({ status: false, message: 'currencyFormat is required' })
            return
        }
        currencyFormat = currencyFormat.trim()
        if (!(currencyFormat == '₹')) return res.status(400).send({ status: false, msg: "currencyFormat  should be ₹ " })

        if (!validator.isValid(style)) return res.status(400).send({ status: false, message: 'style is required' })

        if (!validator.isValid(availableSizes)) return res.status(400).send({ status: false, message: `please give atleast one size` })

        availableSizes = availableSizes.toUpperCase().trim()
        let check = availableSizes.split(',')

        for (i = 0; i < check.length; i++) {
            let size = ['S', 'XS', 'M', 'X', 'L', 'XXL', 'XL']
            if (!(size.includes(check[i]))) {
                return res.status(400).send({ staus: false, msg: "availableSizes should be 'S','XS','M','X','L','XXL','XL'" })
            }
        };
        availableSizes = check;
        let productData = { title, description, price, currencyId, currencyFormat, style, productImage, availableSizes }
        let product = await productModel.create(productData)
        res.status(201).send({ status: true, data: product })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    };
}
const getProduct = async function (req, res) {
    try {
        let filterQuery = { isDeleted: false }
        let querybody = req.query;

        if (!validator.isValidRequestBody(querybody)) {
            let NDeleted = await productModel.find(filterQuery).select({ _id: 1, title: 1, price: 1, availableSizes: 1 }).sort({ price: -1 })
            res.status(200).send({ status: true, message: 'Not Deleted product List', data: NDeleted })
            return
        };
        const { size, name, priceGreaterThan, priceLessThan } = querybody

        if (validator.isValid(size)) {
            var sizeOf = size.toUpperCase().trim()
            // filterQuery.availableSizes = size
            filterQuery['availableSizes'] = { $regex: sizeOf.trim() }    //size
            //console.log(typeof size)
        };
        if (validator.isValid(name)) {
            filterQuery.title = { $regex: name.trim() }
        };
        if (priceGreaterThan) {
            filterQuery.price = { $gt: priceGreaterThan }
        };
        if (priceLessThan) {
            filterQuery.price = { $lt: priceLessThan }
        };
        if (priceLessThan && priceGreaterThan) {
            filterQuery.price = { $lt: priceLessThan, $gt: priceGreaterThan }
        };
        let data = await productModel.find(filterQuery)
            .select({ _id: 0, title: 1, price: 1, availableSizes: 1, })
            .sort({ price: -1 })
        if (validator.isValid(data)) {
            return res.status(200).send({ status: true, msg: "products list1", data: data })
        } else {
            return res.status(400).send({ status: false, msg: "no product found " })
        }
    }
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
};

const productById = async function (req, res) {
    try {
        const productId = req.params.productId
        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: `${productId} is not a valid product id` })
        };
        const product = await productModel.findById({ _id: productId, isDeleted: false });
        if (!product) {
            return res.status(404).send({ status: false, message: `product does not exit` })
        } else {
            return res.status(200).send({ status: true, message: 'Success', data: product })
        }
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};

const updateproduct = async (req, res) => {
    try {
        let productId = req.params.productId;
        const requestBody = req.body;
        const productImage = req.files;

        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: `${productId} is not a valid product id` })
        };
        const ProductFound = await productModel.findOne({ _id: productId, isDeleted:false })
        if (!ProductFound) {
            return res.status(404).send({ status: false, message: `Product Details not found with given productId` })
        };
        if (!validator.isValidRequestBody(requestBody)) {
            if (!(productImage)) {
                return res.status(400).send({ status: false, message: 'No paramateres passed. Product unmodified' })
            }
            else if (!(productImage.length > 0)) {
                return res.status(400).send({ status: false, message: "ProductImage is required" })
            }
        };
        let { title, description, price, currencyId, currencyFormat, isFreeShipping, availableSizes, style, installments } = requestBody

        if (Object.prototype.hasOwnProperty.call(requestBody, 'title')) {
            if (!validator.isValid(title)) {
                return res.status(400).send({ status: false, message: `title is required` })
            };
            const TitleUsed = await productModel.findOne({ title });
            if (TitleUsed) {
                return res.status(400).send({ status: false, message: `${title} title  is already registered` })
            }
        };
        if (Object.prototype.hasOwnProperty.call(requestBody, 'description')) {
            if (!validator.isValid(description)) {
                return res.status(400).send({ status: false, message: `description is required` })
            };
        }
        if (Object.prototype.hasOwnProperty.call(requestBody, 'price')) {
            //   price = parseFloat(price).toFixed(1)
            if (!(!isNaN(Number(price)))) {
                return res.status(400).send({ status: false, message: `Price should be a valid number/decimal` })
            }
        }
        if (Object.prototype.hasOwnProperty.call(requestBody, 'currencyId')) {
            if (!(currencyId == "INR")) {
                return res.status(400).send({ status: false, message: `currencyFormat should be INR` })
            }
        }
        if (Object.prototype.hasOwnProperty.call(requestBody, 'currencyFormat')) {
            if (!validator.isValid(currencyFormat)) {
                return res.status(400).send({ status: false, message: `currencyFormat is required` })
            };
            if (!(currencyFormat == "₹")) {
                return res.status(400).send({ status: false, message: `currencyFormat should be ₹` })
            };

        }
        if (Object.prototype.hasOwnProperty.call(requestBody, 'availableSizes')) {
            if (!validator.isValid(availableSizes)) {
                return res.status(400).send({ status: false, message: `Please give atleast one size ` })
            };
            availableSizes = availableSizes.toUpperCase().trim()
            const Check = availableSizes.split(",")

            if (!validator.isValidSize(Check)) {
                return res.status(400).send({ status: false, message: `${[Check[i]]} is not a valid size` })
            }
            availableSizes = Check;
        }
        if (productImage && productImage.length > 0) {
            var uploadedFileURL = await awsFile.uploadFile(productImage[0]);

            requestBody.productImage = uploadedFileURL
        }        //Validation Ends
        const UpdateData = { title, description, price, currencyId, currencyFormat, isFreeShipping, availableSizes, productImage: uploadedFileURL, style, installments }

        UpdateData.UpdatedAt = new Date()
        const upatedUser = await productModel.findOneAndUpdate({ _id: productId }, UpdateData, { new: true })
        res.status(200).send({ status: true, message: 'product updated successfully', data: upatedUser });
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}
const deleteById = async function (req, res) {
    try {
        var productId = req.params.productId;

        if (!(validator.isValidObjectId(productId))) {
            return res.status(400).send({ status: false, message: `${productId} is not a valid product id` })
        };
        const ProductFound = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!ProductFound) {
            return res.status(404).send({ status: false, message: `Product not found  or deleted ` })
        };
        // if (ProductFound.isDeleted == true) {
        //     return res.status(404).send({ status: false, message: "This Product no longer exists" });
        // };
        await productModel.findOneAndUpdate({ _id: productId }, {
            $set: {  isDeleted: true,  deletedAt: new Date()
            }
        })
        res.status(200).send({ status: true, message: `${productId} Product deleted successfully` })
    }
    catch (err) {
        return res.status(500).send({ message: err.message });
    }
}
module.exports = { createProduct, getProduct, productById, updateproduct, deleteById }

