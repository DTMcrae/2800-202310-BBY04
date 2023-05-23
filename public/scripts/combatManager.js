const express = require('express');
const router = express.Router();
const CombatAI = require('./combatAI.js');
const TurnOrder = require('./turnOrder.js');
const CombatPrompts = require('./combatPrompts.js');
const Dice = require('./Dice.js');

const openAI = new CombatAI(process.env.OPENAI_KEY);

//Preset enemy and player information for testing.
function presetPlayers() { return [{ name: "Draeven", class: "Ranger", maxHP: 10, hp: 99, ac: 12, gold: 0, actions: [{ name: "Greatbow" }, { name: "Dagger" }, { name: "Axe" }, { name: "Quarterstaff" }] }, { name: "Asha", class: "Rogue", maxHP: 10, hp: 99, ac: 12, gold: 0, actions: [{ name: "Greatbow" }, { name: "Dagger" }, { name: "Axe" }, { name: "Quarterstaff" }] }] }
function presetEnemies() { return [{ name: "Goblin 1", hp: 7, ac: 9, desc: "A goblin wielding a dagger." }, { name: "Goblin 2", hp: 7, ac: 9, desc: "A goblin wielding a bow." }] }

const prompts = new CombatPrompts();
const initiative = new TurnOrder();

router.get('*', (req, res) => {
    if(!req.session.authenticated)
    {
        res.redirect("/userLoginScreen");
        return;
    }

    if(!req.session.combatInit) startCombat(req);
    req.session.lastURL = req.url;

    var currentActor = initiative.currentTurn(req.session.turnOrder);
    res.render('combat', { players: getAllPlayers(req), history: req.session.history, isPlayer: isActorFriendly(currentActor), actor: currentActor, combat: combatStatus(req) });
});

router.post('/', (req, res) => {
    var currentActor = initiative.currentTurn(req.session.turnOrder);
    res.render('combat', { players: getAllPlayers(req), history: req.session.history, isPlayer: isActorFriendly(currentActor), actor: currentActor, combat: combatStatus(req), error: true });
});

//Placeholder function for assigning actors to combat.
function startCombat(req) {
    req.session.history = [];
    let actors = [];

    //Assign the preset players/enemies
    let players = presetPlayers();
    let enemies = presetEnemies();

    //Roll initiative for each player
    players.forEach(player => {
        player.roll = Dice.Roll(20, 1);
        player.isActive = (player.hp > 0);
        player.isPlayer = true;
        actors.push(player);
    })

    //Roll initiative for each enemy
    enemies.forEach(enemy => {
        enemy.roll = Dice.Roll(20, 1);
        enemy.isActive = (enemy.hp > 0);
        enemy.isPlayer = false;
        actors.push(enemy);
    })

    req.session.turnOrder = initiative.assignNew(actors);
    req.session.combatInit = true;
    this.combatEnded = false;
}

//Process and save the damage the player deals to an enemy.
//If the enemy dies and no enemies remain, combat ends in victory.
//Returns a text string describing the result. (Damage taken or death)
function parseDamage(req, data) {
    if(data === 'undefiend' || data === null || data.Result.DamageDealt === undefined) return undefined;
    let target = (data.Target !== undefined) ? data.Target.Name : data.Result.SelectedTarget;

    let actor = initiative.getActorData(req.session.turnOrder,target);
    actor.hp = data.Result.RemainingHP;

    var resultText;
    if(actor.hp > 0) { 
        resultText = `${actor.name} took ${data.Result.DamageDealt} damage.`;
    } else {
        resultText = `${actor.name} falls to the ground, defeated.`;
        actor.isActive = false;

        if (getActiveEnemies(req).length < 1 || getActivePlayers(req).length < 1) {
            this.combatEnded = true;
            this.playerVictory = (getActiveEnemies(req).length < 1);
        }
    }

    console.log(resultText);
    return resultText;
}

//Returns if an actor is friendly, meaning they are in the player's party.
function isActorFriendly(actor)
{
    return actor.isPlayer;
}

