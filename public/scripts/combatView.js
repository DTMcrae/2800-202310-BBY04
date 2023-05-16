const express = require('express');
const router = express.Router();
const OpenAI = require('../scripts/openai/combatAI.js');
const TurnOrder = require('../scripts/turnOrder.js');

const openAI = new OpenAI(process.env.OPENAI_KEY);
const model = 'gpt-3.5-turbo';

const players = [{ name: "Draeven", class: "Ranger", ac: "12" }];
const playerAction = 'Attacks with my greatbow. (10+4 to hit, 4+4 damage).'
const enemies = [{ name: "Goblin 1", desc: "A goblin wielding a dagger." }];

var initiative = new TurnOrder();//([{ name: "Draeven", id: "0", roll: 13 }, { name: "Goblin 1", id: "1", roll: 7 }]);

router.get('/', (req, res) => {
    // Initialize summary and events in the session
    console.log("DO THE THING!!!1");
    req.session.history = [];
    initiative.assignNew(([{ name: "Draeven", id: "0", roll: 13 }, { name: "Goblin 1", id: "1", roll: 7 }]));
    res.render('combatTesting', { history: req.session.history });
});

// The general story prompt only asks for an adventure summary
const generateEnemyTurnPrompt = (enemies, players) => {
    let prompt = `You are the dungeon master for a D&D 5E combat encounter. I'm the ${players[0].name}, a ${players[0].class} with an AC of ${players[0].ac}`;

    if (players.length > 1) {
        prompt += `, and my party consists of `;
        for (var x = 1; x < players.length; x++) {
            prompt += `${players[x].name}, a ${players[x].class} with an AC of ${players[x].ac}`;
            if (x + 1 < players.length) {
                prompt += ', ';
            }
            if (x + 2 == players.length) {
                prompt += `and `;
            }
        }
    }

    prompt += `. Here are the upcoming turns you must control, and you can ONLY control these. It is currently ${enemies[0].desc}'s turn`;
    if (enemies.length > 1) {
        prompt += `followed by `;
        for (var x = 1; x < enemies.length; x++) {
            prompt += `${enemies[x].desc}'s turn`;
            if (x + 1 < enemies.length) {
                prompt += ', then ';
            }
        }
    }

    prompt += `Do not include the following characters in your response; /();`;

    prompt += `. Please format your response as a JSON object like this:

    {
        "Action": "A brief description of the action that was taken. Do not describe include any rolls, or damage numbers.",
        "Damage": "If the target of an attack would take damage, formated like this: 'TargetName_DamageAmount_Type'"
    }`;

    return prompt;
};


const generatePlayerTurnPrompt = (actorName, action, target) => {
    console.log(`${actorName} does ${action} to ${target.name}.`);
    let prompt = `You are the dungeon master for a D&D 5E combat encounter, describing the following:
    ${actorName} does ${action} to ${target.name}.

    Please format your response as a JSON object like this:

    {
        "Action": "A brief description of the following: ${actorName} does ${action} to ${target.name}. Include whether or not the attack hits, but do not describe include any rolls, or damage numbers.",
        "Damage": "TargetName_DamageAmount_Type"
    }`;


    return prompt;
};

function parseDamage(data) {
    let parsed = data.Damage.split("_");
    console.log(parsed[0] + " takes " + parsed[1] + " " + parsed[2] + " damage.");
}

function testCallback() {
    console.log("It worked!");
}

router.post('/generateAction/:actor', async (req, res) => {
    const actor = req.params.actor;
    let friendly = false;

    for (var i = 0; i < players.length; i++) {
        if (players[i].name == actor) friendly = true;
    }
    console.log("Actor: ", actor);
    console.log("Friendly: ", friendly);

    if (friendly && !initiative.canActName("Draeven")) {
        res.render('combatTesting', {
            actions: [{ Action: "It is not Draeven's turn yet" }],
            history: req.session.history
        });
        return;
    }
    else if (!friendly && !initiative.canActName("Goblin 1")) {
        res.render('combatTesting', {
            actions: [{ Action: "It is not Goblin 1's turn yet" }],
            history: req.session.history
        });
        return;
    }

    initiative.endTurn();

    try {
        let actorName = req.params.actor;
        const text = (friendly) ? await openAI.generateText(generatePlayerTurnPrompt(actorName, playerAction, enemies[0]), model, 200) :
            await openAI.generateText(generateEnemyTurnPrompt(enemies, players), model, 400);

        let toParse = text.split('}');

        // Log the entire response to see what's in it
        let data = [];
        console.log(toParse[0]);
        data.push(JSON.parse(toParse[0] + '}'));
        for (var x = 1; x < toParse.length - 1; x++) {
            data.push(JSON.parse(toParse[x].substring(1) + '}'));
        }

        // Store the generated story summary and events in the session
        req.session.action = data;
        var history = req.session.history;
        for (var i = 0; i < data.length; i++) {
            req.session.history.push(data[i].Action);
            parseDamage(data[i]);
        }

        console.log("History: " + history);

        res.render('combatTesting', {
            actions: data,
            history: history
        });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.toString() });
    }
});

module.exports = router;