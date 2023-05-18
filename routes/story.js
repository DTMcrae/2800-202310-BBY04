const express = require('express');
const router = express.Router();
const OpenAI = require('../scripts/openai/openAI.js');

const openAI = new OpenAI(process.env.OPENAI_KEY);
const model = 'gpt-3.5-turbo';

// Test values for story generation
const NPC = 'Gaiden';

const characters = [
  { name: 'River', class: 'Druid' },
  { name: 'Thorin', class: 'Fighter' }
];

const enemies = ['bandit1', 'bandit2'];
const boss = 'Beholder';

router.get('/', (req, res) => {
    // Initialize summary and events in the session
    req.session.summary = '';
    for (let i = 1; i <= 8; i++) {
      req.session[`event${i}`] = '';
    }
    req.session.currentEvent = 0;
    res.render('story', { currentEvent: req.session.currentEvent });
});

router.get('/story', async (req, res) => {
    // Perform any necessary logic here

    // Then render your 'story' view with the session data
    res.render('story', {
        title: req.session.title,
        summary: req.session.summary,
        goal: req.session.goal,
        s_start: req.session.s_start,
        s_boss: req.session.s_boss,
        events: req.session.events,
        currentEvent: req.session.currentEvent
    });
});

const generateEventPrompt = (eventNumber, events, NPC, goal, s_start, s_boss, characters, enemies, boss) => {
    const eventType = events[eventNumber].type;
    let prompt = "";

    switch(eventType) {
        
        // Narratives that set up a scene
        case "Story_Intro":
            prompt = `Describe the initial setting of "${s_start}" in three sentences. This is the start of a new story for ${characters[0].name} and ${characters[1].name}. End the scene by having a worried "${NPC}" call over ${characters[0].name} and ${characters[1].name}.`;
            break;

        case "Story_Event":
            prompt = `Describe the setting, the situation, the characters' actions, and any complications. This is not the climax of the story.`;
            break;
        
        // NPC interaction events and outcomes
        case "NPC_Quest":
            prompt = `"${NPC}" tells ${characters[0].name} that they must ${goal}. Remember that the characters are already talking. Only ${NPC} speaks in this scene. Write the DnD scene with mostly dialogue in five sentences.`;
            break;

         case "NPC_Q1":
            prompt = `"${NPC}" provides more details about the goal to ${goal}. Write the dialogue in five sentences.`;
            break;
        
        case "NPC_Q2":
            prompt = `"${NPC}" provides more details about the ${boss}. ${NPC} is not fully confident about the details, but they describe why ${boss} started ${conflict}. Write the dialogue in three sentences.`;
            break;

        // Adventure and battle skill checks and outcomes
        case "SkillCheck_prompt":
            prompt = `${characters[0].name} and ${characters[1].name} accept the quest. As they leave "${setting2}, they are ambushed by "${enemies[0].name}" and ${characters[0].name} has to do a skill check. Describe the challenge and ask the player to roll a d20.`;
            break;
        


        // Setting up a battle
        case "Battle":
            prompt = `The party have to fight "${enemies[0].name}" and "${enemies[1].name}" at ${setting3}. Describe the opponents.`;
            break;
        
        case "Boss battle":
            prompt = `The party faces the climactic boss battle against "${boss}" at ${s_boss}. Describe the boss, the environment, the party's strategy, and the flow of the battle. Do not reveal the outcome yet.`;
            break;

        default:
            prompt = `Whoops, error found.`;
            break;
    }

    return prompt;
};


// This line serves static files from the 'images' directory
router.use(express.static('images'));


router.post('/generateEvent/:eventNumber', async (req, res) => {
    try {
        const eventNumber = parseInt(req.params.eventNumber);
        const event = req.session.events[eventNumber];
        
        const prompt = generateEventPrompt(
            eventNumber, 
            req.session.events, 
            NPC, 
            req.session.goal, 
            req.session.s_start, 
            req.session.s_boss, 
            characters, 
            enemies, 
            boss
        );        
        
        const text = await openAI.generateText(prompt, model, 800);

        console.log('Event', eventNumber,': ', text)
        
        if(event.json) {
            // Parse the text into a JSON object
            const responseObject = JSON.parse(text);
            // Store the generated event in the session
            req.session[`event${eventNumber}`] = responseObject;
        } else {
            // Store the generated event in the session
            req.session[`event${eventNumber}`] = text;
        }
        
        req.session.currentEvent = eventNumber + 1;

        // Create a new object to store all events up to the current one
        let eventsUpToCurrent = {};
        for(let i = 1; i <= req.session.currentEvent; i++) {
            eventsUpToCurrent[i] = req.session.events[i];
        }

        res.render('story', {
            summary: req.session.summary,
            currentEvent: req.session.currentEvent,
            events: eventsUpToCurrent,
            generatedEventText: text
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.toString() });
    }
});

module.exports = router;