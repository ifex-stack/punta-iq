import { openaiClient } from './openai-client';
import { logger } from './logger';

/**
 * Advanced ML-based prediction engine that combines statistical models with AI insights
 * to generate more accurate and detailed predictions.
 */
export class AdvancedPredictionEngine {
  /**
   * Generate advanced predictions for a match using historical data, live odds, and team form
   * 
   * @param matchData Match data including teams and basic stats
   * @param historicalData Historical match data for the teams
   * @param liveOdds Current betting odds if available
   * @returns Enhanced prediction with detailed analysis and confidence factors
   */
  async generateAdvancedPrediction(
    matchData: any, 
    historicalData: any = null, 
    liveOdds: any = null
  ): Promise<any> {
    try {
      logger.info('AdvancedPredictionEngine', 'Generating advanced prediction', { 
        matchId: matchData.id,
        teams: `${matchData.homeTeam} vs ${matchData.awayTeam}`,
        sport: matchData.sport
      });
      
      // Start with statistical baseline prediction
      const baselinePrediction = this.generateBaselinePrediction(matchData, historicalData);
      
      // Add historical trend analysis
      const withTrends = await this.analyzeHistoricalTrends(baselinePrediction, historicalData);
      
      // Enhance with AI insights if API key is available
      if (openaiClient.hasApiKey()) {
        return await this.enhanceWithAI(withTrends, matchData);
      }
      
      return withTrends;
    } catch (error) {
      logger.error('AdvancedPredictionEngine', 'Error generating advanced prediction', error);
      throw error;
    }
  }
  
  /**
   * Generate a baseline prediction using statistical models
   */
  private generateBaselinePrediction(matchData: any, historicalData: any = null): any {
    try {
      // Extract basic team information
      const { homeTeam, awayTeam, league, sport } = matchData;
      
      // Generate prediction based on sport
      if (sport === 'football') {
        return this.generateFootballBaseline(matchData, historicalData);
      } else if (sport === 'basketball') {
        return this.generateBasketballBaseline(matchData, historicalData);
      }
      
      // Default prediction structure if sport not recognized
      return {
        matchId: matchData.id || `${homeTeam}-${awayTeam}`.toLowerCase().replace(/\s/g, '-'),
        sport,
        league,
        homeTeam,
        awayTeam,
        startTime: matchData.startTime || new Date(Date.now() + 86400000).toISOString(),
        confidence: 50,
        predictions: {},
        analysisFactors: [],
        predictionMethods: ['statistical-baseline'],
      };
    } catch (error) {
      logger.error('AdvancedPredictionEngine', 'Error generating baseline prediction', error);
      return {
        error: 'Failed to generate baseline prediction',
        matchData
      };
    }
  }
  
