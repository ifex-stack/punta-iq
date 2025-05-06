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

export interface MonthlyData {
  month: string;
  year: number;
  total: number;
  won: number;
  successRate: number;
}

interface MonthlyPerformanceChartProps {
  data: MonthlyData[];
  title: string;
  description?: string;
  loading?: boolean;
  height?: number;
}

export const MonthlyPerformanceChart: React.FC<MonthlyPerformanceChartProps> = ({
  data,
  title,
  description,
  loading = false,
  height = 350
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (loading || !data.length || !svgRef.current || !tooltipRef.current) return;
    
    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Set dimensions and margins
    const margin = { top: 20, right: 50, bottom: 40, left: 50 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // Create scales
    const xScale = d3.scaleBand()
      .domain(data.map(d => `${d.month} ${d.year}`))
      .range([0, width])
      .padding(0.1);
    
    const yScaleRate = d3.scaleLinear()
      .domain([0, 100])
      .range([chartHeight, 0]);
    
    const yScaleVolume = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.total) || 0])
      .range([chartHeight, 0]);
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", chartHeight + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Create axes
    svg.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .style("font-size", "10px");
    
    // Create y-axis for success rate
    svg.append("g")
      .call(d3.axisLeft(yScaleRate).ticks(5).tickFormat(d => `${d}%`))
      .selectAll("text")
      .style("font-size", "10px");
    
    // Create y-axis for volume
    svg.append("g")
      .attr("transform", `translate(${width}, 0)`)
      .call(d3.axisRight(yScaleVolume).ticks(5))
      .selectAll("text")
      .style("font-size", "10px");
    
    // Add y-axis labels
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -chartHeight / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "#3b82f6")
      .text("Success Rate (%)");
    
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", width + 40)
      .attr("x", -chartHeight / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "#f97316")
      .text("Total Predictions");
    
    // Create tooltip div
    const tooltip = d3.select(tooltipRef.current)
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "10px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "100");
    
    // Create bars for total predictions
    svg.selectAll(".total-bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "total-bar")
      .attr("x", d => xScale(`${d.month} ${d.year}`)! + xScale.bandwidth() / 2 - 10)
      .attr("width", 20)
      .attr("y", chartHeight)
      .attr("height", 0)
      .attr("rx", 2)
      .attr("ry", 2)
      .style("fill", "#f97316")
      .style("opacity", 0.3)
      .transition()
      .delay((d, i) => i * 50)
      .duration(800)
      .attr("y", d => yScaleVolume(d.total))
      .attr("height", d => chartHeight - yScaleVolume(d.total));
    
    // Create line generator for success rate
    const line = d3.line<MonthlyData>()
      .x(d => xScale(`${d.month} ${d.year}`)! + xScale.bandwidth() / 2)
      .y(d => yScaleRate(d.successRate))
      .curve(d3.curveMonotoneX);
    
    // Create path for success rate line
    const path = svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 3)
      .attr("d", line);
    
    // Animate path
    const pathLength = path.node()!.getTotalLength();
    path
      .attr("stroke-dasharray", pathLength)
      .attr("stroke-dashoffset", pathLength)
      .transition()
      .duration(1500)
      .attr("stroke-dashoffset", 0);
    
    // Add circles for data points
    svg.selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(`${d.month} ${d.year}`)! + xScale.bandwidth() / 2)
      .attr("cy", d => yScaleRate(d.successRate))
      .attr("r", 4)
      .style("fill", "#3b82f6")
      .style("opacity", 0)
      .transition()
      .delay((d, i) => 1200 + i * 50)
      .duration(300)
      .style("opacity", 1);
    
    // Add interactions
    svg.selectAll(".dot")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(100)
          .attr("r", 6);
        
        const tooltipContent = `
          <div class="font-bold">${d.month} ${d.year}</div>
          <div>Success Rate: <span class="font-bold">${d.successRate.toFixed(1)}%</span></div>
          <div>Total Predictions: <span class="font-bold">${d.total}</span></div>
          <div>Won: <span class="font-bold">${d.won}</span></div>
        `;
        
        tooltip
          .style("visibility", "visible")
          .html(tooltipContent)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(100)
          .attr("r", 4);
        
        tooltip.style("visibility", "hidden");
      });
    
    // Add interactions for bars
    svg.selectAll(".total-bar")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(100)
          .style("opacity", 0.5);
        
        const tooltipContent = `
          <div class="font-bold">${d.month} ${d.year}</div>
          <div>Success Rate: <span class="font-bold">${d.successRate.toFixed(1)}%</span></div>
          <div>Total Predictions: <span class="font-bold">${d.total}</span></div>
          <div>Won: <span class="font-bold">${d.won}</span></div>
        `;
        
        tooltip
          .style("visibility", "visible")
          .html(tooltipContent)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(100)
          .style("opacity", 0.3);
        
        tooltip.style("visibility", "hidden");
      });
    
    setIsInitialized(true);
  }, [data, loading, title, height]);
  
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
            <p className="text-muted-foreground mb-2">No monthly performance data available</p>
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
          <div className="text-xs text-muted-foreground mt-4 flex justify-center space-x-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
              <span>Success Rate (%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 opacity-30 rounded-sm mr-1"></div>
              <span>Total Predictions</span>
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
};