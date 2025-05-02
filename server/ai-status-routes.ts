/**
 * API routes for AI service status monitoring and display
 */
import { Router } from "express";
import { MicroserviceClient } from "./microservice-client";
import { createContextLogger } from "./logger";
import { spawn } from "child_process";
import path from "path";

export const aiStatusRouter = Router();
const client = new MicroserviceClient();
const logger = createContextLogger("AIStatusRoutes");

// Get detailed AI service status
aiStatusRouter.get("/", async (req, res) => {
  try {
    const isRunning = await client.isRunning();
    let detailedStatus;
    
    if (isRunning) {
      try {
        // Try to get detailed status from the API
        detailedStatus = await client.getStatus();
      } catch (error) {
        // If can't get detailed status, return basic info
        detailedStatus = { 
          overall: "degraded",
          services: {},
          timestamp: new Date().toISOString()
        };
      }
      
      res.json({
        status: "online",
        detailed: detailedStatus,
        uptime: "unknown", // In a future version, we could track uptime
        lastRestartAt: null // In a future version, we could track restart times
      });
    } else {
      res.json({
        status: "offline",
        detailed: null,
        message: "AI microservice is not running",
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error(`Error getting AI service status: ${error}`);
    res.status(500).json({ 
      status: "error",
      message: "Failed to determine AI service status",
      error: (error as Error).message 
    });
  }
});

// Manual start endpoint (protected - should have auth in production)
aiStatusRouter.post("/start", async (req, res) => {
  try {
    const isRunning = await client.isRunning();
    
    if (isRunning) {
      return res.json({ 
        status: "success", 
        message: "AI service is already running" 
      });
    }
    
    // Get the path to the start script
    const scriptPath = path.join(process.cwd(), "scripts", "start-ai-service.js");
    
    // Spawn the Node.js process to run the script
    const childProcess = spawn("node", [scriptPath], {
      detached: true,
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    
    // Detach the child process so it continues running independently
    childProcess.unref();
    
    logger.info(`AI service start initiated with PID: ${childProcess.pid}`);
    
    // Wait a moment for the service to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if the service is now running
    const isNowRunning = await client.isRunning();
    
    if (isNowRunning) {
      res.json({ 
        status: "success", 
        message: "AI service started successfully" 
      });
    } else {
      res.status(500).json({ 
        status: "error", 
        message: "AI service failed to start in the expected timeframe" 
      });
    }
  } catch (error) {
    logger.error(`Error starting AI service: ${error}`);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to start AI service",
      error: (error as Error).message 
    });
  }
});