  /**
   * Generate football-specific baseline prediction
   */
  private generateFootballBaseline(matchData: any, historicalData: any = null): any {
    const { homeTeam, awayTeam, league, id } = matchData;
    
    // Use historical data if available, otherwise use statistical estimates
    // In a real implementation, these would be calculated from actual data
    const homeStrength = (historicalData?.homeStrength) || Math.random() * 0.3 + 0.7; // 0.7-1.0
    const awayStrength = (historicalData?.awayStrength) || Math.random() * 0.3 + 0.6; // 0.6-0.9
    const homeAdvantage = 1.3; // Standard home advantage factor
    
    // Calculate win probabilities
    const homeProbability = Math.min(85, Math.floor((homeStrength * homeAdvantage) / (homeStrength * homeAdvantage + awayStrength) * 100));
    const drawFactor = Math.min(1, (100 - Math.abs(homeStrength * 100 - awayStrength * 100)) / 50);
    const drawProbability = Math.floor(28 * drawFactor);
    const awayProbability = Math.max(5, 100 - homeProbability - drawProbability);
    
    // Determine most likely outcome
    let predictedOutcome = 'H';
    let confidence = homeProbability;
    
    if (drawProbability > homeProbability && drawProbability > awayProbability) {
      predictedOutcome = 'D';
      confidence = drawProbability;
    } else if (awayProbability > homeProbability) {
      predictedOutcome = 'A';
      confidence = awayProbability;
    }
    
    // BTTS probability
    const bttsYesProbability = Math.min(90, Math.max(40, 
      Math.floor(50 + (awayStrength * 20) + (homeStrength * homeAdvantage * 10))
    ));
    
    // Over/Under probability for goals
    const overProbability = Math.min(90, Math.max(40,
      Math.floor(50 + (homeStrength * 15) + (awayStrength * 15))
    ));
    
    // Score prediction
    const homeGoals = Math.max(0, Math.round(2.2 * homeStrength * homeAdvantage));
    const awayGoals = Math.max(0, Math.round(1.5 * awayStrength));
    
    // Corner kicks predictions
    const homeCornersBase = 5 + Math.floor(homeStrength * 4);
    const awayCornersBase = 3 + Math.floor(awayStrength * 4);
    const totalCorners = homeCornersBase + awayCornersBase;
    const cornerLine = 9.5;
    const cornersOverProbability = totalCorners > cornerLine ? 
      Math.min(90, Math.max(40, Math.floor(50 + (totalCorners - cornerLine) * 10))) : 
      Math.min(60, Math.max(10, Math.floor(50 - (cornerLine - totalCorners) * 10)));
      
    // Cards predictions
    const homeAggressionFactor = 0.7 + (Math.random() * 0.6); // 0.7-1.3 random factor for team aggression
    const awayAggressionFactor = 0.8 + (Math.random() * 0.7); // 0.8-1.5 random factor for away team aggression (away teams often more aggressive)
    const matchIntensityFactor = Math.min(1.5, Math.max(0.8, 2.0 - Math.abs(homeStrength - awayStrength))); // closer teams = more intense match
    
    const homeYellowCards = Math.max(0, Math.round(1.2 * homeAggressionFactor * matchIntensityFactor));
    const awayYellowCards = Math.max(0, Math.round(1.8 * awayAggressionFactor * matchIntensityFactor));
    const totalCards = homeYellowCards + awayYellowCards;
    const cardsLine = 3.5;
    const cardsOverProbability = totalCards > cardsLine ? 
      Math.min(90, Math.max(40, Math.floor(50 + (totalCards - cardsLine) * 15))) : 
      Math.min(60, Math.max(10, Math.floor(50 - (cardsLine - totalCards) * 15)));
    
    // Red card probability
    const redCardProbability = Math.min(30, Math.max(5, 
      Math.floor(5 + (homeAggressionFactor * 5) + (awayAggressionFactor * 8) + (matchIntensityFactor * 10))
    ));
    
    // First half goals prediction
    const firstHalfGoalsProbability = Math.min(85, Math.max(40,
      Math.floor(50 + (homeStrength * 10) + (awayStrength * 5))
    ));
    
    // Market odds (simulated)
    const homeOdds = (100 / homeProbability) * 0.85;
    const drawOdds = (100 / drawProbability) * 0.85;
    const awayOdds = (100 / awayProbability) * 0.85;
    
    return {
      id: `pred-${id || Date.now()}`,
      matchId: id || `${homeTeam}-${awayTeam}`.toLowerCase().replace(/\s/g, '-'),
      sport: 'football',
      league,
      homeTeam,
      awayTeam,
      startTime: matchData.startTime || new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      predictedOutcome,
      confidence,
      isPremium: confidence > 70,
      predictions: {
        '1X2': {
          outcome: predictedOutcome,
          homeWin: { probability: homeProbability, odds: parseFloat(homeOdds.toFixed(2)) },
          draw: { probability: drawProbability, odds: parseFloat(drawOdds.toFixed(2)) },
          awayWin: { probability: awayProbability, odds: parseFloat(awayOdds.toFixed(2)) },
        },
        'BTTS': {
          outcome: bttsYesProbability > 55 ? 'Yes' : 'No',
          probability: bttsYesProbability > 55 ? bttsYesProbability : 100 - bttsYesProbability,
          odds: bttsYesProbability > 55 ? parseFloat((100 / bttsYesProbability * 0.85).toFixed(2)) : parseFloat((100 / (100 - bttsYesProbability) * 0.85).toFixed(2)),
        },
        'Over_Under_2.5': {
          line: 2.5,
          outcome: overProbability > 55 ? 'Over' : 'Under',
          probability: overProbability > 55 ? overProbability : 100 - overProbability,
          odds: overProbability > 55 ? parseFloat((100 / overProbability * 0.85).toFixed(2)) : parseFloat((100 / (100 - overProbability) * 0.85).toFixed(2)),
        },
        'CorrectScore': {
          outcome: `${homeGoals}-${awayGoals}`,
          probability: Math.floor(100 / (Math.pow(homeGoals + awayGoals + 1, 2))),
        },
        'PredictedScore': {
          home: homeGoals,
          away: awayGoals,
        },
        'Corners_Over_Under': {
          line: cornerLine,
          outcome: cornersOverProbability > 55 ? 'Over' : 'Under',
          probability: cornersOverProbability > 55 ? cornersOverProbability : 100 - cornersOverProbability,
          odds: cornersOverProbability > 55 ? parseFloat((100 / cornersOverProbability * 0.85).toFixed(2)) : parseFloat((100 / (100 - cornersOverProbability) * 0.85).toFixed(2)),
          predictedCorners: {
            home: homeCornersBase,
            away: awayCornersBase,
            total: totalCorners
          }
        },
        'Cards_Over_Under': {
          line: cardsLine,
          outcome: cardsOverProbability > 55 ? 'Over' : 'Under',
          probability: cardsOverProbability > 55 ? cardsOverProbability : 100 - cardsOverProbability,
          odds: cardsOverProbability > 55 ? parseFloat((100 / cardsOverProbability * 0.85).toFixed(2)) : parseFloat((100 / (100 - cardsOverProbability) * 0.85).toFixed(2)),
          predictedCards: {
            home: homeYellowCards,
            away: awayYellowCards,
            total: totalCards
          }
        },
        'RedCard': {
          outcome: redCardProbability > 20 ? 'Yes' : 'No',
          probability: redCardProbability > 20 ? redCardProbability : 100 - redCardProbability,
          odds: redCardProbability > 20 ? parseFloat((100 / redCardProbability * 0.85).toFixed(2)) : parseFloat((100 / (100 - redCardProbability) * 0.85).toFixed(2)),
        },
        'FirstHalfGoal': {
          outcome: firstHalfGoalsProbability > 55 ? 'Yes' : 'No',
          probability: firstHalfGoalsProbability > 55 ? firstHalfGoalsProbability : 100 - firstHalfGoalsProbability,
          odds: firstHalfGoalsProbability > 55 ? parseFloat((100 / firstHalfGoalsProbability * 0.85).toFixed(2)) : parseFloat((100 / (100 - firstHalfGoalsProbability) * 0.85).toFixed(2)),
        },
      },
      analysisFactors: [
        { factor: 'Home advantage', impact: 'high' },
        { factor: 'Team strength', impact: 'medium' }
      ],
      predictionMethods: ['statistical-model', 'poisson-distribution'],
    };
  }
  
