import type { HeatmapData } from "@/types/player-types";

/**
 * Transform raw player stats into heatmap-compatible data format
 */
export function transformPlayerStatsToHeatmap(
  stats: Record<string, Record<string, number>>
): HeatmapData[] {
  const heatmapData: HeatmapData[] = [];
  
  Object.entries(stats).forEach(([team, metrics]) => {
    Object.entries(metrics).forEach(([metric, value]) => {
      heatmapData.push({
        x: team,
        y: metric,
        value
      });
    });
  });
  
  return heatmapData;
}

/**
 * Generate performance data for a player based on their position
 */
export function generatePlayerPerformanceData(position: string): HeatmapData[] {
  const metrics = getMetricsByPosition(position);
  const teams = ["Arsenal", "Chelsea", "Liverpool", "Man City", "Man United", "Tottenham"];
  const heatmapData: HeatmapData[] = [];
  
  teams.forEach(team => {
    metrics.forEach(metric => {
      // Generate a value between 1-10 with weighted randomness based on position
      let value: number;
      
      if (position === "Forward" && (metric === "Goals" || metric === "Shots")) {
        // Forwards have higher values for shooting metrics
        value = 5 + Math.floor(Math.random() * 6);
      } else if (position === "Midfielder" && (metric === "Passes" || metric === "Assists")) {
        // Midfielders have higher values for passing metrics
        value = 5 + Math.floor(Math.random() * 6);
      } else if (position === "Defender" && (metric === "Tackles" || metric === "Interceptions")) {
        // Defenders have higher values for defensive metrics
        value = 5 + Math.floor(Math.random() * 6);
      } else {
        // Other metrics are more random
        value = 1 + Math.floor(Math.random() * 10);
      }
      
      heatmapData.push({
        x: team,
        y: metric,
        value
      });
    });
  });
  
  return heatmapData;
}

/**
 * Get relevant metrics based on player position
 */
function getMetricsByPosition(position: string): string[] {
  switch (position) {
    case "Forward":
      return ["Goals", "Shots", "Assists", "Dribbles", "Passes", "Touches"];
    case "Midfielder":
      return ["Passes", "Assists", "Tackles", "Interceptions", "Goals", "Touches"];
    case "Defender":
      return ["Tackles", "Interceptions", "Clearances", "Blocks", "Passes", "Duels Won"];
    default:
      return ["Goals", "Assists", "Passes", "Tackles", "Interceptions", "Touches"];
  }
}