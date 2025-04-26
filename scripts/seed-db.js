import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';
import * as schema from '../shared/schema.js';

// Configure Neon for WebSockets
neonConfig.webSocketConstructor = ws;

async function main() {
  console.log('🌱 Seeding database with initial data...');

  // Connect to the database
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  try {
    // Add sample sports
    console.log('Adding sports...');
    const sportsData = [
      { name: "Soccer", icon: "fa-futbol", isActive: true },
      { name: "Basketball", icon: "fa-basketball-ball", isActive: true },
      { name: "American Football", icon: "fa-football-ball", isActive: true },
      { name: "Baseball", icon: "fa-baseball-ball", isActive: true },
      { name: "Hockey", icon: "fa-hockey-puck", isActive: true },
      { name: "Tennis", icon: "fa-table-tennis", isActive: true }
    ];
    
    for (const sport of sportsData) {
      await db.insert(schema.sports).values(sport).onConflictDoNothing();
    }
    
    // Add sample leagues
    console.log('Adding leagues...');
    const leaguesData = [
      { sportId: 1, name: "Premier League", isActive: true },
      { sportId: 1, name: "La Liga", isActive: true },
      { sportId: 1, name: "Bundesliga", isActive: true },
      { sportId: 1, name: "Serie A", isActive: true },
      { sportId: 2, name: "NBA", isActive: true },
      { sportId: 2, name: "EuroLeague", isActive: true },
      { sportId: 3, name: "NFL", isActive: true },
      { sportId: 4, name: "MLB", isActive: true },
      { sportId: 5, name: "NHL", isActive: true },
      { sportId: 6, name: "ATP", isActive: true }
    ];
    
    for (const league of leaguesData) {
      await db.insert(schema.leagues).values(league).onConflictDoNothing();
    }
    
    // Add sample matches
    console.log('Adding matches...');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const matchesData = [
      { 
        leagueId: 1, 
        homeTeam: "Manchester City", 
        awayTeam: "Liverpool", 
        startTime: new Date(today.getTime() + 6 * 60 * 60 * 1000), 
        homeOdds: 2.10, 
        drawOdds: 3.40, 
        awayOdds: 3.20,
        isCompleted: false
      },
      { 
        leagueId: 2, 
        homeTeam: "Barcelona", 
        awayTeam: "Real Madrid", 
        startTime: new Date(today.getTime() + 8 * 60 * 60 * 1000), 
        homeOdds: 1.85, 
        drawOdds: 3.50, 
        awayOdds: 4.20,
        isCompleted: false
      },
      { 
        leagueId: 3, 
        homeTeam: "Bayern Munich", 
        awayTeam: "Dortmund", 
        startTime: new Date(today.getTime() + 4 * 60 * 60 * 1000), 
        homeOdds: 1.60, 
        drawOdds: 4.00, 
        awayOdds: 5.50,
        isCompleted: false
      },
      { 
        leagueId: 5, 
        homeTeam: "Los Angeles Lakers", 
        awayTeam: "Golden State Warriors", 
        startTime: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000), 
        homeOdds: 1.90,
        awayOdds: 1.90,
        isCompleted: false
      },
      { 
        leagueId: 7, 
        homeTeam: "Kansas City Chiefs", 
        awayTeam: "San Francisco 49ers", 
        startTime: new Date(tomorrow.getTime() + 12 * 60 * 60 * 1000), 
        homeOdds: 1.70,
        awayOdds: 2.10,
        isCompleted: false
      }
    ];
    
    for (const match of matchesData) {
      await db.insert(schema.matches).values(match).onConflictDoNothing();
    }
    
    // Add sample predictions
    console.log('Adding predictions...');
    const predictionsData = [
      {
        matchId: 1,
        predictedOutcome: "home",
        confidence: 85,
        isPremium: false,
        additionalPredictions: { btts: true, overUnder: "over2.5" }
      },
      {
        matchId: 2,
        predictedOutcome: "home",
        confidence: 95,
        isPremium: true,
        additionalPredictions: { btts: true, overUnder: "over3.5" }
      },
      {
        matchId: 3,
        predictedOutcome: "home_over2.5",
        confidence: 80,
        isPremium: false,
        additionalPredictions: { btts: true, overUnder: "over2.5" }
      },
      {
        matchId: 4,
        predictedOutcome: "away",
        confidence: 70,
        isPremium: true,
        additionalPredictions: { overUnder: "over220.5", marginOfVictory: "+5.5" }
      },
      {
        matchId: 5,
        predictedOutcome: "home",
        confidence: 75,
        isPremium: true,
        additionalPredictions: { overUnder: "over48.5", marginOfVictory: "+3.5" }
      }
    ];
    
    for (const prediction of predictionsData) {
      await db.insert(schema.predictions).values(prediction).onConflictDoNothing();
    }

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Failed to seed database:', err);
  process.exit(1);
});