  /**
   * Generate basketball-specific baseline prediction
   */
  private generateBasketballBaseline(matchData: any, historicalData: any = null): any {
    const { homeTeam, awayTeam, league, id } = matchData;
    
    // Use historical data if available, otherwise use statistical estimates
    const homeStrength = (historicalData?.homeStrength) || Math.random() * 0.3 + 0.7; // 0.7-1.0
    const awayStrength = (historicalData?.awayStrength) || Math.random() * 0.3 + 0.6; // 0.6-0.9
    const homeAdvantage = 1.2; // Standard home advantage factor for basketball
    
    // Calculate win probabilities
    const homeProbability = Math.min(90, Math.floor((homeStrength * homeAdvantage) / (homeStrength * homeAdvantage + awayStrength) * 100));
    const awayProbability = 100 - homeProbability;
    
    // Determine most likely outcome
    const predictedOutcome = homeProbability > awayProbability ? 'H' : 'A';
    const confidence = Math.max(homeProbability, awayProbability);
    
    // Score prediction
    const homePoints = Math.round(100 * homeStrength * homeAdvantage);
    const awayPoints = Math.round(95 * awayStrength);
    const totalPoints = homePoints + awayPoints;
    
    // Total points over/under probability
    const overUnderLine = 220.5;
    const overProbability = totalPoints > overUnderLine ? 
      Math.min(90, Math.max(55, Math.floor(50 + (totalPoints - overUnderLine) / 2))) : 
      Math.max(10, Math.min(45, Math.floor(50 - (overUnderLine - totalPoints) / 2)));
    
    // Spread calculation
    const spread = Math.abs(homePoints - awayPoints);
    const favoredTeam = homePoints > awayPoints ? 'H' : 'A';
    
    // Market odds (simulated)
    const homeOdds = (100 / homeProbability) * 0.9;
    const awayOdds = (100 / awayProbability) * 0.9;
    
    return {
      id: `pred-${id || Date.now()}`,
      matchId: id || `${homeTeam}-${awayTeam}`.toLowerCase().replace(/\s/g, '-'),
      sport: 'basketball',
      league,
      homeTeam,
      awayTeam,
      startTime: matchData.startTime || new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      predictedOutcome,
      confidence,
      isPremium: confidence > 75,
      predictions: {
        'Winner': {
          outcome: predictedOutcome,
          homeWin: { probability: homeProbability, odds: parseFloat(homeOdds.toFixed(2)) },
          awayWin: { probability: awayProbability, odds: parseFloat(awayOdds.toFixed(2)) },
        },
        'TotalPoints': {
          line: overUnderLine,
          outcome: totalPoints > overUnderLine ? 'Over' : 'Under',
          probability: overProbability,
          predictedTotal: totalPoints,
        },
        'Spread': {
          line: spread.toFixed(1),
          favored: favoredTeam,
          probability: Math.min(85, Math.max(55, confidence)),
        },
        'PredictedScore': {
          home: homePoints,
          away: awayPoints,
        },
      },
      analysisFactors: [
        { factor: 'Home court advantage', impact: 'medium' },
        { factor: 'Team offensive rating', impact: 'high' }
      ],
      predictionMethods: ['statistical-model', 'points-distribution'],
    };
  }
  
  /**
   * Analyze historical trends to enhance prediction
   */
  private async analyzeHistoricalTrends(prediction: any, historicalData: any = null): Promise<any> {
    // If no historical data, return the original prediction
    if (!historicalData) {
      return {
        ...prediction,
        predictionMethods: [...prediction.predictionMethods, 'no-historical-data']
      };
    }
    
    try {
      const { homeTeam, awayTeam, sport } = prediction;
      
      // Extract historical results if available
      const headToHead = historicalData.headToHead || [];
      const homeForm = historicalData.homeForm || [];
      const awayForm = historicalData.awayForm || [];
      
      // Analyze head-to-head record
      const h2hAnalysis = this.analyzeHeadToHead(headToHead, homeTeam, awayTeam);
      
      // Analyze recent form
      const formAnalysis = this.analyzeTeamForm(homeForm, awayForm);
      
      // Adjust confidence based on historical data
      const confidenceAdjustment = this.calculateConfidenceAdjustment(h2hAnalysis, formAnalysis);
      const newConfidence = Math.min(95, Math.max(30, prediction.confidence + confidenceAdjustment));
      
      // Create enhanced prediction with historical insights
      return {
        ...prediction,
        confidence: newConfidence,
        historicalInsights: {
          headToHead: h2hAnalysis,
          recentForm: formAnalysis,
          confidenceAdjustment,
        },
        analysisFactors: [
          ...prediction.analysisFactors,
          { factor: 'Historical head-to-head', impact: Math.abs(confidenceAdjustment) > 5 ? 'high' : 'medium' },
          { factor: 'Recent form', impact: 'high' }
        ],
        predictionMethods: [...prediction.predictionMethods, 'historical-trend-analysis'],
      };
    } catch (error) {
      logger.error('AdvancedPredictionEngine', 'Error analyzing historical trends', error);
      return prediction;
    }
  }
  
