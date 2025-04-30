import type { Express } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { insertNotificationSchema, insertPushTokenSchema } from "@shared/schema";
import { 
  sendPushNotification, 
  sendMulticastPushNotification, 
  subscribeToTopic,
  unsubscribeFromTopic
} from "./firebase-admin";

// Helper function to validate if a user is an admin
const isAdmin = (req: any): boolean => {
  return req.isAuthenticated() && req.user.id === 1; // Consider user ID 1 as admin for testing
};

export function setupNotificationRoutes(app: Express) {
  // Get current user's notifications
  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const userId = req.user.id;
      const notifications = await storage.getUserNotifications(userId, limit);
      
      return res.json(notifications);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });
  
  // Mark notification as read
  app.patch("/api/notifications/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const notification = await storage.getNotificationById(id);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      if (notification.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const success = await storage.markNotificationAsRead(id);
      if (success) {
        return res.json({ success: true });
      } else {
        return res.status(500).json({ message: "Failed to mark notification as read" });
      }
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });
  
  // Mark all notifications as read
  app.patch("/api/notifications/read-all", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user.id;
      const success = await storage.markAllNotificationsAsRead(userId);
      
      if (success) {
        return res.json({ success: true });
      } else {
        return res.status(500).json({ message: "Failed to mark notifications as read" });
      }
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });
  
  // Delete notification
  app.delete("/api/notifications/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const notification = await storage.getNotificationById(id);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      if (notification.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const success = await storage.deleteNotification(id);
      if (success) {
        return res.json({ success: true });
      } else {
        return res.status(500).json({ message: "Failed to delete notification" });
      }
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });
  
  // Delete all notifications
  app.delete("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user.id;
      const success = await storage.deleteAllNotifications(userId);
      
      if (success) {
        return res.json({ success: true });
      } else {
        return res.status(500).json({ message: "Failed to delete notifications" });
      }
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });
  
  // Register a push token (for mobile/web browser push notifications)
  app.post("/api/push-tokens", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const schema = insertPushTokenSchema.extend({
        token: z.string().min(1, "Token is required"),
        platform: z.enum(["ios", "android", "web"], { 
          errorMap: () => ({ message: "Platform must be 'ios', 'android', or 'web'" })
        }),
      });
      
      const validatedData = schema.parse({
        ...req.body,
        userId: req.user.id,
      });
      
      const token = await storage.createPushToken(validatedData);
      return res.status(201).json(token);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ message: error.message });
    }
  });
  
  // Deactivate a push token
  app.delete("/api/push-tokens/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const token = await storage.getPushTokenById(id);
      
      if (!token) {
        return res.status(404).json({ message: "Token not found" });
      }
      
      if (token.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const success = await storage.deactivatePushToken(id);
      if (success) {
        return res.json({ success: true });
      } else {
        return res.status(500).json({ message: "Failed to deactivate token" });
      }
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });
  
  // Admin route: Create notification
  app.post("/api/admin/notifications", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Check if user is admin (in a real app, we would have roles)
    // For now, we'll assume only user with ID 1 can create notifications for others
    if (req.user.id !== 1) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const schema = insertNotificationSchema.extend({
        userId: z.number().min(1, "User ID is required"),
        title: z.string().min(1, "Title is required"),
        message: z.string().min(1, "Message is required"),
        type: z.enum(["info", "success", "warning", "error"], { 
          errorMap: () => ({ message: "Type must be one of 'info', 'success', 'warning', 'error'" })
        }),
      });
      
      const validatedData = schema.parse(req.body);
      const notification = await storage.createNotification(validatedData);
      
      return res.status(201).json(notification);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ message: error.message });
    }
  });
  
  // Test push notification for the current user
  app.post("/api/notifications/test", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { title, body, data = {} } = req.body;
      
      if (!title || !body) {
        return res.status(400).json({ message: "Title and body are required" });
      }
      
      // Create an in-app notification
      await storage.createNotification({
        userId: req.user.id,
        title,
        message: body,
        type: "info",
        data
      });
      
      // Send through WebSocket if user is connected
      await storage.notifyUserViaWebSocket(req.user.id, {
        type: 'notification',
        title,
        body,
        data
      });
      
      // Get user's tokens for Firebase push notifications
      const tokens = await storage.getUserPushTokens(req.user.id);
      
      if (tokens && tokens.length > 0) {
        // If user has multiple tokens, send to all of them
        if (tokens.length > 1) {
          const tokenList = tokens.map(t => t.token);
          const result = await sendMulticastPushNotification(tokenList, title, body, data);
          return res.json({ 
            success: true, 
            message: "Test notifications sent successfully", 
            result
          });
        } else {
          // Send to single device
          const result = await sendPushNotification(tokens[0].token, title, body, data);
          return res.json({ 
            success: true, 
            message: "Test notification sent successfully", 
            result
          });
        }
      } else {
        // Fallback to existing push notification service if no Firebase tokens
        const success = await storage.sendPushNotification(
          req.user.id,
          title,
          body,
          data
        );
        
        if (success) {
          return res.json({ success: true, message: "Test notification sent successfully (using legacy service)" });
        } else {
          return res.status(500).json({ success: false, message: "Failed to send test notification" });
        }
      }
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });
  
  // Admin endpoint: Send test notification to any user
  app.post("/api/admin/send-notification", async (req, res) => {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    
    try {
      const { userId, title, body, type = "info", data = {} } = req.body;
      
      if (!userId || !title || !body) {
        return res.status(400).json({ 
          message: "userId, title, and body are required",
          example: {
            userId: 1,
            title: "New Prediction Available",
            body: "Check out our latest prediction for the upcoming match!",
            type: "info", // optional: info, success, warning, error
            data: { 
              matchId: 123, 
              redirectTo: "/predictions/123" 
            } // optional
          }
        });
      }
      
      // Create an in-app notification
      const notification = await storage.createNotification({
        userId,
        title,
        message: body,
        type: type as any,
        data
      });
      
      // Send through WebSocket if user is connected
      await storage.notifyUserViaWebSocket(userId, {
        type: 'notification',
        title,
        body,
        data
      });
      
      // Get user's Firebase tokens
      const tokens = await storage.getUserPushTokens(userId);
      let firebaseResult = null;
      
      if (tokens && tokens.length > 0) {
        // If user has multiple tokens, send to all of them
        if (tokens.length > 1) {
          const tokenList = tokens.map(t => t.token);
          firebaseResult = await sendMulticastPushNotification(tokenList, title, body, data);
        } else {
          // Send to single device
          firebaseResult = await sendPushNotification(tokens[0].token, title, body, data);
        }
      }
      
      // Also use the existing push notification service as fallback
      const legacySuccess = await storage.sendPushNotification(
        userId,
        title,
        body,
        data
      );
      
      return res.json({ 
        success: true, 
        message: "Admin notification sent successfully", 
        notification,
        firebaseResult,
        legacyPushDelivered: legacySuccess
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });
  
  // Add a new route to subscribe a device to a topic
  app.post("/api/notifications/subscribe", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { token, topic } = req.body;
      
      if (!token || !topic) {
        return res.status(400).json({ message: "Token and topic are required" });
      }
      
      const result = await subscribeToTopic(token, topic);
      
      return res.json({ 
        success: result.success, 
        message: result.success ? `Successfully subscribed to ${topic}` : "Failed to subscribe to topic",
        result
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });
  
  // Add a new route to unsubscribe a device from a topic
  app.post("/api/notifications/unsubscribe", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { token, topic } = req.body;
      
      if (!token || !topic) {
        return res.status(400).json({ message: "Token and topic are required" });
      }
      
      const result = await unsubscribeFromTopic(token, topic);
      
      return res.json({ 
        success: result.success, 
        message: result.success ? `Successfully unsubscribed from ${topic}` : "Failed to unsubscribe from topic",
        result
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });
}