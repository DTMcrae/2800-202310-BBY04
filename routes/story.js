const express = require('express');
const router = express.Router();
const OpenAI = require('../scripts/openai/openAI.js');

const openAI = new OpenAI(process.env.OPENAI_KEY);
const model = 'gpt-3.5-turbo';
const topic = 'The Lost Cat';
const NPC = 'Gandolf';

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
const generateStoryPrompt = (topic, NPC) => {
    return `Imagine you are creating a detailed DnD adventure called "${topic}". First, provide an overall summary of the adventure in a separate paragraph. This should include the main characters, the setting, and the central conflict or goal. "${NPC}" gives the party their mission. After each paragraph, write "<br/>".

Then, in separate paragraphs, describe four key events that take place during the adventure. These events should follow a narrative arc: the first event should set the adventure in motion, the second event should involve some form of journey or exploration, the third event should present a significant challenge or obstacle for the party, and the fourth event should be the climax of the adventure. 

Please format your response as a JSON object, with each value written as a separate sentence, like this:

    {
        "Summary": "The overall summary of the story.",
        "Event 1": "Describe how the adventure starts.",
        "Event 2": "Describe the journey to their mission.",
        "Event 3": "Describe a challenge the party has to face before final chapter.",
        "Event 4": "Describe the story climax."
    }`;
};


const generateEventPrompt = (eventNumber, events, NPC) => {
    const event = events[eventNumber - 1]; // because array indices are 0-based
    let prompt = "";

    switch(eventNumber) {
        case 1:
            prompt = `Imagine you are writing a script for a role-playing game. The party is given a quest by "${NPC}" who asks them three questions about "${event}". Write out the conversation in separate lines, describing the NPC's reactions and any additional information they give. After each line of dialogue, write "<br/>". Remember, this is not the end of the story, so make sure to leave room for further developments.`;
            break;
        case 2:
            prompt = `In our ongoing role-playing game, the party encounters a low level monster during "${event}". Describe the encounter in detail, with each action of the party and the monster written as a separate sentence. Do not end the story.`;
            break;
        case 3:
            prompt = `The party has reached the point in their adventure where they must pass a skill check during "${event}". Describe the scenario in separate sentences, providing outcomes for failure, partial success, full success, and critical success. This is not the final chapter of the story.`;
            break;
        case 4:
            prompt = `The climax of the adventure is here. The party faces a boss battle during "${event}". Describe this climactic encounter in separate sentences, including the actions of the party and the boss, as well as the final outcome.`;
            break;
        default:
            prompt = `Imagine you are writing a script for a role-playing game. The party is in the middle of the event "${event}". Provide a detailed description of this scenario, with character dialogues, environmental descriptions, and the challenges they face written as separate sentences. Remember, this is not the end of the story, so make sure to leave room for further developments.`;
            break;
    }

    
    return prompt;
};

// This line serves static files from the 'images' directory
router.use(express.static('images'));

router.post('/generateStory', async (req, res) => {
    try {
        const text = await openAI.generateText(generateStoryPrompt(topic, NPC), model, 800);
        
        // Log the entire response to see what's in it
        console.log(text);
        const data = JSON.parse(text);

        // Store the generated story summary and events in the session
        req.session.summary = data.Summary;
        req.session.events = [data["Event 1"], data["Event 2"], data["Event 3"], data["Event 4"]];

        // Logs the summary and the value in each event
        console.log('Summary:', req.session.summary);
        for(let i = 0; i < req.session.events.length; i++) {
            console.log('Event ' + (i + 1) + ':', req.session.events[i]);
        }

        req.session.currentEvent = 1;

        res.render('story', {
            summary: req.session.summary,
            currentEvent: req.session.currentEvent,
            events: req.session.events.slice(0, req.session.currentEvent),
            generatedEventText: text
        });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.toString() });
    }
});

router.post('/generateEvent/:eventNumber', async (req, res) => {
    try {
        const eventNumber = parseInt(req.params.eventNumber);
        const prompt = generateEventPrompt(eventNumber, req.session.events, NPC);
        const text = await openAI.generateText(prompt, model, 800);
        console.log(text);

        // Store the generated event in the session
        req.session[`event${eventNumber}`] = text;
        req.session.currentEvent = eventNumber + 1;

        res.render('story', {
            summary: req.session.summary,
            currentEvent: req.session.currentEvent,
            events: req.session.events.slice(0, req.session.currentEvent),
            generatedEventText: text
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.toString() });
    }
});

module.exports = router;