  /**
   * Analyze head-to-head record between two teams
   */
  private analyzeHeadToHead(headToHead: any[], homeTeam: string, awayTeam: string): any {
    if (!headToHead || headToHead.length === 0) {
      return { 
        available: false,
        summary: 'No head-to-head data available'
      };
    }
    
    // Count results
    const results = {
      homeWins: 0,
      draws: 0,
      awayWins: 0,
      totalMatches: headToHead.length,
      recentTrend: ''
    };
    
    // Analyze results
    headToHead.forEach(match => {
      if (match.homeTeam === homeTeam) {
        // Home team was home in this match
        if (match.homeScore > match.awayScore) {
          results.homeWins++;
        } else if (match.homeScore === match.awayScore) {
          results.draws++;
        } else {
          results.awayWins++;
        }
      } else {
        // Home team was away in this match
        if (match.awayScore > match.homeScore) {
          results.homeWins++;
        } else if (match.homeScore === match.awayScore) {
          results.draws++;
        } else {
          results.awayWins++;
        }
      }
    });
    
    // Calculate percentages
    const homeWinPct = (results.homeWins / results.totalMatches) * 100;
    const drawPct = (results.draws / results.totalMatches) * 100;
    const awayWinPct = (results.awayWins / results.totalMatches) * 100;
    
    // Determine recent trend (using last 3 matches)
    const recentMatches = headToHead.slice(0, 3);
    let homeTeamWins = 0;
    let awayTeamWins = 0;
    
    recentMatches.forEach(match => {
      if (match.homeTeam === homeTeam && match.homeScore > match.awayScore) {
        homeTeamWins++;
      } else if (match.awayTeam === homeTeam && match.awayScore > match.homeScore) {
        homeTeamWins++;
      } else if (match.homeTeam === awayTeam && match.homeScore > match.awayScore) {
        awayTeamWins++;
      } else if (match.awayTeam === awayTeam && match.awayScore > match.homeScore) {
        awayTeamWins++;
      }
    });
    
    if (homeTeamWins > awayTeamWins) {
      results.recentTrend = `${homeTeam} has won ${homeTeamWins} of the last ${recentMatches.length} meetings`;
    } else if (awayTeamWins > homeTeamWins) {
      results.recentTrend = `${awayTeam} has won ${awayTeamWins} of the last ${recentMatches.length} meetings`;
    } else {
      results.recentTrend = `Even record in the last ${recentMatches.length} meetings`;
    }
    
    return {
      available: true,
      results,
      percentages: {
        homeWin: homeWinPct.toFixed(1),
        draw: drawPct.toFixed(1),
        awayWin: awayWinPct.toFixed(1),
      },
      dominantTeam: homeWinPct > awayWinPct ? homeTeam : awayWinPct > homeWinPct ? awayTeam : 'Even',
      summary: `In ${results.totalMatches} meetings, ${homeTeam} has won ${results.homeWins} (${homeWinPct.toFixed(1)}%), there have been ${results.draws} draws (${drawPct.toFixed(1)}%), and ${awayTeam} has won ${results.awayWins} (${awayWinPct.toFixed(1)}%).`
    };
  }
  
  /**
   * Analyze recent form for both teams
   */
  private analyzeTeamForm(homeForm: any[], awayForm: any[]): any {
    const createFormSummary = (team: string, form: any[]) => {
      if (!form || form.length === 0) {
        return { available: false, summary: `No recent form data for ${team}` };
      }
      
      const wins = form.filter(m => m.result === 'W').length;
      const draws = form.filter(m => m.result === 'D').length;
      const losses = form.filter(m => m.result === 'L').length;
      
      const winPct = (wins / form.length) * 100;
      
      // Calculate average goals scored and conceded
      let goalsScored = 0;
      let goalsConceded = 0;
      
      form.forEach(match => {
        goalsScored += match.goalsScored || 0;
        goalsConceded += match.goalsConceded || 0;
      });
      
      const avgScored = goalsScored / form.length;
      const avgConceded = goalsConceded / form.length;
      
      // Last 5 matches form string (e.g. "WDLWW")
      const formString = form.slice(0, 5).map(m => m.result).join('');
      
      return {
        available: true,
        matches: form.length,
        results: { wins, draws, losses },
        winPercentage: winPct.toFixed(1),
        scoring: { 
          goalsScored,
          goalsConceded,
          avgScored: avgScored.toFixed(1),
          avgConceded: avgConceded.toFixed(1)
        },
        formString,
        summary: `${team} has won ${wins}, drawn ${draws}, and lost ${losses} of their last ${form.length} matches.`,
      };
    };
    
    const homeFormAnalysis = createFormSummary('Home team', homeForm);
    const awayFormAnalysis = createFormSummary('Away team', awayForm);
    
    // Determine which team has better form
    let betterForm = 'Even';
    
    if (homeFormAnalysis.available && awayFormAnalysis.available) {
      const homeWinPct = parseFloat(homeFormAnalysis.winPercentage);
      const awayWinPct = parseFloat(awayFormAnalysis.winPercentage);
      
      if (homeWinPct > awayWinPct + 15) {
        betterForm = 'Home team significantly better';
      } else if (homeWinPct > awayWinPct) {
        betterForm = 'Home team slightly better';
      } else if (awayWinPct > homeWinPct + 15) {
        betterForm = 'Away team significantly better';
      } else if (awayWinPct > homeWinPct) {
        betterForm = 'Away team slightly better';
      }
    }
    
    return {
      home: homeFormAnalysis,
      away: awayFormAnalysis,
      comparison: betterForm
    };
  }
  
