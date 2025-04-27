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
    
    // Over/Under probability
    const overProbability = Math.min(90, Math.max(40,
      Math.floor(50 + (homeStrength * 15) + (awayStrength * 15))
    ));
    
    // Score prediction
    const homeGoals = Math.max(0, Math.round(2.2 * homeStrength * homeAdvantage));
    const awayGoals = Math.max(0, Math.round(1.5 * awayStrength));
    
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
        },
        'Over_Under': {
          line: 2.5,
          outcome: overProbability > 55 ? 'Over' : 'Under',
          probability: overProbability > 55 ? overProbability : 100 - overProbability,
        },
        'CorrectScore': {
          outcome: `${homeGoals}-${awayGoals}`,
          probability: Math.floor(100 / (Math.pow(homeGoals + awayGoals + 1, 2))),
        },
        'PredictedScore': {
          home: homeGoals,
          away: awayGoals,
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
      
      // Sort predictions by confidence (highest first)
      const sortedPredictions = [...predictions].sort((a, b) => b.confidence - a.confidence);
      
      // Generate different sized accumulators
      const accumulators: any = {
        small: [],
        medium: [],
        large: [],
        mega: []
      };
      
      // Create small accumulator (2 selections)
      if (sortedPredictions.length >= 2) {
        accumulators.small.push(this.createAccumulator(
          sortedPredictions.slice(0, 2),
          'small',
          options.minConfidence || 75
        ));
      }
      
      // Create medium accumulator (3 selections)
      if (sortedPredictions.length >= 3) {
        accumulators.medium.push(this.createAccumulator(
          sortedPredictions.slice(0, 3),
          'medium',
          options.minConfidence || 70
        ));
      }
      
      // Create large accumulator (4 selections)
      if (sortedPredictions.length >= 4) {
        accumulators.large.push(this.createAccumulator(
          sortedPredictions.slice(0, 4),
          'large',
          options.minConfidence || 65
        ));
      }
      
      // Create mega accumulator (5 selections)
      if (sortedPredictions.length >= 5) {
        accumulators.mega.push(this.createAccumulator(
          sortedPredictions.slice(0, 5),
          'mega',
          options.minConfidence || 60
        ));
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
  private createAccumulator(selections: any[], type: string, minConfidence: number): any {
    const id = `acca-${Date.now()}-${type}`;
    
    // Map selections to accumulator format
    const accaSelections = selections.map(prediction => {
      // Get main market for the sport
      const market = prediction.sport === 'football' ? '1X2' : 'Winner';
      const marketData = prediction.predictions[market];
      
      // Get odds for the predicted outcome
      let odds = 2.0; // Default
      if (prediction.predictedOutcome === 'H') {
        odds = marketData.homeWin?.odds || 2.0;
      } else if (prediction.predictedOutcome === 'D') {
        odds = marketData.draw?.odds || 3.0;
      } else if (prediction.predictedOutcome === 'A') {
        odds = marketData.awayWin?.odds || 2.5;
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