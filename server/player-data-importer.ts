import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { PlayerSeasonStats } from '@shared/player-interfaces';

// Interface for raw player data from CSV
interface RawPlayerData {
  Id: string;
  Name: string;
  Firstname: string;
  Lastname: string;
  Age: string;
  'Birth date': string;
  'Birth place': string;
  'Birth country': string;
  Nationality: string;
  Height: string;
  Weight: string;
  Injured: string;
  Photo: string;
  'Team id': string;
  'Team name': string;
  'Team logo': string;
  'League id': string;
  'League name': string;
  'League country': string;
  'League logo': string;
  'League flag': string;
  'League season': string;
  'Games appearences': string;
  'Games lineups': string;
  'Games minutes': string;
  'Games number': string;
  'Games position': string;
  'Games rating': string;
  'Games captain': string;
  'Substitutes in': string;
  'Substitutes out': string;
  'Substitutes bench': string;
  'Shots total': string;
  'Shots on': string;
  'Goals total': string;
  'Goals conceded': string;
  'Goals assists': string;
  'Goals saves': string;
  'Passes total': string;
  'Passes key': string;
  'Passes accuracy': string;
  'Tackles total': string;
  'Tackles blocks': string;
  'Tackles interceptions': string;
  'Duels total': string;
  'Duels won': string;
  'Dribbles attempts': string;
  'Dribbles success': string;
  'Dribbles past': string;
  'Fouls drawn': string;
  'Fouls committed': string;
  'Cards yellow': string;
  'Cards yellowred': string;
  'Cards red': string;
  'Penalty won': string;
  'Penalty committed': string;
  'Penalty scored': string;
  'Penalty missed': string;
  'Penalty saved': string;
}

/**
 * Imports player data from a CSV file and transforms it into PlayerSeasonStats objects
 * @param filePath The path to the CSV file
 * @returns An array of PlayerSeasonStats objects
 */
export function importPlayerData(filePath: string): PlayerSeasonStats[] {
  try {
    const csvPath = path.resolve(filePath);
    if (!fs.existsSync(csvPath)) {
      console.error(`CSV file not found: ${csvPath}`);
      return [];
    }

    // Read the CSV file
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse the CSV data with semicolon delimiter
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter: ';' // Specify semicolon as the delimiter
    }) as RawPlayerData[];

    console.log(`Parsed ${records.length} records from CSV`);
    
    // Filter out duplicate player entries (keep one entry per player)
    const uniquePlayers = new Map<string, RawPlayerData>();
    for (const record of records) {
      const playerId = record.Id;
      // If we haven't seen this player yet, or if this record has more complete data, keep it
      if (!uniquePlayers.has(playerId) || 
          (parseInt(record['Games minutes'] || '0') > parseInt(uniquePlayers.get(playerId)!['Games minutes'] || '0'))) {
        uniquePlayers.set(playerId, record);
      }
    }
    
    console.log(`Found ${uniquePlayers.size} unique players after filtering duplicates`);
    
    // Transform raw data into PlayerSeasonStats objects
    // Use the actual player ID from the CSV when available
    return Array.from(uniquePlayers.values()).map(record => {
      const playerId = parseInt(record.Id) || 0;
      return transformToPlayerStats(record, playerId);
    });
  } catch (error) {
    console.error(`Error importing player data: ${error}`);
    return [];
  }
}

/**
 * Transforms raw player data from CSV into a PlayerSeasonStats object
 * @param record The raw player data from CSV
 * @param playerId The ID to assign to the player
 * @returns A PlayerSeasonStats object
 */
