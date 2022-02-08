const express = require('express');
var bodyParser = require('body-parser');//Body-parser is the Node.js body parsing middleware. It is responsible for parsing the incoming request bodies in a middleware before you handle it
var multer = require('multer') // HERE
const route = require('./routes/route.js');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer().any()) // HERE


const mongoose = require('mongoose')

mongoose.connect("mongodb+srv://user-open-to-all-trainees:AutogenerateSecurePassword@training-cluster.xohin.mongodb.net/project5SSCPDatabase?retryWrites=true&w=majority", { useNewUrlParser: true })//useFindAndModify: false
    .then(() => console.log('mongodb running on 27017'))
    .catch(err => console.log(err))

app.use('/', route);

app.listen(process.env.PORT || 3000, function () {// 3000 is port number
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});

const express = require('express')
const bodyParser = require('body-parser')


