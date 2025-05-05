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
  // Check if user is authenticated
  if (!req.isAuthenticated()) {
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
    
    // Calculate metrics for the historical dashboard
    const metrics = await calculateHistoricalMetrics(sport, fromDate, toDate, resultType);
    
    // Get predictions based on filters with pagination
    const predictionsData = await getPredictions(sport, fromDate, toDate, resultType, market, page, limit);
    
    // Get monthly performance data
    const monthlyPerformance = await getMonthlyPerformance(sport);
    
    // Get sport-specific performance data
    const sportPerformance = await getSportPerformance();
    
    // Return combined response
    res.json({
      metrics,
      predictions: predictionsData.predictions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(predictionsData.total / limit),
        total: predictionsData.total,
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
  // Check if user is authenticated
  if (!req.isAuthenticated()) {
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
    
    // Get all predictions matching the criteria (no pagination for export)
    const predictionResults = await db
      .select()
      .from(predictions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(predictions.createdAt));
    
    // Generate CSV header
    let csv = "Date,Match,Sport,League,Prediction,Market,Odds,Confidence,Result\n";
    
    // Generate CSV rows
    for (const prediction of predictionResults) {
      const date = new Date(prediction.createdAt).toISOString().split('T')[0];
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