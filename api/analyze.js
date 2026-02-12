// api/analyze.js
import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
      // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
              return res.status(200).end();
    }

    if (req.method !== 'POST') {
              return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
              const { userName, events } = req.body;

          if (!events || events.length === 0) {
                        return res.status(400).json({ error: 'No events provided' });
          }

          const client = new Anthropic({
                        apiKey: process.env.ANTHROPIC_API_KEY
          });

          const prompt = `You are an expert on John Krumboltz's Planned Happenstance theory.

          Analyze the following life events for ${userName} and identify which of the 5 Planned Happenstance skills are demonstrated in each event:
          - 🔍 Curiosity: Exploring new learning opportunities
          - 💪 Persistence: Continuing despite setbacks
          - 🔄 Flexibility: Changing circumstances and attitudes
          - ☀️ Optimism: Viewing new opportunities as achievable
          - 🎯 Risk-taking: Taking action despite uncertainty

          Events:
          ${events.map((e, i) => `${i + 1}. [${e.age}] ${e.title}: ${e.description}`).join('\\n')}

          Respond in this exact JSON format:
          {
              "events": [
                      {
                                  "age": "the age/period",
                                              "title": "the title",
                                                          "description": "brief summary",
                                                                      "skills": ["🔍 Curiosity", "🎯 Risk-taking"]
                                                                              }
                                                                                  ],
                                                                                      "pattern": "A 2-3 sentence analysis of ${userName}'s dominant happenstance pattern",
                                                                                          "message": "An encouraging message that Krumboltz might give to ${userName} based on their story"
                                                                                          }

                                                                                          Only respond with valid JSON, no additional text.`;

          const response = await client.messages.create({
                        model: 'claude-haiku-4-5-20251001',
                        max_tokens: 1024,
                        messages: [{ role: 'user', content: prompt }]
          });

          const content = response.content[0].text;

          // Parse JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (!jsonMatch) {
                            throw new Error('Invalid response format');
              }

          const analysis = JSON.parse(jsonMatch[0]);

          return res.status(200).json(analysis);

    } catch (error) {
              console.error('Analysis error:', error);
              return res.status(500).json({
                            error: 'Analysis failed',
                            message: error.message
              });
    }
}
