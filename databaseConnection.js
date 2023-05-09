require('dotenv').config();

const mongodb_host = process.env.mongodb_host;
const mongodb_user = process.env.mongodb_user;
const mongodb_password = process.env.mongodb_password;

const MongoClient = require("mongodb").MongoClient;
const atlasURI = `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/?retryWrites=true`;
var database = new MongoClient(atlasURI, {useNewUrlParser: true, useUnifiedTopology: true});
module.exports = {database};
const MongoClient = require('mongodb').MongoClient;

// require('dotenv').config();

// const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`;

// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// async function connectToDatabase() {
//     await client.connect();
//     return client;
// }

// module.exports = { connectToDatabase };
