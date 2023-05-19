const express = require('express');
const router = express.Router();
const OpenAI = require('./openai/combatAI.js');
const TurnOrder = require('./turnOrder.js');
const CombatPrompts = require('./combatPrompts.js');
const Dice = require('./Dice.js');

const openAI = new OpenAI(process.env.OPENAI_KEY);
const model = 'gpt-3.5-turbo';

const mainPage = 'combat';

//Preset enemy and player information for testing.
function presetPlayers() { return [{ name: "Draeven", class: "Ranger", maxHP: 10, hp: 10, ac: 12, gold: 0, actions: [{ name: "Greatbow" }, { name: "Dagger" }, { name: "Axe" }, { name: "Quarterstaff" }] }, { name: "Asha", class: "Rogue", maxHP: 12, hp: 12, ac: 11, actions: [{ name: "Dual Daggers" }, { name: "Crossbow" }, { name: "Sneak Attack" }]}] }
function presetEnemies() { return [{ name: "Goblin 1", hp: 7, ac: 9, desc: "A goblin wielding a dagger." }, { name: "Goblin 2", hp: 7, ac: 9, desc: "A goblin wielding a bow." }] }
var players = [];
var enemies = [];

const prompts = new CombatPrompts();
var initiative = new TurnOrder();

router.get('/', (req, res) => {
    if(!req.session.authenticated)
    {
        res.redirect("/userLoginScreen");
        return;
    }
    
    // Initialize combat history
    req.session.history = [];
    var actors = [];
    
    //Assign the preset players/enemies
    players = presetPlayers();
    enemies = presetEnemies();
    
    //Roll initiative for each player
    players.forEach(player => {
        player.roll = Dice.Roll(20,1);
        player.isActive = (player.hp > 0);
        actors.push(player);
    })

    //Roll initiative for each enemy
    enemies.forEach(enemy => {
        enemy.roll = Dice.Roll(20,1);
        enemy.isActive = (enemy.hp > 0);
        actors.push(enemy);
    })

    //Add every actor to the initative list, and get the first actor.
    initiative.assignNew(actors);
    var currentActor = initiative.currentTurn();
    this.combatEnded = false;
    res.render('combat', { players: players, isPlayer: players.includes(currentActor), actor: currentActor, combat: combatStatus() });
});

//Process and save the damage the player deals to an enemy.
//If the enemy dies and no enemies remain, combat ends in victory.
//Returns a text string describing the result. (Damage taken or death)
function parseDamage(data) {
    if(data === 'undefiend' || data === null || data.Result.DamageDealt === undefined) return undefined;

    let actor = initiative.getActorData(data.Target.Name);
    actor.hp = data.Result.RemainingHP;

    var resultText;
    if(actor.hp > 0) { 
        resultText = `${actor.name} took ${data.Result.DamageDealt} damage.`;
    } else {
        resultText = `${actor.name} falls to the ground, defeated.`;
        actor.isActive = false;

        if (getActiveEnemies().length < 1) {
            this.combatEnded = true;
            this.playerVictory = true;
        }
    }

    console.log(resultText);
    return resultText;
}

//Process and save the damage an enemy deals to a player.
//If the player dies and no party members remain, combat ends in defeat.
//Returns a text string describing the result. (Damage taken or death)
function parseEnemyDamage(data) {
    if (data === 'undefiend' || data === null || data.Result.DamageDealt === undefined) return undefined;

    let actor = initiative.getActorData(data.Result.SelectedTarget);
    actor.hp = data.Result.RemainingHP;

    var resultText;
    if (actor.hp > 0) {
        resultText = `${actor.name} took ${data.Result.DamageDealt} damage.`;
    } else {
        resultText = `${actor.name} falls to the ground, defeated.`;
        actor.isActive = false;

        if(getActivePlayers().length < 1) {
            this.combatEnded = true;
            this.playerVictory = false;
        }
    }

    console.log(resultText);
    return resultText;
}

//Returns if an actor is friendly, meaning they are in the player's party.
function isActorFriendly(actor)
{
    return players.includes(actor);
}

//Returns all currently alive players.
function getActivePlayers()
{
    var result = [];

    players.forEach(player => {
        if(player.isActive) result.push(player);
    })

    return result;
}

//Returns all currently alive players.
function getActiveEnemies() {
    var result = [];

    enemies.forEach(enemy => {
        if (enemy.isActive) result.push(enemy);
    })

    return result;
}

//Checks the current status of combat.
//status is false if combat is ongoing, true if it has ended.
function combatStatus() {
    if(this.combatEnded) {
        return {status: true, playerVictory: this.playerVictory};
    }
    return  {status: false};
}

//Sends the user to the victory page, and generates a combat outro.
router.post("/victory", async (req,res) => {
    let response = await openAI.generateResponse(prompts.storySystemPrompt(), prompts.combatVictoryPrompt(players, enemies, req.session.history), 600, 0.95);
    let data = JSON.parse(response);

    var outro;

    if (data.Result !== undefined) outro = data.Result.CombatOutro;
    else outro = data.CombatOutro;

    res.render("combatVictory", {
        summary: outro,
        players: players,
        isPlayer: true
    })
});

