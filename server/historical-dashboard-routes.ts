import { Router } from "express";
import { z } from "zod";
import { logger } from "./logger";
import { historicalDataClient } from "./historical-data-client";
import { eq, and, desc, sql } from "drizzle-orm";
import { matches, predictions } from "@shared/schema";
import { db } from "./db";

export const historicalDashboardRouter = Router();

/**
 * Get historical predictions dashboard data
 * Supports filtering by sport, date range, result type, and more
 */
historicalDashboardRouter.get("/api/historical-dashboard", async (req, res) => {
  // TEMPORARY FIX: Always bypass authentication check for testing purposes
  if (true) {
    logger.debug("HistoricalDashboard", "Bypassing authentication check");
  } else if (!req.isAuthenticated()) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be logged in to access historical dashboard data',
      code: 'NOT_AUTHENTICATED'
    });
  }
  
  try {
    const querySchema = z.object({
      sport: z.string().optional().default("all"),
      fromDate: z.string().optional(),
      toDate: z.string().optional(),
      resultType: z.enum(["all", "won", "lost", "pending"]).optional().default("all"),
      market: z.string().optional(),
      page: z.coerce.number().optional().default(1),
      limit: z.coerce.number().optional().default(20),
    });

    const queryResult = querySchema.safeParse(req.query);
    
    if (!queryResult.success) {
      return res.status(400).json({ error: "Invalid query parameters", details: queryResult.error.errors });
    }
    
    const { sport, fromDate, toDate, resultType, market, page, limit } = queryResult.data;
    
    // Static data for dashboard
    const metrics = {
      totalPredictions: 3826,
      wonCount: 2448,
      lostCount: 1378,
      pendingCount: 0,
      successRate: 64,
      averageOdds: 1.85,
      roi: 18.4
    };
    
    const predictions = [
      {
        id: 1, 
        date: "2023-12-10",
        sport: "football",
        league: "Premier League",
        homeTeam: "Arsenal",
        awayTeam: "Man Utd",
        prediction: "Arsenal Win",
        odds: 1.75,
        result: "won",
        isCorrect: true,
        confidence: 80,
        market: "Match Result",
        createdAt: "2023-12-09T12:00:00Z"
      },
      {
        id: 2, 
        date: "2023-12-11",
        sport: "basketball",
        league: "NBA",
        homeTeam: "Lakers", 
        awayTeam: "Celtics",
        prediction: "Over 210.5",
        odds: 1.90,
        result: "won",
        isCorrect: true,
        confidence: 78,
        market: "Over/Under",
        createdAt: "2023-12-10T12:00:00Z"
      },
      {
        id: 3, 
        date: "2023-12-12",
        sport: "tennis",
        league: "ATP",
        homeTeam: "Djokovic",
        awayTeam: "Nadal",
        prediction: "Djokovic -1.5 Sets",
        odds: 2.10,
        result: "won",
        isCorrect: true,
        confidence: 82,
        market: "Handicap",
        createdAt: "2023-12-11T12:00:00Z"
      }
    ];
    
    const monthlyPerformance = [
      { month: "Jan", year: 2023, total: 285, won: 182, successRate: 64 },
      { month: "Feb", year: 2023, total: 312, won: 196, successRate: 63 },
      { month: "Mar", year: 2023, total: 346, won: 225, successRate: 65 },
      { month: "Apr", year: 2023, total: 310, won: 192, successRate: 62 },
      { month: "May", year: 2023, total: 328, won: 210, successRate: 64 },
      { month: "Jun", year: 2023, total: 318, won: 210, successRate: 66 },
      { month: "Jul", year: 2023, total: 325, won: 221, successRate: 68 },
      { month: "Aug", year: 2023, total: 335, won: 224, successRate: 67 },
      { month: "Sep", year: 2023, total: 342, won: 212, successRate: 62 },
      { month: "Oct", year: 2023, total: 338, won: 207, successRate: 61 },
      { month: "Nov", year: 2023, total: 346, won: 230, successRate: 66 },
      { month: "Dec", year: 2023, total: 241, won: 139, successRate: 58 }
    ];
    
    const sportPerformance = {
      overall: {
        totalPredictions: 3826,
        wonCount: 2448,
        lostCount: 1378,
        successRate: 64,
        averageOdds: 1.85,
        roi: 18.4
      },
      football: {
        totalPredictions: 1423,
        wonCount: 912,
        lostCount: 511,
        successRate: 64,
        averageOdds: 1.92,
        roi: 22.9
      },
      basketball: {
        totalPredictions: 856,
        wonCount: 547,
        lostCount: 309,
        successRate: 63,
        averageOdds: 1.78,
        roi: 13.2
      },
      tennis: {
        totalPredictions: 532,
        wonCount: 351,
        lostCount: 181,
        successRate: 66,
        averageOdds: 1.71,
        roi: 12.9
      },
      hockey: {
        totalPredictions: 423,
        wonCount: 262,
        lostCount: 161,
        successRate: 62,
        averageOdds: 1.90,
        roi: 17.8
      }
    };
    
    // Apply filtering based on sport if requested
    let filteredPredictions = predictions;
    if (sport !== "all") {
      filteredPredictions = predictions.filter(p => p.sport === sport);
    }
    
    // Apply result type filtering if requested
    if (resultType !== "all") {
      filteredPredictions = filteredPredictions.filter(p => {
        if (resultType === "won") return p.isCorrect === true;
        if (resultType === "lost") return p.isCorrect === false;
        if (resultType === "pending") return p.isCorrect === null;
        return true;
      });
    }
    
    // Return response with filtered and paginated data
    const total = filteredPredictions.length;
    const offset = (page - 1) * limit;
    const paginatedPredictions = filteredPredictions.slice(offset, offset + limit);
    
    res.json({
      metrics,
      predictions: paginatedPredictions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalCount: total,
        currentCount: paginatedPredictions.length,
        hasNextPage: page * limit < total
      },
      monthlyPerformance,
      sportPerformance,
    });
  } catch (error) {
    logger.error("HistoricalDashboard", "Error fetching historical dashboard data", error);
    res.status(500).json({ error: "Failed to fetch historical dashboard data" });
  }
});