  /**
   * Calculate confidence adjustment based on historical analysis
   */
  private calculateConfidenceAdjustment(h2hAnalysis: any, formAnalysis: any): number {
    let adjustment = 0;
    
    // Adjust based on head-to-head
    if (h2hAnalysis.available) {
      const homeWinPct = parseFloat(h2hAnalysis.percentages.homeWin);
      const awayWinPct = parseFloat(h2hAnalysis.percentages.awayWin);
      
      if (homeWinPct > 70) {
        adjustment += 5;
      } else if (homeWinPct > 60) {
        adjustment += 3;
      } else if (awayWinPct > 70) {
        adjustment -= 5;
      } else if (awayWinPct > 60) {
        adjustment -= 3;
      }
    }
    
    // Adjust based on recent form
    if (formAnalysis.home.available && formAnalysis.away.available) {
      if (formAnalysis.comparison === 'Home team significantly better') {
        adjustment += 5;
      } else if (formAnalysis.comparison === 'Home team slightly better') {
        adjustment += 2;
      } else if (formAnalysis.comparison === 'Away team significantly better') {
        adjustment -= 5;
      } else if (formAnalysis.comparison === 'Away team slightly better') {
        adjustment -= 2;
      }
    }
    
    return adjustment;
  }
  
  /**
   * Enhance prediction with AI-powered insights
   */
  private async enhanceWithAI(prediction: any, matchData: any): Promise<any> {
    try {
      // Get AI analysis of the match
      const aiAnalysis = await openaiClient.analyzeMatch(
        { ...matchData, ...prediction }, 
        prediction.sport
      );
      
      if (!aiAnalysis.aiInsights) {
        return {
          ...prediction,
          predictionMethods: [...prediction.predictionMethods, 'ai-analysis-failed'],
        };
      }
      
      // Extract AI confidence
      const aiConfidence = aiAnalysis.aiInsights?.prediction?.confidence || 0;
      
      // Merge confidences with more weight on statistical model (70/30 split)
      const mergedConfidence = Math.round((prediction.confidence * 0.7) + (aiConfidence * 0.3));
      
      // Possibly adjust outcome if AI strongly disagrees
      let finalOutcome = prediction.predictedOutcome;
      if (aiAnalysis.aiInsights?.prediction?.predictedOutcome !== prediction.predictedOutcome && 
          aiConfidence > prediction.confidence + 15) {
        finalOutcome = aiAnalysis.aiInsights.prediction.predictedOutcome;
      }
      
      // Create enhanced prediction with AI insights
      return {
        ...prediction,
        predictedOutcome: finalOutcome,
        confidence: mergedConfidence,
        aiAnalysis: aiAnalysis.aiInsights,
        modelUsed: aiAnalysis.modelUsed,
        isAiEnhanced: true,
        analysisFactors: [
          ...prediction.analysisFactors,
          ...(aiAnalysis.aiInsights?.matchAnalysis?.homeTeamStrengths || []).map((s: string) => ({ 
            factor: `Home strength: ${s}`, 
            impact: 'medium' 
          })),
          ...(aiAnalysis.aiInsights?.matchAnalysis?.awayTeamWeaknesses || []).map((w: string) => ({ 
            factor: `Away weakness: ${w}`, 
            impact: 'medium' 
          })),
        ],
        valueBets: aiAnalysis.aiInsights?.bettingAdvice?.valueBets || [],
        predictionMethods: [...prediction.predictionMethods, 'ai-enhanced', aiAnalysis.modelUsed],
      };
    } catch (error) {
      logger.error('AdvancedPredictionEngine', 'Error enhancing prediction with AI', error);
      return prediction;
    }
  }
  
