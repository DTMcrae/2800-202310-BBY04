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


//function for loading equip into an array
async function fetchEquipmentOptions() {
const equipmentList = await equipCollection.find().toArray();
return equipmentList.map((equip) => equip.Name).join(', ');
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