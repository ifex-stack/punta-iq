import { FantasyContest } from '@shared/schema';

// Create a memory-only fantasy data store for development
// This approach allows us to avoid modifying the storage interface for now
class FantasyMemoryStore {
  private fantasyContests: FantasyContest[] = [];
  private fantasyTeams: any[] = [];
  private fantasyContestEntries: any[] = [];
  private contestIdCounter = 1;
  private teamIdCounter = 1;
  private entryIdCounter = 1;
  
  getAllFantasyContests(limit = 20, status?: string, tier?: string): FantasyContest[] {
    let contests = [...this.fantasyContests];
    
    if (status) {
      contests = contests.filter(contest => contest.status === status);
    }
    
    if (tier) {
      contests = contests.filter(contest => contest.tier === tier);
    }
    
    // Sort by startDate descending (newest first)
    contests.sort((a, b) => {
      const dateA = a.startDate instanceof Date ? a.startDate : new Date(a.startDate);
      const dateB = b.startDate instanceof Date ? b.startDate : new Date(b.startDate);
      return dateB.getTime() - dateA.getTime();
    });
    
    return contests.slice(0, limit);
  }
  
  getFreeFantasyContests(limit = 20, status?: string): FantasyContest[] {
    return this.getAllFantasyContests(limit, status, 'free');
  }
  
  getPremiumFantasyContests(limit = 20, status?: string): FantasyContest[] {
    return this.getAllFantasyContests(limit, status, 'premium');
  }
  
  getFantasyContestById(id: number): FantasyContest | undefined {
    return this.fantasyContests.find(contest => contest.id === id);
  }
  
  createFantasyContest(contest: any): FantasyContest {
    const id = this.contestIdCounter++;
    const now = new Date();
    const newContest: FantasyContest = {
      ...contest,
      id,
      status: 'upcoming',
      playerCount: 0,
      createdAt: now,
      updatedAt: now
    } as FantasyContest;
    
    this.fantasyContests.push(newContest);
    return newContest;
  }
  
  getFantasyTeamById(id: number): any | undefined {
    return this.fantasyTeams.find(team => team.id === id);
  }
  
  getUserContestEntries(userId: number): any[] {
    return this.fantasyContestEntries.filter(entry => entry.userId === userId);
  }
  
  createContestEntry(entry: any): any {
    const id = this.entryIdCounter++;
    const now = new Date();
    const newEntry = {
      ...entry,
      id,
      createdAt: now,
      updatedAt: now,
      rank: null,
      prizeWon: null,
      totalPoints: entry.totalPoints || 0
    };
    
    this.fantasyContestEntries.push(newEntry);
    
    // Update contest player count
    const contest = this.getFantasyContestById(entry.contestId);
    if (contest) {
      contest.playerCount = (contest.playerCount || 0) + 1;
    }
    
    return newEntry;
  }
  
  getContestLeaderboard(contestId: number): any[] {
    return this.fantasyContestEntries
      .filter(entry => entry.contestId === contestId)
      .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
  }
  
  updateFantasyContestStatus(id: number, status: string): FantasyContest | null {
    const contestIndex = this.fantasyContests.findIndex(c => c.id === id);
    if (contestIndex === -1) return null;
    
    const contest = this.fantasyContests[contestIndex];
    const updatedContest = {
      ...contest,
      status,
      updatedAt: new Date()
    } as FantasyContest;
    
    this.fantasyContests[contestIndex] = updatedContest;
    return updatedContest;
  }
}

// Create a singleton instance
const fantasyStore = new FantasyMemoryStore();

// Export it to be used in API routes
export const getFantasyStore = () => fantasyStore;

export async function initializeFantasyData() {
  console.log('Initializing fantasy football data...');
  
  try {
    // Check if we already have contests
    const existingContests = fantasyStore.getAllFantasyContests();
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
  
  // Insert free contests
  for (const contestData of freeContests) {
    try {
      fantasyStore.createFantasyContest(contestData);
      console.log(`Created free contest: ${contestData.name}`);
    } catch (error) {
      console.error(`Error creating free contest ${contestData.name}:`, error);
    }
  }
  
  // Insert premium contests
  for (const contestData of premiumContests) {
    try {
      fantasyStore.createFantasyContest(contestData);
      console.log(`Created premium contest: ${contestData.name}`);
    } catch (error) {
      console.error(`Error creating premium contest ${contestData.name}:`, error);
    }
  }
  
  console.log('Fantasy data initialization complete!');
}