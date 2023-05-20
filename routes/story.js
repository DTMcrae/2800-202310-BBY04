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
const typesN = ['', '', '', '', 'about a lost villager', 'about fighting bandit raiders', 'about fighting a gang of thugs', 'about a bounty hunt', 'about fighting goblins', 'about a magic portal', 'about defending a village', 'about stealing back an artifact', 'about a haunted mansion', 'about a separated couple', 'about a missing royal', 'about a rescue', 'about a heist', 'about a rivalry', 'about a journey', 'about an intruder', 'about a rebellion', 'about an artifact', 'about a prophecy', 'about a tournament', 'about an escape', 'about a hunt', 'about a treasure hunt', 'about strange magic', 'about a tower defense', 'about a lost cat',];
const typesB = ['', 'about time travel back to BCIT opening in 1969', 'about squeaky classroom chairs', 'about a campus coffee shortage', 'about an extremely long line at Tim Horton\'s', 'about loud noises at the BCIT library', 'about an overcrowded BCIT gym', 'about find a parking spot', 'about a lost student', 'about fighting a rival school', 'about fighting school bullies', 'about missing textbooks', 'about a cursed exam', 'about a magic portal', 'about defending the campus', 'about stealing back stolen documents', 'about a haunted building', 'about separated friends', 'about a team of students working on an AI project', 'about an Easter Egg mission', 'about AI', 'about a student imposter', 'about a rescue', 'about restoring power to campus', 'about cursed code', 'about rogue AI', 'about escaping a virtual reality program', 'about a cybersecurity breach', 'about a vanishing classroom', 'about a lost cat'];
const bcitN = '';
const bcitB = 'at BCIT';

// Arrays for event generation to randomize either the event or the emotion in the scene
const random_class = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard', 'BCIT student'];
const emotion_NPC = ['desperate', 'hopeless', 'fearful', 'anxious', 'weary', 'skeptical', 'grateful', 'resigned', 'suspicious', 'regretful', 'grieiving', 'nervous', 'awestruck', 'excited', 'curious', 'hopeful', 'relieved', 'happy'];
const verb_location = ['living in', 'arriving at', 'visiting', 'exploring', 'investigating', 'found themselves in', 'randomly found', 'lived all their life in'];

// Test values for story generation
const NPC = 'Alistair';

const characters = [
  { name: 'River', class: 'Druid' },
  { name: 'Thorin', class: 'Fighter' }
];

const enemies = ['bandit', 'goblin'];
const boss = 'Beholder';


// The general story prompt asks for an adventure summary and event types
const generateStoryPrompt = (randomType, bcit) => {

    return `Imagine you are creating a detailed DnD adventure ${randomType} ${bcit}. Please provide the following details:

    - "title": The title of the adventure.
    - "summary": An overall summary of the adventure that describes the central conflict or goal. Please write the summary in three sentences. Leave the outcome a mystery to maintain the suspense.
    - "goal": Describe the central goal of the adventure in one sentence. Use the format "<action> the <noun>"
    - "s_start": The name of the location where the story starts. Only provide the name.
    - "s_soss": The location where the central conflict or goal can be resolved. Only provide the name.
    - "npc_role": The role of the NPC who tells you about the adventure. Only provide their title.
     
    
    Please structure your response in the following format:
    
    {
      "title": "<title>",
      "summary": "<summary>",
      "goal": "<goal>",
      "s_start": "<setting>"
      "s_boss": "<setting>"
      "npc_role": "<role>"
    
    }`;
};

const generateIntro = (selectedClass, verb, s_start, NPC, npc_role) => {    
    return `Start a DnD adventure about a player character of the "${selectedClass}" class who is "${verb}" "${s_start}" in four sentences. Refer to the character as "you" after introducing them. Describe the character and the setting. End the scene by having ${NPC} the ${npc_role} call out to the main character. Don't introduce any conflict. `;
};

const generateNPC = (NPC, emotion, characters, goal) => {
    return `A "${emotion}" "${NPC}" tells ${characters[0].name} that they must ${goal}. Remember that they are already talking. Describe the scene in two sentences.`;
};

