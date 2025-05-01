import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PerformanceHeatmap } from "@/components/player/performance-heatmap";
import { generatePlayerPerformanceData } from '@/lib/player-data-utils';
import type { HeatmapData, PlayerStats } from '@/types/player-types';
import { 
  Activity, 
  BarChart, 
  Calendar, 
  ChevronRight, 
  LineChart, 
  Search, 
  Shield, 
  Goal,
  TrendingUp, 
  User, 
  Zap 
} from 'lucide-react';

export default function PlayerPerformancePage() {
  const [selectedPosition, setSelectedPosition] = useState<string>("Forward");
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("overview");
  
  // Sample player data
  const players: { [key: string]: PlayerStats[] } = {
    "Forward": [
      { id: 1, name: "Harry Kane", position: "Forward", appearances: 34, goals: 23, assists: 8, rating: 8.4, minutes: 3045, team: "Bayern Munich" },
      { id: 2, name: "Erling Haaland", position: "Forward", appearances: 36, goals: 35, assists: 5, rating: 8.7, minutes: 3123, team: "Manchester City" },
      { id: 3, name: "Kylian Mbappé", position: "Forward", appearances: 33, goals: 27, assists: 10, rating: 8.6, minutes: 2967, team: "PSG" }
    ],
    "Midfielder": [
      { id: 4, name: "Kevin De Bruyne", position: "Midfielder", appearances: 29, goals: 7, assists: 16, rating: 8.3, minutes: 2543, team: "Manchester City" },
      { id: 5, name: "Bruno Fernandes", position: "Midfielder", appearances: 35, goals: 12, assists: 9, rating: 7.9, minutes: 3140, team: "Manchester United" },
      { id: 6, name: "Luka Modric", position: "Midfielder", appearances: 30, goals: 4, assists: 12, rating: 8.1, minutes: 2430, team: "Real Madrid" }
    ],
    "Defender": [
      { id: 7, name: "Virgil van Dijk", position: "Defender", appearances: 32, goals: 3, assists: 2, rating: 8.2, minutes: 2880, team: "Liverpool" },
      { id: 8, name: "Rúben Dias", position: "Defender", appearances: 34, goals: 1, assists: 2, rating: 7.9, minutes: 3060, team: "Manchester City" },
      { id: 9, name: "Marquinhos", position: "Defender", appearances: 31, goals: 2, assists: 3, rating: 7.8, minutes: 2790, team: "PSG" }
    ]
  };
  
  // Get players for the selected position
  const positionPlayers = players[selectedPosition] || [];
  
  // Set default selected player if none selected yet
  useEffect(() => {
    if (positionPlayers.length > 0 && !selectedPlayer) {
      setSelectedPlayer(positionPlayers[0].name);
    }
  }, [selectedPosition, positionPlayers, selectedPlayer]);
  
  // Get the selected player data
  const player = positionPlayers.find(p => p.name === selectedPlayer);
  
  // Generate performance data for the heatmap
  const [performanceData, setPerformanceData] = useState<HeatmapData[]>([]);
  
  useEffect(() => {
    if (player) {
      // In a real application, this would be fetched from the API
      const data = generatePlayerPerformanceData(player.position);
      setPerformanceData(data);
    }
  }, [player]);
  
  // Page animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  // Render empty state if no players or selection
  if (!player) {
    return (
      <div className="container px-4 py-8">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }
  
  return (
    <motion.div 
      className="container px-4 py-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold tracking-tight">Player Performance Analysis</h1>
          <p className="text-muted-foreground">
            Interactive visualization of player statistics and performance metrics
          </p>
        </motion.div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <motion.div variants={itemVariants}>
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Forward">Forwards</SelectItem>
                <SelectItem value="Midfielder">Midfielders</SelectItem>
                <SelectItem value="Defender">Defenders</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Select value={selectedPlayer || ""} onValueChange={setSelectedPlayer}>
              <SelectTrigger className="w-48 md:w-56">
                <SelectValue placeholder="Select player" />
              </SelectTrigger>
              <SelectContent>
                {positionPlayers.map((player) => (
                  <SelectItem key={player.id} value={player.name}>
                    {player.name} ({player.team})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        </div>
      </div>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
        variants={itemVariants}
      >
        <Card className="md:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">{player.name}</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <span className="mr-2">{player.position}</span>
                  <span className="mx-2 text-muted-foreground">•</span>
                  <span>{player.team}</span>
                </CardDescription>
              </div>
              
              <Badge 
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-none"
              >
                {player.rating} Rating
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 pt-0">
            <div className="flex flex-col items-center justify-center p-3 bg-muted/40 rounded-lg">
              <Football className="h-5 w-5 mb-1 text-amber-500" />
              <div className="text-2xl font-bold text-center">{player.goals}</div>
              <div className="text-xs text-center text-muted-foreground">Goals</div>
            </div>
            
            <div className="flex flex-col items-center justify-center p-3 bg-muted/40 rounded-lg">
              <Zap className="h-5 w-5 mb-1 text-blue-500" />
              <div className="text-2xl font-bold text-center">{player.assists}</div>
              <div className="text-xs text-center text-muted-foreground">Assists</div>
            </div>
            
            <div className="flex flex-col items-center justify-center p-3 bg-muted/40 rounded-lg">
              <Calendar className="h-5 w-5 mb-1 text-emerald-500" />
              <div className="text-2xl font-bold text-center">{player.appearances}</div>
              <div className="text-xs text-center text-muted-foreground">Appearances</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div className="mb-8" variants={itemVariants}>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid grid-cols-3 w-full md:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PerformanceHeatmap 
                playerName={player.name} 
                data={performanceData} 
                title="Performance by Opposition"
                description="Breakdown of key performance metrics against different opponents"
                metrics={["Goals", "Assists", "Passes", "Dribbles", "Tackles", "Interceptions"]}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Strengths & Weaknesses</CardTitle>
                  <CardDescription>Analysis of player performance profile</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-sm mb-3 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2 text-emerald-500" />
                        Key Strengths
                      </h4>
                      <ul className="space-y-2.5">
                        {["Finishing", "Positioning", "Off-the-ball movement", "Shot power"].map((strength, index) => (
                          <motion.li 
                            key={index}
                            className="text-sm flex items-start"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Badge variant="outline" className="mr-2 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/60">
                              +
                            </Badge>
                            {strength}
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-3 flex items-center">
                        <Activity className="h-4 w-4 mr-2 text-amber-500" />
                        Areas to Improve
                      </h4>
                      <ul className="space-y-2.5">
                        {["Aerial duels", "Defensive contribution"].map((weakness, index) => (
                          <motion.li 
                            key={index}
                            className="text-sm flex items-start"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 + 0.4 }}
                          >
                            <Badge variant="outline" className="mr-2 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/60">
                              ~
                            </Badge>
                            {weakness}
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-sm mb-3">Performance Trend</h4>
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                          <motion.div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${player.rating * 10}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                        <span className="ml-3 text-sm font-medium">{player.rating}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Form</CardTitle>
                  <CardDescription>Performance in last 5 matches</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const randomScore = Math.floor(Math.random() * 4);
                      const randomOpponent = ["Liverpool", "Arsenal", "Chelsea", "Tottenham", "Newcastle"][i];
                      const randomResult = ["W", "D", "L"][Math.floor(Math.random() * 3)];
                      const randomGoals = Math.floor(Math.random() * 2);
                      const randomAssists = Math.floor(Math.random() * 2);
                      const randomRating = (6 + Math.random() * 3).toFixed(1);
                      
                      return (
                        <motion.div 
                          key={i} 
                          className="flex items-center justify-between p-3 border rounded-lg"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <div className="flex items-center">
                            <Badge 
                              className={`mr-3 ${
                                randomResult === "W" ? "bg-emerald-500" : 
                                randomResult === "D" ? "bg-amber-500" : 
                                "bg-red-500"
                              }`}
                            >
                              {randomResult}
                            </Badge>
                            <div>
                              <div className="font-medium text-sm">vs {randomOpponent}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(2025, 3, 30 - i).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-muted-foreground">Goals</span>
                              <span className="font-medium">{randomGoals}</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-muted-foreground">Assists</span>
                              <span className="font-medium">{randomAssists}</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-muted-foreground">Rating</span>
                              <span className={`font-medium ${
                                parseFloat(randomRating) >= 7.5 ? "text-emerald-600 dark:text-emerald-400" : 
                                parseFloat(randomRating) >= 6.5 ? "text-amber-600 dark:text-amber-400" : 
                                "text-red-600 dark:text-red-400"
                              }`}>{randomRating}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Scoring Zones</CardTitle>
                  <CardDescription>Goal distribution by area</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden border">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg width="100%" height="100%" viewBox="0 0 300 200" className="opacity-30">
                        {/* Simplified pitch outline */}
                        <rect x="0" y="0" width="300" height="200" fill="#4ade80" stroke="white" strokeWidth="2" />
                        <rect x="0" y="40" width="40" height="120" fill="none" stroke="white" strokeWidth="2" />
                        <rect x="260" y="40" width="40" height="120" fill="none" stroke="white" strokeWidth="2" />
                        <circle cx="150" cy="100" r="30" fill="none" stroke="white" strokeWidth="2" />
                        <line x1="150" y1="0" x2="150" y2="200" stroke="white" strokeWidth="2" />
                      </svg>
                      
                      {/* Heat zones */}
                      <motion.div 
                        className="absolute top-[30%] left-[20%] w-16 h-16 rounded-full bg-red-500/20"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.6 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                      />
                      <motion.div 
                        className="absolute top-[40%] left-[30%] w-20 h-20 rounded-full bg-red-500/40"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.8 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                      />
                      <motion.div 
                        className="absolute top-[60%] left-[15%] w-12 h-12 rounded-full bg-red-500/30"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.7 }}
                        transition={{ delay: 0.7, duration: 0.8 }}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Inside box</span>
                      <div className="flex items-center">
                        <span className="text-sm font-medium mr-2">75%</span>
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                          <motion.div 
                            className="bg-red-500 h-1.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: '75%' }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Outside box</span>
                      <div className="flex items-center">
                        <span className="text-sm font-medium mr-2">20%</span>
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                          <motion.div 
                            className="bg-amber-500 h-1.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: '20%' }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Headers</span>
                      <div className="flex items-center">
                        <span className="text-sm font-medium mr-2">5%</span>
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                          <motion.div 
                            className="bg-blue-500 h-1.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: '5%' }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.6 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="performance" className="mt-6">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Over Time</CardTitle>
                  <CardDescription>Tracking player metrics across the season</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-muted-foreground">More performance analysis will appear here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="comparison" className="mt-6">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Compare with Other Players</CardTitle>
                  <CardDescription>Side-by-side comparison with other players in the same position</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-muted-foreground">Player comparison tools will appear here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}