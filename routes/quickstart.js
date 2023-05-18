const express = require('express');
const router = express.Router();
const OpenAI = require('../scripts/openai/openAI.js');

const openAI = new OpenAI(process.env.OPENAI_KEY);
const model = 'gpt-3.5-turbo';

const types = ['', '', '', '', '', '', '', '', 'about a lost villager', 'about fighting bandit raiders', 'about fighting a gang of thugs', 'about a bounty hunt', 'about fighting goblins', 'about a magic portal', 'about defending a village', 'about stealing back an artifact', 'about a haunted mansion', 'about a separated couple', 'about a missing royal', 'about a rescue', 'about a heist', 'about a rivalry', 'about a journey', 'about an intruder', 'about a rebellion', 'about an artifact', 'about a prophecy', 'about a tournament', 'about an escape', 'about a hunt', 'about a treasure hunt', 'about strange magic', 'about a tower defense', 'about a lost cat', 'about BCIT'];

router.get('/', (req, res) => {
    // Initialize summary and events in the session
    req.session.summary = '';
    for (let i = 1; i <= 8; i++) {
      req.session[`event${i}`] = '';
    }
    req.session.currentEvent = 0;
    res.render('quickstart', { currentEvent: req.session.currentEvent });
});

// The general story prompt asks for an adventure summary and event types
const generateStoryPrompt = (randomType) => {

    return `Imagine you are creating a detailed DnD adventure ${randomType}. Please provide the following details:

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

// This line serves static files from the 'images' directory
router.use(express.static('images'));

router.post('/generateStory', async (req, res) => {
    try {
        const randomIndex = Math.floor(Math.random() * types.length);
        const randomType = types[randomIndex];
        console.log('Story type: ', randomType);

        const responseText = await openAI.generateText(generateStoryPrompt(randomType), model, 1200);

        // Parse the text into a JSON object
        const responseObject = JSON.parse(responseText);

        // Store the generated story summary and events in the session
        req.session.summary = responseObject.summary;
        req.session.title = responseObject.title;
        req.session.goal = responseObject.goal;
        req.session.s_start = responseObject.s_start;
        req.session.s_boss = responseObject.s_boss;

        req.session.events = {
            "1": { "type": "Story_Intro", "json": false },
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
        

        req.session.currentEvent = 1;

        console.log('Summary:', req.session.summary);
        console.log('Title:', req.session.title);
        console.log('Goal:', req.session.goal);
        console.log('Current Event:', req.session.currentEvent);
        console.log('Start location:', req.session.s_start);
        console.log('Boss location:', req.session.s_boss);
        
        res.render('quickstart', {
            title: req.session.title,
            summary: req.session.summary,
            goal: req.session.goal,
            currentEvent: req.session.currentEvent,
            events: req.session.events,
            s_start: req.session.s_start,
            s_boss: req.session.s_boss,
        });
        

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.toString() });
    }
});

router.post('/newGame', async (req, res) => {
    res.redirect('/story');
});


module.exports = router;