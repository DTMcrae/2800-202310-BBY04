const express = require('express');
const router = express.Router();
const OpenAI = require('../scripts/openai/openAI.js');

const openAI = new OpenAI(process.env.OPENAI_KEY);
const model = 'gpt-3.5-turbo';
const topic = 'The Lost Cat';

router.get('/', (req, res) => {
    // Initialize summary and events in the session
    req.session.summary = '';
    for (let i = 1; i <= 4; i++) {
      req.session[`event${i}`] = '';
    }
    req.session.currentEvent = 0;
    res.render('story', { currentEvent: req.session.currentEvent });
});

// The general story prompt only asks for an adventure summary
const generateStoryPrompt = (topic) => {
    return `Write a DnD adventure summary of a story called "${topic}", followed by four key events in the story. It should be in JSON format. The structure should be as follows:

    {
        "Summary": "The overall summary of the story",
        "Event 1": "Describe how the adventure starts",
        "Event 2": "Describe the journey to their mission",
        "Event 3": "Describe a challenge the party has to face before final chapter",
        "Event 4": "Describe the story climax"
    }`;
};

router.post('/generateStory', async (req, res) => {
    try {
        const text = await openAI.generateText(generateStoryPrompt(topic), model, 800);
        
        // Log the entire response to see what's in it
        console.log(text);
        const data = JSON.parse(text);

        // Store the generated story summary and events in the session
        req.session.summary = data.Summary;
        req.session.events = [data["Event 1"], data["Event 2"], data["Event 3"], data["Event 4"]];

        req.session.currentEvent = 1;

        res.render('story', {
            summary: req.session.summary,
            currentEvent: req.session.currentEvent,
            events: req.session.events.slice(0, req.session.currentEvent)
        });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.toString() });
    }
});



const generateEventPrompt = (eventNumber, session) => {
    // Use the event description from the session
    return session.events[eventNumber - 1];
};

router.post('/generateEvent/:eventNumber', async (req, res) => {
    try {
        const eventNumber = parseInt(req.params.eventNumber);
        const text = await openAI.generateText(generateEventPrompt(eventNumber, req.session), model, 1600);
        console.log("text:", text);

        // Store the generated event in the session
        req.session[`event${eventNumber}`] = text;
        req.session.currentEvent = eventNumber + 1;

        res.render('story', {
            summary: req.session.summary,
            currentEvent: req.session.currentEvent,
            events: req.session.events.slice(0, req.session.currentEvent)
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.toString() });
    }
});

module.exports = router;