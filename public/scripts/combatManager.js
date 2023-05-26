const express = require('express');
const router = express.Router();
const CombatAI = require('./combatAI.js');
const TurnOrder = require('./turnOrder.js');
const CombatPrompts = require('./combatPrompts.js');
const Dice = require('./Dice.js');
const Crypto = require('crypto');
const ObjectId = require('mongodb').ObjectId;
const Data = require('./Data.js');
const data = new Data();

const openAI = new CombatAI(process.env.OPENAI_KEY);

//Preset enemy and player information for testing.
function presetPlayers() { return [{ name: "Draeven", class: "Ranger", maxHP: 10, hp: 99, ac: 12, gold: 0, actions: [{ name: "Greatbow" }, { name: "Dagger" }, { name: "Axe" }, { name: "Quarterstaff" }] }, { name: "Asha", class: "Rogue", maxHP: 10, hp: 99, ac: 12, gold: 0, actions: [{ name: "Greatbow" }, { name: "Dagger" }, { name: "Axe" }, { name: "Quarterstaff" }] }] }
function presetEnemies() { return [{ name: "Goblin 1", hp: 7, ac: 9, desc: "A goblin wielding a dagger." }, { name: "Goblin 2", hp: 7, ac: 9, desc: "A goblin wielding a bow." }] }

const prompts = new CombatPrompts();
const initiative = new TurnOrder();

const { userCollection,
    // monstersCollection,
    // npcCollection,
    // partyMemCollection,
    // userCharCollection,
    userSavedCollection
} = require('../.././databaseConnection.js');

router.post("/load/:id", async (req, res) => {

    //Something something load from database

    //Assign req.session.turnOrder to the turnOrder stored in the database
    //Assign req.session.history to the history stored in the database

    id = req.params.id;

    if (id === undefined) {
        console.error("Bad Story ID");
        req.redirect("/LandingPage");
        return;
    }

    try {
        var response = await userSavedCollection.collection.find({
            storyID: id, userID: req.session.userID
        }).project({
            initiative: 1,
            history: 1
        }).toArray();

        req.session.storyID = id;
        req.session.turnOrder = response[0].initiative;
        req.session.history = response[0].history;

    } catch (e) {
        console.log(e);
    }

    req.session.combatInit = true;
    this.combatEnded = false;
    res.redirect('/combat');
})

router.get('*', async (req, res) => {
    if (!req.session.authenticated) {
        res.redirect("/userLoginScreen");
        return;
    }

    //req.session.combatInit = false;
    if (!req.session.combatInit) await startCombat(req);
    req.session.lastURL = req.url;

    var currentActor = initiative.currentTurn(req.session.turnOrder);
    res.render('combat', { players: getAllPlayers(req), history: req.session.history, isPlayer: isActorFriendly(currentActor), actor: currentActor, combat: combatStatus(req), saved:req.session.saved });
    req.session.saved = false;
});

router.post('/', (req, res) => {
    var currentActor = initiative.currentTurn(req.session.turnOrder);
    res.render('combat', { players: getAllPlayers(req), history: req.session.history, isPlayer: isActorFriendly(currentActor), actor: currentActor, combat: combatStatus(req), error: true });
});

//Placeholder function for assigning actors to combat.
async function startCombat(req) {

    req.session.combatEnded = false;
    req.session.history = [];
    let actors = [];

    //Assign the preset players/enemies
    let players = (req.session.characters !== undefined) ? req.session.characters : presetPlayers();
    const enemyNames = (req.session.enemies !== undefined) ? req.session.enemies : presetEnemies();
    let enemies = ["",""];

    if (req.session.combatSequence === 0)
    {
        if (enemyNames[0].name === undefined) {
            enemies[0] = await data.getMonsterInfo((enemyNames[0]).toLowerCase());
            const copy = JSON.stringify(enemies[0]);
            enemies[1] = JSON.parse(copy);
        }
    } 
    else 
    {
        if (enemyNames[0].name === undefined) {
            for (var x = 0; x < enemies.length; x++) {
                enemies[x] = await data.getMonsterInfo((enemyNames[x]).toLowerCase());
            }
        }
    }

    replaceNull(enemies);

    var count = 0;

    //Roll initiative for each player
    players.forEach(player => {
        player.roll = Dice.Roll(20, 1);
        player.isActive = (player.hp > 0);
        player.isPlayer = true;
        player.combatID = count;
        actors.push(player);
        count++;
    });

    //Roll initiative for each enemy
    enemies.forEach(enemy => {
        enemy.roll = Dice.Roll(20, 1);
        enemy.isActive = (enemy.hp > 0);
        enemy.isPlayer = false;
        enemy.combatID = count;
        count++;

        actors.push(enemy);
    })

    req.session.turnOrder = initiative.assignNew(actors);
    req.session.combatInit = true;
    req.session.saved = false;
    this.combatEnded = false;
}

