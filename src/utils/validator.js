
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false;
    if (typeof value === 'string' && value.trim().length === 0) return false;
    return true;
};
const isValidSize = function (value) {
    for (i = 0; i < value.length; i++) {
        let size = ["S", "XS", "M", "X", "L", "XXL", "XL"]
        if (!(size.includes(value[i]))) {
            return false
        }
    }
    return true
};
const isValidStatus = function (status) {
    return ['pending', 'completed', 'cancel'].indexOf(status) !== -1
};
const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0;
};
const validSite = /(:?^((https|http|HTTP|HTTPS){1}:\/\/)(([w]{3})[\.]{1})?([a-zA-Z0-9]{1,}[\.])[\w]*((\/){1}([\w@?^=%&amp;~+#-_.]+))*)$/;
const isValidObjectId = function (objectId) {
    return ObjectId.isValid(objectId)
};
const validEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
const validNumber = /^(\+91[\-\s]?)?[0]?(91)?[789]\d{9}$/

module.exports = { isValid, isValidRequestBody, isValidObjectId, isValidStatus, validEmail, validNumber, isValidSize, validSite };