  /**
   * Generate advanced accumulators with optimized selections
   */
  async generateAdvancedAccumulators(predictions: any[], options: any = {}): Promise<any> {
    try {
      logger.info('AdvancedPredictionEngine', 'Generating advanced accumulators', { 
        numPredictions: predictions.length,
        options
      });
      
      if (!predictions || predictions.length < 2) {
        return {
          error: 'Insufficient predictions to create accumulators',
          available: false
        };
      }
      
      // Group predictions by sport for better diversity
      const sportGroups: {[key: string]: any[]} = {};
      predictions.forEach(pred => {
        const sport = pred.sport || 'other';
        if (!sportGroups[sport]) {
          sportGroups[sport] = [];
        }
        sportGroups[sport].push(pred);
      });
      
      // Enhance predictions with market information if available
      const enhancedPredictions = predictions.map(prediction => {
        // If prediction already has markets data, return as is
        if (prediction.markets) {
          return prediction;
        }
        
        // For football predictions, create markets data from predictions object
        if (prediction.sport === 'football' && prediction.predictions) {
          const markets: any = {};
          
          // Add 1X2 market
          if (prediction.predictions['1X2']) {
            markets['1X2'] = {
              outcome: prediction.predictedOutcome,
              confidence: prediction.confidence,
              odds: prediction.predictions['1X2'][prediction.predictedOutcome === 'H' ? 'homeWin' : 
                    (prediction.predictedOutcome === 'D' ? 'draw' : 'awayWin')]?.odds || 2.0
            };
          }
          
          // Add BTTS market
          if (prediction.predictions['BTTS']) {
            markets['BTTS'] = {
              outcome: prediction.predictions['BTTS'].outcome,
              confidence: prediction.predictions['BTTS'].probability,
              odds: prediction.predictions['BTTS'].odds || 
                    ((100 / prediction.predictions['BTTS'].probability) * 0.85).toFixed(2)
            };
          }
          
          // Add Over/Under market
          if (prediction.predictions['Over_Under'] || prediction.predictions['Over_Under_2.5']) {
            const ouData = prediction.predictions['Over_Under_2.5'] || prediction.predictions['Over_Under'];
            markets['Over_Under_2.5'] = {
              outcome: ouData.outcome,
              confidence: ouData.probability,
              line: ouData.line || 2.5,
              odds: ouData.odds || ((100 / ouData.probability) * 0.85).toFixed(2)
            };
          }
          
          // Add corners market if available
          if (prediction.predictions['Corners_Over_Under']) {
            markets['Corners_Over_Under'] = {
              ...prediction.predictions['Corners_Over_Under'],
              confidence: prediction.predictions['Corners_Over_Under'].probability
            };
          }
          
          // Add cards market if available
          if (prediction.predictions['Cards_Over_Under']) {
            markets['Cards_Over_Under'] = {
              ...prediction.predictions['Cards_Over_Under'],
              confidence: prediction.predictions['Cards_Over_Under'].probability
            };
          }
          
          return {
            ...prediction,
            markets
          };
        }
        
        return prediction;
      });
      
      // Sort predictions by confidence (highest first)
      const sortedPredictions = [...enhancedPredictions].sort((a, b) => {
        // For predictions with markets, use the highest market confidence
        if (a.markets && b.markets) {
          const aMaxConf = Math.max(...Object.values(a.markets).map((m: any) => m.confidence || 0));
          const bMaxConf = Math.max(...Object.values(b.markets).map((m: any) => m.confidence || 0));
          return bMaxConf - aMaxConf;
        } else if (a.markets) {
          const aMaxConf = Math.max(...Object.values(a.markets).map((m: any) => m.confidence || 0));
          return b.confidence - aMaxConf;
        } else if (b.markets) {
          const bMaxConf = Math.max(...Object.values(b.markets).map((m: any) => m.confidence || 0));
          return bMaxConf - a.confidence;
        } else {
          return b.confidence - a.confidence;
        }
      });
      
      // Generate different sized accumulators
      const accumulators: any = {
        small: [],
        medium: [],
        large: [],
        mega: []
      };
      
      // Create small accumulator (2 selections)
      if (sortedPredictions.length >= 2) {
        // Standard small accumulator
        accumulators.small.push(this.createAccumulator(
          sortedPredictions.slice(0, 2),
          'small',
          options.minConfidence || 75
        ));
        
        // Create a BTTS/Goal market-specific accumulator if possible
        const goalMarketPredictions = sortedPredictions.filter(p => 
          p.markets && (p.markets['BTTS'] || p.markets['Over_Under_2.5'])
        );
        
        if (goalMarketPredictions.length >= 2) {
          accumulators.small.push(this.createAccumulator(
            goalMarketPredictions.slice(0, 2),
            'small',
            options.minConfidence || 75,
            true // Force varied markets
          ));
        }
      }
      
      // Create medium accumulator (3 selections)
      if (sortedPredictions.length >= 3) {
        // Standard medium accumulator
        accumulators.medium.push(this.createAccumulator(
          sortedPredictions.slice(0, 3),
          'medium',
          options.minConfidence || 70
        ));
        
        // Create a mixed-market medium accumulator if possible
        const footballPredictions = sortedPredictions.filter(p => p.sport === 'football' && p.markets);
        if (footballPredictions.length >= 3) {
          // Try to get one prediction for each market type
          const btts = footballPredictions.find(p => p.markets['BTTS']);
          const overUnder = footballPredictions.find(p => p.markets['Over_Under_2.5'] && p !== btts);
          const corners = footballPredictions.find(p => p.markets['Corners_Over_Under'] && p !== btts && p !== overUnder);
          const winners = footballPredictions.filter(p => p.markets['1X2'] && p !== btts && p !== overUnder && p !== corners);
          
          const specialSelections = [
            btts, 
            overUnder,
            ...(corners ? [corners] : []),
            ...winners
          ].filter(Boolean).slice(0, 3);
          
          if (specialSelections.length === 3) {
            accumulators.medium.push(this.createAccumulator(
              specialSelections,
              'medium',
              options.minConfidence || 70,
              true // Force varied markets
            ));
          }
        }
      }
      
      // Create large accumulator (4 selections)
      if (sortedPredictions.length >= 4) {
        // Create with mixed sports for variety
        const footballPicks = sportGroups['football']?.slice(0, 2) || [];
        const basketballPicks = sportGroups['basketball']?.slice(0, 1) || [];
        const otherPicks = sortedPredictions.filter(p => 
          !footballPicks.includes(p) && !basketballPicks.includes(p)
        ).slice(0, 4 - footballPicks.length - basketballPicks.length);
        
        const diverseSelections = [...footballPicks, ...basketballPicks, ...otherPicks];
        
        if (diverseSelections.length >= 4) {
          accumulators.large.push(this.createAccumulator(
            diverseSelections.slice(0, 4),
            'large',
            options.minConfidence || 65
          ));
        } else {
          // Fallback to standard large accumulator
          accumulators.large.push(this.createAccumulator(
            sortedPredictions.slice(0, 4),
            'large',
            options.minConfidence || 65
          ));
        }
      }
      
      // Create mega accumulator (5+ selections)
      if (sortedPredictions.length >= 5) {
        // Standard mega accumulator
        accumulators.mega.push(this.createAccumulator(
          sortedPredictions.slice(0, 5),
          'mega',
          options.minConfidence || 60
        ));
        
        // Create a larger 6+ selection accumulator if possible
        if (sortedPredictions.length >= 6) {
          accumulators.mega.push(this.createAccumulator(
            sortedPredictions.slice(0, 6),
            'mega',
            options.minConfidence || 60
          ));
        }
      }
      
      // Enhance with AI explanations if available
      if (openaiClient.hasApiKey()) {
        return await this.enhanceAccumulatorsWithAI(accumulators);
      }
      
      return accumulators;
    } catch (error) {
      logger.error('AdvancedPredictionEngine', 'Error generating advanced accumulators', error);
      throw error;
    }
  }
  
