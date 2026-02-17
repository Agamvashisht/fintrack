import winston from 'winston';
import path from 'path';
import { config } from './env';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  if (stack) {
    log += `\n${stack}`;
  }
  if (Object.keys(metadata).length > 0) {
    log += ` ${JSON.stringify(metadata)}`;
  }
  return log;
});

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: combine(
      colorize({ all: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      logFormat,
    ),
  }),
];

if (config.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join(config.LOG_DIR, 'error.log'),
      level: 'error',
      format: combine(timestamp(), errors({ stack: true }), winston.format.json()),
    }),
    new winston.transports.File({
      filename: path.join(config.LOG_DIR, 'combined.log'),
      format: combine(timestamp(), errors({ stack: true }), winston.format.json()),
    }),
  );
}

export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  transports,
  exitOnError: false,
});

export default logger;
