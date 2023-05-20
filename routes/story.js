const express = require('express');
const router = express.Router();
const OpenAI = require('../scripts/openai/openAI.js');

const openAI = new OpenAI(process.env.OPENAI_KEY);
const model = 'gpt-3.5-turbo';

const {
    connectToDatabase
} = include('databaseConnection');
const mongodb_database = process.env.MONGODB_DATABASE;

// Arrays for story generation. (note: N is for "Normal" games, B is for BCIT "Easter egg games")
const typesN = ['', '', '', '', '', '', '', '', 'about a lost villager', 'about fighting bandit raiders', 'about fighting a gang of thugs', 'about a bounty hunt', 'about fighting goblins', 'about a magic portal', 'about defending a village', 'about stealing back an artifact', 'about a haunted mansion', 'about a separated couple', 'about a missing royal', 'about a rescue', 'about a heist', 'about a rivalry', 'about a journey', 'about an intruder', 'about a rebellion', 'about an artifact', 'about a prophecy', 'about a tournament', 'about an escape', 'about a hunt', 'about a treasure hunt', 'about strange magic', 'about a tower defense', 'about a lost cat', 'about BCIT'];
const typesB = ['', 'about time travel back to BCIT opening in 1969', 'about squeaky classroom chairs', 'about a campus coffee shortage', 'about an extremely long line at Tim Horton\'s', 'about loud noises at the BCIT library', 'about an overcrowded BCIT gym', 'about find a parking spot', 'about a lost student', 'about fighting a rival school', 'about fighting school bullies', 'about missing textbooks', 'about a cursed exam', 'about a magic portal', 'about defending the campus', 'about stealing back stolen documents', 'about a haunted building', 'about separated friends', 'about a team of students working on an AI project', 'about an Easter Egg mission', 'about AI', 'about a student imposter', 'about a rescue', 'about restoring power to campus', 'about cursed code', 'about rogue AI', 'about escaping a virtual reality program', 'about a cybersecurity breach', 'about a vanishing classroom', 'about a lost cat'];
const bcitN = '';
const bcitB = 'at BCIT';

// Array around the main character's relationship with the starting location
const location = [];

// Test values for story generation
const NPC = 'Alistair';

const characters = [
  { name: 'River', class: 'Druid' },
  { name: 'Thorin', class: 'Fighter' }
];

const enemies = ['bandit1', 'bandit2'];
const boss = 'Beholder';


// The general story prompt asks for an adventure summary and event types
const generateStoryPrompt = (randomType, bcit) => {

    return `Imagine you are creating a detailed DnD adventure ${randomType} ${bcit}. Please provide the following details:

- "Title": The title of the adventure.
- "Summary": An overall summary of the adventure that describes the central conflict or goal. Please write the summary in three sentences. Leave the outcome a mystery to maintain the suspense.
- "Goal": Describe the central goal of the adventure in one sentence. Use the format "<action> the <noun>"
- "S_Start": The name of the location where the story starts. Only provide the name.
- "S_Boss": The location where the central conflict or goal can be resolved. Only provide the name.
 

Please structure your response in the following format:

{
  "title": "<title>",
  "summary": "<summary>",
  "goal": "<goal>",
  "s_start": "<setting>"
  "s_boss": "<setting>"

}`;
};

const generateIntro = () => {
    
    return `Yay! The code worked.`

};

const generateEventPrompt = (eventNumber, events, NPC, goal, s_start, s_boss, characters, enemies, boss) => {
    const eventType = events[eventNumber].type;
    let prompt = "";

    switch(eventType) {
        
        // Narratives that set up a scene
        case "Story_Intro":
            prompt = `Describe the initial setting of "${s_start} in three sentences. This is the start of a new story for ${characters[0].name} and ${characters[1].name}. End the scene by having a worried "${NPC}" call over ${characters[0].name} and ${characters[1].name}.`;
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
            prompt = `Write a four line poem about the ${goal}.`;
            break;
    }

    return prompt;
};

// This line serves static files from the 'images' directory
router.use(express.static('images'));

