/**
 * Sistema de Log
 * Centraliza e formata logs da aplicação
 */

enum LogLevel {
  INFO = 'INFO',
  ERROR = 'ERROR',
  WARN = 'WARN',
  DEBUG = 'DEBUG',
}

export class Logger {
  private static formatMessage(level: LogLevel, scope: string, message: string): string {
    return `[${level}] [${scope}] ${message}`;
  }

  static info(scope: string, message: string): void {
    console.log(this.formatMessage(LogLevel.INFO, scope, message));
  }

  static error(scope: string, message: string, error?: unknown): void {
    console.error(this.formatMessage(LogLevel.ERROR, scope, message));
    if (error) console.error(error);
  }

  static warn(scope: string, message: string): void {
    console.warn(this.formatMessage(LogLevel.WARN, scope, message));
  }

  static debug(scope: string, message: string): void {
    console.debug(this.formatMessage(LogLevel.DEBUG, scope, message));
  }
}
