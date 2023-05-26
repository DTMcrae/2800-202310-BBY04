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
      return response.data.choices[0].message;
    } catch (error) {
        console.error('Error while making a request to the ChatGPT API:', error);
        throw new Error('Error while making a request to the ChatGPT API');
    }
}

/*------------------------------------------------------------------------------------End of chatgpt function call----------------------------------------------------------------------*/


//function for loading equip into an array
async function fetchEquipmentOptions() {
const equipmentList = await equipCollection.find().toArray();
return equipmentList.map((equip) => equip.Name).join(', ');
}

//function for loading all the monster names into an array
async function getMonsterNames() {
const monstersList = await monstersCollection.find({}, { projection: { _id: 0, name: 1 } }).toArray();
return monsterList = monsters.map(monster => monster.name);
}

//fucntion for return an object containing spefic Monster information
async function getMonsterInfo(name) {
const monsterInfo = await monstersCollection.findOne({ name: name });
return monsterInfo;
}

//function for defing ac
async function calculateAC(character) {
  let baseAC = 10; // base AC when no armor is worn
  let dexMod = Math.floor((character.AbilityScores.Dexterity - 10) / 2); // calculate Dexterity modifier

  // the AC values and max DEX mod bonus are predefined for simplicity. Ideally, these should be in a database or another data structure
  const armorValues = {
      'Leather': [11, null],
      'Studded leather': [12, null],
      'Hide': [12, 2],
      'Chain shirt': [13, 2],
      'Scale mail': [14, 2],
      'Breastplate': [14, 2],
      'Half plate': [15, 2],
      'Ring mail': [14, null],
      'Chain mail': [16, null],
      'Splint': [17, null],
      'Plate': [18, null],
  };

  let armor = character.Equipment.Armour;
  let shield = character.Equipment.Additional_Equipment_3 === 'Shield';
  let charClass = character.Class;
  let unarmoredDefense = character.Abilities.includes('Unarmored Defense');

  if (armor in armorValues) {
      let [baseACArmor, maxDexBonus] = armorValues[armor];
      if (maxDexBonus !== null) {
          dexMod = Math.min(dexMod, maxDexBonus); // limit DEX mod bonus if there is a maximum
      }
      baseAC = baseACArmor;
  } else if (unarmoredDefense && armor === 'None') {
      if (charClass === 'Barbarian') {
          let conMod = Math.floor((character.AbilityScores.Constitution - 10) / 2); // calculate Constitution modifier
          baseAC += conMod;
      } else if (charClass === 'Monk') {
          let wisMod = Math.floor((character.AbilityScores.Wisdom - 10) / 2); // calculate Wisdom modifier
          baseAC += wisMod;
      }
  }

  let ac = baseAC + dexMod;
  if (shield) {
      ac += 2; // add 2 for shield
  }

  return ac;
}

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


/* Reference for outer joints
breakdown of the $lookup stage:
from: Specifies the collection to join with the input documents (in this case, the EQUIPMENT collection).
localField: Specifies the field from the input documents (documents from charCollection) to use as the key for the join operation. 
    In this case, the items field represents the list of item IDs in the player's inventory.
foreignField: Specifies the field from the documents of the from collection (equipCollection) to use as the key for the join operation. 
    In this case, the _id field represents the unique ID of each equipment item.
as: Specifies the name of the new array field that will be added to the input documents. This new field contains the matching documents from the from collection.
     In this case, the field is named inventoryDetails.
*/

async function getPlayerInventory(characterId) {
    const result = await charCollection.aggregate([
        { $match: { _id: ObjectId(characterId) } },
        {
        $lookup: {
            from: 'EQUIPMENT',
            localField: 'items',
            foreignField: '_id',
            as: 'inventoryDetails',
        },
        },
        {
        $project: {
            _id: 0,
            inventoryDetails: 1,
        },
        },
    ]).toArray();

    return result[0]?.inventoryDetails || [];
}

async function getPlayerEquippedItems(characterId) {
    const result = await charCollection.aggregate([
      { $match: { _id: ObjectId(characterId) } },
      {
        $lookup: {
          from: 'EQUIPMENT',
          localField: 'equippedItems',
          foreignField: '_id',
          as: 'equippedDetails',
        },
      },
      {
        $project: {
          _id: 0,
          equippedDetails: 1,
        },
      },
    ]).toArray();
  
    return result[0]?.equippedDetails || [];
}

/*-----------------------------------------------------------------------------------End of function ----------------------------------------------------------------------------------------------*/



//Middleware of for getting chat gpt to provide equip based on the data avaliable in the database. This is temp and can be changed as we develop further.
const chatGPTMiddleware = async (req, res, next) => {
  const equipmentOptions = await fetchEquipmentOptions();

  // Log the equipmentOptions to the console
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
  const testCharacterData = {
      name: "Test Wizard",
      currentLevel: 1,
      class: "Wizard",
      subclass: "",
      nextLevel: 2
  };

  const levelUpData = await getLevelUpData(testCharacterData.class, testCharacterData.nextLevel);
  const spellData = await spellcasting(testCharacterData.class);
  
  const fullCharacterData = {
      ...testCharacterData,
      ...levelUpData,
      spells: spellData
  };

  res.render('character', fullCharacterData);
});
