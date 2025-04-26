import React, { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

// Recharts components
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function StatsPage() {
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const [period, setPeriod] = useState("week");
  
  // Get statistics data
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['/api/predictions/stats', period],
  });
  
  const { data: predictionHistory } = useQuery({
    queryKey: ['/api/predictions/history', period],
  });
  
  const { data: sportBreakdown } = useQuery({
    queryKey: ['/api/predictions/sports', period],
  });
  
  if (!user) {
    return (
      <div className="container py-10 max-w-5xl">
        <div className="mb-8 flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")}
            className="mr-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Statistics</h1>
        </div>
        
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle>Please Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You need to sign in to view detailed statistics. Statistics help you track 
              prediction performance and optimize your strategy.
            </p>
            <Button onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Dummy data for charts (since we don't have real data in this example)
  const predictionHistoryData = predictionHistory || [
    { date: "Apr 20", success: 67, fail: 33 },
    { date: "Apr 21", success: 72, fail: 28 },
    { date: "Apr 22", success: 65, fail: 35 },
    { date: "Apr 23", success: 70, fail: 30 },
    { date: "Apr 24", success: 82, fail: 18 },
    { date: "Apr 25", success: 75, fail: 25 },
    { date: "Apr 26", success: 78, fail: 22 },
  ];
  
  const sportBreakdownData = sportBreakdown || [
    { name: "Football", value: 45, fill: "#1a73e8" },
    { name: "Basketball", value: 25, fill: "#4caf50" },
    { name: "Tennis", value: 15, fill: "#f44336" },
    { name: "Hockey", value: 10, fill: "#ff9800" },
    { name: "Baseball", value: 5, fill: "#9c27b0" },
  ];
  
  const marketPerformanceData = [
    { name: "1X2", success: 76, avg: 70 },
    { name: "BTTS", success: 68, avg: 65 },
    { name: "O/U 2.5", success: 72, avg: 68 },
    { name: "Correct Score", success: 42, avg: 40 },
    { name: "Double Chance", success: 82, avg: 75 },
  ];
  
  return (
    <div className="container py-10 max-w-6xl">
      <div className="mb-8 flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/")}
          className="mr-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Statistics & Analysis</h1>
      </div>
      
      <Tabs
        defaultValue="week"
        className="mb-6"
        onValueChange={(value) => setPeriod(value)}
      >
        <TabsList>
          <TabsTrigger value="week">Last 7 Days</TabsTrigger>
          <TabsTrigger value="month">Last 30 Days</TabsTrigger>
          <TabsTrigger value="quarter">Last 90 Days</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {statsData?.successRate || "76%"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {statsData?.correct || 186} correct out of {statsData?.total || 244}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {statsData?.avgConfidence || "74%"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              On {statsData?.totalPredictions || 244} predictions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Odds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {statsData?.avgOdds || "1.87"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Potential ROI: {statsData?.potentialROI || "+42%"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Best Performing Sport
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {statsData?.bestSport || "Football"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {statsData?.bestSportRate || "82%"} success rate
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Success Rate Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Success Rate Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={predictionHistoryData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="success"
                    stroke="#1a73e8"
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                    name="Success Rate (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Predictions by Sport */}
        <Card>
          <CardHeader>
            <CardTitle>Predictions by Sport</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sportBreakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => 
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {sportBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Market Performance */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Performance by Market Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={marketPerformanceData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="success" 
                  name="Your Success Rate" 
                  fill="#1a73e8" 
                />
                <Bar 
                  dataKey="avg" 
                  name="Platform Average" 
                  fill="#e0e0e0" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Call to Action */}
      {!user.subscriptionTier && (
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold mb-2">Upgrade for Enhanced Analytics</h3>
                <p className="text-muted-foreground">
                  Subscribe to access advanced statistics, personalized insights, and historical performance data.
                </p>
              </div>
              <Button 
                className="md:self-start"
                onClick={() => navigate("/subscription")}
              >
                View Subscription Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}