function getAllPlayers(req) {
    var result = [];

    req.session.turnOrder.order.forEach(actor => {
        if (actor.isPlayer) result.push(actor);
    })

    return result;
}

//Returns all currently alive players.
function getActivePlayers(req)
{
    var result = [];

    req.session.turnOrder.order.forEach(actor => {
        if (actor.isPlayer && actor.isActive) result.push(actor);
    })

    return result;
}

function getAllEnemies(req) {
    var result = [];

    req.session.turnOrder.order.forEach(actor => {
        if (!actor.isPlayer) result.push(actor);
    })

    return result;
}

//Returns all currently alive players.
function getActiveEnemies(req) {
    var result = [];

    req.session.turnOrder.order.forEach(actor => {
        if (!actor.isPlayer && actor.isActive) result.push(actor);
    })

    return result;
}

//Checks the current status of combat.
//status is false if combat is ongoing, true if it has ended.
function combatStatus(req) {
    if(req.session.combatEnded) {
        return {status: true, playerVictory: (getActiveEnemies(req).length < 1)};
    }
    return  {status: false};
}

//Checks if the response from chatGPT is null, and redirects to an error page.
function verifyResponse(req, res, response, url) {
    if(response === null) {
        //The below function works similar to a standard redirect, but treats it as a post request.
        res.redirect(307,url);
        return false;
    }
    return true;
}

router.post("/save", async (req,res) => {
   var turnOrder = req.session.turnOrder;
   var history = req.session.history;

   //Something something save to database
});

router.get("/load/:id", async (req,res) => {

    //Something something load from database

    //Assign req.session.turnOrder to the turnOrder stored in the database
    //Assign req.session.history to the history stored in the database

    req.session.combatInit = true;
    this.combatEnded = false;
    res.redirect('/combat');
})

//Sends the user to the victory page, and generates a combat outro.
router.post("/victory", async (req,res) => {
    let response = await openAI.generateResponse(prompts.storySystemPrompt(), prompts.combatVictoryPrompt(getAllPlayers(req), getAllEnemies(req), req.session.history), 600, 0.95);
    let data = JSON.parse(response);

    var outro;

    if (data.Result !== undefined) outro = data.Result.CombatOutro;
    else outro = data.CombatOutro;

    req.session.combatInit = false;
    res.render("combatVictory", {
        summary: outro,
        players: getAllPlayers(req),
        isPlayer: true
    })
});

//Sends the user to the defeat page, and generates a combat outro.
router.post("/defeat", async (req, res) => {
    let response = await openAI.generateResponse(prompts.storySystemPrompt(), prompts.combatDefeatPrompt(getAllPlayers(req), getAllEnemies(req), req.session.history), 600, 0.95);
    let data = JSON.parse(response);

    var outro;

    if(data.Result !== undefined) outro = data.Result.CombatOutro;
    else outro = data.CombatOutro;

    req.session.combatInit = false;
    res.render("combatDefeat", {
        summary: outro,
        players: getAllPlayers(req), 
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
        targets: getActiveEnemies(req),
        history: req.session.history,
        players: getAllPlayers(req),
        isPlayer: true
    });
});

//Saves the selected target, and moves to dice roll.
router.post("/selectTarget/:target", async (req, res) => {
    req.session.combatTarget = req.params.target;

    let actor = initiative.getActorData(req.session.turnOrder, req.session.combatActor);


    var roll;

    if(actor.actions[req.session.combatAction].DamageDice === undefined) {

        response = await openAI.generateRollRequest(prompts.generateBasicActionPrompt(actor.name, actor.actions[req.session.combatAction], req.params.target));

        if(!verifyResponse(req,res,response,"/combat/selectAction/" + req.session.combatActor + "=" + req.session.combatAction));
    
        response = formatResponse(response);

        let data = JSON.parse(response);
        roll = (data.DamageDice).split('d');
        actor.actions[req.session.combatAction].DamageDice = roll;
    }

    else {
        roll = actor.actions[req.session.combatAction].DamageDice;
    }

    console.log("Roll:",req.session.combatRoll);

    res.render('diceRoll', {
        Dice: roll[1],
        Amount: roll[0],
        history: req.session.history,
        players: getAllPlayers(req),
        isPlayer: true,
        roll: req.session.combatRoll
    });
});