//In case one of the enemies cannot be found in the database, attempt to copy an already existing enemy's data.
function replaceNull(enemies) {
    var copy = null;
    var breakout = 0;
    var result = enemies;

    while (result.includes(null)) {
        breakout++;
        for (var x = 0; x < result.length; x++) {
            if (result[x] != null) {
                copy = result[x];
            } else {
                result[x] = copy;
            }
        }
        if (breakout >= 3) break;
    }

    if (result.includes(null)) {
        console.error("Unable to find a replacement enemy.", result);
    }
    else return result;
}

//Process and save the damage the player deals to an enemy.
//If the enemy dies and no enemies remain, combat ends in victory.
//Returns a text string describing the result. (Damage taken or death)
function parseDamage(req, data) {
    //Ensure all required paramaters are present.
    if (data === undefined || data === null || data.Result.DamageDealt === undefined) return undefined;
    let target = (data.Target !== undefined) ? req.session.combatTarget : data.Result.SelectedTarget;

    //Get the information of the actor that is taking damage.
    let actor = initiative.getActorData(req.session.turnOrder, target);
    if(actor === null) actor = initiative.getActorDataID(req.session.turnOrder, target);

    //Update that actors health (hp)
    if(actor.hp === undefined) return " ";
    actor.hp = data.Result.RemainingHP;

    var resultText;

    //If the actor's hp is greater than 0, say they take damage.
    //Otherwise, set isActive to false for the actor, meaning they are "dead"
    if (Number(actor.hp) > 0) {
        resultText = `${actor.name} took ${data.Result.DamageDealt} damage.`;
    } else {
        resultText = `${actor.name} falls to the ground, defeated.`;
        actor.isActive = false;

        if (getActiveEnemies(req).length < 1 || getActivePlayers(req).length < 1) {
            req.session.combatEnded = true;
            req.session.playerVictory = (getActiveEnemies(req).length < 1);
        }
    }

    return resultText;
}

//Returns if an actor is friendly, meaning they are in the player's party.
function isActorFriendly(actor) {
    return actor.isPlayer;
}

//Returns all players present in combat.
function getAllPlayers(req) {
    var result = [];

    req.session.turnOrder.order.forEach(actor => {
        if (actor.isPlayer) result.push(actor);
    })

    return result;
}

//Returns all currently alive players.
function getActivePlayers(req) {
    var result = [];

    req.session.turnOrder.order.forEach(actor => {
        if (actor.isPlayer === true && actor.isActive === true) result.push(actor);
    })
    return result;
}

//Returns all enemies present in combat.
function getAllEnemies(req) {
    var result = [];

    req.session.turnOrder.order.forEach(actor => {
        if (!actor.isPlayer) result.push(actor);
    })

    return result;
}

//Returns all currently alive enemies.
function getActiveEnemies(req) {
    var result = [];

    req.session.turnOrder.order.forEach(actor => {
        if (actor.isPlayer === false && actor.isActive === true) {
            result.push(actor);
        }
    })

    return result;
}

//Checks the current status of combat.
//status is false if combat is ongoing, true if it has ended.
function combatStatus(req) {
    if (req.session.combatEnded === true || getActiveEnemies(req).length < 1 || getActivePlayers(req).length < 1) {
        return { status: true, playerVictory: req.session.playerVictory };
    }
    return { status: false };
}

//Checks if the response from chatGPT is null, and redirects to an error page.
function verifyResponse(req, res, response, url) {
    if (response === null) {
        //The below function works similar to a standard redirect, but treats it as a post request.
        res.redirect(307, url);
        return false;
    }
    return true;
}

//Post route for saving progress to the database.
router.post("/save", async (req, res) => {
    var turnOrder = req.session.turnOrder;
    var history = req.session.history;

    if (req.session.storyID !== undefined) {

        //Attempt to find an update an existing save
        try {
            var result = await userSavedCollection.collection.find({
                storyID: req.session.storyID
            }).project({
                initiative: 1,
                history: 1
            }).toArray();

            if (result.length > 0) {
                var updated = await userSavedCollection.collection.updateOne(
                    { storyID: req.session.storyID },
                    { $set: { gameState: "combat", initiative: turnOrder, history: history, date: new Date().toLocaleString() } }
                );
            }
        } catch (e) {
            console.log(e);
            res.redirect(307, "/combat");
        }

    }
    else {
        //Attempt to create a new save
        try {
        var id = Crypto.randomBytes(20).toString('hex');
        req.session.storyID = id;
        var result = await userSavedCollection.collection.insertOne({
            gameState: "combat",
            userID: req.session.userID,
            storyID: id,
            initiative: turnOrder,
            history: history,
            date: new Date().toLocaleString(),
        });

        var userUpdate = await userCollection.collection.updateOne(
            { _id: new ObjectId(req.session.userID) },
            { $addToSet: { userStories: id } }
        );
        } catch (e) {
            console.log(e);
            res.redirect(307, "/combat");
        }
    }
    req.session.saved = true;
    res.redirect("/combat");
});