const generateDialogue = (qtopic, NPC, characters) => {
    return `${characters[0].name} asks ${NPC} ${qtopic}. Write one sentence per dialogue line.

    - "Q1": ${characters[0].name}'s first question to ${NPC}
    - "A1": ${NPC}'s response
    - "Q2": A follow-up question
    - "A2": Answer to the follow-up
         
    Please structure your response in the following format:
    
    {
      "Q1": "${characters[0].name}: <question>",
      "A1": "${NPC}: <answer>",
      "Q2": "${characters[0].name}: <question>",
      "A2": "${NPC}: <answer>"
    
    }`;
};

const generateNPCSC = (characters, selectedClass, NPC, enemies) => {
    return `As they finish talking, ${characters[0].name} and ${NPC} are ambushed by a ${enemies[0]} and a ${enemies[1]}. ${characters[0].name} employs various skills in response to the surprise attack.

    1. In two sentences, depict the unfolding attack. Do not refer to the enemies with "the". Remember that the action is just starting.
    2. Choose two different skill checks. For each, provide a brief action phrase starting with "Try to" indicating how the skill check is used. Remember that the player is ${characters[0].name} and is a ${selectedClass}.

    Format your response as follows:
    
    {
      "npc_atk": "Description of the attack",
      "SC1": "First Skill",
      "SCA1": "How the first skill check is used",
      "SC2": "Second Skill",
      "SCA2": "How the second skill check is used",

    }`

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

// Functions that pull random values in arrays to randomize story generation prompts
function getRandomElement(array) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

function getTwoRandomElements(array) {
    let firstIndex = Math.floor(Math.random() * array.length);
    let secondIndex = firstIndex;
    
    // Ensure the second index is not the same as the first
    while (secondIndex === firstIndex) {
        secondIndex = Math.floor(Math.random() * array.length);
    }

    return [array[firstIndex], array[secondIndex]];
}

function getThreeRandomElements(array) {
    let indices = new Set();

    if(array.length < 3) {
        throw new Error("Input array should have at least 3 unique elements");
    }
    
    while(indices.size < 3) {
        let randomIndex = Math.floor(Math.random() * array.length);
        indices.add(randomIndex);
    }

    return Array.from(indices).map(index => array[index]);
}


// Sets up the next event in the story sequence
function getNextEvent(req) {
    // If starting a new game, sets currentEvent to 1
    if (!req.session.currentEvent) {
        req.session.currentEvent = 1;
    }

    // Readies the number for the next event
    const event = req.session.events[req.session.currentEvent];
    req.session.currentEvent += 1;
    return event;
}

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
        const randomType = getRandomElement(types);
        console.log('Story type: ', randomType);

        // Creates the story and parses the text into a JSON object
        const responseText = await openAI.generateText(generateStoryPrompt(randomType, bcit), model, 1600);
        const responseObject = JSON.parse(responseText);

        // Store the generated story summary and events in the session

        req.session.summary = responseObject.summary;
        req.session.title = responseObject.title;
        req.session.goal = responseObject.goal;
        req.session.s_start = responseObject.s_start;
        req.session.s_boss = responseObject.s_boss;
        req.session.npc_role = responseObject.npc_role;

        req.session.currentEvent = 1;
        req.session.events = {
            "1": { "type": "story-intro" },
            "2": { "type": "story-npc" },
            "3": { "type": "story-npcSC" },
            "4": { "type": "story-npcsc" },
            "5": { "type": "SkillCheck_prompt" },
            "6": { "type": "SkillCheck_fail" },
            "7": { "type": "SkillCheck_partial" },
            "8": { "type": "SkillCheck_success" },
            "9": { "type": "SkillCheck_full" },
            "10": { "type": "Battle" },
            "11": { "type": "Story_Event" },
            "12": { "type": "Boss" },
        };
       
        if (!req.session.selectedClass) {
            const randomClass = getRandomElement(random_class);
            req.session.selectedClass = randomClass;
            console.log('Random class: ', randomClass);
        }

        console.log('Character Class:', req.session.selectedClass);
        console.log('Summary:', req.session.summary);
        console.log('Title:', req.session.title);
        console.log('Goal:', req.session.goal);
        console.log('Start location:', req.session.s_start);
        console.log('Boss location:', req.session.s_boss);
        console.log('NPC role:', req.session.npc_role);

        // Sends title and summary to the story generation screen
        res.render('story', {
            title: req.session.title,
            summary: req.session.summary,
        });

    } catch (error) {
        console.error(error);
        res.status(500).send({
            error: error.toString()
        });
    }
});

