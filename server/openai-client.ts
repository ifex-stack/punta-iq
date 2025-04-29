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
  
  /**
   * Generate contextual performance hints for a player based on statistics
   * and upcoming match context
   * 
   * @param playerData Player's profile and season statistics
   * @param recentMatches Recent match data for the player
   * @param upcomingMatch Optional data about upcoming match/opponent
   * @returns AI-generated contextual performance hints
   */
  async generatePlayerPerformanceHints(
    playerData: any, 
    recentMatches: any[] = [], 
    upcomingMatch: any = null
  ): Promise<any> {
    try {
      if (!this.hasApiKey()) {
        logger.warn('OpenAIClient', 'No API key available for player hints generation');
        return null;
      }

      const playerPosition = playerData.position || 'Unknown';
      
      logger.info('OpenAIClient', 'Generating player performance hints', {
        playerId: playerData.id,
        playerName: playerData.name,
        position: playerPosition
      });

      const systemMessage = `You are a professional football analyst and statistics expert specializing in player performance analysis. 
        You provide concise, data-driven insights about player performance based on their statistics, recent form, and contextual factors.
        Focus on actionable insights that would help someone decide whether to select this player for fantasy football or make a prediction about their performance.
        
        Respond with JSON in this format:
        {
          "formSummary": "Brief 1-2 sentence assessment of current form",
          "strengths": ["2-3 key statistical strengths"],
          "weaknesses": ["1-2 areas of concern"],
          "fantasyOutlook": "1-2 sentence fantasy football recommendation",
          "keyStats": ["2-3 most impressive stats with context"],
          "matchupInsight": "If upcoming match data provided, specific insight about this matchup",
          "confidenceRating": "A number from 1-10 representing confidence in good performance"
        }`;

      // Tailor the prompt based on player position
      let positionSpecificGuidance = "";
      switch (playerPosition.toLowerCase()) {
        case "goalkeeper":
          positionSpecificGuidance = "For goalkeepers, focus on clean sheets, saves, goals conceded, and distribution stats.";
          break;
        case "defender":
          positionSpecificGuidance = "For defenders, focus on clean sheets, tackles, interceptions, blocks, aerial duels, and attacking contributions.";
          break;
        case "midfielder":
          positionSpecificGuidance = "For midfielders, focus on passing stats, key passes, assists, chances created, defensive contributions, and goal threat.";
          break;
        case "forward":
        case "attacker":
          positionSpecificGuidance = "For forwards, focus on goals, shots, conversion rate, expected goals (xG), assists, and overall attacking threat.";
          break;
      }

      const upcomingMatchContext = upcomingMatch ? 
        `The player has an upcoming match: ${JSON.stringify(upcomingMatch, null, 2)}` : 
        "No upcoming match data provided.";

      const prompt = `Analyze this football player's performance data:
        Player Profile: ${JSON.stringify(playerData, null, 2)}
        Season Statistics: ${JSON.stringify(playerData.seasonStats || {}, null, 2)}
        Recent Matches: ${JSON.stringify(recentMatches, null, 2)}
        ${upcomingMatchContext}
        
        ${positionSpecificGuidance}
        
        Provide concise, relevant performance insights that would help fantasy managers and bettors.`;

      const result = await this.generateCompletion(prompt, {
        systemMessage,
        temperature: 0.3,
        responseFormat: "json_object"
      });

      const content = result.choices[0]?.message?.content || '{}';
      return {
        hints: JSON.parse(content),
        modelUsed: "gpt-4o"
      };
    } catch (error) {
      logger.error('OpenAIClient', 'Error generating player hints', error);
      if (error instanceof SyntaxError) {
        // JSON parsing error
        return { 
          hints: {
            formSummary: "Could not analyze player data",
            strengths: [],
            weaknesses: [],
            confidenceRating: 0
          },
          error: "JSON parsing error"
        };
      }
      return { hints: null, error: (error as Error).message };
    }
  }
}

export const openaiClient = new OpenAIClient();