//Sends the user to the victory page, and generates a combat outro.
router.post("/victory", async (req, res) => {
    let response = await openAI.generateResponse(prompts.storySystemPrompt(), prompts.combatVictoryPrompt(getAllPlayers(req), getAllEnemies(req), req.session.history), 600, 0.95);
    let data = JSON.parse(response);

    var outro;

    if (data.Result !== undefined) outro = data.Result.CombatOutro;
    else outro = data.CombatOutro;

    req.session.combatInit = false;
    res.render("combatVictory", {
        summary: outro,
        players: getAllPlayers(req),
        isPlayer: true,
        destination: req.session.combatSequence
    })
});

//Sends the user to the defeat page, and generates a combat outro.
router.post("/defeat", async (req, res) => {
    let response = await openAI.generateResponse(prompts.storySystemPrompt(), prompts.combatDefeatPrompt(getAllPlayers(req), getAllEnemies(req), req.session.history), 600, 0.95);
    let data = JSON.parse(response);

    var outro;

    if (data.Result !== undefined) outro = data.Result.CombatOutro;
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

    //Checks if the action has a dice roll assigned to it.
    //If not, ask chatGPT for one, and save it to the action.
    if (actor.actions[req.session.combatAction].DamageDice === undefined) {

        response = await openAI.generateRollRequest(prompts.generateBasicActionPrompt(actor.name, actor.actions[req.session.combatAction], req.params.target));

        if (!verifyResponse(req, res, response, "/combat/selectAction/" + req.session.combatActor + "=" + req.session.combatAction));

        response = formatResponse(response);

        let data = JSON.parse(response);
        roll = (data.DamageDice).split('d');
        actor.actions[req.session.combatAction].DamageDice = roll;
    }

    else {
        roll = actor.actions[req.session.combatAction].DamageDice;
    }

    res.render('diceRoll', {
        Dice: roll[1],
        Amount: roll[0],
        history: req.session.history,
        players: getAllPlayers(req),
        isPlayer: true,
        roll: req.session.combatRoll
    });
});

//Updates the session history, and processes the damage of the previous event.
function updateHistory(req, data) {
    req.session.history.push(data.Result.ActionDescription);
    req.session.history.push(parseDamage(req, data));
    req.session.lastURL = req.url;
}

//Gets the values rolled by the player, and generates a response.
router.post('/generatePlayerAction/:roll', async (req, res) => {
    let result = req.params.roll;
    result = result.toString().split('_');

    req.session.combatRoll = result;

    let current = initiative.currentTurn(req.session.turnOrder);

    try {
        //Query the chatGPT API using the prompts generated from the player's selected action, target, and dice rolls.
        //const text = await openAI.generateText(prompts.generatePlayerTurnPrompt(prompts.generateActionPrompt(actor, current.actions[req.session.combatAction], initiative.getActorData(req.session.combatTarget), result[0], result[1])), model, 200);

        let systemPrompt = prompts.playerSystemPrompt();
        let playerPrompt = prompts.playerTurnPrompt(current, prompts.assignAction(current.actions[req.session.combatAction], result[0], result[1]), initiative.getActorDataID(req.session.turnOrder, req.session.combatTarget), 300, 0.75);

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

        let text = await openAI.generateResponse(systemPrompt, enemyPrompt, 300, 0.75);
        if (!verifyResponse(req, res, text, '/combat')) {
            return;
        };
        text = formatResponse(text);

        //Parse the JSON received from chatGPT, into a readable format.
        updateHistory(req, JSON.parse(text));

        //End the current turn, and run the callback function of the next actor's turn, if one exists.
        //This repeats for every consecutive enemy action.
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

//A formatting function for parsing JSON.
//chatGPT likes to add comments which cannot be parsed, this function removes them.
function formatResponse(text) {
    var data = text;

    while (data.substring(data.length - 1) != "}" && data.length > 1) {
        data = data.substring(0, data.length - 1);
    }

    return data;
}

module.exports = router;
