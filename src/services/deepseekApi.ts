export const sendToDeepSeek = async (message: string, context: any): Promise<string> => {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.REACT_APP_DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are a business AI assistant. Analyze this business context: ${JSON.stringify(context)}`
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
};

export const generateConversationTitle = async (firstMessage: string): Promise<string> => {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Generate a short, descriptive title (max 5 words) for this business conversation:'
          },
          {
            role: 'user',
            content: firstMessage
          }
        ],
        temperature: 0.3,
        max_tokens: 20
      })
    });
    
    if (!response.ok) {
      return 'Business Chat';
    }
    
    const data = await response.json();
    return data.choices[0].message.content.trim() || 'Business Chat';
  } catch (error) {
    console.error('Error generating conversation title:', error);
    return 'Business Chat';
  }
};
