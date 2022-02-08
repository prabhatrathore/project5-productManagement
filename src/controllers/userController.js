const userModel = require('../models/userModel')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const validator = require('../utils/validator')
const awsFile = require('../utils/ams-sdk')

const createUser = async function (req, res) {
    try {
        let files = req.files;
        const requestBody = req.body;
        if (!validator.isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide user details' })
            return
        };// Extract params
        let { fname, lname, phone, email, password, address } = requestBody;// Object destructing
        //  Validation starts
        if (!validator.isValid(fname)) return res.status(400).send({ status: false, message: `fname is required` });

        if (!validator.isValid(lname)) return res.status(400).send({ status: false, message: `lname is required ` });
        //book cover      
        if (files && files.length > 0) {
            var uploadedFileURL = await awsFile.uploadFile(files[0]);
        } else {
            return res.status(400).send({ status: false, message: "Noting to write" })
        };
        if (!validator.isValid(phone)) return res.status(400).send({ status: false, message: 'phone no is required' });
        //  phone = phone.trim()
        if (!(validator.validNumber.test(phone))) {
            res.status(400).send({ status: false, message: `Please fill a valid phone number` })
            return
        };
        const isPhoneAlreadyUsed = await userModel.findOne({ phone }); //{phone: phone} object shorthand property
        if (isPhoneAlreadyUsed) {
            res.status(400).send({ status: false, message: `${phone} phone number is already registered` })
            return
        };
        if (!validator.isValid(email)) {
            res.status(400).send({ status: false, message: `Email is required` })
            return
        };
        email = email.trim().toLowerCase()
        if (!(validator.validEmail.test(email))) {
            res.status(400).send({ status: false, message: `Email should be a valid email address ` })
            return
        };
        const isEmailAlreadyUsed = await userModel.findOne({ email }); // {email: email} object shorthand property
        if (isEmailAlreadyUsed) {
            res.status(400).send({ status: false, message: `${email} email address is already registered` })
            return
        };
        if (!validator.isValid(password)) {
            res.status(400).send({ status: false, message: `Password is required` })
            return
        };
        //password = password.trim()
        if (!(password.length > 7 && password.length < 16)) {
            res.status(400).send({ status: false, message: "password should  between 8 and 15 characters" })
            return
        }; // Validation ends
        const userData = { fname, lname, phone, email, profileImage: uploadedFileURL, password, address };
        userData.password = await bcrypt.hash(userData.password, 10)

        const newUser = await userModel.create(userData);
        res.status(201).send({ status: true, message: ` User created successfully`, data: newUser });
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    };
};

const loginAuthor = async function (req, res) {
    try {
        const data = req.body;
        if (!validator.isValidRequestBody(data)) {
            return res.status(400).send({ status: false, msg: "provide login credentials" })
        };
        let { email, password } = data
        if (!validator.isValid(email)) {
            return res.status(401).send({ status: false, msg: "Email is required" })
        };
        email = email.toLowerCase().trim()
        if (!(validator.validEmail.test(email))) {
            res.status(400).send({ status: false, message: `Email should be a valid email address` })
            return
        };
        if (!validator.isValid(password)) {
            res.status(402).send({ status: false, msg: "password is required" })
            return
        };
        // password = password.trim()

        
        if (!((password.length > 7) && (password.length < 16))) {
            return res.status(400).send({ status: false, message: `Password length should be between 8 and 15.` })
        };

        let userEmail = await userModel.findOne({ email: email });
        //
        let match = await bcrypt.compare(data.password, userEmail.password);

        if (!match) {
            res.status(403).send({ status: false, msg: "invalid email or password, try again with valid login credentials " })
            return
        };
        const token = await jwt.sign({
            userId: userEmail._id,

            iat: Math.floor(Date.now() / 1000),//issue date
            exp: Math.floor(Date.now() / 1000) + 300000 * 60//expire date 30*60 = 30min 
        }, 'project4');
        res.header('x-api-key', token);
        res.status(200).send({ status: true, msg: "User login successfull", data: { "userId": userEmail._id, "token": token } });
        return
    }
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
        return
    };
};
const getUserById = async function (req, res) {
    try {
        const userId = req.params.userId

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: `${userId} is not a valid userId` })
        };
        const user = await userModel.findById({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(404).send({ status: false, message: `user does not exist` })
        };
        return res.status(200).send({ status: true, message: 'User profile details', data: user })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        userId = req.params.userId;
        const requestBody = req.body;
        const profileImage = req.files
        TokenDetail = req.user

        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: 'No paramateres passed. Book unmodified' })
        };
        const UserFound = await userModel.findOne({ _id: userId,isDeleted:false });

        if (!UserFound) {
            return res.status(404).send({ status: false, message: `User not found with given UserId` })
        };
        if (!TokenDetail != userId) {
            res.status(400).send({ status: false, message: "userId in url param and in token is not same" })
        };
        let { fname, lname, email, phone, password } = requestBody
        if (Object.prototype.hasOwnProperty.call(requestBody, 'email')) {
            if (!(/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(requestBody.email))) {
                res.status(400).send({ status: false, message: `Email should be a valid email address` })
                return
            };

            const isEmailAlreadyUsed = await userModel.findOne({ email: requestBody.email });
            if (isEmailAlreadyUsed) {
                res.status(400).send({ status: false, message: `${requestBody.email} email address is already registered` })
                return
            };
        };

        if (Object.prototype.hasOwnProperty.call(requestBody, 'password')) {
            requestBody.password = requestBody.password.trim();
            if (!(requestBody.password.length > 7 && requestBody.password.length < 16)) {
                res.status(400).send({ status: false, message: "password should  between 8 and 15 characters" })
                return
            };
            var salt = await bcrypt.genSalt(10);
            password = await bcrypt.hash(requestBody.password, salt)
            console.log(password)
            requestBody.password = password;
        };
        if (profileImage && profileImage.length > 0) {
            var uploadedFileURL = await awsFile.uploadFile(profileImage[0]);
            console.log(uploadedFileURL)
            requestBody.profileImage = uploadedFileURL
        };
        if (requestBody.address) {
            requestBody.address = JSON.parse(requestBody.address)
            if (requestBody.address.shipping) {
                if (requestBody.address.shipping.street) {
                    UserFound.address.shipping.street = requestBody.address.shipping.street
                    await UserFound.save()
                }
                if (requestBody.address.shipping.city) {
                    UserFound.address.shipping.city = requestBody.address.shipping.city
                    await UserFound.save()
                }
                if (requestBody.address.shipping.pincode) {
                    UserFound.address.shipping.pincode = requestBody.address.shipping.pincode
                    await UserFound.save()
                }
            }
            if (requestBody.address.billing) {
                if (requestBody.address.billing.street) {
                    UserFound.address.billing.street = requestBody.address.billing.street
                    await UserFound.save()
                }
                if (requestBody.address.billing.city) {
                    UserFound.address.billing.city = requestBody.address.billing.city
                    await UserFound.save()
                }
                if (requestBody.address.billing.pincode) {
                    UserFound.address.billing.pincode = requestBody.address.billing.pincode
                    await UserFound.save()
                }
            }
        }

        requestBody.UpdatedAt = new Date()
        const UpdateData = { fname, profileImage: uploadedFileURL, lname, email, phone, password }
        const upatedUser = await userModel.findOneAndUpdate({ _id: userId }, UpdateData, { new: true })
        res.status(200).send({ status: true, message: 'User updated successfully', data: upatedUser });

    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
};
module.exports = { createUser, loginAuthor, getUserById, updateUser }