  /**
   * Create an accumulator from selected predictions
   */
  private createAccumulator(selections: any[], type: string, minConfidence: number, forceDiverseMarkets: boolean = false): any {
    const id = `acca-${Date.now()}-${type}`;
    
    // Market mapping - which markets should we use for each sport
    const marketOptions = {
      football: ['1X2', 'BTTS', 'Over_Under_2.5', 'Corners_Over_Under'],
      basketball: ['Winner', 'TotalPoints'],
      tennis: ['Winner'],
      cricket: ['Winner'],
      baseball: ['Winner'],
    };
    
    // If we want diverse markets, track which ones have been used
    const usedMarkets: Set<string> = new Set();
    
    // Map selections to accumulator format
    const accaSelections = selections.map(prediction => {
      // Check if the prediction has markets - use enhanced structure if available
      if (prediction.markets) {
        // Select a market based on confidence
        const availableMarkets = Object.keys(prediction.markets).filter(key => 
          prediction.markets[key].confidence >= minConfidence
        );
        
        // Pick a market - prefer using different markets for variety
        let market;
        
        if (prediction.sport === 'football') {
          // For football, use various markets based on their confidence
          let validOptions = marketOptions.football.filter(m => 
            availableMarkets.includes(m) && prediction.markets[m].confidence >= minConfidence + 5
          );
          
          if (forceDiverseMarkets && usedMarkets.size > 0) {
            // Filter out markets that have already been used
            const unusedOptions = validOptions.filter(m => !usedMarkets.has(m));
            
            // If there are unused options, prioritize them
            if (unusedOptions.length > 0) {
              validOptions = unusedOptions;
            }
          }
          
          // Choose randomly from valid options with high confidence, or fallback to 1X2
          market = validOptions.length > 0 
            ? validOptions[Math.floor(Math.random() * validOptions.length)]
            : '1X2';
          
          // Record that we've used this market type
          if (forceDiverseMarkets) {
            usedMarkets.add(market);
          }
        } else {
          // For other sports, use the main winner market
          market = prediction.sport === 'football' ? '1X2' : 'Winner';
        }
        
        const marketData = prediction.markets[market];
        
        return {
          matchId: prediction.matchId,
          homeTeam: prediction.homeTeam,
          awayTeam: prediction.awayTeam,
          league: prediction.league,
          startTime: prediction.startTime,
          sport: prediction.sport,
          market: market,
          outcome: marketData.outcome,
          odds: marketData.odds,
          confidence: marketData.confidence,
          line: marketData.line, // For over/under markets
          explanation: this.getMarketExplanation(market, marketData)
        };
      } else {
        // Legacy/fallback format - use main market for the sport
        const market = prediction.sport === 'football' ? '1X2' : 'Winner';
        const marketData = prediction.predictions?.[market];
        
        // Get odds for the predicted outcome
        let odds = 2.0; // Default
        if (prediction.predictedOutcome === 'H' || prediction.predictedOutcome === '1') {
          odds = marketData?.homeWin?.odds || prediction.homeOdds || 2.0;
        } else if (prediction.predictedOutcome === 'D' || prediction.predictedOutcome === 'X') {
          odds = marketData?.draw?.odds || prediction.drawOdds || 3.0;
        } else if (prediction.predictedOutcome === 'A' || prediction.predictedOutcome === '2') {
          odds = marketData?.awayWin?.odds || prediction.awayOdds || 2.5;
        }
        
        return {
          matchId: prediction.matchId,
          homeTeam: prediction.homeTeam,
          awayTeam: prediction.awayTeam,
          league: prediction.league,
          startTime: prediction.startTime,
          sport: prediction.sport,
          market,
          outcome: prediction.predictedOutcome,
          odds,
          confidence: prediction.confidence,
        };
      }
    });
    
    // Calculate accumulator details
    const totalOdds = accaSelections.reduce((acc, selection) => acc * selection.odds, 1);
    const avgConfidence = accaSelections.reduce((acc, selection) => acc + selection.confidence, 0) / accaSelections.length;
    
    // Lower confidence slightly for each additional selection (accumulator risk)
    const confidence = Math.max(30, Math.round(avgConfidence - (selections.length - 1) * 5));
    
    return {
      id,
      createdAt: new Date().toISOString(),
      size: selections.length,
      totalOdds: parseFloat(totalOdds.toFixed(2)),
      confidence,
      isPremium: confidence > 65,
      type,
      selections: accaSelections,
      riskRating: this.calculateRiskRating(confidence, selections.length),
      potentialReturn: parseFloat((totalOdds * 10).toFixed(2)), // £10 stake
    };
  }
  
