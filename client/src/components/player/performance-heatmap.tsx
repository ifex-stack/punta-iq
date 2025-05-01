import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { HeatmapData } from '@/types/player-types';

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
  metrics,
  highlightCells = []
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (loading || !data.length || !svgRef.current || !tooltipRef.current) return;
    
    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Set dimensions and margins
    const margin = { top: 20, right: 10, bottom: 60, left: 60 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 340 - margin.top - margin.bottom;
    
    // Create scales
    const xValues = Array.from(new Set(data.map(d => d.x)));
    const yValues = metrics || Array.from(new Set(data.map(d => d.y)));
    
    const xScale = d3.scaleBand()
      .domain(xValues)
      .range([0, width])
      .padding(0.05);
    
    const yScale = d3.scaleBand()
      .domain(yValues)
      .range([height, 0])
      .padding(0.05);
    
    // Create color scale
    const colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateInferno)
      .domain([1, 10]); // Assuming values range from 1-10
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Create axes
    const xAxis = svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .style("font-size", "10px");
    
    const yAxis = svg.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("font-size", "10px");
    
    // Create tooltip div
    const tooltip = d3.select(tooltipRef.current)
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "5px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "100");
    
    // Draw cells with staggered animation
    svg.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", d => xScale(d.x)!)
      .attr("y", d => yScale(d.y)!)
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("rx", 2)
      .attr("ry", 2)
      .style("fill", "rgba(0, 0, 0, 0.05)")
      .style("stroke", "rgba(0, 0, 0, 0.1)")
      .style("stroke-width", 1)
      .transition()
      .delay((d, i) => i * 10)
      .duration(500)
      .style("fill", d => colorScale(d.value));
    
    // Add value text
    svg.selectAll("text.value")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "value")
      .attr("x", d => xScale(d.x)! + xScale.bandwidth() / 2)
      .attr("y", d => yScale(d.y)! + yScale.bandwidth() / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("font-size", "10px")
      .style("fill", d => d.value > 5 ? "white" : "black")
      .style("font-weight", "bold")
      .style("opacity", 0)
      .text(d => d.value)
      .transition()
      .delay((d, i) => i * 10 + 300)
      .duration(300)
      .style("opacity", 1);
    
    // Add interactions
    svg.selectAll("rect")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(100)
          .style("stroke", "white")
          .style("stroke-width", 2);
        
        tooltip
          .style("visibility", "visible")
          .html(`<strong>${d.y}</strong> vs ${d.x}: <strong>${d.value}</strong>`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(100)
          .style("stroke", "rgba(0, 0, 0, 0.1)")
          .style("stroke-width", 1);
        
        tooltip.style("visibility", "hidden");
      });
    
    // Highlight specific cells if provided
    if (highlightCells.length > 0) {
      highlightCells.forEach(cell => {
        svg.selectAll("rect")
          .filter(d => d.x === cell.x && d.y === cell.y)
          .style("stroke", "#fbbf24")
          .style("stroke-width", 2)
          .style("stroke-dasharray", "3,2");
      });
    }
    
    setIsInitialized(true);
  }, [data, loading, playerName, metrics, highlightCells]);
  
  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setIsInitialized(false);
      // Redraw after resize
      setTimeout(() => setIsInitialized(true), 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Different loading states
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex flex-col items-center justify-center">
            <p className="text-muted-foreground mb-2">No performance data available</p>
            <p className="text-xs text-muted-foreground">Check back later for updates</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <motion.div 
          className="relative h-80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <svg ref={svgRef} width="100%" height="100%" />
          <div ref={tooltipRef} />
        </motion.div>
      </CardContent>
    </Card>
  );
};