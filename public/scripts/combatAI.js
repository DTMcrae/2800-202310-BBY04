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
        this.breakout = 0;
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
            // Return the text of the response
            var parseAttempt = JSON.parse(response.data.choices[0].message.content);
            return response.data.choices[0].message.content;
        } catch (error) {
            const response = await this.#retryResponse(systemPrompt, userPrompt, tokens, temp);
            return response;
        }
    }

    //A private function that repeats the prompt request from chatGPT in case an error occurs.
    async #retryResponse(systemPrompt, userPrompt, tokens, temp) {
        this.breakout++;

        if(this.breakout >= 3) {
            return null;
        }

        const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay));
        await waitFor(500);
        
        try {
            // Send a request to the OpenAI API to generate text
            const response = await this.openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "system",
                    content: systemPrompt
                }, {
                    role: "user",
                    content: userPrompt
                }],
                max_tokens: tokens,
                temperature: temp,
            });
            // Return the text of the response
            var parseAttempt = JSON.parse(response.data.choices[0].message.content);
            return response.data.choices[0].message.content;
        } catch (error) {
            const response = await this.#retryResponse(systemPrompt, userPrompt, tokens, temp);
            return response;
        }
    }

    //Custom request for getting what dice need to be rolled from chatGPT.
    async generateRollRequest(action) {
        this.breakout = 0;
        try {
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
            // Return the text of the response
            var parseAttempt = JSON.parse(response.data.choices[0].message.content);
            return response.data.choices[0].message.content;
        } catch (error) {
            const response = await this.#retryRollRequest(action);
            return response;
        }
    }

    //A private function that repeats the prompt request from chatGPT in case an error occurs.
    async #retryRollRequest(action) {
        this.breakout++;

        if (this.breakout >= 3) {
            return null;
        }

        const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay));
        await waitFor(500);

        try {
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
            // Return the text of the response
            var parseAttempt = JSON.parse(response.data.choices[0].message.content);
            return response.data.choices[0].message.content;
        } catch (error) {
            const response = await this.#retryRollRequest(action);
            return response;
        }
    }
}

module.exports = CombatAI;