const express = require('express');
const router = express.Router();
const OpenAI = require('../scripts/openai/openAI.js');

const openAI = new OpenAI(process.env.OPENAI_KEY);
const model = 'gpt-3.5-turbo';

const types = ['', 'about time travel back to BCIT opening in 1969', 'about squeaky classroom chairs', 'about a campus coffee shortage', 'about an extremely long line at Tim Horton\'s', 'about loud noises at the BCIT library', 'about an overcrowded BCIT gym', 'about find a parking spot', 'about a lost student', 'about fighting a rival school', 'about fighting school bullies', 'about missing textbooks', 'about a cursed exam', 'about a magic portal', 'about defending the campus', 'about stealing back stolen documents', 'about a haunted building', 'about separated friends', 'about a team of students working on an AI project', 'about an Easter Egg mission', 'about AI', 'about a student imposter', 'about a rescue', 'about restoring power to campus', 'about cursed code', 'about rogue AI', 'about escaping a virtual reality program', 'about a cybersecurity breach', 'about a vanishing classroom', 'about a lost cat'];

// The general story prompt asks for an adventure summary and event types
const generateStoryPrompt = (randomType) => {

    return `Imagine you are creating a detailed DnD adventure ${randomType} at BCIT. Please provide the following details:

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

        const responseText = await openAI.generateText(generateStoryPrompt(randomType), model, 1000);

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
        
        res.render('BCIT', {
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
    try {
        const introText = await openAI.generateText(generateIntro(req.session.summary, req.session.s_start), model, 800);
        console.log(introText);
        req.session.intro = introText;

    } catch (error) {
        console.error(error);
        res.status(500).send({
            error: error.toString()
        });
    }
});


module.exports = router;