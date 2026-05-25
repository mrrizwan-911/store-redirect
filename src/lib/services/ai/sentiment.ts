import { aiConfig } from './config';
import { logger } from '@/lib/utils/logger';

export type Sentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

export async function analyzeSentiment(text: string): Promise<Sentiment> {
  const provider = aiConfig.provider;

  const prompt = `
    Analyze the sentiment of the following product review.
    Classify it as exactly one of these three: POSITIVE, NEUTRAL, or NEGATIVE.
    Return ONLY the word and nothing else.

    Review: "${text}"
  `;

  try {
    if (provider === 'anthropic') {
      const client = aiConfig.getAnthropic();
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: prompt }],
      });
      const content = response.content[0];
      if (content.type === 'text') {
        const sentiment = content.text.trim().toUpperCase();
        return validateSentiment(sentiment);
      }
    } else {
      const client = aiConfig.getOpenAI();
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 10,
      });
      const sentiment = response.choices[0].message.content?.trim().toUpperCase() || 'NEUTRAL';
      return validateSentiment(sentiment);
    }
  } catch (error) {
    logger.error('Sentiment analysis failed:', error);
    return 'NEUTRAL';
  }

  return 'NEUTRAL';
}

function validateSentiment(value: string): Sentiment {
  if (['POSITIVE', 'NEUTRAL', 'NEGATIVE'].includes(value)) {
    return value as Sentiment;
  }
  return 'NEUTRAL';
}