function transformToPlayerStats(record: RawPlayerData, playerId: number): PlayerSeasonStats {
  // Parse numeric values, defaulting to 0 or null if not valid
  const parseNumeric = (val: string, defaultVal: number | null = 0): number | null => {
    if (!val || val === '') return defaultVal;
    // Remove any percentage or other symbols that might be included
    const cleanVal = val.replace('%', '').trim();
    const num = parseFloat(cleanVal);
    return isNaN(num) ? defaultVal : num;
  };

  // Determine player position from 'Games position'
  const determinePosition = (position: string): string => {
    if (!position) return 'unknown';
    
    position = position.toLowerCase();
    if (position.includes('goalkeeper') || position.includes('gk')) return 'goalkeeper';
    if (position.includes('defender') || position.includes('cb') || position.includes('lb') || position.includes('rb')) return 'defender';
    if (position.includes('midfielder') || position.includes('cm') || position.includes('cdm') || position.includes('cam')) return 'midfielder';
    if (position.includes('forward') || position.includes('attacker') || position.includes('st') || position.includes('lw') || position.includes('rw')) return 'forward';
    return 'unknown';
  };

  // Extract season from 'League season'
  const season = record['League season'] || new Date().getFullYear().toString();
  
  // Calculate rating - convert from 0-10 scale if needed
  let rating = parseNumeric(record['Games rating']);
  if (rating && rating > 0 && rating <= 10) {
    // Already on a 0-10 scale, which is what we want
  } else if (rating && rating > 10 && rating <= 100) {
    // Convert from 0-100 scale to 0-10 scale
    rating = rating / 10;
  }

  // Determine player's position
  const position = determinePosition(record['Games position']);

  // Calculate fantasy points based on player stats
  const fantasyPoints = calculateFantasyPoints(record, position);

  // For clean sheets, estimate for goalkeepers and defenders based on appearances
  let cleanSheets = 0;
  const appearances = parseNumeric(record['Games appearences']) || 0;
  if ((position === 'goalkeeper' || position === 'defender') && appearances > 0) {
    // Estimate clean sheets as approximately 30% of appearances
    cleanSheets = Math.round(appearances * 0.3);
  }
  
  // Create a full name from firstname and lastname
  const fullName = `${record.Firstname || ''} ${record.Lastname || ''}`.trim() || record.Name;

  return {
    playerId,
    season,
    competition: record['League name'],
    competitionId: parseNumeric(record['League id']),
    team: record['Team name'],
    teamId: parseNumeric(record['Team id']),
    playerName: fullName, // Add player's name for easier reference
    position: position as any, // Cast to match expected type
    nationality: record.Nationality,
    photo: record.Photo,
    
    // Basic player info
    age: parseNumeric(record.Age),
    
    // Appearance stats
    appearances: parseNumeric(record['Games appearences']),
    lineups: parseNumeric(record['Games lineups']),
    minutesPlayed: parseNumeric(record['Games minutes']) || 0,
    captain: record['Games captain'] === '1' || record['Games captain']?.toLowerCase() === 'true',
    
    // Goal involvement
    goals: parseNumeric(record['Goals total']) || 0,
    assists: parseNumeric(record['Goals assists']) || 0,
    penalties: parseNumeric(record['Penalty scored']),
    
    // Disciplinary
    yellowCards: parseNumeric(record['Cards yellow']) || 0,
    redCards: parseNumeric(record['Cards red']) || 0,
    
    // Goalkeeper stats
    cleanSheets: cleanSheets,
    goalsConceded: parseNumeric(record['Goals conceded']),
    saves: parseNumeric(record['Goals saves']),
    
    // Passing stats
    passesTotal: parseNumeric(record['Passes total']),
    passesKey: parseNumeric(record['Passes key']),
    passAccuracy: parseNumeric(record['Passes accuracy']),
    
    // Defensive stats
    tackles: parseNumeric(record['Tackles total']),
    tacklesBlocks: parseNumeric(record['Tackles blocks']),
    tacklesInterceptions: parseNumeric(record['Tackles interceptions']),
    duelsTotal: parseNumeric(record['Duels total']),
    duelsWon: parseNumeric(record['Duels won']),
    
    // Attacking stats
    shotsTotal: parseNumeric(record['Shots total']),
    shotsOnTarget: parseNumeric(record['Shots on']),
    dribblesAttempts: parseNumeric(record['Dribbles attempts']),
    dribblesSuccess: parseNumeric(record['Dribbles success']),
    dribblesSuccessful: parseNumeric(record['Dribbles success']),
    
    // Additional advanced stats
    xG: null, // Not provided in the CSV
    xA: null, // Not provided in the CSV
    
    // Additional info
    injury: record['Injured'] === '1' ? 'Injured' : null,
    fantasyPoints,
    rating,
    form: null // Not provided in the CSV
  };
}

