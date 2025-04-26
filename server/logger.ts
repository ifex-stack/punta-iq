// Centralized logging system for PuntaIQ
// Handles server-side logging with different log levels and contexts

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Log entry type
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
  userId?: number;
}

// Configuration options
const LOG_TO_CONSOLE = true;
const LOG_TO_FILE = false; // Set to true when file logging is implemented
const LOG_LEVEL = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;

// Check if a log level should be logged based on current config
function shouldLog(level: LogLevel): boolean {
  const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.CRITICAL];
  const configIndex = levels.indexOf(LOG_LEVEL);
  const messageIndex = levels.indexOf(level);
  
  return messageIndex >= configIndex;
}

// Format log entry for console output
function formatConsoleLog(entry: LogEntry): string {
  const { timestamp, level, context, message } = entry;
  let formattedData = '';
  
  if (entry.data) {
    try {
      if (typeof entry.data === 'object') {
        formattedData = ` ${JSON.stringify(entry.data)}`;
      } else {
        formattedData = ` ${entry.data}`;
      }
    } catch (e) {
      formattedData = ' [Unserializable data]';
    }
  }
  
  return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}${formattedData}`;
}

// Main logging function
export function log(level: LogLevel, context: string, message: string, data?: any, userId?: number): void {
  if (!shouldLog(level)) return;
  
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    context,
    message,
    data,
    userId
  };
  
  // Console logging
  if (LOG_TO_CONSOLE) {
    const formattedMessage = formatConsoleLog(entry);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(formattedMessage);
        break;
    }
  }
  
  // File logging (could be implemented for production environments)
  if (LOG_TO_FILE) {
    // Placeholder for file logging implementation
    // This would write logs to a file or send to a log service
  }
}

// Convenience logging methods
export const logger = {
  debug: (context: string, message: string, data?: any, userId?: number) => 
    log(LogLevel.DEBUG, context, message, data, userId),
    
  info: (context: string, message: string, data?: any, userId?: number) => 
    log(LogLevel.INFO, context, message, data, userId),
    
  warn: (context: string, message: string, data?: any, userId?: number) => 
    log(LogLevel.WARN, context, message, data, userId),
    
  error: (context: string, message: string, data?: any, userId?: number) => 
    log(LogLevel.ERROR, context, message, data, userId),
    
  critical: (context: string, message: string, data?: any, userId?: number) => 
    log(LogLevel.CRITICAL, context, message, data, userId)
};

// Create a context-specific logger
export function createContextLogger(context: string) {
  return {
    debug: (message: string, data?: any, userId?: number) => 
      logger.debug(context, message, data, userId),
      
    info: (message: string, data?: any, userId?: number) => 
      logger.info(context, message, data, userId),
      
    warn: (message: string, data?: any, userId?: number) => 
      logger.warn(context, message, data, userId),
      
    error: (message: string, data?: any, userId?: number) => 
      logger.error(context, message, data, userId),
      
    critical: (message: string, data?: any, userId?: number) => 
      logger.critical(context, message, data, userId)
  };
}