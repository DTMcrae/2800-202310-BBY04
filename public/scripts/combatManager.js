const TurnOrder = require('../scripts/turnOrder.js');
const OpenAI = require('../scripts/openai/combatAI.js');

class CombatManager {

    static async BeginCombat(friendlyActors, enemyActors)
    {
        if(this.initialized !== undefined && this.initialized)
        {
            console.log("Attempted to initialize combat while combat is already running. \n Use CombatManager.EndCombat() before starting a new encounter.");
        }

        this.actors = [];
        this.actors.push(friendlyActors);
        this.actors.push(enemyActors);

        this.initiative = new TurnOrder();
        this.initiative.assignNew(actors);

        //Async roll function for the player
        //Calculate initiative
        //Assign each npc an 'automatic' action callback function
        //Assign the player an 'await input' callback function
        this.initialized = true;
        console.log("Combat encounter has begun.");
    }

    static CanAct(name)
    {
        return this.initiative.canActName(name);
    }

    static async EndTurn()
    {
        return await this.initiative.endTurn();
        
    }

    static async EndCombat()
    {
        this.initialized = false;
        console.log("Combat encounter has ended.");
    }
}