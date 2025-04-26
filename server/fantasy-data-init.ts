import { storage } from './storage';
import { FantasyContest } from '@shared/schema';

export async function initializeFantasyData() {
  console.log('Initializing fantasy football data...');
  
  // Check if we already have contests
  const existingContests = await storage.getAllFantasyContests();
  if (existingContests.length > 0) {
    console.log(`Found ${existingContests.length} existing fantasy contests, skipping initialization`);
    return;
  }
  
  // Create free contests
  const freeContests = [
    {
      name: 'Weekly Warrior Challenge',
      description: 'Compete against other managers in this free weekly contest. Top performers win fantasy points and badges.',
      startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // tomorrow
      endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 1 week from tomorrow
      entryFee: 0,
      prizePool: {
        total: 1000,
        distribution: [
          { position: 1, percentage: 30 },
          { position: 2, percentage: 20 },
          { position: 3, percentage: 15 },
          { position: 4, percentage: 10 },
          { position: 5, percentage: 10 },
          { position: [6, 10], percentage: 3 }
        ]
      },
      maxTeams: 100,
      tier: 'free',
      type: 'classic',
      gameweekIds: [1, 2],
      rules: {
        teamSize: 11,
        budget: 100,
        maxPlayersPerTeam: 3,
        positions: {
          GK: { min: 1, max: 1 },
          DEF: { min: 3, max: 5 },
          MID: { min: 3, max: 5 },
          FWD: { min: 1, max: 3 }
        }
      }
    },
    {
      name: 'Rookie Cup',
      description: 'Perfect for new managers. Learn the ropes and compete for small prizes with no entry fee.',
      startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      entryFee: 0,
      prizePool: {
        total: 500,
        distribution: [
          { position: 1, percentage: 40 },
          { position: 2, percentage: 30 },
          { position: 3, percentage: 20 },
          { position: [4, 5], percentage: 5 }
        ]
      },
      maxTeams: 200,
      tier: 'free',
      type: 'classic',
      gameweekIds: [2, 3],
      rules: {
        teamSize: 11,
        budget: 100,
        maxPlayersPerTeam: 3,
        positions: {
          GK: { min: 1, max: 1 },
          DEF: { min: 3, max: 5 },
          MID: { min: 3, max: 5 },
          FWD: { min: 1, max: 3 }
        }
      }
    },
    {
      name: 'Weekend Showdown',
      description: 'Fast-paced weekend contest with matches from Saturday and Sunday only.',
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      entryFee: 0,
      prizePool: {
        total: 750,
        distribution: [
          { position: 1, percentage: 35 },
          { position: 2, percentage: 25 },
          { position: 3, percentage: 15 },
          { position: [4, 10], percentage: 5 }
        ]
      },
      maxTeams: 150,
      tier: 'free',
      type: 'classic',
      gameweekIds: [3],
      rules: {
        teamSize: 11,
        budget: 100,
        maxPlayersPerTeam: 3,
        positions: {
          GK: { min: 1, max: 1 },
          DEF: { min: 3, max: 5 },
          MID: { min: 3, max: 5 },
          FWD: { min: 1, max: 3 }
        }
      }
    }
  ];
  
  // Create premium contests
  const premiumContests = [
    {
      name: 'Champions League',
      description: 'Exclusive premium contest with a £100 prize pool. Only available to premium subscribers.',
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
      entryFee: 0, // Free for premium subscribers
      prizePool: {
        total: 10000,
        distribution: [
          { position: 1, percentage: 30 },
          { position: 2, percentage: 20 },
          { position: 3, percentage: 15 },
          { position: [4, 10], percentage: 5 }
        ],
        currencySymbol: '£',
        realMoney: true
      },
      maxTeams: 100,
      tier: 'premium',
      type: 'classic',
      gameweekIds: [1, 2, 3],
      rules: {
        teamSize: 11,
        budget: 100,
        maxPlayersPerTeam: 3,
        positions: {
          GK: { min: 1, max: 1 },
          DEF: { min: 3, max: 5 },
          MID: { min: 3, max: 5 },
          FWD: { min: 1, max: 3 }
        }
      }
    },
    {
      name: 'Elite Manager Challenge',
      description: 'Test your skills against the best fantasy managers. £50 prize pool for top performers.',
      startDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      entryFee: 0,
      prizePool: {
        total: 5000,
        distribution: [
          { position: 1, percentage: 40 },
          { position: 2, percentage: 25 },
          { position: 3, percentage: 15 },
          { position: [4, 5], percentage: 10 }
        ],
        currencySymbol: '£',
        realMoney: true
      },
      maxTeams: 50,
      tier: 'premium',
      type: 'classic',
      gameweekIds: [2, 3, 4, 5],
      rules: {
        teamSize: 11,
        budget: 100,
        maxPlayersPerTeam: 3,
        positions: {
          GK: { min: 1, max: 1 },
          DEF: { min: 3, max: 5 },
          MID: { min: 3, max: 5 },
          FWD: { min: 1, max: 3 }
        }
      }
    }
  ];
  
  // Insert free contests
  for (const contestData of freeContests) {
    await storage.createFantasyContest(contestData);
    console.log(`Created free contest: ${contestData.name}`);
  }
  
  // Insert premium contests
  for (const contestData of premiumContests) {
    await storage.createFantasyContest(contestData);
    console.log(`Created premium contest: ${contestData.name}`);
  }
  
  console.log('Fantasy data initialization complete!');
}