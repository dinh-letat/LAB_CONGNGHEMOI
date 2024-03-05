const express = require('express');
const app = express();
const port = 3000;

const multer = require('multer');
const AWS = require('aws-sdk');
require('dotenv').config();
const path = require('path');

// config AWS 
process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = "1";

// config aws for access to aws cloud through aws IAM user account
AWS.config.update({
    region: process.env.REGION,
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const bucketName = process.env.S3_BUCKET_NAME;
const tableName = process.env.DYNAMODB_TABLE_NAME;



app.use(express.json({extends: false}));
app.use(express.static('./views'));

app.set('view engine', 'ejs');
app.set('views', './views');

// router for project have
app.get('/', async(req, res) => {
    try {
        const params = { TableName: tableName };
        const data = await dynamodb.scan(params).promise();
        console.log("data= ", data.Items);
        return res.render("index.ejs", { data: data.Items });
    } catch (error) {
        console.error("Error retrieving data from DynamoDB: ", error);
        return res.status(500).send("Internal Server Error");
    }
})


// Config multer for upload image manage
const storage = multer.memoryStorage({
    destination(req, file, callback) {
        callback(null, "");
    },
});

const upload = multer({
    storage,
    limits: {fileSize: 2000000}, // accept file minimun 2MB
    fileFilter(req, file, cb){
        checkFileType(file, cb);
    },
});

function checkFileType(file, cb) {
    const fileTypes = /jpeg|png|jpg|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (extname && mimetype) {
        return cb(null, true);
    }
    return cb("Error: PLS upload images /jpeg|png|jpg|gif/ only!")
}

app.listen(port, () => {
    console.log(`App listen on port ${port}`)
})