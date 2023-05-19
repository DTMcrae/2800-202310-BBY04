const {
    Configuration,
    OpenAIApi
} = require('openai');

class CombatAI {
    constructor(apiKey) {
        // Create the Configuration and OpenAIApi instances
        this.openai = new OpenAIApi(new Configuration({
            apiKey
        }));
    }

    //Custom request for getting what dice need to be rolled from chatGPT.
    async generateResponse(systemPrompt, userPrompt, tokens, temp) {
        try {
            // Send a request to the OpenAI API to generate text
            const response = await this.openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "system",
                    content: systemPrompt
                },{
                    role: "user",
                    content: userPrompt
                }],
                max_tokens: tokens,
                temperature: temp,
            });
            console.log(`request cost: ${response.data.usage.total_tokens} tokens`);
            // Return the text of the response
            return response.data.choices[0].message.content;
        } catch (error) {
            throw error;
        }
    }

    //Custom request for getting what dice need to be rolled from chatGPT.
    async generateRollRequest(action) {
        try {
            console.log("Roll Request Action:",action);
            // Send a request to the OpenAI API to generate text
            const response = await this.openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "system",
                    content: "You are the dungeon master in a D&D 5E game, telling your players what dice they need to roll. Replace DamageDice and Stat with the dice needed to perform the action the player describes. DamageDice should only contain the type of dice and amount to roll in this format:`1d4`. Stat should be formatted like this:`Dexterity`. All communication should be in JSON format, no sentences. Leave any comments in a separate JSON field.",
                },
            {
                role: "user",
                content: `{
                "Action": "${action}",
                "DamageDice": "Unknown",
                "Stat": "Unknown",
                }`
            }],
                max_tokens: 200,
                temperature: 0.5,
            });
            console.log(`Dice request cost: ${response.data.usage.total_tokens} tokens`);
            console.log(`Response:`, response.data.choices[0].message.content);
            // Return the text of the response
            return response.data.choices[0].message.content;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = CombatAI;