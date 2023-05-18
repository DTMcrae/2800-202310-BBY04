require('dotenv').config();

const mongodb_host = process.env.mongodb_host;
const mongodb_user = process.env.mongodb_user;
const mongodb_password = process.env.mongodb_password;

const MongoClient = require("mongodb").MongoClient;
const atlasURI = `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/?retryWrites=true`;
var database = new MongoClient(atlasURI, {useNewUrlParser: true, useUnifiedTopology: true});

const classesCollection = db.collection('CLASSES');
const equipmentCollection = db.collection('EQUIPMENT');
const levelCollection = db.collection('LEVEL');
const monstersCollection = db.collection('MONSTERS');
const npcCollection = db.collection('NPC');
const partymemCollection = db.collection('PARTYMEM');
const scenarioCollection = db.collection('SCENARIO');
const sessionCollection = db.collection('SESSION');
const spellsCollection = db.collection('SPELLS');
const usercharCollection = db.collection('USERCHAR');
const usersavedCollection = db.collection('USERSAVED');
const userauthCollection = db.collection('USERAUTH');


module.exports = {database};