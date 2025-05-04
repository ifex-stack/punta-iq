/**
 * Logger configuration for PuntaIQ application
 */
import winston from 'winston';

// Configure the Winston logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'puntaiq-api' },
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.printf(info => `[${info.timestamp}] [${info.level}] ${info.message}`)
      )
    })
  ]
});

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    })
  );
  logger.add(
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  );
}

/**
 * Create a context-specific logger
 * @param context The logging context (e.g., 'HTTP', 'DATABASE', etc.)
 * @returns A winston child logger with the specified context
 */
function createContextLogger(context: string) {
  return logger.child({ context });
}

export { logger, createContextLogger };