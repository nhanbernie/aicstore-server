import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  GeminiMessage,
  GeminiRequestBody,
  GeminiResponse,
  GeminiConfig,
} from '../interfaces/gemini.interface';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly apiKey: string | undefined;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.model = this.configService.get<string>('GEMINI_MODEL') || 'gemini-pro';
    this.baseUrl =
      this.configService.get<string>('GEMINI_BASE_URL') ||
      'https://generativelanguage.googleapis.com/v1beta';

    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY is not configured');
    }

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Send a chat message to Gemini
   */
  async chat(
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    options?: {
      temperature?: number;
      maxTokens?: number;
    },
  ): Promise<string> {
    try {
      this.validateApiKey();

      // Convert history to Gemini format
      const contents: GeminiMessage[] = [
        ...history.map((msg) => ({
          role: msg.role === 'user' ? ('user' as const) : ('model' as const),
          parts: [{ text: msg.content }],
        })),
        {
          role: 'user' as const,
          parts: [{ text: message }],
        },
      ];

      const requestBody: GeminiRequestBody = {
        contents,
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 2048,
          topK: 40,
          topP: 0.95,
        },
      };

      const response = await this.axiosInstance.post<GeminiResponse>(
        `/models/${this.model}:generateContent?key=${this.apiKey}`,
        requestBody,
      );

      const generatedText = this.extractTextFromResponse(response.data);
      
      this.logger.log(`Gemini response generated successfully`);
      
      return generatedText;
    } catch (error) {
      this.handleError(error, 'Error in chat');
    }
  }

  async generate(
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
    },
  ): Promise<string> {
    try {
      this.validateApiKey();

      const requestBody: GeminiRequestBody = {
        contents: [
          {
            role: 'user' as const,
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 2048,
          topK: 40,
          topP: 0.95,
        },
      };

      const response = await this.axiosInstance.post<GeminiResponse>(
        `/models/${this.model}:generateContent?key=${this.apiKey}`,
        requestBody,
      );

      const generatedText = this.extractTextFromResponse(response.data);
      
      this.logger.log(`Gemini content generated successfully`);
      
      return generatedText;
    } catch (error) {
      this.handleError(error, 'Error generating content');
    }
  }

  /**
   * Extract text from Gemini response
   */
  private extractTextFromResponse(response: GeminiResponse): string {
    if (!response.candidates || response.candidates.length === 0) {
      throw new HttpException(
        'No response generated from Gemini',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const candidate = response.candidates[0];
    
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new HttpException(
        'Invalid response format from Gemini',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return candidate.content.parts.map(part => part.text).join('');
  }

  /**
   * Validate API key
   */
  private validateApiKey(): void {
    if (!this.apiKey) {
      throw new HttpException(
        'Gemini API key is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: any, context: string): never {
    this.logger.error(`${context}: ${error.message}`, error.stack);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error.response?.data?.error?.message || error.message;
      
      throw new HttpException(
        {
          statusCode: status,
          message: `Gemini API Error: ${message}`,
          error: 'Gemini Service Error',
        },
        status,
      );
    }

    throw new HttpException(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'An unexpected error occurred',
        error: 'Internal Server Error',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{
    status: string;
    model: string;
    configured: boolean;
  }> {
    return {
      status: this.apiKey ? 'ready' : 'not_configured',
      model: this.model,
      configured: !!this.apiKey,
    };
  }
}