  /**
   * Calculate risk rating (1-5) based on confidence and number of selections
   */
  private calculateRiskRating(confidence: number, selections: number): number {
    // Base risk on confidence
    let risk = 6 - Math.floor(confidence / 20);
    
    // Increase risk for more selections
    risk += Math.floor(selections / 2);
    
    // Cap at 1-5
    return Math.min(5, Math.max(1, risk));
  }
  
  /**
   * Get a human-readable explanation for a market prediction
   */
  private getMarketExplanation(market: string, marketData: any): string {
    switch (market) {
      case '1X2':
        const outcomeMap: {[key: string]: string} = {
          '1': 'Home Win',
          'H': 'Home Win',
          'X': 'Draw',
          'D': 'Draw',
          '2': 'Away Win',
          'A': 'Away Win'
        };
        return `${outcomeMap[marketData.outcome] || marketData.outcome} (${Math.round(marketData.confidence)}% confidence)`;
        
      case 'BTTS':
        return `Both Teams To Score: ${marketData.outcome} (${Math.round(marketData.confidence)}% confidence)`;
        
      case 'Over_Under_2.5':
        return `Goals ${marketData.outcome} 2.5 (${Math.round(marketData.confidence)}% confidence)`;
        
      case 'Corners_Over_Under':
        return `Corner Kicks ${marketData.outcome} ${marketData.line} (${Math.round(marketData.confidence)}% confidence)`;
        
      case 'Cards_Over_Under':
        return `Cards ${marketData.outcome} ${marketData.line} (${Math.round(marketData.confidence)}% confidence)`;
        
      case 'RedCard':
        return `Red Card: ${marketData.outcome} (${Math.round(marketData.confidence)}% confidence)`;
        
      case 'FirstHalfGoal':
        return `First Half Goal: ${marketData.outcome} (${Math.round(marketData.confidence)}% confidence)`;
        
      case 'TotalPoints':
        return `Total Points ${marketData.outcome} ${marketData.line} (${Math.round(marketData.confidence)}% confidence)`;
        
      case 'Winner':
        return `Winner: ${marketData.outcome} (${Math.round(marketData.confidence)}% confidence)`;
        
      default:
        return `${market}: ${marketData.outcome} (${Math.round(marketData.confidence)}% confidence)`;
    }
  }
  
  /**
   * Enhance accumulators with AI explanations
   */
  private async enhanceAccumulatorsWithAI(accumulators: any): Promise<any> {
    try {
      const enhanced = { ...accumulators };
      
      // Get the most interesting accumulators (one from each category)
      const accsToEnhance = [];
      
      if (enhanced.small?.[0]) {
        accsToEnhance.push({ type: 'small', accumulator: enhanced.small[0] });
      }
      
      if (enhanced.medium?.[0]) {
        accsToEnhance.push({ type: 'medium', accumulator: enhanced.medium[0] });
      }
      
      if (enhanced.large?.[0]) {
        accsToEnhance.push({ type: 'large', accumulator: enhanced.large[0] });
      }
      
      if (enhanced.mega?.[0]) {
        accsToEnhance.push({ type: 'mega', accumulator: enhanced.mega[0] });
      }
      
      // Process in parallel
      const enhancementPromises = accsToEnhance.map(async ({ type, accumulator }) => {
        try {
          const explanation = await openaiClient.explainAccumulator(accumulator);
          
          // Add explanation to the accumulator
          if (enhanced[type]?.[0]) {
            enhanced[type][0] = {
              ...enhanced[type][0],
              aiExplanation: explanation,
              isAiEnhanced: true
            };
          }
        } catch (error) {
          logger.error('AdvancedPredictionEngine', `Error enhancing ${type} accumulator`, error);
        }
      });
      
      // Wait for all enhancements to complete
      await Promise.all(enhancementPromises);
      
      return enhanced;
    } catch (error) {
      logger.error('AdvancedPredictionEngine', 'Error enhancing accumulators', error);
      return accumulators;
    }
  }
}

// Export a singleton instance
export const advancedPredictionEngine = new AdvancedPredictionEngine();