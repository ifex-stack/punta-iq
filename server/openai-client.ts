import OpenAI from "openai";
import { logger } from './logger';

/**
 * Client for interacting with OpenAI's API
 */
export class OpenAIClient {
  private client: OpenAI | null;
  
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
      logger.info('OpenAIClient', 'OpenAI client initialized successfully');
    } else {
      this.client = null;
      logger.warn('OpenAIClient', 'No OPENAI_API_KEY found in environment variables');
    }
  }

  /**
   * Checks if the OpenAI API key is available
   */
  hasApiKey(): boolean {
    return !!this.client;
  }

  /**
   * Makes a completion request to the OpenAI API
   */
  async generateCompletion(prompt: string, options: any = {}): Promise<any> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Missing API key.');
    }

    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: options.systemMessage || "You are a helpful assistant." },
          { role: "user", content: prompt }
        ],
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens,
        ...(options.responseFormat && { response_format: { type: options.responseFormat }}),
      });

      return response;
    } catch (error) {
      logger.error('OpenAIClient', 'Error generating completion', error);
      throw error;
    }
  }

  /**
   * Analyzes a match to generate advanced predictions
   * 
   * @param matchData Match data with team stats
   * @param sport Sport type (football, basketball, etc.)
   * @returns Enhanced predictions with AI-powered insights
   */
  async analyzeMatch(matchData: any, sport: string): Promise<any> {
    try {
      if (!this.hasApiKey()) {
        logger.warn('OpenAIClient', 'No API key available for match analysis');
        return { aiInsights: null };
      }

      logger.info('OpenAIClient', 'Analyzing match with OpenAI', { 
        matchId: matchData.id,
        teams: `${matchData.homeTeam} vs ${matchData.awayTeam}`,
        sport
      });

      const systemMessage = `You are an expert sports betting analyst and predictor specializing in ${sport}. 
        Analyze the provided match data and provide detailed insights, predictions, and betting tips.
        Respond with JSON in this format:
        {
          "matchAnalysis": {
            "summary": "Brief summary of key insights",
            "homeTeamStrengths": [],
            "homeTeamWeaknesses": [],
            "awayTeamStrengths": [],
            "awayTeamWeaknesses": []
          },
          "prediction": {
            "predictedOutcome": "H/D/A or Home/Draw/Away",
            "confidence": 0-100,
            "reasoning": "Clear explanation for prediction",
            "riskRating": 1-5
          },
          "bettingAdvice": {
            "valueBets": [],
            "riskyBets": [],
            "recommendedMarkets": []
          },
          "additionalInsights": ""
        }`;

      const prompt = `Analyze this upcoming ${sport} match: ${JSON.stringify(matchData, null, 2)}`;

      const result = await this.generateCompletion(prompt, {
        systemMessage,
        temperature: 0.2,
        responseFormat: "json_object"
      });

      const content = result.choices[0]?.message?.content || '{}';
      const aiAnalysis = JSON.parse(content);
      
      return { 
        aiInsights: aiAnalysis,
        modelUsed: "gpt-4o"
      };
    } catch (error) {
      logger.error('OpenAIClient', 'Error analyzing match', error);
      if (error instanceof SyntaxError) {
        // JSON parsing error
        return { 
          aiInsights: {
            matchAnalysis: { summary: "Could not parse AI analysis" },
            prediction: { confidence: 0 },
            bettingAdvice: {}
          },
          error: "JSON parsing error"
        };
      }
      return { aiInsights: null, error: (error as Error).message };
    }
  }

  /**
   * Generates explanations for accumulators to help users understand the prediction
   */
  async explainAccumulator(accumulator: any): Promise<string> {
    try {
      if (!this.hasApiKey()) {
        return '';
      }

      const systemMessage = `You are an expert sports betting analyst. Explain the provided accumulator bet 
        in a concise but informative way. Focus on why these selections work well together and 
        highlight key factors that make this a good accumulator.`;

      const prompt = `Explain this sports accumulator bet in 150 words or less: ${JSON.stringify(accumulator, null, 2)}`;

      const result = await this.generateCompletion(prompt, {
        systemMessage,
        temperature: 0.3,
        maxTokens: 250
      });

      return result.choices[0]?.message?.content || '';
    } catch (error) {
      logger.error('OpenAIClient', 'Error explaining accumulator', error);
      return '';
    }
  }

  /**
   * Analyzes recent form and statistics to provide insights on team performance trends
   */
  async analyzeTeamTrends(teamData: any, recentMatches: any[]): Promise<any> {
    try {
      if (!this.hasApiKey()) {
        return null;
      }

      const systemMessage = `You are an expert sports analyst specializing in identifying team performance trends. 
        Analyze the provided team data and recent matches to provide insights on form, playing style,
        and performance trends.
        Respond with JSON in this format:
        {
          "formAnalysis": "Analysis of recent form",
          "performanceTrends": ["list of key trends"],
          "keyStrengths": ["list of key strengths"],
          "keyWeaknesses": ["list of key weaknesses"],
          "upcomingOutlook": "prediction of how team is likely to perform"
        }`;

      const prompt = `Analyze this team's performance data and recent matches:
        Team Data: ${JSON.stringify(teamData, null, 2)}
        Recent Matches: ${JSON.stringify(recentMatches, null, 2)}`;

      const result = await this.generateCompletion(prompt, {
        systemMessage,
        temperature: 0.2,
        responseFormat: "json_object"
      });

      const content = result.choices[0]?.message?.content || '{}';
      return JSON.parse(content);
    } catch (error) {
      logger.error('OpenAIClient', 'Error analyzing team trends', error);
      return null;
    }
  }
}

export const openaiClient = new OpenAIClient();