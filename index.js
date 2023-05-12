require("./utils.js");
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const port =  3000;
const app = express();

const expireTime = 24 * 60 * 60 * 1000;

/* secret information section */
const mongodb_host = process.env.mongodb_host;
const mongodb_user = process.env.mongodb_user;
const mongodb_password = process.env.mongodb_password;
const mongodb_database = process.env.mongodb_database;
const mongodb_session_secret = process.env.mongodb_session_secret;
const node_session_secert = process.env.node_session_secret;
/* END secret section */

var {database} = require('./databaseConnection');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(session({
    secret: node_session_secert,
    saveUninitialized: false,
    resave: true
}));

const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
    apiKey: process.env.openAI_API_KEY,
  });

  const openai = new OpenAIApi(configuration);

async function generateText() {
    try {
        // Send a request to the OpenAI API to generate text
        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: 'Give me a bullet point of 5 dnd equipment as bullet points'
            }]
        });
        console.log(`request cost: ${response.data.usage.total_tokens} tokens`);
        console.log('Response: ' + response.data.choices[0].message);
        // console.log(response['choices'][0]['message']['content']);
            // Return the text of the response
        return response.data.choices[0].message;
    } catch (error) {
        throw error;
    }
}

app.get('/', async (req, res) => {
    const equipment = await generateText();
    res.render('test', { equipment: equipment.content });
});

app.listen(port, () => {
    console.log("Node application listening on port " + port);
});