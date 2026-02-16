import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
    if (!process.env.ANTHROPIC_API_KEY) {
        console.error('ANTHROPIC_API_KEY is not set');
        return res.status(500).json({ error: 'API key not configured' });
    }

    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
    });

    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { events, requestStructuredData } = req.body;

        if (!events || !Array.isArray(events)) {
            return res.status(400).json({ error: 'Invalid events data' });
        }

        const eventsText = events.map((event, index) => `\nEvent ${index + 1}:\n- Period: ${event.period}\n- Title: ${event.title}\n- Chance Event: ${event.situation}\n- My Action: ${event.action}\n`).join('\n');

        let systemPrompt = `You are an expert in John Krumboltz's Planned Happenstance Theory. Analyze the user's career events and explain how the following 5 skills were manifested:\n1. Curiosity\n2. Persistence\n3. Flexibility\n4. Optimism\n5. Risk-taking`;

        let userPrompt = `Please analyze the following 4 events:\n\n${eventsText}\n\n`;

        userPrompt += `Analyze which skills were manifested in each event.\n\nAnalysis format:\n## Event 1: [Title]\n### Key Analysis\n**Curiosity** ★★★★★\n- Specific evidence 1\n- Specific evidence 2\n\n**Risk-taking** ★★★\n- Specific evidence\n\n---\n\nImportant: Analyze in a way that helps the user realize "I unknowingly used these skills to turn chance into opportunity."`;

        const message = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 4000,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: userPrompt
                }
            ]
        });

        res.status(200).json(message);
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Analysis failed', details: error.message });
    }
}
