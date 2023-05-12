require('dotenv').config();

const mongodb_host = process.env.mongodb_host;
const mongodb_user = process.env.mongodb_user;
const mongodb_password = process.env.mongodb_password;

const MongoClient = require("mongodb").MongoClient;
const atlasURI = `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/?retryWrites=true`;
var database = new MongoClient(atlasURI, {useNewUrlParser: true, useUnifiedTopology: true});
module.exports = {database};