require('dotenv').config();

const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;

const MongoClient = require("mongodb").MongoClient;
const atlasURI = `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/?retryWrites=true`;

const client = new MongoClient(atlasURI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = client.db(mongodb_database);

class DbCollection {
  constructor(collectionName) {
    this.collection = db.collection(collectionName);
  }
}

const collections = {
  userCollection: new DbCollection('USERAUTH'),
  classesCollection: new DbCollection('CLASSES'),
  equipmentCollection: new DbCollection('EQUIPMENT'),
  levelCollection: new DbCollection('LEVEL'),
  monstersCollection: new DbCollection('MONSTERS'),
  npcCollection: new DbCollection('NPC'),
  partyMemCollection: new DbCollection('PARTYMEM'),
  scenarioCollection: new DbCollection('SCENARIO'),
  sessionCollection: new DbCollection('SESSION'),
  spellsCollection: new DbCollection('SPELLS'),
  userCharCollection: new DbCollection('USERCHAR'),
  userSavedCollection: new DbCollection('USERSAVED'),
};

module.exports = collections;