// Handles GET requests and moves player to the next event
router.get('/story-event', async (req, res) => {

    const event = getNextEvent(req);
    
    // Generates a different event page depending on the next event type
    switch (event.type) {

        case 'story-intro':

            const randomVerb = getRandomElement(verb_location);

            const introText = await openAI.generateText(generateIntro(req.session.selectedClass, randomVerb, req.session.s_start, NPC, req.session.npc_role), model, 800);

            res.render('story-intro', { text: introText  });
            break;

        case 'story-npc':

            const randomEmotion = getRandomElement(emotion_NPC);

            const npcText = await openAI.generateText(generateNPC(NPC, randomEmotion, characters, req.session.goal), model, 800);
            console.log(npcText);

            // Generates an array of questions to ask the NPC
            req.session.questions = ['mission', 'npc', 'setting'];

            res.render('story-npc', { text: npcText, emotion: randomEmotion, goal: req.session.goal, NPC: NPC, s_start: req.session.s_start, questions: req.session.questions, npc_role: req.session.npc_role});

            break;

        case 'story-npcSC':

            const npcscText = await openAI.generateText(generateNPCSC(characters, req.session.selectedClass, NPC, enemies), model, 1600);
            const npcscObject = JSON.parse(npcscText);
            
            req.session.npc_atk = npcscObject.npc_atk;
            req.session.SC1 = npcscObject.SC1;
            req.session.SCA1 = npcscObject.SCA1;
            req.session.SC2 = npcscObject.SC2;
            req.session.SCA2 = npcscObject.SCA2;

            res.render('story-npcSC', { text: req.session.npc_atk, SC1: req.session.SC1, SCA1: req.session.SCA1, SC2: req.session.SC2, SCA2: req.session.SCA2, })
            break;
        
        // ...Add more cases as needed

        default:
            // Handle an unknown event type
            console.error(`Unknown event type: ${event.type}`);
            res.status(500).send('An error occurred');
            break;
    }
});

// Creates dialogue with NPC based on the selected buttons
router.get('/story-npcCHAT', async (req, res) => {

    const questionKey = req.query.question;
    let qtopic;
    
    // Removes a question if it was already asked
    const questionIndex = req.session.questions.indexOf(questionKey);
    if (questionIndex > -1) {
      req.session.questions.splice(questionIndex, 1);
    }

    // Changes the prompts based on the button pressed
    switch (questionKey) {
        case 'mission':
            qtopic = 'why ' + NPC + ' needs a ' + req.session.selectedClass + ' to ' + req.session.goal;
            break;

        case 'npc':
            qtopic = 'more about their role as ' + req.session.npc_role;
            break;

        case 'setting':
            qtopic = 'about ' + req.session.s_start;
            break;
    }

    console.log('Question Key:', questionKey);
    console.log('Session Questions:', req.session.questions);
    console.log('Question Index:', questionIndex);
    console.log('QTopic:', qtopic);

    const dialogueText = await openAI.generateText(generateDialogue(qtopic, NPC, characters), model, 800);
    console.log('Response from OpenAI: ', dialogueText);
    const dialogueObject = JSON.parse(dialogueText);

    req.session.Q1 = dialogueObject.Q1;
    req.session.A1 = dialogueObject.A1;
    req.session.Q2 = dialogueObject.Q2;
    req.session.A2 = dialogueObject.A2;

    res.render('story-npcCHAT', {Q1: req.session.Q1, A1: req.session.A1, Q2: req.session.Q2, A2: req.session.A2, goal: req.session.goal, NPC: NPC, s_start: req.session.s_start, questions: req.session.questions});
    
});


// ***For testing only, allows console logs for scene in development ***//
router.post('/skip', async (req, res) => {

    // *** ChatGPT line to test here **//
    const npcscText = await openAI.generateText(generateNPCSC(characters, NPC, enemies), model, 1600);
    console.log(npcscText);
    // *** End test area **//

    res.render('story', {

    });
    
});

module.exports = router;