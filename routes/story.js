const express = require('express');
const router = express.Router();
const OpenAI = require('../scripts/openai/openAI.js');

const openAI = new OpenAI(process.env.OPENAI_KEY);
const model = 'gpt-3.5-turbo';

/*----------------------------------------------------------------------------Database connections loading variables------------------------------------------------------------------------------------------------------------------*/
//Dasebase connection
const {
    userCollection,
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
} = require('../databaseConnection.js');
/*----------------------------------------------------------------------------end of Database connections loading variables------------------------------------------------------------------------------------------------------------------*/

// Arrays for story generation. (note: N is for "Normal" games, B is for BCIT "Easter egg games")
const typesN = ['', '', '', '', 'about a lost villager', 'about fighting bandit raiders', 'about fighting a gang of thugs', 'about a bounty hunt', 'about fighting goblins', 'about a magic portal', 'about defending a village', 'about stealing back an artifact', 'about a haunted mansion', 'about a separated couple', 'about a missing royal', 'about a rescue', 'about a heist', 'about a rivalry', 'about a journey', 'about an intruder', 'about a rebellion', 'about an artifact', 'about a prophecy', 'about a tournament', 'about an escape', 'about a hunt', 'about a treasure hunt', 'about strange magic', 'about a tower defense', 'about a lost cat', ];
const typesB = ['', 'about time travel back to BCIT opening in 1969', 'about squeaky classroom chairs', 'about a campus coffee shortage', 'about an extremely long line at Tim Horton\'s', 'about loud noises at the BCIT library', 'about an overcrowded BCIT gym', 'about find a parking spot', 'about a lost student', 'about fighting a rival school', 'about fighting school bullies', 'about missing textbooks', 'about a cursed exam', 'about a magic portal', 'about defending the campus', 'about stealing back stolen documents', 'about a haunted building', 'about separated friends', 'about a team of students working on an AI project', 'about an Easter Egg mission', 'about AI', 'about a student imposter', 'about a rescue', 'about restoring power to campus', 'about cursed code', 'about rogue AI', 'about escaping a virtual reality program', 'about a cybersecurity breach', 'about a vanishing classroom', 'about a lost cat'];
const bcitN = '';
const bcitB = 'at BCIT';

// Arrays for event generation to randomize either the event or the emotion in the scene
const random_class = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard', 'BCIT Nerd'];
const emotion_NPC = ['desperate', 'hopeless', 'fearful', 'anxious', 'weary', 'skeptical', 'grateful', 'resigned', 'suspicious', 'regretful', 'grieiving', 'nervous', 'awestruck', 'excited', 'curious', 'hopeful', 'relieved', 'happy'];
const verb_location = ['living in', 'arriving at', 'visiting', 'exploring', 'investigating', 'found themselves in', 'randomly found', 'lived all their life in'];


// const characters = userCharCollection.characters;


// The general story prompt asks for an adventure summary and event types
const generateStoryPrompt = (NPC, monster, characters, randomType, bcit) => {
    console.log(NPC);
    console.log(monster);
    console.log(characters);

    return `Imagine you are creating a detailed DnD adventure ${randomType} ${bcit}. Please provide the following details:

    - "title": The title of the adventure.
    - "summary": An overall summary of the adventure that describes the central conflict or goal. Please write the summary in three sentences. Leave the outcome a mystery to maintain the suspense.
    - "goal": Describe the central goal of the adventure in one sentence. Use the format "<action> the <noun>"
    - "s_start": The name of the location where the story starts. Only provide the name.
    - "s_travel": The name of a location they need to travel through to reach the central conflict or goal. Only provide the name.
    - "s_boss": The location where the central conflict or goal can be resolved. Only provide the name.
    - "npc_role": The role of the NPC who tells you about the adventure. Only provide their title.
    - "npc_name": Look at this list of potential characters: ${NPC}. Choose one that fits the story best and provide their name from the list.
    - "monster_1": Consider this list of monsters: ${monster}. Select a monster appropriate for the adventure and provide their name from the list. Do not invent a new monster.
    - "monster_2": Consider this list of monsters: ${monster}. Select a monster appropriate for the adventure and provide their name from the list. Do not invent a new monster.
    
    Please structure your response in the following format:
    
    {
      "title": "<title>",
      "summary": "<summary>",
      "goal": "<goal>",
      "s_start": "<setting>"
      "s_travel: "<setting>"
      "s_boss": "<setting>"
      "npc_role": "<role>"
      "npc_name" : "<name>"
      "monster_1" : "<monster name>"
      "monster_2" : "<monster name>"
    
    }`;
};

