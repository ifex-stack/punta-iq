import { pgTable, text, serial, integer, boolean, timestamp, json, doublePrecision, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Define enums
export const playerPositionEnum = pgEnum('player_position', ['goalkeeper', 'defender', 'midfielder', 'forward']);
export const fantasyContestStatusEnum = pgEnum('fantasy_contest_status', ['upcoming', 'active', 'completed', 'cancelled']);
export const fantasyContestTierEnum = pgEnum('fantasy_contest_tier', ['free', 'premium']);
export const badgeTierEnum = pgEnum('badge_tier', ['bronze', 'silver', 'gold', 'platinum', 'diamond']);
export const leaderboardTypeEnum = pgEnum('leaderboard_type', ['weekly', 'monthly', 'seasonal', 'all_time', 'fantasy', 'prediction_accuracy']);

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  deviceImei: text("device_imei"), // IMEI for mobile device identification
  phoneNumber: text("phone_number"), // For 2FA
  isTwoFactorEnabled: boolean("is_two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"), // Secret for 2FA
  referralCode: text("referral_code"), // Unique referral code for this user
  referredBy: integer("referred_by"), // ID of user who referred this user
  createdAt: timestamp("created_at").defaultNow().notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionTier: text("subscription_tier").default("free"),
  notificationSettings: json("notification_settings").default({
    predictions: true,
    results: true,
    promotions: true,
  }),
  // Fantasy gamification properties
  fantasyPoints: integer("fantasy_points").default(0).notNull(),
  totalContestsWon: integer("total_contests_won").default(0).notNull(),
  totalContestsEntered: integer("total_contests_entered").default(0).notNull(),
  
  // Referral gamification properties
  referralStreak: integer("referral_streak").default(0).notNull(),
  lastReferralDate: timestamp("last_referral_date"),
});

// Referrals table
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  referredId: integer("referred_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text("status").default("pending").notNull(), // pending, completed, rewarded
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  rewardAmount: integer("reward_amount"),
  rewardDate: timestamp("reward_date"),
});

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  fantasyTeams: many(fantasyTeams),
  fantasyEntries: many(fantasyContestEntries),
  pointsTransactions: many(pointsTransactions),
  userBadges: many(userBadges),
  leaderboardEntries: many(leaderboardEntries),
  referralsAsReferrer: many(referrals, { relationName: "referrer" }),
  referralsAsReferred: many(referrals, { relationName: "referred" }),
}));

// Referrals relations
export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: "referrer",
  }),
  referred: one(users, {
    fields: [referrals.referredId],
    references: [users.id],
    relationName: "referred",
  }),
}));

