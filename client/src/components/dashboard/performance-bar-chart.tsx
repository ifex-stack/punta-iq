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

export interface BarChartData {
  label: string;
  value: number;
  percentage?: number;
  color?: string;
}

interface PerformanceBarChartProps {
  data: BarChartData[];
  title: string;
  description?: string;
  loading?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
  height?: number;
  showPercentage?: boolean;
  formatValue?: (value: number) => string;
}

export const PerformanceBarChart: React.FC<PerformanceBarChartProps> = ({
  data,
  title,
  description,
  loading = false,
  valuePrefix = "",
  valueSuffix = "",
  height = 300,
  showPercentage = false,
  formatValue
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (loading || !data.length || !svgRef.current || !tooltipRef.current) return;
    
    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Set dimensions and margins
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // Create scales
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.label))
      .range([0, width])
      .padding(0.3);
    
    const yMax = d3.max(data, d => d.value) || 0;
    const yScale = d3.scaleLinear()
      .domain([0, yMax * 1.1]) // Add 10% padding at the top
      .range([chartHeight, 0]);
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", chartHeight + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Create axes
    const xAxis = svg.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .style("font-size", "10px");
    
    const yAxis = svg.append("g")
      .call(d3.axisLeft(yScale)
        .ticks(5)
        .tickFormat(d => {
          if (formatValue) {
            return formatValue(d as number);
          }
          return `${valuePrefix}${d}${valueSuffix}`;
        }))
      .selectAll("text")
      .style("font-size", "10px");
    
    // Create tooltip div
    const tooltip = d3.select(tooltipRef.current)
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "5px 10px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "100");
    
    // Draw bars with animation
    svg.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.label)!)
      .attr("width", xScale.bandwidth())
      .attr("y", chartHeight)
      .attr("height", 0)
      .attr("rx", 3)
      .attr("ry", 3)
      .style("fill", d => d.color || "#3b82f6") // Default to blue if no color provided
      .transition()
      .delay((d, i) => i * 50)
      .duration(800)
      .attr("y", d => yScale(d.value))
      .attr("height", d => chartHeight - yScale(d.value));
    
    // Add value labels on top of bars
    svg.selectAll(".value-label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "value-label")
      .attr("x", d => xScale(d.label)! + xScale.bandwidth() / 2)
      .attr("y", d => yScale(d.value) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "#6b7280")
      .style("font-weight", "500")
      .style("opacity", 0)
      .text(d => {
        if (formatValue) {
          return formatValue(d.value);
        }
        return `${valuePrefix}${d.value}${valueSuffix}`;
      })
      .transition()
      .delay((d, i) => i * 50 + 400)
      .duration(300)
      .style("opacity", 1);
    
    // Add interactions
    svg.selectAll(".bar")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(100)
          .style("opacity", 0.8);
        
        let tooltipContent = `<strong>${d.label}</strong>: ${valuePrefix}${d.value}${valueSuffix}`;
        if (showPercentage && d.percentage !== undefined) {
          tooltipContent += ` (${d.percentage.toFixed(1)}%)`;
        }
        
        tooltip
          .style("visibility", "visible")
          .html(tooltipContent)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 30) + "px");
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 30) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(100)
          .style("opacity", 1);
        
        tooltip.style("visibility", "hidden");
      });
    
    setIsInitialized(true);
  }, [data, loading, title, height, valuePrefix, valueSuffix, showPercentage, formatValue]);
  
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
          <div style={{height: `${height}px`}} className="flex items-center justify-center">
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
          <div style={{height: `${height}px`}} className="flex flex-col items-center justify-center">
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
          className="relative"
          style={{height: `${height}px`}}
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