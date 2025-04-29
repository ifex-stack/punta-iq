import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { PlayerSeasonStats } from '@shared/player-interfaces';

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

export function importPlayerData(filePath: string): PlayerSeasonStats[] {
  try {
    const csvData = fs.readFileSync(filePath, 'utf8');
    const records: RawPlayerData[] = parse(csvData, {
      columns: true,
      delimiter: ';',
      skip_empty_lines: true
    });

    return records.map(record => transformToPlayerStats(record));
  } catch (error) {
    console.error('Error importing player data:', error);
    return [];
  }
}

function transformToPlayerStats(record: RawPlayerData): PlayerSeasonStats {
  // Parse numerical values safely
  const parseNumber = (value: string): number | null => {
    if (value === '' || value === undefined) return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  // Parse rating value which may have decimal points
  const parseRating = (value: string): number | null => {
    if (!value) return null;
    
    // Some ratings might come in format "7.200000" - we handle that here
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  // Parse pass accuracy which is often in percentage 
  const parseAccuracy = (value: string): number | null => {
    if (!value) return null;
    // If value contains '%', remove it
    const cleanValue = value.replace('%', '');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? null : parsed;
  };

  // Convert positions to our standard format
  const standardizePosition = (position: string): string => {
    position = position.toLowerCase();
    if (position.includes('goalkeeper')) return 'goalkeeper';
    if (position.includes('defender')) return 'defender';
    if (position.includes('midfielder')) return 'midfielder';
    if (position.includes('attacker') || position.includes('forward')) return 'forward';
    return position;
  };

  return {
    playerId: parseInt(record.Id),
    season: record['League season'],
    competition: record['League name'],
    competitionId: parseNumber(record['League id']),
    team: record['Team name'],
    teamId: parseNumber(record['Team id']),
    
    // Appearance stats
    appearances: parseNumber(record['Games appearences']),
    lineups: parseNumber(record['Games lineups']),
    minutesPlayed: parseNumber(record['Games minutes']) || 0,
    captain: record['Games captain'] === 'true',
    
    // Goal involvement
    goals: parseNumber(record['Goals total']) || 0,
    assists: parseNumber(record['Goals assists']) || 0,
    
    // Disciplinary
    yellowCards: parseNumber(record['Cards yellow']) || 0,
    redCards: parseNumber(record['Cards red']) || 0,
    
    // Goalkeeper stats
    cleanSheets: 0, // Calculate from matches data if available
    goalsConceded: parseNumber(record['Goals conceded']),
    saves: parseNumber(record['Goals saves']),
    
    // Passing stats
    passesTotal: parseNumber(record['Passes total']),
    passesKey: parseNumber(record['Passes key']),
    passAccuracy: parseAccuracy(record['Passes accuracy']),
    
    // Defensive stats
    tacklesTotal: parseNumber(record['Tackles total']),
    tacklesBlocks: parseNumber(record['Tackles blocks']),
    tacklesInterceptions: parseNumber(record['Tackles interceptions']),
    duelsTotal: parseNumber(record['Duels total']),
    duelsWon: parseNumber(record['Duels won']),
    
    // Attacking stats
    shotsTotal: parseNumber(record['Shots total']),
    shotsOnTarget: parseNumber(record['Shots on']),
    dribblesAttempts: parseNumber(record['Dribbles attempts']),
    dribblesSuccess: parseNumber(record['Dribbles success']),
    
    // Additional info
    rating: parseRating(record['Games rating']),
    
    // Calculate fantasy points based on position and stats
    fantasyPoints: calculateFantasyPoints(
      standardizePosition(record['Games position'] || ''), 
      parseNumber(record['Goals total']) || 0,
      parseNumber(record['Goals assists']) || 0,
      parseNumber(record['Cards yellow']) || 0,
      parseNumber(record['Cards red']) || 0,
      0, // cleanSheets
      parseNumber(record['Games minutes']) || 0
    )
  };
}

function calculateFantasyPoints(
  position: string,
  goals: number,
  assists: number,
  yellowCards: number,
  redCards: number,
  cleanSheets: number,
  minutesPlayed: number
): number {
  let points = 0;
  
  // Points for playing
  if (minutesPlayed >= 60) {
    points += 2;
  } else if (minutesPlayed > 0) {
    points += 1;
  }
  
  // Points for goals based on position
  if (position === 'goalkeeper' || position === 'defender') {
    points += goals * 6;
  } else if (position === 'midfielder') {
    points += goals * 5;
  } else { // forward
    points += goals * 4;
  }
  
  // Points for assists
  points += assists * 3;
  
  // Points for cards
  points -= yellowCards * 1;
  points -= redCards * 3;
  
  // Points for clean sheets based on position
  if (position === 'goalkeeper' || position === 'defender') {
    points += cleanSheets * 4;
  } else if (position === 'midfielder') {
    points += cleanSheets * 1;
  }
  
  return points;
}

export function importAndSavePlayerData() {
  const filePath = path.join(__dirname, '../attached_assets/players_players-statistics_get-players-statistics-for-current-seasons.csv');
  const playerStats = importPlayerData(filePath);
  
  console.log(`Imported ${playerStats.length} player statistics records`);
  return playerStats;
}