export const insertReferralSchema = createInsertSchema(referrals).pick({
  referrerId: true,
  referredId: true,
  status: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  deviceImei: true,
  phoneNumber: true,
  referralCode: true,
  referredBy: true,
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

// Fantasy Teams
export const fantasyTeams = pgTable("fantasy_teams", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  formation: text("formation").default("4-4-2"),
  totalPoints: integer("total_points").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Fantasy Teams relations
export const fantasyTeamsRelations = relations(fantasyTeams, ({ one, many }) => ({
  user: one(users, {
    fields: [fantasyTeams.userId],
    references: [users.id],
  }),
  players: many(fantasyTeamPlayers),
  entries: many(fantasyContestEntries),
}));

// Football Players
export const footballPlayers = pgTable("football_players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  position: playerPositionEnum("position").notNull(),
  team: text("team").notNull(),
  league: text("league").notNull(),
  country: text("country"),
  imageUrl: text("image_url"),
  externalId: text("external_id"), // ID from external API for data synchronization
  active: boolean("active").default(true),
  // Stats
  appearances: integer("appearances").default(0),
  goals: integer("goals").default(0),
  assists: integer("assists").default(0),
  yellowCards: integer("yellow_cards").default(0),
  redCards: integer("red_cards").default(0),
  cleanSheets: integer("clean_sheets").default(0),
  minutesPlayed: integer("minutes_played").default(0),
  fantasyPointsTotal: integer("fantasy_points_total").default(0),
  fantasyPointsAvg: doublePrecision("fantasy_points_avg").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Football Players relations
export const footballPlayersRelations = relations(footballPlayers, ({ many }) => ({
  fantasyTeamPlayers: many(fantasyTeamPlayers),
  playerGameweekStats: many(playerGameweekStats),
}));

// Fantasy Team Players (junction table)
export const fantasyTeamPlayers = pgTable("fantasy_team_players", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => fantasyTeams.id, { onDelete: 'cascade' }),
  playerId: integer("player_id").notNull().references(() => footballPlayers.id),
  isCaptain: boolean("is_captain").default(false),
  isViceCaptain: boolean("is_vice_captain").default(false),
  position: integer("position").notNull(), // Position in the formation (1-11)
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

// Fantasy Team Players relations
export const fantasyTeamPlayersRelations = relations(fantasyTeamPlayers, ({ one }) => ({
  team: one(fantasyTeams, {
    fields: [fantasyTeamPlayers.teamId],
    references: [fantasyTeams.id],
  }),
  player: one(footballPlayers, {
    fields: [fantasyTeamPlayers.playerId],
    references: [footballPlayers.id],
  }),
}));

// Fantasy Contests
export const fantasyContests = pgTable("fantasy_contests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  entryFee: integer("entry_fee").default(0), // In fantasy points
  prizePool: json("prize_pool").notNull(), // JSON describing prize distribution
  maxTeams: integer("max_teams"), // Optional limit on number of entries
  status: fantasyContestStatusEnum("status").default("upcoming").notNull(),
  tier: fantasyContestTierEnum("tier").default("free").notNull(), // 'free' or 'premium'
  type: text("type").default("classic"), // "classic", "head-to-head", "league"
  gameweekIds: json("gameweek_ids"), // Array of gameweek IDs included in this contest
  rules: json("rules"), // Specific contest rules
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Fantasy Contests relations
export const fantasyContestsRelations = relations(fantasyContests, ({ many }) => ({
  entries: many(fantasyContestEntries),
  gameweeks: many(fantasyGameweeks),
}));

// Fantasy Gameweeks
export const fantasyGameweeks = pgTable("fantasy_gameweeks", {
  id: serial("id").primaryKey(),
  contestId: integer("contest_id").references(() => fantasyContests.id, { onDelete: 'cascade' }),
  number: integer("number").notNull(),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  fixtures: json("fixtures"), // JSON with match fixtures for this gameweek
  status: fantasyContestStatusEnum("status").default("upcoming").notNull(),
  isProcessed: boolean("is_processed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Fantasy Gameweeks relations
export const fantasyGameweeksRelations = relations(fantasyGameweeks, ({ one, many }) => ({
  contest: one(fantasyContests, {
    fields: [fantasyGameweeks.contestId],
    references: [fantasyContests.id],
  }),
  playerStats: many(playerGameweekStats),
}));

// Player Gameweek Stats
export const playerGameweekStats = pgTable("player_gameweek_stats", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => footballPlayers.id),
  gameweekId: integer("gameweek_id").notNull().references(() => fantasyGameweeks.id, { onDelete: 'cascade' }),
  // Performance stats
  minutesPlayed: integer("minutes_played").default(0),
  goals: integer("goals").default(0),
  assists: integer("assists").default(0),
  cleanSheet: boolean("clean_sheet").default(false),
  yellowCards: integer("yellow_cards").default(0),
  redCard: boolean("red_card").default(false),
  saves: integer("saves").default(0),
  penaltiesSaved: integer("penalties_saved").default(0),
  penaltiesMissed: integer("penalties_missed").default(0),
  ownGoals: integer("own_goals").default(0),
  // Fantasy points
  totalPoints: integer("total_points").default(0),
  bonusPoints: integer("bonus_points").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Player Gameweek Stats relations
export const playerGameweekStatsRelations = relations(playerGameweekStats, ({ one }) => ({
  player: one(footballPlayers, {
    fields: [playerGameweekStats.playerId],
    references: [footballPlayers.id],
  }),
  gameweek: one(fantasyGameweeks, {
    fields: [playerGameweekStats.gameweekId],
    references: [fantasyGameweeks.id],
  }),
}));

// Fantasy Contest Entries
export const fantasyContestEntries = pgTable("fantasy_contest_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  contestId: integer("contest_id").notNull().references(() => fantasyContests.id, { onDelete: 'cascade' }),
  teamId: integer("team_id").notNull().references(() => fantasyTeams.id),
  rank: integer("rank"),
  totalPoints: integer("total_points").default(0),
  prizeWon: integer("prize_won"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Fantasy Contest Entries relations
export const fantasyContestEntriesRelations = relations(fantasyContestEntries, ({ one }) => ({
  user: one(users, {
    fields: [fantasyContestEntries.userId],
    references: [users.id],
  }),
  contest: one(fantasyContests, {
    fields: [fantasyContestEntries.contestId],
    references: [fantasyContests.id],
  }),
  team: one(fantasyTeams, {
    fields: [fantasyContestEntries.teamId],
    references: [fantasyTeams.id],
  }),
}));

// Points Transactions
export const pointsTransactions = pgTable("points_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // "earn", "spend", "refund", "bonus", "prize"
  description: text("description").notNull(),
  relatedId: integer("related_id"), // ID of related entity (contest, prediction, etc.)
  relatedType: text("related_type"), // Type of related entity
  balanceAfter: integer("balance_after").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Points Transactions relations
export const pointsTransactionsRelations = relations(pointsTransactions, ({ one }) => ({
  user: one(users, {
    fields: [pointsTransactions.userId],
    references: [users.id],
  }),
}));

// Insert schemas for fantasy feature
export const insertFantasyTeamSchema = createInsertSchema(fantasyTeams).pick({
  userId: true,
  name: true,
  logoUrl: true,
  formation: true,
});

export const insertFootballPlayerSchema = createInsertSchema(footballPlayers).pick({
  name: true,
  position: true,
  team: true,
  league: true,
  country: true,
  imageUrl: true,
  externalId: true,
});

export const insertFantasyTeamPlayerSchema = createInsertSchema(fantasyTeamPlayers).pick({
  teamId: true,
  playerId: true,
  isCaptain: true,
  isViceCaptain: true,
  position: true,
});

export const insertFantasyContestSchema = createInsertSchema(fantasyContests).pick({
  name: true,
  description: true,
  startDate: true,
  endDate: true,
  entryFee: true,
  prizePool: true,
  maxTeams: true,
  tier: true,
  type: true,
  gameweekIds: true,
  rules: true,
});

export const insertFantasyGameweekSchema = createInsertSchema(fantasyGameweeks).pick({
  contestId: true,
  number: true,
  name: true,
  startDate: true,
  endDate: true,
  fixtures: true,
});

export const insertFantasyContestEntrySchema = createInsertSchema(fantasyContestEntries).pick({
  userId: true,
  contestId: true,
  teamId: true,
});

export const insertPlayerGameweekStatsSchema = createInsertSchema(playerGameweekStats).pick({
  playerId: true,
  gameweekId: true,
  minutesPlayed: true,
  goals: true,
  assists: true,
  cleanSheet: true,
  yellowCards: true,
  redCard: true,
  saves: true,
  penaltiesSaved: true,
  penaltiesMissed: true,
  ownGoals: true,
  bonusPoints: true,
});

export const insertPointsTransactionSchema = createInsertSchema(pointsTransactions).pick({
  userId: true,
  amount: true,
  type: true,
  description: true,
  relatedId: true,
  relatedType: true,
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'info', 'success', 'warning', 'error'
  link: text("link"),
  icon: text("icon"),
  read: boolean("read").default(false),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  data: json("data"), // Additional JSON data specific to the notification type
});

// Notifications relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  title: true,
  message: true,
  type: true,
  link: true,
  icon: true,
  expiresAt: true,
  data: true,
});

// Push tokens table for mobile and web push notifications
export const pushTokens = pgTable("push_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text("token").notNull(),
  platform: text("platform").notNull(), // 'ios', 'android', 'web'
  deviceName: text("device_name"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at").defaultNow().notNull(),
});

// Push tokens relations
export const pushTokensRelations = relations(pushTokens, ({ one }) => ({
  user: one(users, {
    fields: [pushTokens.userId],
    references: [users.id],
  }),
}));

export const insertPushTokenSchema = createInsertSchema(pushTokens).pick({
  userId: true,
  token: true,
  platform: true,
  deviceName: true,
});

// Define subscription tiers
export const subscriptionTiers = {
  FREE: "free",
  BASIC: "basic",
  PRO: "pro",
  ELITE: "elite",
};

// Badges table for gamification
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'prediction', 'fantasy', 'engagement', 'achievement'
  icon: text("icon").notNull(),
  tier: badgeTierEnum("tier").default("bronze").notNull(),
  points: integer("points").default(0).notNull(), // Points awarded for earning this badge
  requirements: json("requirements").notNull(), // JSON with requirements to earn this badge
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User Badges (junction table for users and their earned badges)
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  badgeId: integer("badge_id").notNull().references(() => badges.id, { onDelete: 'cascade' }),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
  progress: json("progress"), // For badges that have progress towards completion
  isNew: boolean("is_new").default(true).notNull(), // Track if user has viewed this badge yet
});

// Relations for badges
export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}));

// Relations for user badges
export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

// Leaderboards
export const leaderboards = pgTable("leaderboards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: leaderboardTypeEnum("type").notNull(),
  period: text("period"), // 'current', '2023-W01' (weekly), '2023-01' (monthly), '2023-Q1' (quarterly), '2023' (yearly)
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  rules: json("rules"), // Specific scoring rules for this leaderboard
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Leaderboard entries (user rankings)
export const leaderboardEntries = pgTable("leaderboard_entries", {
  id: serial("id").primaryKey(),
  leaderboardId: integer("leaderboard_id").notNull().references(() => leaderboards.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  points: integer("points").default(0).notNull(),
  rank: integer("rank"), // Current position in the leaderboard
  previousRank: integer("previous_rank"), // Track rank changes
  details: json("details"), // JSON with detailed scoring breakdown
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Relations for leaderboards
export const leaderboardsRelations = relations(leaderboards, ({ many }) => ({
  entries: many(leaderboardEntries),
}));

// Relations for leaderboard entries
export const leaderboardEntriesRelations = relations(leaderboardEntries, ({ one }) => ({
  leaderboard: one(leaderboards, {
    fields: [leaderboardEntries.leaderboardId],
    references: [leaderboards.id],
  }),
  user: one(users, {
    fields: [leaderboardEntries.userId],
    references: [users.id],
  }),
}));

// Insert schemas for badges
export const insertBadgeSchema = createInsertSchema(badges).pick({
  name: true,
  description: true,
  category: true,
  icon: true,
  tier: true,
  points: true,
  requirements: true,
  isActive: true,
});

// Insert schema for user badges
export const insertUserBadgeSchema = createInsertSchema(userBadges).pick({
  userId: true,
  badgeId: true,
  progress: true,
});

// Insert schema for leaderboards
export const insertLeaderboardSchema = createInsertSchema(leaderboards).pick({
  name: true,
  description: true,
  type: true,
  period: true,
  startDate: true,
  endDate: true,
  isActive: true,
  rules: true,
});

// Insert schema for leaderboard entries
export const insertLeaderboardEntrySchema = createInsertSchema(leaderboardEntries).pick({
  leaderboardId: true,
  userId: true,
  points: true,
  rank: true,
  previousRank: true,
  details: true,
});

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

// Fantasy feature types
export type FantasyTeam = typeof fantasyTeams.$inferSelect;
export type InsertFantasyTeam = z.infer<typeof insertFantasyTeamSchema>;
export type FootballPlayer = typeof footballPlayers.$inferSelect;
export type InsertFootballPlayer = z.infer<typeof insertFootballPlayerSchema>;
export type FantasyTeamPlayer = typeof fantasyTeamPlayers.$inferSelect;
export type InsertFantasyTeamPlayer = z.infer<typeof insertFantasyTeamPlayerSchema>;
export type FantasyContest = typeof fantasyContests.$inferSelect;
export type InsertFantasyContest = z.infer<typeof insertFantasyContestSchema>;
export type FantasyGameweek = typeof fantasyGameweeks.$inferSelect;
export type InsertFantasyGameweek = z.infer<typeof insertFantasyGameweekSchema>;
export type FantasyContestEntry = typeof fantasyContestEntries.$inferSelect;
export type InsertFantasyContestEntry = z.infer<typeof insertFantasyContestEntrySchema>;
export type PlayerGameweekStat = typeof playerGameweekStats.$inferSelect;
export type InsertPlayerGameweekStat = z.infer<typeof insertPlayerGameweekStatsSchema>;
export type PointsTransaction = typeof pointsTransactions.$inferSelect;
export type InsertPointsTransaction = z.infer<typeof insertPointsTransactionSchema>;

// Notification types
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = z.infer<typeof insertPushTokenSchema>;

// Gamification types
export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type Leaderboard = typeof leaderboards.$inferSelect;
export type InsertLeaderboard = z.infer<typeof insertLeaderboardSchema>;
export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;
export type InsertLeaderboardEntry = z.infer<typeof insertLeaderboardEntrySchema>;

// Referral types
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
