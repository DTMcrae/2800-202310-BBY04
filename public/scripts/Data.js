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
      const monsterInfo = await monstersCollection.collection.findOne({ name: name });
      return monsterInfo;
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
        { $sample: { size: 5 } },
        { $project: { _id: 0, name: 1, background: 1 } }
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
    
    async getLevelUpData(userClass, userLevel) {
      try {
          const levelData = await levelCollection.collection.findOne({ class: userClass });
          return levelData;
      } catch (err) {
          console.error(err);
          return null;
      }
    }
    
    async getSpellData(userClass, userLevel) {
      try {
          const spellData = await spellsCollection.collection.find({ classes: new RegExp(userClass, 'i'), level: { $lte: userLevel } }).toArray();
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
    
    async getPlayerInventory(characterId) {
        const result = userCharCollection.collection.aggregate([
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
    
    async getPlayerEquippedItems(characterId) {
        const result = await userCharCollection.collection.aggregate([
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
}

module.exports = Data;
