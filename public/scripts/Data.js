const { userCollection, 
  classesCollection, 
  equipmentCollection,
  levelCollection,
  monstersCollection,
  npcCollection,
  partyMemCollection,
  scenarioCollection,
  sessionCollection,
  spellsCollection,
  userCharCollection,
  userSavedCollection  
} = require('../../databaseConnection.js');
const { ObjectId, Code } = require('mongodb');

class Data {

  //function for loading equip into an array
  async fetchEquipmentOptions() {
    const equipmentList = await equipmentCollection.collection.find().toArray();
    return equipmentList.map((equip) => equip.Name).join(', ');
  }
    
  //function for loading all the monster names into an array
  async getMonsterNames() {
    const monstersList = await monstersCollection.collection.aggregate([
        { $match: { cr: { $lte: '1/4' } } },
        // { $sample: { size: 5 } },
        { $project: { _id: 0, name: 1 } }
    ]).toArray();
    return monstersList.map(monster => monster.name);
  }


    //fucntion for return an object containing spefic Monster information
    async getMonsterInfo(name) {
      const normalized_name = name.toLowerCase().replace(/ /g, "-");
      const monsterInfo = await monstersCollection.collection.findOne({ name: normalized_name });
      const fallbackMonster = {
        "_id" : "6451f263f429a21febb3d6ef",
        "name" : "goblin",
        "url" : "https://www.aidedd.org/dnd/monstres.php?vo=goblin",
        "cr" : "1/4",
        "type" : "humanoid (goblinoid)",
        "size" : "Small",
        "ac" : 15,
        "hp" : 7,
        "speed" : 0,
        "align" : "neutral evil",
        "legendary" : "0",
        "source" : "Monster Manual (SRD)",
        "str" : "8.0",
        "dex" : "14.0",
        "con" : "10.0",
        "int" : "10.0",
        "wis" : "8.0",
        "cha" : "8.0"
      }
      if (monsterInfo) {
        return monsterInfo;
      } else {
        console.log(`Monster with name: ${normalized_name} not found, using fallback data.`);
        return fallbackMonster;
      }
    }
      

    async getBossMonsterNames() {
      const bossMonstersList = await monstersCollection.collection.find({ legendary: { $ne: null } }, { projection: { _id: 0, name: 1 } }).toArray();
      return bossMonstersList.map(bossMonster => bossMonster.name);
  }
  
  async getBossMonsterDetails(name) {
    const bossMonsterDetails = await monstersCollection.collection.findOne({ name: name, legendary: { $ne: null } });
    return bossMonsterDetails;
}


  //function for loading all npc with thier background into an object array
  async getNpc() {
    const npcList = await npcCollection.collection.aggregate([
        { 
          $match: {
            name: { $not: /Character/ }, // filter out documents where the name contains 'Character'
            stats_1: { $ne: 0 }, // filter out documents where 'stats_1' is not equal to 0
            stats_2: { $ne: 0 }, // repeat for all stats
            stats_3: { $ne: 0 },
            stats_4: { $ne: 0 },
            stats_5: { $ne: 0 },
            stats_6: { $ne: 0 }
          }
        },
        { $sample: { size: 5 } },
        { $project: { _id: 0, char_id: 1, name: 1, background: 1 } }
    ]).toArray();
    return npcList.map(npc => ({ name: npc.name, background: npc.background }));
  }
  

  //function of returning all the npc details
  async getNpcDetails(name, background) {
    const npcDetails = await npcCollection.collection.findOne({ name: name, background: background });
    return npcDetails;
}
  
  //function for defing ac
    async calculateAC(character) {
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

    async calculateMaxHP(character) {
      var level = character.Level;
      var constitution = character.AbilityScores.Constitution;
      var hitDie = this.getHitDie(character.Class);

      var result = (hitDie + (((hitDie / 2) + 1) * (level - 1)) + (Math.floor((constitution - 10) / 2) * level));
      console.log("MaxHP:", result);
      return result;
    }

  getHitDie(characterClass) {
    switch (characterClass) {
      case "Druid":
        return 8;
      case "Fighter":
        return 10;
      case "Wizard":
        return 6;
      case "Warlock":
        return 8;
      case "Sorcerer":
        return 6;
      case "Rogue":
        return 8;
      case "Ranger":
        return 10;
      case "Paladin":
        return 10;
      case "Monk":
        return 8;
      case "Cleric":
        return 8;
      case "Bard":
        return 8;
      case "Barbarian":
        return 12;
      case "BCIT Nerd":
        return 6;
      default:
        return 6;
    }
  }

  async getActions(character) {
    var result = [];
    result.push({name: character.Equipment.Weapon});
    if (character.Equipment.Ranged_Weapon !== undefined && character.Equipment.Ranged_Weapon !== "None") {
      result.push({name: character.Equipment.Ranged_Weapon});
    }

    return result;
  }
    
    async getLevelUpData(userClass, userLevel) {
      try {
          const characterClassData = await levelCollection.collection.findOne({ class: userClass });
          if (!characterClassData) {
              throw new Error(`No data found for class: ${userClass}`);
          }
          
          // construct the field name for the required level
          const levelField = `lvl${userLevel}`;
    
          // get the data for the required level
          const levelData = characterClassData[levelField];
    
          // if no data found for this level, return null or you can throw an error
          if (!levelData) {
              return null;
              // or: throw new Error(`No data found for class: ${userClass}, level: ${userLevel}`);
          }
    
          return levelData;
          
      } catch (err) {
          console.error(err);
          return null;
      }
    }    
    
      async getSpellData(userClass, userLevel) {
        try {
          const spellData = await spellsCollection.collection.find({ classes: new RegExp(userClass, 'i'), level: { $lte: userLevel + 1 } }).toArray();
          return spellData;
        } catch (err) {
          console.error(err);
          return null;
        }
      }
    
    
    async spellcasting(userClass) {
      try {
          // For Wizards and Druids at level 1, we will only fetch level 0 (cantrips) and level 1 spells.
          const spellData = await spellsCollection.collection.find({ classes: new RegExp(userClass, 'i'), level: { $in: [0, 1] } }).toArray();
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
    
        async getPartyDetails(req, res, next) {
        if (!req.session || !req.session.characters) {
          throw new Error('No characters found in session');
        }
  
        const playerDetails = req.session.characters.map(character => {
            const { Equipment, ...details } = character;
            return details;
        });
  
        return playerDetails;
      }
      
    
    async getPlayerEquipment(req) {
      // Ensure the session data is parsed to an object
      if (typeof req.session.characters === 'string') {
          req.session.characters = JSON.parse(req.session.characters);
      }
  
      // Array to store details of all characters
      let characterDetails = [];
  
      // Loop over all characters in the session
      for (let character of req.session.characters) {
          // Get the character's Name, Class and Equipment
          let details = {
              'Name': character.Name,
              'Class': character.Class,
              'Equipment': character.Equipment
          };
          characterDetails.push(details);
      }
  
      return characterDetails;
  }
  
}

module.exports = Data;
