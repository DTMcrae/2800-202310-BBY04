require('dotenv').config();

const mongodb_host = process.env.mongodb_host;
const mongodb_user = process.env.mongodb_user;
const mongodb_password = process.env.mongodb_password;

const MongoClient = require("mongodb").MongoClient;
const atlasURI = `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/?retryWrites=true`;
var database = new MongoClient(atlasURI, {useNewUrlParser: true, useUnifiedTopology: true});
let db;

client.connect(err => {
    if (err) throw err;
    db = client.db('MYDND');
});

const getClassesCollection = () => db.collection('CLASSES');
const getEquipmentCollection = () => db.collection('EQUIPMENT');
const getLevelCollection = () => db.collection('LEVEL');
const getMonstersCollection = () => db.collection('MONSTERS');
const getNpcCollection = () => db.collection('NPC');
const getPartymemCollection = () => db.collection('PARTYMEM');
const getScenarioCollection = () => db.collection('SCENARIO');
const getSessionCollection = () => db.collection('SESSION');
const getSpellsCollection = () => db.collection('SPELLS');
const getUsercharCollection = () => db.collection('USERCHAR');
const getUsersavedCollection = () => db.collection('USERSAVED');
const getUserauthCollection = () => db.collection('USERAUTH');


module.exports = {
    database,
    getClassesCollection,
    getEquipmentCollection,
    getLevelCollection,
    getMonstersCollection,
    getNpcCollection,
    getPartymemCollection,
    getScenarioCollection,
    getSessionCollection,
    getSpellsCollection,
    getUsercharCollection,
    getUsersavedCollection,
    getUserauthCollection
};