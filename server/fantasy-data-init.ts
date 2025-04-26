import { storage } from './storage';
import { FantasyContest } from '@shared/schema';

export async function initializeFantasyData() {
  console.log('Initializing fantasy football data...');
  
  try {
    // Check if getAllFantasyContests method exists
    if (typeof (storage as any).getAllFantasyContests !== 'function') {
      console.log('Storage does not have getAllFantasyContests method, adding implementation');
      
      // Add method if missing (this is a safeguard)
      (storage as any).getAllFantasyContests = async function(limit = 20, status?: string, tier?: string) {
        // @ts-ignore
        let contests = Array.from(this.fantasyContestsMap.values());
        
        if (status) {
          contests = contests.filter((contest: any) => contest.status === status);
        }
        
        if (tier) {
          contests = contests.filter((contest: any) => contest.tier === tier);
        }
        
        // Sort by startDate descending (newest first)
        contests.sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        
        return contests.slice(0, limit);
      };
      
      // Also ensure getFreeFantasyContests exists
      (storage as any).getFreeFantasyContests = async function(limit = 20, status?: string) {
        return (storage as any).getAllFantasyContests(limit, status, 'free');
      };
      
      // Also ensure getPremiumFantasyContests exists
      (storage as any).getPremiumFantasyContests = async function(limit = 20, status?: string) {
        return (storage as any).getAllFantasyContests(limit, status, 'premium');
      };
    }
    
    // Check if we already have contests
    const existingContests = await (storage as any).getAllFantasyContests();
    if (existingContests && existingContests.length > 0) {
      console.log(`Found ${existingContests.length} existing fantasy contests, skipping initialization`);
      return;
    }
  } catch (error) {
    console.error('Error checking fantasy contests:', error);
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
  
  // Ensure all required fantasy methods exist
  if (typeof (storage as any).createFantasyContest !== 'function') {
    console.log('Storage does not have createFantasyContest method, adding implementation');
    
    // Add method if missing
    (storage as any).createFantasyContest = async function(contest: any) {
      // @ts-ignore
      const id = this.fantasyContestIdCounter++;
      const now = new Date();
      const newContest = {
        ...contest,
        id,
        status: 'upcoming',
        playerCount: 0,
        createdAt: now,
        updatedAt: now
      };
      // @ts-ignore
      this.fantasyContestsMap.set(id, newContest);
      return newContest;
    };
  }
  
  // Add getFantasyContestById method if missing
  if (typeof (storage as any).getFantasyContestById !== 'function') {
    console.log('Storage does not have getFantasyContestById method, adding implementation');
    
    (storage as any).getFantasyContestById = async function(id: number) {
      // @ts-ignore
      return this.fantasyContestsMap.get(id);
    };
  }
  
  // Add getUserContestEntries method if missing
  if (typeof (storage as any).getUserContestEntries !== 'function') {
    console.log('Storage does not have getUserContestEntries method, adding implementation');
    
    (storage as any).getUserContestEntries = async function(userId: number) {
      // @ts-ignore
      return Array.from(this.fantasyContestEntriesMap.values())
        .filter((entry: any) => entry.userId === userId);
    };
  }
  
  // Add getContestLeaderboard method if missing
  if (typeof (storage as any).getContestLeaderboard !== 'function') {
    console.log('Storage does not have getContestLeaderboard method, adding implementation');
    
    (storage as any).getContestLeaderboard = async function(contestId: number) {
      // @ts-ignore
      return Array.from(this.fantasyContestEntriesMap.values())
        .filter((entry: any) => entry.contestId === contestId)
        .sort((a: any, b: any) => (b.totalPoints || 0) - (a.totalPoints || 0));
    };
  }
  
  // Add getFantasyTeamById method if missing
  if (typeof (storage as any).getFantasyTeamById !== 'function') {
    console.log('Storage does not have getFantasyTeamById method, adding implementation');
    
    (storage as any).getFantasyTeamById = async function(id: number) {
      // @ts-ignore
      return this.fantasyTeamsMap.get(id);
    };
  }
  
  // Add createContestEntry method if missing
  if (typeof (storage as any).createContestEntry !== 'function') {
    console.log('Storage does not have createContestEntry method, adding implementation');
    
    (storage as any).createContestEntry = async function(entryData: any) {
      // @ts-ignore
      const id = this.fantasyContestEntryIdCounter++;
      const now = new Date();
      const entry = {
        ...entryData,
        id,
        createdAt: now,
        updatedAt: now,
        rank: null,
        prizeWon: null,
        totalPoints: entryData.totalPoints || 0
      };
      // @ts-ignore
      this.fantasyContestEntriesMap.set(id, entry);
      
      // Update contest player count
      // @ts-ignore
      const contest = await this.getFantasyContestById(entryData.contestId);
      if (contest) {
        contest.playerCount = (contest.playerCount || 0) + 1;
        // @ts-ignore
        this.fantasyContestsMap.set(contest.id, contest);
      }
      
      return entry;
    };
  }
  
  // Add updateUser method if missing
  if (typeof (storage as any).updateUser !== 'function') {
    console.log('Storage does not have updateUser method, adding implementation');
    
    (storage as any).updateUser = async function(id: number, updates: any) {
      // @ts-ignore
      const user = this.usersMap.get(id);
      if (!user) return null;
      
      const updatedUser = {
        ...user,
        ...updates
      };
      // @ts-ignore
      this.usersMap.set(id, updatedUser);
      return updatedUser;
    };
  }
  
  // Insert free contests
  for (const contestData of freeContests) {
    try {
      await (storage as any).createFantasyContest(contestData);
      console.log(`Created free contest: ${contestData.name}`);
    } catch (error) {
      console.error(`Error creating free contest ${contestData.name}:`, error);
    }
  }
  
  // Insert premium contests
  for (const contestData of premiumContests) {
    try {
      await (storage as any).createFantasyContest(contestData);
      console.log(`Created premium contest: ${contestData.name}`);
    } catch (error) {
      console.error(`Error creating premium contest ${contestData.name}:`, error);
    }
  }
  
  console.log('Fantasy data initialization complete!');
}