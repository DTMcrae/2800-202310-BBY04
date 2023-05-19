const express = require('express');
const router = express.Router();
const OpenAI = require('../scripts/openai/openAI.js');

const openAI = new OpenAI(process.env.OPENAI_KEY);
const model = 'gpt-3.5-turbo';

const typesN = ['', '', '', '', '', '', '', '', 'about a lost villager', 'about fighting bandit raiders', 'about fighting a gang of thugs', 'about a bounty hunt', 'about fighting goblins', 'about a magic portal', 'about defending a village', 'about stealing back an artifact', 'about a haunted mansion', 'about a separated couple', 'about a missing royal', 'about a rescue', 'about a heist', 'about a rivalry', 'about a journey', 'about an intruder', 'about a rebellion', 'about an artifact', 'about a prophecy', 'about a tournament', 'about an escape', 'about a hunt', 'about a treasure hunt', 'about strange magic', 'about a tower defense', 'about a lost cat', 'about BCIT'];
const typesB = ['', 'about time travel back to BCIT opening in 1969', 'about squeaky classroom chairs', 'about a campus coffee shortage', 'about an extremely long line at Tim Horton\'s', 'about loud noises at the BCIT library', 'about an overcrowded BCIT gym', 'about find a parking spot', 'about a lost student', 'about fighting a rival school', 'about fighting school bullies', 'about missing textbooks', 'about a cursed exam', 'about a magic portal', 'about defending the campus', 'about stealing back stolen documents', 'about a haunted building', 'about separated friends', 'about a team of students working on an AI project', 'about an Easter Egg mission', 'about AI', 'about a student imposter', 'about a rescue', 'about restoring power to campus', 'about cursed code', 'about rogue AI', 'about escaping a virtual reality program', 'about a cybersecurity breach', 'about a vanishing classroom', 'about a lost cat'];
const bcitN = '';
const bcitB = 'at BCIT';

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

const generateIntro = (summary, s_start) => {

    return `Write me an introductory paragraph to our story in three sentences. The summary of the story is that ${summary}. Start the story in ${s_start} and do not talk about the conflict.`;
};

// This line serves static files from the 'images' directory
router.use(express.static('images'));

router.post('/generateStory', async (req, res) => {
    try {

        if ('BCIT' == 'BCIT') {
            types = typesB;
            bcit = bcitB;
        } else {
            types = typesN;
            bcit = bcitN;
        }

        const randomIndex = Math.floor(Math.random() * types.length);
        const randomType = types[randomIndex];
        console.log('Story type: ', randomType);

        const responseText = await openAI.generateText(generateStoryPrompt(randomType, bcit), model, 1600);

        // Parse the text into a JSON object
        const responseObject = JSON.parse(responseText);

        // Store the generated story summary and events in the session
        req.session.summary = responseObject.summary;
        req.session.title = responseObject.title;
        req.session.goal = responseObject.goal;
        req.session.s_start = responseObject.s_start;
        req.session.s_boss = responseObject.s_boss;

        req.session.events = {
            "1": {
                "type": "Story_Event",
                "json": false
            },
            "2": {
                "type": "NPC_Quest",
                "json": false
            },
            "3": {
                "type": "NPC_Q1",
                "json": false
            },
            "4": {
                "type": "NPC_Q2",
                "json": false
            },
            "5": {
                "type": "SkillCheck_prompt",
                "json": true
            },
            "6": {
                "type": "SkillCheck_fail",
                "json": false
            },
            "7": {
                "type": "SkillCheck_partial",
                "json": false
            },
            "8": {
                "type": "SkillCheck_success",
                "json": false
            },
            "9": {
                "type": "SkillCheck_full",
                "json": false
            },
            "10": {
                "type": "Battle",
                "json": false
            },
            "11": {
                "type": "Story_Event",
                "json": false
            },
            "12": {
                "type": "Boss",
                "json": false
            },
        };

        // sessionCollection.insertOne(req.session.summary);
        // sessionCollection.insertOne(req.session.title);
        // sessionCollection.insertOne(req.session.goal);
        // sessionCollection.insertOne(req.session.s_start);
        // sessionCollection.insertOne(req.session.s_boss);


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
            intro: req.session.intro,
        });


    } catch (error) {
        console.error(error);
        res.status(500).send({
            error: error.toString()
        });
    }
});

router.post('/newGame', async (req, res) => {
    try {
        const introText = await openAI.generateText(generateIntro(req.session.summary, req.session.s_start), model, 800);
        console.log(introText);
        req.session.intro = introText;

        // res.render('quickstart', {
        //     intro: req.session.intro,
        // });

    } catch (error) {
        console.error(error);
        res.status(500).send({
            error: error.toString()
        });
    }
});


module.exports = router;