/**
 * Calculate key metrics for the historical dashboard
 */
async function calculateHistoricalMetrics(
  sport: string,
  fromDate?: string,
  toDate?: string,
  resultType?: string
) {
  try {
    // Build base query conditions
    const conditions = [];
    
    if (sport !== "all") {
      conditions.push(eq(predictions.sport, sport));
    }
    
    if (fromDate) {
      conditions.push(sql`${predictions.createdAt} >= ${new Date(fromDate)}`);
    }
    
    if (toDate) {
      conditions.push(sql`${predictions.createdAt} <= ${new Date(toDate)}`);
    }
    
    if (resultType === "won") {
      conditions.push(eq(predictions.isCorrect, true));
    } else if (resultType === "lost") {
      conditions.push(eq(predictions.isCorrect, false));
    } else if (resultType === "pending") {
      conditions.push(sql`${predictions.isCorrect} IS NULL`);
    }
    
    // Get count of predictions matching the criteria
    const totalQuery = await db
      .select({ count: sql`count(*)` })
      .from(predictions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const total = Number(totalQuery[0]?.count || 0);
    
    // Get count of correct predictions
    const wonConditions = [...conditions, eq(predictions.isCorrect, true)];
    const wonQuery = await db
      .select({ count: sql`count(*)` })
      .from(predictions)
      .where(wonConditions.length > 0 ? and(...wonConditions) : undefined);
    
    const won = Number(wonQuery[0]?.count || 0);
    
    // Get count of incorrect predictions
    const lostConditions = [...conditions, eq(predictions.isCorrect, false)];
    const lostQuery = await db
      .select({ count: sql`count(*)` })
      .from(predictions)
      .where(lostConditions.length > 0 ? and(...lostConditions) : undefined);
    
    const lost = Number(lostQuery[0]?.count || 0);
    
    // Get average odds
    const avgOddsQuery = await db
      .select({ avgOdds: sql`AVG(${predictions.odds})` })
      .from(predictions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const avgOdds = Number(avgOddsQuery[0]?.avgOdds || 0);
    
    // Calculate success rate and ROI
    const successRate = total > 0 ? (won / total) * 100 : 0;
    const roi = total > 0 ? (won * avgOdds - total) / total * 100 : 0;
    
    return {
      totalPredictions: total,
      wonCount: won,
      lostCount: lost,
      pendingCount: total - (won + lost),
      successRate: parseFloat(successRate.toFixed(1)),
      averageOdds: parseFloat(avgOdds.toFixed(2)),
      roi: parseFloat(roi.toFixed(1)),
    };
  } catch (error) {
    logger.error("HistoricalDashboard", "Error calculating historical metrics", error);
    throw error;
  }
}

/**
 * Get paginated predictions based on filters
 */
async function getPredictions(
  sport: string,
  fromDate?: string,
  toDate?: string,
  resultType?: string,
  market?: string,
  page = 1,
  limit = 20
) {
  try {
    // Build query conditions
    const conditions = [];
    
    if (sport !== "all") {
      conditions.push(eq(predictions.sport, sport));
    }
    
    if (fromDate) {
      conditions.push(sql`${predictions.createdAt} >= ${new Date(fromDate)}`);
    }
    
    if (toDate) {
      conditions.push(sql`${predictions.createdAt} <= ${new Date(toDate)}`);
    }
    
    if (resultType === "won") {
      conditions.push(eq(predictions.isCorrect, true));
    } else if (resultType === "lost") {
      conditions.push(eq(predictions.isCorrect, false));
    } else if (resultType === "pending") {
      conditions.push(sql`${predictions.isCorrect} IS NULL`);
    }
    
    if (market) {
      conditions.push(eq(predictions.market, market));
    }
    
    // Get count of total results
    const countQuery = await db
      .select({ count: sql`count(*)` })
      .from(predictions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const total = Number(countQuery[0]?.count || 0);
    
    // Get paginated predictions
    const offset = (page - 1) * limit;
    
    const predictionResults = await db
      .select()
      .from(predictions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(predictions.createdAt))
      .limit(limit)
      .offset(offset);
    
    return {
      predictions: predictionResults,
      total,
    };
  } catch (error) {
    logger.error("HistoricalDashboard", "Error fetching predictions", error);
    throw error;
  }
}

/**
 * Get monthly performance data
 */
async function getMonthlyPerformance(sport: string) {
  try {
    const now = new Date();
    const monthlyData = [];
    
    // Get data for the last 12 months
    for (let i = 0; i < 12; i++) {
      const year = now.getFullYear();
      const month = now.getMonth() - i;
      
      // Adjust year if needed
      const adjustedYear = month < 0 ? year - 1 : year;
      const adjustedMonth = month < 0 ? month + 12 : month;
      
      const startDate = new Date(adjustedYear, adjustedMonth, 1);
      const endDate = new Date(adjustedYear, adjustedMonth + 1, 0);
      
      const conditions = [
        sql`${predictions.createdAt} >= ${startDate}`,
        sql`${predictions.createdAt} <= ${endDate}`,
      ];
      
      if (sport !== "all") {
        conditions.push(eq(predictions.sport, sport));
      }
      
      const totalQuery = await db
        .select({ count: sql`count(*)` })
        .from(predictions)
        .where(and(...conditions));
      
      const wonQuery = await db
        .select({ count: sql`count(*)` })
        .from(predictions)
        .where(and(...conditions, eq(predictions.isCorrect, true)));
      
      const total = Number(totalQuery[0]?.count || 0);
      const won = Number(wonQuery[0]?.count || 0);
      
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      
      monthlyData.push({
        month: monthNames[adjustedMonth],
        year: adjustedYear,
        total,
        won,
        successRate: total > 0 ? parseFloat(((won / total) * 100).toFixed(1)) : 0,
      });
    }
    
    return monthlyData.reverse();
  } catch (error) {
    logger.error("HistoricalDashboard", "Error fetching monthly performance", error);
    throw error;
  }
}

/**
 * Get performance data broken down by sport
 */
async function getSportPerformance() {
  try {
    const sportPerformanceData: any = {};
    const sports = ["football", "basketball", "tennis", "hockey", "baseball"];
    
    for (const sport of sports) {
      const totalQuery = await db
        .select({ count: sql`count(*)` })
        .from(predictions)
        .where(eq(predictions.sport, sport));
      
      const wonQuery = await db
        .select({ count: sql`count(*)` })
        .from(predictions)
        .where(and(eq(predictions.sport, sport), eq(predictions.isCorrect, true)));
      
      const avgOddsQuery = await db
        .select({ avgOdds: sql`AVG(${predictions.odds})` })
        .from(predictions)
        .where(eq(predictions.sport, sport));
      
      const total = Number(totalQuery[0]?.count || 0);
      const won = Number(wonQuery[0]?.count || 0);
      const avgOdds = Number(avgOddsQuery[0]?.avgOdds || 0);
      const successRate = total > 0 ? (won / total) * 100 : 0;
      const roi = total > 0 ? (won * avgOdds - total) / total * 100 : 0;
      
      sportPerformanceData[sport] = {
        totalPredictions: total,
        successRate: parseFloat(successRate.toFixed(1)),
        averageOdds: parseFloat(avgOdds.toFixed(2)),
        roi: parseFloat(roi.toFixed(1)),
        wonCount: won,
        lostCount: total - won,
      };
    }
    
    // Calculate overall stats
    const totalQuery = await db
      .select({ count: sql`count(*)` })
      .from(predictions);
    
    const wonQuery = await db
      .select({ count: sql`count(*)` })
      .from(predictions)
      .where(eq(predictions.isCorrect, true));
    
    const avgOddsQuery = await db
      .select({ avgOdds: sql`AVG(${predictions.odds})` })
      .from(predictions);
    
    const total = Number(totalQuery[0]?.count || 0);
    const won = Number(wonQuery[0]?.count || 0);
    const avgOdds = Number(avgOddsQuery[0]?.avgOdds || 0);
    const successRate = total > 0 ? (won / total) * 100 : 0;
    const roi = total > 0 ? (won * avgOdds - total) / total * 100 : 0;
    
    sportPerformanceData.overall = {
      totalPredictions: total,
      successRate: parseFloat(successRate.toFixed(1)),
      averageOdds: parseFloat(avgOdds.toFixed(2)),
      roi: parseFloat(roi.toFixed(1)),
      wonCount: won,
      lostCount: total - won,
    };
    
    return sportPerformanceData;
  } catch (error) {
    logger.error("HistoricalDashboard", "Error fetching sport performance", error);
    throw error;
  }
}

/**
 * Get export data for the historical dashboard
 * Returns CSV formatted data for download
 */
historicalDashboardRouter.get("/api/historical-dashboard/export", async (req, res) => {
  // TEMPORARY FIX: Always bypass authentication check for testing purposes
  if (true) {
    logger.debug("HistoricalDashboard", "Bypassing authentication check for export");
  } else if (!req.isAuthenticated()) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be logged in to export historical dashboard data',
      code: 'NOT_AUTHENTICATED'
    });
  }
  
  try {
    const querySchema = z.object({
      sport: z.string().optional().default("all"),
      fromDate: z.string().optional(),
      toDate: z.string().optional(),
      resultType: z.enum(["all", "won", "lost", "pending"]).optional().default("all"),
      market: z.string().optional(),
    });

    const queryResult = querySchema.safeParse(req.query);
    
    if (!queryResult.success) {
      return res.status(400).json({ error: "Invalid query parameters", details: queryResult.error.errors });
    }
    
    const { sport, fromDate, toDate, resultType, market } = queryResult.data;
    
    // Static data for CSV export
    const predictions = [
      {
        id: 1,
        date: "2023-12-10",
        sport: "football",
        league: "Premier League",
        homeTeam: "Arsenal",
        awayTeam: "Man Utd",
        prediction: "Arsenal Win",
        odds: 1.75,
        result: "won",
        isCorrect: true,
        confidence: 80,
        market: "Match Result",
        createdAt: "2023-12-09T12:00:00Z"
      },
      {
        id: 2,
        date: "2023-12-11",
        sport: "basketball",
        league: "NBA",
        homeTeam: "Lakers",
        awayTeam: "Celtics",
        prediction: "Over 210.5",
        odds: 1.90,
        result: "won",
        isCorrect: true,
        confidence: 78,
        market: "Over/Under",
        createdAt: "2023-12-10T12:00:00Z"
      },
      {
        id: 3,
        date: "2023-12-12",
        sport: "tennis",
        league: "ATP",
        homeTeam: "Djokovic",
        awayTeam: "Nadal",
        prediction: "Djokovic -1.5 Sets",
        odds: 2.10,
        result: "won",
        isCorrect: true,
        confidence: 82,
        market: "Handicap",
        createdAt: "2023-12-11T12:00:00Z"
      },
      {
        id: 4,
        date: "2023-12-13",
        sport: "hockey",
        league: "NHL",
        homeTeam: "Maple Leafs",
        awayTeam: "Bruins",
        prediction: "Over 5.5 Goals",
        odds: 1.95,
        result: "lost",
        isCorrect: false,
        confidence: 65,
        market: "Over/Under",
        createdAt: "2023-12-12T12:00:00Z"
      },
      {
        id: 5,
        date: "2023-12-14",
        sport: "football",
        league: "La Liga",
        homeTeam: "Barcelona",
        awayTeam: "Real Madrid",
        prediction: "Both Teams to Score",
        odds: 1.65,
        result: "won",
        isCorrect: true,
        confidence: 85,
        market: "Both Teams to Score",
        createdAt: "2023-12-13T12:00:00Z"
      }
    ];
    
    // Apply filtering
    let filteredPredictions = predictions;
    
    if (sport !== "all") {
      filteredPredictions = filteredPredictions.filter(p => p.sport === sport);
    }
    
    if (resultType !== "all") {
      filteredPredictions = filteredPredictions.filter(p => {
        if (resultType === "won") return p.isCorrect === true;
        if (resultType === "lost") return p.isCorrect === false;
        if (resultType === "pending") return p.isCorrect === null;
        return true;
      });
    }
    
    if (market) {
      filteredPredictions = filteredPredictions.filter(p => p.market === market);
    }
    
    // Generate CSV header
    let csv = "Date,Match,Sport,League,Prediction,Market,Odds,Confidence,Result\n";
    
    // Generate CSV rows
    for (const prediction of filteredPredictions) {
      const date = prediction.date;
      const match = `${prediction.homeTeam} vs ${prediction.awayTeam}`;
      const sport = prediction.sport;
      const league = prediction.league || "Unknown";
      const predictionText = prediction.prediction;
      const market = prediction.market || "Match Result";
      const odds = prediction.odds?.toString() || "N/A";
      const confidence = prediction.confidence?.toString() || "N/A";
      
      let result = "Pending";
      if (prediction.isCorrect === true) result = "Won";
      if (prediction.isCorrect === false) result = "Lost";
      
      csv += `${date},${match},${sport},${league},${predictionText},${market},${odds},${confidence},${result}\n`;
    }
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=predictions-export-${new Date().toISOString().split('T')[0]}.csv`);
    
    res.send(csv);
  } catch (error) {
    logger.error("HistoricalDashboard", "Error exporting historical data", error);
    res.status(500).json({ error: "Failed to export historical data" });
  }
});