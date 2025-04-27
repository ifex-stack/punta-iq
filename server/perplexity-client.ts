import { z } from 'zod';
import { logger } from './logger';

// Types for Perplexity API request/response
export const perplexityRequestSchema = z.object({
  model: z.enum([
    'llama-3.1-sonar-small-128k-online', 
    'llama-3.1-sonar-large-128k-online', 
    'llama-3.1-sonar-huge-128k-online'
  ]).default('llama-3.1-sonar-small-128k-online'),
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
    })
  ),
  temperature: z.number().min(0).max(1).default(0.2),
  top_p: z.number().min(0).max(1).default(0.9),
  max_tokens: z.number().optional(),
  stream: z.boolean().default(false),
  search_domain_filter: z.array(z.string()).optional(),
  return_images: z.boolean().default(false),
  return_related_questions: z.boolean().default(false),
  search_recency_filter: z.string().optional(),
});

export type PerplexityRequest = z.infer<typeof perplexityRequestSchema>;

export interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  citations: string[];
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta: {
      role: string;
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Client for interacting with Perplexity's AI API
 */
export class PerplexityClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || '';
    this.baseUrl = 'https://api.perplexity.ai';
    
    if (!this.apiKey) {
      logger.warn('PerplexityClient', 'No PERPLEXITY_API_KEY found in environment variables');
    }
  }

  /**
   * Checks if the Perplexity API key is available
   */
  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  /**
   * Makes a request to the Perplexity API
   */
  async query(options: Partial<PerplexityRequest>): Promise<PerplexityResponse> {
    try {
      // Validate the request
      const request = perplexityRequestSchema.parse({
        ...options,
        stream: false, // Always set stream to false for now
      });

      // Call the Perplexity API
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Perplexity API error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('PerplexityClient', 'Error querying Perplexity API', error);
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
        logger.warn('PerplexityClient', 'No API key available for match analysis');
        return { aiInsights: null };
      }

      logger.info('PerplexityClient', 'Analyzing match with Perplexity', { 
        matchId: matchData.id,
        teams: `${matchData.homeTeam.name} vs ${matchData.awayTeam.name}`,
        sport
      });

      const messages = [
        {
          role: 'system' as const,
          content: `You are an expert sports betting analyst and predictor specializing in ${sport}. 
          Analyze the provided match data and provide detailed insights, predictions, and betting tips.
          Format your response in JSON with the following structure:
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
          }`
        },
        {
          role: 'user' as const,
          content: `Analyze this upcoming ${sport} match: ${JSON.stringify(matchData, null, 2)}`
        }
      ];

      const result = await this.query({
        model: 'llama-3.1-sonar-small-128k-online',
        messages,
        temperature: 0.2,
        search_recency_filter: 'month',
        return_related_questions: false,
      });

      // Extract the JSON content from the response
      try {
        const content = result.choices[0]?.message?.content || '';
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                        content.match(/```\n([\s\S]*?)\n```/) || 
                        [null, content];
        
        const jsonContent = jsonMatch[1] || content;
        const aiAnalysis = JSON.parse(jsonContent);
        
        return { 
          aiInsights: aiAnalysis,
          citations: result.citations || []
        };
      } catch (parseError) {
        logger.error('PerplexityClient', 'Error parsing Perplexity response', parseError);
        return { 
          aiInsights: {
            matchAnalysis: { summary: "Could not parse AI analysis" },
            prediction: { confidence: 0 },
            bettingAdvice: {}
          },
          rawResponse: result.choices[0]?.message?.content
        };
      }
    } catch (error) {
      logger.error('PerplexityClient', 'Error analyzing match', error);
      return { aiInsights: null, error: error.message };
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

      const messages = [
        {
          role: 'system' as const,
          content: `You are an expert sports betting analyst. Explain the provided accumulator bet 
          in a concise but informative way. Focus on why these selections work well together and 
          highlight key factors that make this a good accumulator.`
        },
        {
          role: 'user' as const,
          content: `Explain this sports accumulator bet in 150 words or less: ${JSON.stringify(accumulator, null, 2)}`
        }
      ];

      const result = await this.query({
        model: 'llama-3.1-sonar-small-128k-online',
        messages,
        temperature: 0.3,
        max_tokens: 250,
      });

      return result.choices[0]?.message?.content || '';
    } catch (error) {
      logger.error('PerplexityClient', 'Error explaining accumulator', error);
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

      const messages = [
        {
          role: 'system' as const,
          content: `You are an expert sports analyst specializing in identifying team performance trends. 
          Analyze the provided team data and recent matches to provide insights on form, playing style,
          and performance trends.
          Format your response in JSON with the following structure:
          {
            "formAnalysis": "Analysis of recent form",
            "performanceTrends": ["list of key trends"],
            "keyStrengths": ["list of key strengths"],
            "keyWeaknesses": ["list of key weaknesses"],
            "upcomingOutlook": "prediction of how team is likely to perform"
          }`
        },
        {
          role: 'user' as const,
          content: `Analyze this team's performance data and recent matches:
          Team Data: ${JSON.stringify(teamData, null, 2)}
          Recent Matches: ${JSON.stringify(recentMatches, null, 2)}`
        }
      ];

      const result = await this.query({
        model: 'llama-3.1-sonar-small-128k-online',
        messages,
        temperature: 0.2,
      });

      try {
        const content = result.choices[0]?.message?.content || '';
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                        content.match(/```\n([\s\S]*?)\n```/) || 
                        [null, content];
        
        const jsonContent = jsonMatch[1] || content;
        return JSON.parse(jsonContent);
      } catch (parseError) {
        logger.error('PerplexityClient', 'Error parsing team trends response', parseError);
        return null;
      }
    } catch (error) {
      logger.error('PerplexityClient', 'Error analyzing team trends', error);
      return null;
    }
  }
}

export const perplexityClient = new PerplexityClient();