/**
 * Calculates fantasy points based on player statistics and position
 * @param record The raw player data
 * @param position The player's position
 * @returns The fantasy points value
 */
function calculateFantasyPoints(
  record: RawPlayerData,
  position: string
): number {
  let points = 0;
  
  // Appearance points - 1 for less than 60 mins, 2 for 60+ mins
  const minutes = parseFloat(record['Games minutes'] || '0');
  points += minutes >= 60 ? 2 : (minutes > 0 ? 1 : 0);
  
  // Goals points - more for defenders/goalkeepers
  const goals = parseFloat(record['Goals total'] || '0');
  if (position === 'goalkeeper' || position === 'defender') {
    points += goals * 6;
  } else if (position === 'midfielder') {
    points += goals * 5;
  } else {
    // Forward
    points += goals * 4;
  }
  
  // Assists - 3 points each
  const assists = parseFloat(record['Goals assists'] || '0');
  points += assists * 3;
  
  // Clean sheet points (estimated)
  const appearances = parseFloat(record['Games appearences'] || '0');
  if (position === 'goalkeeper' || position === 'defender') {
    // Estimate clean sheets as approximately 30% of appearances for good players
    const cleanSheets = Math.round(appearances * 0.3);
    points += cleanSheets * 4;
  } else if (position === 'midfielder') {
    // Midfielders get 1 point for clean sheets
    const cleanSheets = Math.round(appearances * 0.3);
    points += cleanSheets * 1;
  }
  
  // Penalty saves (goalkeeper)
  if (position === 'goalkeeper') {
    const penaltySaves = parseFloat(record['Penalty saved'] || '0');
    points += penaltySaves * 5;
  }
  
  // Card deductions
  const yellowCards = parseFloat(record['Cards yellow'] || '0');
  const redCards = parseFloat(record['Cards red'] || '0');
  points -= yellowCards * 1;
  points -= redCards * 3;
  
  // Penalty misses
  const penaltyMisses = parseFloat(record['Penalty missed'] || '0');
  points -= penaltyMisses * 2;
  
  // Add bonus points based on rating
  const rating = parseFloat(record['Games rating'] || '0');
  if (rating >= 8) {
    points += 3;
  } else if (rating >= 7) {
    points += 2;
  } else if (rating >= 6) {
    points += 1;
  }
  
  return Math.max(0, Math.round(points));
}

/**
 * Imports player data from the CSV and saves it to storage
 * This is called during application startup to initialize real player data
 */
export function importAndSavePlayerData() {
  try {
    // Set the path to the CSV file
    const csvPath = './attached_assets/players_players-statistics_get-players-statistics-for-current-seasons.csv';
    
    // Check if the file exists first
    if (!fs.existsSync(path.resolve(csvPath))) {
      console.warn(`Player statistics CSV file not found at ${csvPath}`);
      return [];
    }
    
    // Import the player data
    const playerStats = importPlayerData(csvPath);
    
    // Log the results
    if (playerStats.length > 0) {
      console.log(`Successfully imported ${playerStats.length} player records from ${csvPath}`);
      
      // Log some sample player data for verification
      const samplePlayer = playerStats[0];
      console.log(`Sample player data: ${samplePlayer.playerName}, ${samplePlayer.position}, ${samplePlayer.team}, ${samplePlayer.goals} goals, ${samplePlayer.assists} assists, rating: ${samplePlayer.rating}`);
      
      // Get some position counts for verification
      const goalkeepers = playerStats.filter(p => p.position === 'goalkeeper').length;
      const defenders = playerStats.filter(p => p.position === 'defender').length;
      const midfielders = playerStats.filter(p => p.position === 'midfielder').length;
      const forwards = playerStats.filter(p => p.position === 'forward').length;
      const unknown = playerStats.filter(p => p.position === 'unknown').length;
      
      console.log(`Position distribution: GK: ${goalkeepers}, DEF: ${defenders}, MID: ${midfielders}, FWD: ${forwards}, Unknown: ${unknown}`);
    } else {
      console.warn('No player data was imported from the CSV file');
    }
    
    // Return the imported player stats for storage service to use
    return playerStats;
  } catch (error) {
    console.error('Error importing and saving player data:', error);
    return [];
  }
}