const generateIntro = (selectedClass, verb, s_start, NPC, npc_role) => {
    return `Start a DnD adventure about a player character of the "${selectedClass}" class who is "${verb}" "${s_start}" in four sentences. Refer to the character as "you" after introducing them. Describe the character and the setting. End the scene by having ${NPC} the ${npc_role} call out to the main character. Don't introduce any conflict. `;
};

const generateNPC = (NPC, emotion, characters, goal) => {
    return `A "${emotion}" "${NPC}" tells ${characters[0].name} that they must ${goal}. Describe the scene in three sentences.`;
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
    return `As they finish talking, ${characters[0].name} and ${NPC} are ambushed by two ${enemies[0]}s. ${characters[0].name} employs various skills in response to the surprise attack.

    1. In two sentences, depict the unfolding attack. Do not refer to the enemies with "the". Remember that the action is just starting.
    2. Choose two different skill checks. For each, provide a brief action phrase starting with "Try to" indicating how the skill check is used. Remember that the player is ${characters[0].name} and is a ${selectedClass}.

    Format your response as follows:
    
    {
      "npc_atk": "Description of the attack",
      "SC1": "First Skill",
      "SCA1": "How the first skill check is used in one sentence",
      "SC2": "Second Skill",
      "SCA2": "How the second skill check is used in one sentence",
    }`

};

const generateNPCSC2 = (SC, SCA, rollResult, npcPrompt, scPrompt, characters, selectedClass, NPC, enemies) => {
    return `We are in the middle of a scene where ${characters[0].name} and ${NPC} are in the middle of a conversation when they are ambushed by two ${enemies[0]}s.
    
    ${characters[0].name} does an ${SC} check to ${SCA}. The skill check is a ${rollResult}.
    
    Describe the outcome of the skill check event in three sentences. Remember that ${characters[0].name} is a ${selectedClass}. 
    ${NPC} ${npcPrompt}. 
    ${characters[0].name} ${scPrompt}. 
    End the scene with ${characters[0].name} continuing the fight.`

};

const generateNPCSC3 = (npcPrompt, npcReaction, characters, NPC, enemies, goal, s_travel) => {
    return `In this scene, ${characters[0].name} has defeated two ${enemies[0]}s ${npcPrompt} ${NPC}.
    
    ${npcReaction} with ${characters[0].name}'s abilities, ${NPC} tells ${characters[0].name} that they need to team up to ${goal}. ${NPC} advises that in order to do so, they need to navigate through ${s_travel}.
    
    Describe the scene in five sentences.`

};

const generateJourney = (characters, selectedClass, NPC, s_travel, enemies) => {
    return `In this adventure, ${characters[0].name} and ${NPC} are navigating through ${s_travel}.

    There are two scenes:
    1. Describe the setting and how the characters feel during their travels in four sentences.
    2. ${enemies[1]} appears and creates an obstacle that prevents ${characters[0].name} and ${NPC} from travelling further. The problem must be something that can be resolved by a skill check for a ${selectedClass} by ${characters[0].name}. Set up the problem but do not resolve it. The problem must not be about fighting an enemy. Write this scene in two sentences.

    Format your response as follows:
    
    {
      "journey_text": "Description of the first scene",
      "journey_problem": "Description of the second scene",
    }`

};

const generateJourney2 = (problem, characters, selectedClass, NPC, s_travel) => {
    return `We are in the middle of a scene where ${characters[0].name} and ${NPC} are navigating ${s_travel}. ${problem}.

    Choose two different skill checks. For each, provide a brief action phrase starting with "Try to" indicating how the skill check is used. Remember that the player is ${characters[0].name} and is a ${selectedClass}.

    Format your response as follows:
    
    {
      "SC3": "First Skill",
      "SCA3": "How the first skill check is used in one sentence",
      "SC4": "Second Skill",
      "SCA4": "How the second skill check is used in one sentence",
    }`

};

const generateJourney3 = (problem, SC, SCA, rollResult, npcPrompt, scPrompt, enemyPrompt, characters, selectedClass, NPC, enemies) => {
    return `We are in the middle of a scene: ${problem}.
    
    ${characters[0].name} does an ${SC} check to ${SCA}. The skill check is a ${rollResult}.
    
    Describe the outcome of the skill check event in four sentences. Remember that ${characters[0].name} is a ${selectedClass}. 
    ${characters[0].name} ${scPrompt}
    ${enemies[1]} ${enemyPrompt}
    ${NPC} ${npcPrompt}

    .`

};

