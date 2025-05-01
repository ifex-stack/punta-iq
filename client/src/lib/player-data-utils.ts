import type { HeatmapData } from "@/types/player-types";

/**
 * Transform raw player stats into heatmap-compatible data format
 */
export function transformPlayerStatsToHeatmap(
  playerStats: any[], 
  metrics: string[] = ["Goals", "Assists", "Passes", "Tackles", "Dribbles", "Interceptions"],
  opposingTeams: string[] = []
): HeatmapData[] {
  if (!playerStats || playerStats.length === 0) {
    return [];
  }
  
  const heatmapData: HeatmapData[] = [];
  
  // Default metric mappings to CSV column names
  const metricMappings: Record<string, string> = {
    "Goals": "Goals total",
    "Assists": "Goals assists",
    "Passes": "Passes total",
    "Tackles": "Tackles total",
    "Dribbles": "Dribbles success",
    "Interceptions": "Tackles interceptions",
    "Rating": "Games rating",
    "Shots": "Shots total",
    "Minutes": "Games minutes",
    "Yellow Cards": "Cards yellow",
    "Red Cards": "Cards red"
  };
  
  // Extract unique teams if not provided
  const teams = opposingTeams.length > 0 
    ? opposingTeams 
    : Array.from(new Set(playerStats.map(stat => stat["Team name"])));
  
  // Generate heatmap data
  metrics.forEach(metric => {
    teams.forEach(team => {
      // Find stats for this player against this team
      const matchStats = playerStats.find(stat => stat["Team name"] === team);
      
      if (matchStats) {
        const metricColumn = metricMappings[metric] || metric;
        const value = parseFloat(matchStats[metricColumn]) || 0;
        
        heatmapData.push({
          x: team,
          y: metric,
          value: value
        });
      }
    });
  });
  
  return heatmapData;
}

/**
 * Generate performance data for a player based on their position
 */
export function generatePlayerPerformanceData(
  position: string = "Forward", 
  matches: number = 6
): HeatmapData[] {
  const metrics = getMetricsByPosition(position);
  const teams = [
    "Arsenal", "Chelsea", "Liverpool", 
    "Man City", "Man United", "Tottenham"
  ].slice(0, matches);
  
  const heatmapData: HeatmapData[] = [];
  
  metrics.forEach(metric => {
    teams.forEach(team => {
      // Generate realistic values based on position and metric
      let baseValue = 0;
      let variance = 0;
      
      switch (metric) {
        case "Goals":
          baseValue = position === "Forward" ? 0.8 : position === "Midfielder" ? 0.4 : 0.1;
          variance = 0.5;
          break;
        case "Assists":
          baseValue = position === "Forward" ? 0.6 : position === "Midfielder" ? 0.7 : 0.3;
          variance = 0.5;
          break;
        case "Passes":
          baseValue = position === "Forward" ? 25 : position === "Midfielder" ? 45 : 35;
          variance = 15;
          break;
        case "Tackles":
          baseValue = position === "Forward" ? 1 : position === "Midfielder" ? 3 : 5;
          variance = 2;
          break;
        case "Dribbles":
          baseValue = position === "Forward" ? 4 : position === "Midfielder" ? 3 : 1;
          variance = 2;
          break;
        case "Interceptions":
          baseValue = position === "Forward" ? 0.5 : position === "Midfielder" ? 2 : 4;
          variance = 1.5;
          break;
        case "Shots":
          baseValue = position === "Forward" ? 3.5 : position === "Midfielder" ? 2 : 0.5;
          variance = 2;
          break;
        case "Blocks":
          baseValue = position === "Forward" ? 0.2 : position === "Midfielder" ? 0.8 : 2;
          variance = 1;
          break;
        default:
          baseValue = 5;
          variance = 3;
      }
      
      // Calculate value with random variance, ensure it's not negative
      const value = Math.max(0, baseValue + (Math.random() * 2 - 1) * variance);
      
      // Round appropriately based on metric
      const roundedValue = 
        ["Goals", "Assists", "Tackles", "Interceptions", "Blocks"].includes(metric) 
          ? Math.round(value * 10) / 10 
          : Math.round(value);
      
      heatmapData.push({
        x: team,
        y: metric,
        value: roundedValue
      });
    });
  });
  
  return heatmapData;
}

/**
 * Get relevant metrics based on player position
 */
function getMetricsByPosition(position: string): string[] {
  const commonMetrics = ["Passes", "Tackles"];
  
  switch (position) {
    case "Forward":
      return [...commonMetrics, "Goals", "Assists", "Shots", "Dribbles"];
    case "Midfielder":
      return [...commonMetrics, "Assists", "Interceptions", "Dribbles", "Goals"];
    case "Defender":
      return [...commonMetrics, "Interceptions", "Blocks", "Dribbles", "Goals"];
    case "Goalkeeper":
      return ["Saves", "Clean Sheets", "Passes", "Claims", "Punches", "Errors"];
    default:
      return [...commonMetrics, "Goals", "Assists", "Interceptions", "Dribbles"];
  }
}