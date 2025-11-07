import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { AiIntentResult, AiAction } from '../interfaces/ai-intent.interface';
import { AI_SYSTEM_PROMPT } from '../constants/ai-prompts';

@Injectable()
export class AiIntentService {
  private readonly logger = new Logger(AiIntentService.name);

  constructor(private readonly geminiService: GeminiService) {}

  async classifyIntent(userMessage: string): Promise<AiIntentResult> {
    try {
      const prompt = `${AI_SYSTEM_PROMPT}\n\nUser message: "${userMessage}"`;

      const response = await this.geminiService.generate(prompt, {
        temperature: 0.3, // Lower temperature for more consistent classification
        maxTokens: 500,
      });

      // Try to parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.warn('Failed to extract JSON from AI response');
        return this.getUnknownIntent();
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate the response
      if (!this.isValidIntentResult(parsed)) {
        this.logger.warn('Invalid intent result format');
        return this.getUnknownIntent();
      }

      this.logger.log(`Intent classified: ${parsed.action} (confidence: ${parsed.confidence})`);
      return parsed as AiIntentResult;
    } catch (error) {
      this.logger.error(`Error classifying intent: ${error.message}`);
      return this.getUnknownIntent();
    }
  }

  private isValidIntentResult(obj: any): boolean {
    return (
      obj &&
      typeof obj.action === 'string' &&
      Object.values(AiAction).includes(obj.action) &&
      typeof obj.confidence === 'number' &&
      typeof obj.needsMoreInfo === 'boolean'
    );
  }

  private getUnknownIntent(): AiIntentResult {
    return {
      action: AiAction.UNKNOWN,
      params: {},
      confidence: 0,
      needsMoreInfo: false,
    };
  }
}
