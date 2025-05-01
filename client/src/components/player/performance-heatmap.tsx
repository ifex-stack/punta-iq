import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HeatmapData {
  x: string;
  y: string;
  value: number;
}

interface PerformanceHeatmapProps {
  playerName: string;
  data: HeatmapData[];
  title: string;
  description?: string;
  loading?: boolean;
  metrics?: string[];
  highlightCells?: {x: string, y: string}[];
}

export const PerformanceHeatmap: React.FC<PerformanceHeatmapProps> = ({
  playerName,
  data,
  title,
  description,
  loading = false,
  metrics = ["Goals", "Assists", "Passes", "Dribbles", "Tackles", "Interceptions"],
  highlightCells = [],
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeTab, setActiveTab] = useState("heatmap");
  const [hoveredCell, setHoveredCell] = useState<HeatmapData | null>(null);
  
  // Generate sample opponent data if not provided
  const opponents = ["Team A", "Team B", "Team C", "Team D", "Team E", "Team F"];
  
  // Map metrics to a color range
  const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
    .domain([0, d3.max(data, d => d.value) || 10]);
  
  useEffect(() => {
    if (loading || !data.length || !svgRef.current) return;
    
    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();
    
    const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const width = 300 - margin.left - margin.right;
    const height = 240 - margin.top - margin.bottom;
    
    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Get unique x and y values
    const xValues = Array.from(new Set(data.map(d => d.x)));
    const yValues = Array.from(new Set(data.map(d => d.y)));
    
    // Create scales
    const xScale = d3.scaleBand()
      .domain(xValues)
      .range([0, width])
      .padding(0.05);
    
    const yScale = d3.scaleBand()
      .domain(yValues)
      .range([height, 0])
      .padding(0.05);
    
    // Add X axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickSize(0))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", "8px");
    
    // Add Y axis
    svg.append("g")
      .call(d3.axisLeft(yScale).tickSize(0))
      .selectAll("text")
      .style("font-size", "8px");
    
    // Create the heatmap cells with animation
    svg.selectAll()
      .data(data)
      .enter()
      .append("rect")
      .attr("x", d => xScale(d.x) || 0)
      .attr("y", d => yScale(d.y) || 0)
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("rx", 2)
      .attr("ry", 2)
      .style("fill", "transparent")
      .style("stroke", "#e2e8f0")
      .style("stroke-width", 0.5)
      .transition()
      .duration(800)
      .delay((d, i) => i * 10)
      .style("fill", d => colorScale(d.value))
      .style("opacity", 0.8);
    
    // Add interactivity
    svg.selectAll("rect")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .style("stroke", "#6366f1")
          .style("stroke-width", 2)
          .style("opacity", 1);
        
        setHoveredCell(d);
        
        // Show tooltip
        svg.append("text")
          .attr("class", "tooltip")
          .attr("x", xScale(d.x) || 0)
          .attr("y", (yScale(d.y) || 0) - 5)
          .text(`${d.value}`)
          .style("font-size", "10px")
          .style("font-weight", "bold");
      })
      .on("mouseout", function() {
        d3.select(this)
          .style("stroke", "#e2e8f0")
          .style("stroke-width", 0.5)
          .style("opacity", 0.8);
        
        setHoveredCell(null);
        
        // Remove tooltip
        svg.select(".tooltip").remove();
      });
    
    // Highlight specific cells if needed
    highlightCells.forEach(cell => {
      svg.selectAll("rect")
        .filter(d => d.x === cell.x && d.y === cell.y)
        .style("stroke", "#4f46e5")
        .style("stroke-width", 2)
        .style("opacity", 1);
    });
    
  }, [data, loading, colorScale, highlightCells]);
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3 mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[240px] w-full" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description || `Performance heatmap for ${playerName}`}</CardDescription>
            </div>
            <Badge variant="secondary" className="font-normal">Interactive</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="heatmap" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
              <TabsTrigger value="table">Table View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="heatmap" className="relative">
              <svg ref={svgRef} className="w-full h-[260px]" />
              
              {hoveredCell && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute bottom-2 right-2 bg-primary-foreground border border-border p-3 rounded-md shadow-md"
                >
                  <p className="text-sm font-medium">{hoveredCell.y} vs {hoveredCell.x}</p>
                  <p className="text-xs text-muted-foreground">Value: <span className="font-bold text-primary">{hoveredCell.value}</span></p>
                </motion.div>
              )}
            </TabsContent>
            
            <TabsContent value="table">
              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left text-xs font-medium">Metric</th>
                      {opponents.map(opponent => (
                        <th key={opponent} className="p-2 text-center text-xs font-medium">{opponent}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map(metric => (
                      <tr key={metric} className="border-b last:border-0">
                        <td className="p-2 text-left text-xs font-medium">{metric}</td>
                        {opponents.map(opponent => {
                          const cellData = data.find(d => d.x === opponent && d.y === metric);
                          const value = cellData ? cellData.value : 0;
                          const isHighValue = value > 7;
                          
                          return (
                            <td key={opponent} className="p-2 text-center text-xs">
                              <span className={isHighValue ? "font-bold text-primary" : ""}>
                                {value}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};