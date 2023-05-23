require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.openAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const app = express();

const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

const expireTime = 60 * 60 * 1000;

//Secert code
const mongodb_host = process.env.mongodb_host;
const mongodb_user = process.env.mongodb_user;
const mongodb_password = process.env.mongodb_password;
const mongodb_database = process.env.mongodb_database;
const mongodb_session_secret = process.env.mongodb_session_secret;
const node_session_secert = process.env.node_session_secret;


//creating the required databases
var {database} = require('./databaseConnection');

const equipCollection = database.db(mongodb_database).collection('EQUIPMENT');
const charCollection = database.db(mongodb_database).collection('USERCHAR');
const savedCollection = database.db(mongodb_database).collection('USERSAVED');
const monstersCollection = database.db(mongodb_database).collection('MONSTERS');

//This constant will save the objectid
const { ObjectId } = require('mongodb'); 

//Server related code
app.use(
    session({
        secret: node_session_secert,
        resave: false,
        saveUninitialized: true,
        store: MongoStore.create({ client: database }),
    })
);
/*---------------------------------------------------------------------------------------End of connections-------------------------------------------------------------------------*/

//avoid modifying this function
async function getGPTResponse(prompt) {
    try {
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{
            role: "system",
            content: prompt
        }]
      });
      console.log(`request cost: ${response.data.usage.total_tokens} tokens`);
      return response.data.choices[0].message;
    } catch (error) {
        console.error('Error while making a request to the ChatGPT API:', error);
        throw new Error('Error while making a request to the ChatGPT API');
    }
}

/*------------------------------------------------------------------------------------End of chatgpt function call----------------------------------------------------------------------*/


async function getLevelUpData(userClass, userLevel) {
  try {
      const levelData = await database.collection('LEVEL').findOne({ class: userClass });
      return levelData;
  } catch (err) {
      console.error(err);
      return null;
  }
}

async function getSpellData(userClass, userLevel) {
  try {
      const spellData = await database.collection('SPELLS').find({ classes: new RegExp(userClass, 'i'), level: { $lte: userLevel } }).toArray();
      return spellData;
  } catch (err) {
      console.error(err);
      return null;
  }
}

async function spellcasting(userClass) {
  try {
      // For Wizards and Druids at level 1, we will only fetch level 0 (cantrips) and level 1 spells.
      const spellData = await database.collection('SPELLS').find({ classes: new RegExp(userClass, 'i'), level: { $in: [0, 1] } }).toArray();
      return spellData;
  } catch (err) {
      console.error(err);
      return null;
  }
}

/*-----------------------------------------------------------------------------------End of function ----------------------------------------------------------------------------------------------*/



//Middleware of for getting chat gpt to provide equip based on the data avaliable in the database. This is temp and can be changed as we develop further.
const chatGPTMiddleware = async (req, res, next) => {
  const equipmentOptions = await fetchEquipmentOptions();

  // Log the equipmentOptions to the console
  console.log('Equipment Options:', equipmentOptions);
const generatedPrompt = `Pick 5 random items from the following items: ${equipmentOptions}.`; //prompt that can be changed

try {
    req.gptResponse = await getGPTResponse(generatedPrompt);
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

app.use(chatGPTMiddleware);

const fetchPlayerInventoryMiddleware = async (req, res, next) => {
    try {
      // need a charid here
      const characterId = 'ExampleCharacterId';
      req.inventoryItems = await getPlayerInventory(characterId);
      next();
    } catch (error) {
      console.error('Error while fetching player inventory:', error);
      res.status(500).json({ error: 'Error while fetching player inventory' });
    }
};

const fetchPlayerEquippedItemsMiddleware = async (req, res, next) => {
    try {
      // need a charid here
      const characterId = 'ExampleCharacterId';
      req.equippedItems = await getPlayerEquippedItems(characterId);
      next();
    } catch (error) {
      console.error('Error while fetching player equipped items:', error);
      res.status(500).json({ error: 'Error while fetching player equipped items' });
    }
};

/*-----------------------------------------------------------------------------------End of Middleware ----------------------------------------------------------------------------------------------*/



//This page will display the equipment options
app.get('/equipment-options', (req, res) => {
    res.json({ options: req.gptResponse });
});

//This page will display a players inventory
app.get('/inventory', fetchPlayerInventoryMiddleware, (req, res) => {
    res.render('inventory', { items: req.inventoryItems });
});

app.get('/equipped', fetchPlayerEquippedItemsMiddleware, (req, res) => {
    res.render('equipped', { items: req.equippedItems });
});

//Remove once app completed
app.listen(port, () => {
console.log(`Server is running on port ${port}`);
});

//level up page
// app.get('/levelup', async function(req, res) {
//   const userId = req.session.userId; // replace this with however you're identifying your user

//   if (!userId) {
//       // handle the case where there is no logged in user
//       return res.status(401).send('You must be logged in to view this page.');
//   }

//   const characterData = await getCharacterData(userId); // function that fetches character data from the database
//   const skillOptions = await getSkillOptions(characterData.class, characterData.currentLevel + 1); // function that fetches skill options
//   const subclassOptions = characterData.currentLevel === 1 ? await getSubclassOptions(characterData.class) : [];

//   res.render('levelup', {
//       characterData: characterData,
//       skillOptions: skillOptions,
//       subclassOptions: subclassOptions
//   });
// });

//test level up page
app.get('/levelup', async (req, res) => {

  const levelUpData = await getLevelUpData(testCharacterData.class, testCharacterData.nextLevel);
  const spellData = await spellcasting(testCharacterData.class);
  
  const fullCharacterData = {
      ...testCharacterData,
      ...levelUpData,
      spells: spellData
  };

  res.render('character', fullCharacterData);
});
