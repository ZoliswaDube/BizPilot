import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true // Required for client-side usage
});

export const sendToGroq = async (message: string, context: any, conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = []): Promise<string> => {
  if (!groq.apiKey) {
    throw new Error('Groq API key not found. Please set VITE_GROQ_API_KEY in your environment variables.');
  }

  const systemPrompt = `You are a helpful business AI assistant for BizPilot. Be conversational and friendly. Only provide detailed business analysis when specifically asked. For greetings and casual messages, respond naturally and offer to help.

Business context: ${JSON.stringify(context)}

Remember previous conversation context and refer to it when relevant. Provide personalized responses based on the user's business data and previous interactions.`;

  try {
    // Build messages array with conversation history
    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt
      },
      // Include recent conversation history (last 10 messages to manage token usage)
      ...conversationHistory.slice(-10),
      {
        role: 'user' as const,
        content: message
      }
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile', // Fast and capable model
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      stream: false
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error('No response content from Groq API');
    }

    return responseContent;
  } catch (error: any) {
    console.error('Groq API error:', error);
    throw new Error(`Groq API error: ${error.message || 'Unknown error'}`);
  }
};

export const generateConversationTitle = async (firstMessage: string): Promise<string> => {
  if (!groq.apiKey) {
    return 'New Conversation';
  }

  const prompt = `Generate a short, descriptive title (max 4 words) for a conversation that starts with: "${firstMessage}". Only return the title, nothing else.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 20,
      top_p: 1,
      stream: false
    });

    const title = chatCompletion.choices[0]?.message?.content?.trim();
    
    if (title) {
      return title;
    }
    
    return 'New Conversation';
  } catch (error) {
    console.error('Error generating conversation title:', error);
    return 'New Conversation';
  }
};