//Sends the user to the defeat page, and generates a combat outro.
router.post("/defeat", async (req, res) => {
    let response = await openAI.generateResponse(prompts.storySystemPrompt(), prompts.combatDefeatPrompt(players, enemies, req.session.history), 600, 0.95);
    let data = JSON.parse(response);

    var outro;

    if(data.Result !== undefined) outro = data.Result.CombatOutro;
    else outro = data.CombatOutro;

    res.render("combatDefeat", {
        summary: outro,
        players: players, 
        isPlayer: true
    })
});

//Saves the selected action and actor, then moves to target selection.
router.post("/selectAction/:action", async (req, res) => {
    let data = req.params.action;
    data = data.split('=');

    req.session.combatActor = data[0];
    req.session.combatAction = data[1];

    res.render('target', {
        targets: getActiveEnemies(),
        history: req.session.history,
        players: players,
        isPlayer: true
    });
});

//Saves the selected target, and moves to dice roll.
router.post("/selectTarget/:target", async (req, res) => {
    req.session.combatTarget = req.params.target;

    let actor = initiative.getActorData(req.session.combatActor);

    //Get the dice that needs to be rolled from chatGPT.
    let response = await openAI.generateRollRequest(prompts.generateBasicActionPrompt(actor.name, actor.actions[req.session.combatAction], req.params.target));
    response = formatResponse(response);

    //Parse the dice response, to allow the roll to happen.
    let data = JSON.parse(response);
    let roll = (data.DamageDice).split('d');

    res.render('diceRoll', {
        Dice: roll[1],
        Amount: roll[0],
        history: req.session.history,
        players: players,
        isPlayer: true
    });
});

//Gets the values rolled by the player, and generates a response.
router.post('/generatePlayerAction/:roll', async(req,res) => {
    let result = req.params.roll;
    result = result.toString().split('_');

    const actor = req.session.combatActor;

    let current = initiative.currentTurn();
    let friendly = isActorFriendly(current);
    
    //If for whatever reason, this post is reached while it is not a player's turn, return to the combat screen.
    if (actor != current.name) {
        res.render('combat', {
            actions: [{ Action: `It is not ${actor}'s turn yet` }],
            history: req.session.history,
            players: players, 
            isPlayer: friendly,
            actor: current,
            combat: combatStatus()
        });
        return;
    }

    try {
        //Query the chatGPT API using the prompts generated from the player's selected action, target, and dice rolls.
        //const text = await openAI.generateText(prompts.generatePlayerTurnPrompt(prompts.generateActionPrompt(actor, current.actions[req.session.combatAction], initiative.getActorData(req.session.combatTarget), result[0], result[1])), model, 200);

        let systemPrompt = prompts.playerSystemPrompt();
        let playerPrompt = prompts.playerTurnPrompt(current, prompts.assignAction(current.actions[req.session.combatAction], result[0], result[1]), initiative.getActorData(req.session.combatTarget), 300, 0.75);

        let text = await openAI.generateResponse(systemPrompt, playerPrompt);
        text = formatResponse(text);

        //Info to be displayed on the page later.
        let data = [];
        let damage = [];

        //Parse the JSON received from chatGPT, into a readable format.
        data.push(JSON.parse(text));

        // Store the received action, and update the history.
        req.session.action = data;
        for (var i = 0; i < data.length; i++) {
            req.session.history.push(data[i].Result.ActionDescription);
            req.session.history.push(parseDamage(data[i]));
        }

        //End the current turn, and run the callback function of the next actor's turn, if one exists.
        await initiative.endTurn();

        console.log(req.session.history);

        //Render the page, using the received information from chatGPT.
        res.render('combat', {
            history: req.session.history,
            players: players,
            isPlayer: isActorFriendly(initiative.currentTurn()),
            actor: initiative.currentTurn(),
            combat: combatStatus()
        });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.toString() });
    }
});

//Generates a response for the enemies actions.
router.post('/generateAction/:actor', async (req, res) => {
    const actor = req.params.actor;

    let current = initiative.currentTurn();
    let friendly = isActorFriendly(current);

    try {
        //Query the chatGPT API using the prompts generated from the enemy who is acting, and the targetable players.
        let systemPrompt = prompts.enemySystemPrompt();
        let enemyPrompt = prompts.enemyTurnPrompt(current, getActivePlayers());
        let text = await openAI.generateResponse(systemPrompt,enemyPrompt, 300, 0.75);

        console.log("Non-Formatted: ",text);
        text = formatResponse(text);

        //Info to be displayed on the page later.
        let data = [];
        let damage = [];

        //Parse the JSON received from chatGPT, into a readable format.
        data.push(JSON.parse(text));

        // Store the received action, and update the history.
        req.session.action = data;
        for (var i = 0; i < data.length; i++) {
            req.session.history.push(data[i].Result.ActionDescription);
            req.session.history.push(parseEnemyDamage(data[i]));
        }

        //End the current turn, and run the callback function of the next actor's turn, if one exists.
        //This repeats for every consecutive enemy action.
        await initiative.endTurn();

        console.log(req.session.history);
        //Render the page, using the received information from chatGPT.
        res.render('combat', {
            history: req.session.history,
            players: players,
            isPlayer: isActorFriendly(initiative.currentTurn()),
            actor: initiative.currentTurn(),
            combat: combatStatus()
        });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.toString() });
    }
});

//A formatting function for parsing JSON.
//chatGPT likes to add comments which cannot be parsed, this function removes those comments.
function formatResponse(text) {
    var data = text;

    while(data.substring(data.length - 1) != "}" && data.length > 1)
    {
        data = data.substring(0, data.length - 1);
    }

    return data;
}

module.exports = router;