// This line serves static files from the 'images' directory
router.use(express.static('images'));

// Functions that pull random values in arrays to randomize story generation prompts
function getRandomElement(array) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

// *** Temp Diceroll function ***//
function rollD20() {
    let roll = Math.floor(Math.random() * 20) + 1;
    let result = '';

    if (roll === 1) {
        result = 'Critical Failure';
    } else if (roll <= 5) {
        result = 'Failure';
    } else if (roll <= 10) {
        result = 'Partial Success';
    } else if (roll < 20) {
        result = 'Success';
    } else {
        result = 'Critical Success';
    }

    return {
        roll: roll,
        result: result
    };
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

        //pulling monster and npc names from session
        const monsterNames = req.session.monsterNames;
        const mString = JSON.stringify(monsterNames);
        const npcList = req.session.npcList;
        const nString = JSON.stringify(npcList);
        const characters = req.session.characters;
        // async() => await openAI.generateDM();
        // Creates the story and parses the text into a JSON object
        const responseText = await openAI.generateText(generateStoryPrompt(nString, mString, characters, randomType, bcit), model);
        const responseObject = JSON.parse(responseText);

        // Store the generated story summary and events in the session

        req.session.summary = responseObject.summary;
        req.session.title = responseObject.title;
        req.session.goal = responseObject.goal;
        req.session.s_start = responseObject.s_start;
        req.session.s_travel = responseObject.s_travel;
        req.session.s_boss = responseObject.s_boss;
        req.session.npc_role = responseObject.npc_role;
        req.session.npc_name = responseObject.npc_name;

        req.session.enemies = [responseObject.monster_1, responseObject.monster_2];

        req.session.currentEvent = 1;
        req.session.events = {
            "1": {
                "type": "story-journey"
            },
            "2": {
                "type": "story-npc"
            },
            "3": {
                "type": "story-npcSC"
            },
            "4": {
                "type": "story-journey"
            },
            "5": {
                "type": "SkillCheck_prompt"
            },
            "6": {
                "type": "SkillCheck_fail"
            },
            "7": {
                "type": "SkillCheck_partial"
            },
            "8": {
                "type": "SkillCheck_success"
            },
            "9": {
                "type": "SkillCheck_full"
            },
            "10": {
                "type": "Battle"
            },
            "11": {
                "type": "Story_Event"
            },
            "12": {
                "type": "Boss"
            },
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
        console.log('Travel location:', req.session.s_travel);
        console.log('Boss location:', req.session.s_boss);
        console.log('NPC role:', req.session.npc_role);
        console.log('NPC name:', req.session.npc_name);
        console.log('Enemies:', req.session.enemies);

        // Sends title and summary to the story generation screen
        res.render('story', {
            userID: req.session.userID,
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
    const characters = req.session.characters;

    // Generates a different event page depending on the next event type
    switch (event.type) {

        case 'story-intro':

            const randomVerb = getRandomElement(verb_location);

            const introText = await openAI.generateText(generateIntro(req.session.selectedClass, randomVerb, req.session.s_start, req.session.npcSelected, req.session.npc_role), model, 800);

            res.render('story-intro', {
                text: introText
            });
            break;

        case 'story-npc':

            const randomEmotion = getRandomElement(emotion_NPC);

            const npcText = await openAI.generateText(generateNPC(req.session.npcSelected, randomEmotion, characters, req.session.goal), model, 800);
            console.log(npcText);

            // Generates an array of questions to ask the NPC
            req.session.questions = ['mission', 'npc', 'setting'];

            res.render('story-npc', {
                text: npcText,
                emotion: randomEmotion,
                goal: req.session.goal,
                NPC: req.session.npc_name,
                s_start: req.session.s_start,
                questions: req.session.questions,
                npc_role: req.session.npc_role
            });

            break;

        case 'story-npcSC':

            const npcscText = await openAI.generateText(generateNPCSC(characters, req.session.selectedClass, req.session.npcSelected, req.session.enemies), model, 3000);
            const npcscObject = JSON.parse(npcscText);

            req.session.npc_atk = npcscObject.npc_atk;
            req.session.SC1 = npcscObject.SC1;
            req.session.SCA1 = npcscObject.SCA1;
            req.session.SC2 = npcscObject.SC2;
            req.session.SCA2 = npcscObject.SCA2;

            console.log('npc_atk:', req.session.npc_atk);
            console.log('SC1:', req.session.SC1);
            console.log('SCA1:', req.session.SCA1);
            console.log('SC2:', req.session.SC2);
            console.log('SCA2:', req.session.SCA2);

            res.render('story-npcSC', {
                text: req.session.npc_atk,
                SC1: req.session.SC1,
                SCA1: req.session.SCA1,
                SC2: req.session.SC2,
                SCA2: req.session.SCA2,
            })
            break;

        case 'story-journey':

            const journeyText = await openAI.generateText(generateJourney(characters, req.session.selectedClass, req.session.npc_name, req.session.s_travel, req.session.enemies), model, 3000);
            const journeyObject = JSON.parse(journeyText);

            req.session.journey_text = journeyObject.journey_text;
            req.session.journey_problem = journeyObject.journey_problem;

            console.log('journey_text:', req.session.journey_text);
            console.log('journey_problem:', req.session.journey_problem);

            res.render('story-journey', {
                text: req.session.journey_text,
            })
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
    const characters = req.session.characters;
    let qtopic;

    // Removes a question if it was already asked
    const questionIndex = req.session.questions.indexOf(questionKey);
    if (questionIndex > -1) {
        req.session.questions.splice(questionIndex, 1);
    }

    // Changes the prompts based on the button pressed
    switch (questionKey) {
        case 'mission':
            qtopic = 'why ' + req.session.npcSelected + ' needs a ' + req.session.selectedClass + ' to ' + req.session.goal;
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

    const dialogueText = await openAI.generateText(generateDialogue(qtopic, req.session.npcSelected, characters), model, 800);
    console.log('Response from OpenAI: ', dialogueText);
    const dialogueObject = JSON.parse(dialogueText);

    req.session.Q1 = dialogueObject.Q1;
    req.session.A1 = dialogueObject.A1;
    req.session.Q2 = dialogueObject.Q2;
    req.session.A2 = dialogueObject.A2;

    res.render('story-npcCHAT', {
        Q1: req.session.Q1,
        A1: req.session.A1,
        Q2: req.session.Q2,
        A2: req.session.A2,
        goal: req.session.goal,
        NPC: req.session.npc_name,
        s_start: req.session.s_start,
        questions: req.session.questions
    });

});

router.get('/story-npcSC2', async (req, res) => {

    let rollResult = rollD20();
    console.log('Skill Check Dice roll:' + rollResult.roll);
    console.log('Skill Check Result:' + rollResult.result);
    const characters = req.session.characters;

    let scPrompt;
    let npcPrompt;
    req.session.rollResult = rollResult.result;

    switch (req.session.rollResult) {
        case 'Critical Failure':
            npcPrompt = "is knocked unconcious.";
            scPrompt = "takes damage and has to fight both enemies alone.";
            break;
        case 'Failure':
            npcPrompt = "is injured and cannot fight.";
            scPrompt = "has to fight both enemies alone.";
            break;
        case 'Partial Success':
            npcPrompt = "readies for battle";
            scPrompt = "fights both enemies together.";
            break;
        case 'Success':
            npcPrompt = "takes out one enemy.";
            scPrompt = "fights the other enemy together.";
            break;
        case 'Critical Success':
            npcPrompt = "is impressed by your skill";
            scPrompt = "defeats one enemy and they fight the other enemy together.";
            break;
    }

    let SC;
    let SCA;

    if (req.query.skillcheck === req.session.SC1) {
        SC = req.session.SC1;
        SCA = req.session.SCA1;
    } else {
        SC = req.session.SC2;
        SCA = req.session.SCA2;
    }

    const npcsc2Text = await openAI.generateText(generateNPCSC2(SC, SCA, req.session.rollResult, npcPrompt, scPrompt, characters, req.session.selectedClass, req.session.npc_name, req.session.enemies), model, 1600);
    console.log(npcsc2Text);

    res.render('story-npcSC2', {
        text: npcsc2Text,
        rollResult: rollResult.roll
    });
});

router.get('/story-npcSC3', async (req, res) => {

    let npcPrompt;
    let npcReaction;
    const characters = req.session.characters;

    switch (req.session.rollResult) {
        case 'Critical Failure':
            npcPrompt = "and wakes up the wounded";
            npcReaction = "Despite appearing concerned and unimpressed";
            break;
        case 'Failure':
            npcPrompt = "and tends to the wounded";
            npcReaction = "Despite appearing disappointed";
            break;
        case 'Partial Success':
            npcPrompt = "with";
            npcReaction = "Appearing content";
            break;
        case 'Success':
            npcPrompt = "with";
            npcReaction = "Clearly impressed";
            break;
        case 'Critical Success':
            npcPrompt = "with";
            npcReaction = "Appearing pleasantly surprised and clearly impressed";
            break;
    }

    const npcsc3Text = await openAI.generateText(generateNPCSC3(npcPrompt, npcReaction, characters, req.session.npc_name, req.session.enemies, req.session.goal, req.session.s_travel), model, 1600);
    console.log(npcsc3Text);

    res.render('story-npcSC3', {
        text: npcsc3Text,
    });
});

router.get('/story-journey2', async (req, res) => {

    const NPC = req.session.npc_name;
    const characters = req.session.characters;

    const journey2Text = await openAI.generateText(generateJourney2(req.session.journey_problem, characters, req.session.selectedClass, NPC, req.session.s_travel, req.session.enemies), model, 3000);
    const journey2Object = JSON.parse(journey2Text);

    console.log('journey 2 text:', journey2Text);

    req.session.SC3 = journey2Object.SC3;
    req.session.SCA3 = journey2Object.SCA3;
    req.session.SC4 = journey2Object.SC4;
    req.session.SCA4 = journey2Object.SCA4;

    console.log('SC3:', req.session.SC3);
    console.log('SCA3:', req.session.SCA3);
    console.log('SC4:', req.session.SC4);
    console.log('SCA4:', req.session.SCA4);

    res.render('story-journey2', {
        text: req.session.journey_problem,
        SC3: req.session.SC3,
        SCA3: req.session.SCA3,
        SC4: req.session.SC4,
        SCA4: req.session.SCA4,
    })
});

router.get('/story-journey3', async (req, res) => {

    let rollResult = rollD20();
    console.log('Skill Check Dice roll:' + rollResult.roll);
    console.log('Skill Check Result:' + rollResult.result);
    const characters = req.session.characters;

    let scPrompt;
    let enemyPrompt;
    let npcPrompt;
    let captured;
    req.session.rollResult = rollResult.result;

    switch (req.session.rollResult) {
        case 'Critical Failure':
            scPrompt = "tries to overcome the challenge and makes the problem worse.";
            enemyPrompt = "calls for enemy allies and surrounds the characters.";
            npcPrompt = "is speechless and has a grim look on their face as they are taken prisoner.";
            captured = true;
            break;
        case 'Failure':
            scPrompt = "tries to overcome the challenge and fails.";
            enemyPrompt = "calls for enemy allies and surrounds the characters.";
            npcPrompt = "moans in frustration as they are taken prisoner.";
            captured = true;
            break;
        case 'Partial Success':
            scPrompt = "almost overcomes the challenge but fails.";
            enemyPrompt = "laughs and leaves.";
            npcPrompt = "steps in to help and together our heroes overcome the challenge.";
            captured = false;
            break;
        case 'Success':
            scPrompt = "overcomes with the challenge.";
            enemyPrompt = "acts frustrated and leaves.";
            npcPrompt = "is relieved.";
            captured = false;
            break;
        case 'Critical Success':
            scPrompt = "overcomes with the challenge with great skill.";
            enemyPrompt = "flees in terror.";
            npcPrompt = "recognizes the enemy and yells that they need to follow it.";
            captured = false;
            break;
    }

    req.session.captured = captured;

    let SC;
    let SCA;

    if (req.query.skillcheck === req.session.SC3) {
        SC = req.session.SC3;
        SCA = req.session.SCA3;
    } else {
        SC = req.session.SC4;
        SCA = req.session.SCA4;
    }

    const journey3Text = await openAI.generateText(generateJourney3(req.session.journey_problem, SC, SCA, req.session.rollResult, npcPrompt, scPrompt, enemyPrompt, characters, req.session.selectedClass, req.session.npc_name, req.session.enemies), model, 1600);
    console.log(journey3Text);

    res.render('story-journey3', {
        text: journey3Text,
        rollResult: rollResult.roll
    });
});


// ***For testing only, allows console logs for scene in development ***//
router.post('/test', async (req, res) => {

    // *** ChatGPT line to test here **//
    const NPC = req.session.npc_name;
    const characters = req.session.characters;

    const journeyText = await openAI.generateText(generateJourney(characters, req.session.selectedClass, NPC, req.session.s_travel, req.session.enemies), model, 3000);
    const journeyObject = JSON.parse(journeyText);

    req.session.journey_text = journeyObject.journey_text;
    req.session.journey_problem = journeyObject.journey_problem;

    console.log('journey_text:', req.session.journey_text);
    console.log('journey_problem:', req.session.journey_problem);
    // *** End test area **//

    res.render('story', {

    });

});

module.exports = router;