const jwt = require('jsonwebtoken')

const userAuth = async (req, res, next) => {
    try {
        const authtoken =   req.headers['authorization']//req.header('x-api-key')
const bearerToken = authtoken.split(' ')
const token = bearerToken[1]
//console.log(token)
        if (!token) {
            res.status(403).send({ status: false, message: `Missing authentication token in request` })
            return;
        }
        const decoded = await jwt.verify(token, 'project4')
       // console.log(decoded)
        if (!decoded) {
            res.status(403).send({ status: false, message: `Invalid authentication token in request` })
            return;
        }
        req.user = decoded.userId;
        next()
    } catch (error) {       
     return   res.status(500).send({ status: false, message: error.message })
    }
}
module.exports.userAuth = userAuth