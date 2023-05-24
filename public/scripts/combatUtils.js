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

class CombatUtils {

    calculatePlayerHP(character) {
        var level = Number((character.level).split(" ")[1]);
        var constitution = Number(character.abilityScores[2].split(" ")[1]);
        var hitDie = this.getHitDie(character.class);

        return this.calculateHP(hitDie, level, constitution);
    }

    calculatePartyMemberHP(character) {
        var level = character.level;
        var constitution = character.AbilityScores.Constitution;
        var hieDie = this.getHitDie(character.Class);

        return this.calculateHP(hitDie, level, constitution);
    }

    calculateNpcHP(character) {
        return character.base_hp;
    }

    calculateEnemyHP(entity) {
        return entity.hp;
    }

    calculateHP(hitDie, level, constitution) {
        var result = (hitDie + (((hitDie / 2) + 1) * (level - 1)) + Math.floor((constitution - 10) / 2));
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

    getActions(character) {
        var isNPC = (character.class === undefined);
    }
}

module.exports = CombatUtils;