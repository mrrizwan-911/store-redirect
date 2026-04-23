import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export type AIProvider = 'openai' | 'anthropic';

class AIServiceConfig {
  private static instance: AIServiceConfig;
  private openaiClient: OpenAI | null = null;
  private anthropicClient: Anthropic | null = null;

  private constructor() {}

  public static getInstance(): AIServiceConfig {
    if (!AIServiceConfig.instance) {
      AIServiceConfig.instance = new AIServiceConfig();
    }
    return AIServiceConfig.instance;
  }

  public get provider(): AIProvider {
    const provider = process.env.AI_PROVIDER as AIProvider;
    return provider === 'openai' ? 'openai' : 'anthropic';
  }

  public getOpenAI(): OpenAI {
    if (!this.openaiClient) {
      this.openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.openaiClient;
  }

  public getAnthropic(): Anthropic {
    if (!this.anthropicClient) {
      this.anthropicClient = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
    return this.anthropicClient;
  }
}

export const aiConfig = AIServiceConfig.getInstance();