// Generates main story details
// JSON output: story summary, title, event sequence, character's main objective, starting and final locations
router.post('/generateStory', async (req, res) => {
    try {

        // If user picks "Easter Egg" class, switch that turns all stories into BCIT-related stories
        if (req.session.selectedClass == 'BCIT Nerd') {
            types = typesB;
            bcit = bcitB;
        } else {
            types = typesN;
            bcit = bcitN;
        }

        // Adds a random story type to the generated story
        const randomIndex = Math.floor(Math.random() * types.length);
        const randomType = types[randomIndex];
        console.log('Story type: ', randomType);

        // Creates the story
        const responseText = await openAI.generateText(generateStoryPrompt(randomType, bcit), model, 1600);

        // Parse the text into a JSON object
        const responseObject = JSON.parse(responseText);

        // Store the generated story summary and events in the session

        req.session.summary = responseObject.summary;
        req.session.title = responseObject.title;
        req.session.goal = responseObject.goal;
        req.session.s_start = responseObject.s_start;
        req.session.s_boss = responseObject.s_boss;

        if (!req.session.selectedClass) {
            req.session.selectedClass = 'Druid';
        }

        req.session.events = {
            "1": { "type": "story_intro", "json": false },
            "2": { "type": "NPC_Quest", "json": false },
            "3": { "type": "NPC_Q1", "json": false },
            "4": { "type": "NPC_Q2", "json": false },
            "5": { "type": "SkillCheck_prompt", "json": true },
            "6": { "type": "SkillCheck_fail", "json": false },
            "7": { "type": "SkillCheck_partial", "json": false },
            "8": { "type": "SkillCheck_success", "json": false },
            "9": { "type": "SkillCheck_full", "json": false },
            "10": { "type": "Battle", "json": false },
            "11": { "type": "Story_Event", "json": false },
            "12": { "type": "Boss", "json": false },
        };

        console.log('Character Class:', req.session.selectedClass);
        console.log('Summary:', req.session.summary);
        console.log('Title:', req.session.title);
        console.log('Goal:', req.session.goal);
        console.log('Start location:', req.session.s_start);
        console.log('Boss location:', req.session.s_boss);

        // Sends title and summary to the story generation screen
        res.render('story', {
            selectedClass: req.session.selectedClass,
            title: req.session.title,
            summary: req.session.summary,
            currentEvent: req.session.currentEvent,
            goal: req.session.goal,
            s_start: req.session.s_start,
            s_boss: req.session.s_boss,
            events: req.session.events
        });

    } catch (error) {
        console.error(error);
        res.status(500).send({
            error: error.toString()
        });
    }
});

// Starts a new game
router.get('/story-intro', (req,res) => {
    console.log('New game started!');

    res.render('story-intro', {
        selectedClass: req.session.selectedClass,
        title: req.session.title,
        summary: req.session.summary,
        currentEvent: req.session.currentEvent,
        goal: req.session.goal,
        s_start: req.session.s_start,
        s_boss: req.session.s_boss,
        events: req.session.events })
});

// For generating events
router.post('/generateEvent/:eventNumber', async (req, res) => {
    try {

        if (req.session.currentEvent == 0) {
            req.session.currentEvent++;
        }

        // Sets the current event number
        const eventNumber = parseInt(req.params.eventNumber);
        const event = req.session.events[eventNumber];
        console.log('Event Number: ', eventNumber);
        
        // Generates the event text from existing data
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
        
        if(event.json) {
            const responseObject = JSON.parse(text);
            req.session[`event${eventNumber}`] = responseObject;
        } else {
            req.session[`event${eventNumber}`] = text;
        }
        console.log('Event text: ', text);
        
        req.session.currentEvent = eventNumber + 1;

        // Create a new object to store all events up to the current one
        let eventsUpToCurrent = {};
        for(let i = 1; i <= req.session.currentEvent; i++) {
            eventsUpToCurrent[i] = req.session.events[i];
        }

        res.render('story', {
            title: req.session.title,
            summary: req.session.summary,
            currentEvent: req.session.currentEvent,
            events: eventsUpToCurrent,
            eventText: text
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.toString() });
    }
});


module.exports = router;