function updateHistory(req, data) {
        req.session.history.push(data.Result.ActionDescription);
        req.session.history.push(parseDamage(req, data));
        req.session.lastURL = req.url;
}

//Gets the values rolled by the player, and generates a response.
router.post('/generatePlayerAction/:roll', async(req,res) => {
    let result = req.params.roll;
    result = result.toString().split('_');

    req.session.combatRoll = result;

    let current = initiative.currentTurn(req.session.turnOrder);

    try {
        //Query the chatGPT API using the prompts generated from the player's selected action, target, and dice rolls.
        //const text = await openAI.generateText(prompts.generatePlayerTurnPrompt(prompts.generateActionPrompt(actor, current.actions[req.session.combatAction], initiative.getActorData(req.session.combatTarget), result[0], result[1])), model, 200);

        let systemPrompt = prompts.playerSystemPrompt();
        let playerPrompt = prompts.playerTurnPrompt(current, prompts.assignAction(current.actions[req.session.combatAction], result[0], result[1]), initiative.getActorData(req.session.turnOrder,req.session.combatTarget), 300, 0.75);

        let text = await openAI.generateResponse(systemPrompt, playerPrompt);
        if (!verifyResponse(req, res, text, '/combat/selectTarget/' + req.session.combatTarget)) {
            return;
        };
        text = formatResponse(text);

        req.session.combatRoll = 0;

        // Store the received action, and update the history.
        updateHistory(req, JSON.parse(text));

        //End the current turn, and run the callback function of the next actor's turn, if one exists.
        await initiative.endTurn(req.session.turnOrder);

        //Render the page, using the received information from chatGPT.
        res.render('combat', {
            history: req.session.history,
            players: getAllPlayers(req),
            isPlayer: isActorFriendly(initiative.currentTurn(req.session.turnOrder)),
            actor: initiative.currentTurn(req.session.turnOrder),
            combat: combatStatus(req)
        });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.toString() });
    }
});

//Generates a response for the enemies actions.
router.post('/generateAction/:actor', async (req, res) => {
    let current = initiative.currentTurn(req.session.turnOrder);

    try {
        //Query the chatGPT API using the prompts generated from the enemy who is acting, and the targetable players.
        let systemPrompt = prompts.enemySystemPrompt();
        let enemyPrompt = prompts.enemyTurnPrompt(current, getActivePlayers(req));

        let text = await openAI.generateResponse(systemPrompt,enemyPrompt, 300, 0.75);
        if(!verifyResponse(req, res, text, '/combat')) {
            return;
        };
        text = formatResponse(text);

        //Parse the JSON received from chatGPT, into a readable format.
        updateHistory(req, JSON.parse(text));

        //End the current turn, and run the callback function of the next actor's turn, if one exists.
        //This repeats for every consecutive enemy action.
        await initiative.endTurn(req.session.turnOrder);

        console.log(req.session.history);
        //Render the page, using the received information from chatGPT.
        res.render('combat', {
            history: req.session.history,
            players: getAllPlayers(req),
            isPlayer: isActorFriendly(initiative.currentTurn(req.session.turnOrder)),
            actor: initiative.currentTurn(req.session.turnOrder),
            combat: combatStatus(req)
        });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.toString() });
    }
});

//A formatting function for parsing JSON.
//chatGPT likes to add comments which cannot be parsed, this function removes them.
function formatResponse(text) {
    var data = text;

    while(data.substring(data.length - 1) != "}" && data.length > 1)
    {
        data = data.substring(0, data.length - 1);
    }

    return data;
}

module.exports = router;
