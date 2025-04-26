import { pgTable, text, serial, integer, boolean, timestamp, json, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionTier: text("subscription_tier").default("free"),
  notificationSettings: json("notification_settings").default({
    predictions: true,
    results: true,
    promotions: true,
  }),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

// Sports table
export const sports = pgTable("sports", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  isActive: boolean("is_active").default(true),
});

export const insertSportSchema = createInsertSchema(sports).pick({
  name: true,
  icon: true,
  isActive: true,
});

// Leagues table
export const leagues = pgTable("leagues", {
  id: serial("id").primaryKey(),
  sportId: integer("sport_id").notNull(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true),
});

export const insertLeagueSchema = createInsertSchema(leagues).pick({
  sportId: true,
  name: true,
  isActive: true,
});

// Matches table
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  leagueId: integer("league_id").notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  startTime: timestamp("start_time").notNull(),
  homeOdds: doublePrecision("home_odds").notNull(),
  drawOdds: doublePrecision("draw_odds"),
  awayOdds: doublePrecision("away_odds").notNull(),
  isCompleted: boolean("is_completed").default(false),
  result: text("result"),
});

export const insertMatchSchema = createInsertSchema(matches).pick({
  leagueId: true,
  homeTeam: true,
  awayTeam: true,
  startTime: true,
  homeOdds: true,
  drawOdds: true,
  awayOdds: true,
});

// Predictions table
export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  predictedOutcome: text("predicted_outcome").notNull(), // e.g., "home", "away", "draw", "btts", "over2.5"
  confidence: doublePrecision("confidence").notNull(), // 0-100 percentage
  isPremium: boolean("is_premium").default(false),
  additionalPredictions: json("additional_predictions"), // e.g., { btts: true, overUnder: "over2.5" }
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isCorrect: boolean("is_correct"),
});

export const insertPredictionSchema = createInsertSchema(predictions).pick({
  matchId: true,
  predictedOutcome: true,
  confidence: true,
  isPremium: true,
  additionalPredictions: true,
});

// User Predictions (tracking which predictions a user has viewed/saved)
export const userPredictions = pgTable("user_predictions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  predictionId: integer("prediction_id").notNull(),
  isSaved: boolean("is_saved").default(false),
  isInAccumulator: boolean("is_in_accumulator").default(false),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});

export const insertUserPredictionSchema = createInsertSchema(userPredictions).pick({
  userId: true,
  predictionId: true,
  isSaved: true,
  isInAccumulator: true,
});

// Accumulators (parlay bets)
export const accumulators = pgTable("accumulators", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  totalOdds: doublePrecision("total_odds").notNull(),
  confidence: doublePrecision("confidence"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
});

export const insertAccumulatorSchema = createInsertSchema(accumulators).pick({
  userId: true,
  name: true,
  totalOdds: true,
  confidence: true,
});

// Accumulator items (individual predictions in an accumulator)
export const accumulatorItems = pgTable("accumulator_items", {
  id: serial("id").primaryKey(),
  accumulatorId: integer("accumulator_id").notNull(),
  predictionId: integer("prediction_id").notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const insertAccumulatorItemSchema = createInsertSchema(accumulatorItems).pick({
  accumulatorId: true,
  predictionId: true,
});

// Define subscription tiers
export const subscriptionTiers = {
  FREE: "free",
  BASIC: "basic",
  PRO: "pro",
  ELITE: "elite",
};

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Sport = typeof sports.$inferSelect;
export type InsertSport = z.infer<typeof insertSportSchema>;
export type League = typeof leagues.$inferSelect;
export type InsertLeague = z.infer<typeof insertLeagueSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type UserPrediction = typeof userPredictions.$inferSelect;
export type InsertUserPrediction = z.infer<typeof insertUserPredictionSchema>;
export type Accumulator = typeof accumulators.$inferSelect;
export type InsertAccumulator = z.infer<typeof insertAccumulatorSchema>;
export type AccumulatorItem = typeof accumulatorItems.$inferSelect;
export type InsertAccumulatorItem = z.infer<typeof insertAccumulatorItemSchema>;
