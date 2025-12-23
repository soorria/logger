import winston from 'winston'
import { BaseLoggerAdapter, type LogLevel } from '../types.js'

class WinstonAdapter extends BaseLoggerAdapter {
  name = 'winston'
  private logger!: winston.Logger

  setup() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()],
    })
  }

  log(level: LogLevel, message: string, data?: unknown) {
    this.logger.log(level, message, data)
  }
}

class WinstonPrettyAdapter extends BaseLoggerAdapter {
  name = 'winston-pretty'
  private logger!: winston.Logger

  setup() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      transports: [new winston.transports.Console()],
    })
  }

  log(level: LogLevel, message: string, data?: unknown) {
    this.logger.log(level, message, data)
  }
}

export const adapters = [new WinstonAdapter(), new WinstonPrettyAdapter()]
