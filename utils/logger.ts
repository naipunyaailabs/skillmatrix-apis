import { randomUUID } from 'crypto';

export interface LogMeta {
  [key: string]: any;
}

export class Logger {
  constructor(private requestId: string = randomUUID(), private context: string = '') {}

  private formatLog(level: string, message: string, meta?: LogMeta) {
    return JSON.stringify({
      level,
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
      context: this.context,
      message,
      ...meta
    });
  }

  info(message: string, meta?: LogMeta) {
    console.log(this.formatLog('info', message, meta));
  }

  warn(message: string, meta?: LogMeta) {
    console.warn(this.formatLog('warn', message, meta));
  }

  error(message: string, error?: Error, meta?: LogMeta) {
    console.error(this.formatLog('error', message, {
      error: error?.message,
      stack: error?.stack,
      ...meta
    }));
  }

  debug(message: string, meta?: LogMeta) {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(this.formatLog('debug', message, meta));
    }
  }

  // Create a child logger with additional context
  child(context: string): Logger {
    return new Logger(this.requestId, context);
  }
}

// Create a default logger instance
export function createLogger(requestId?: string, context?: string): Logger {
  return new Logger(requestId, context);
}
