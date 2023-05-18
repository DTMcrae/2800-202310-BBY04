const {
    Configuration,
    OpenAIApi
} = require('openai');

class OpenAI {
    constructor(apiKey) {
        // Create the Configuration and OpenAIApi instances
        this.openai = new OpenAIApi(new Configuration({
            apiKey
        }));
    }
    // Asynchronous function to generate text from the OpenAI API
    async generateText(prompt, model, tokens, temp = 0.85) {
        try {
            // Send a request to the OpenAI API to generate text
            const response = await this.openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "system",
                    content: prompt,
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
}

module.exports = OpenAI;