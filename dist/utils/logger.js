"use strict";
/**
 * Sistema de Log
 * Centraliza e formata logs da aplicação
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel["INFO"] = "INFO";
    LogLevel["ERROR"] = "ERROR";
    LogLevel["WARN"] = "WARN";
    LogLevel["DEBUG"] = "DEBUG";
})(LogLevel || (LogLevel = {}));
class Logger {
    static formatMessage(level, scope, message) {
        return `[${level}] [${scope}] ${message}`;
    }
    static info(scope, message) {
        console.log(this.formatMessage(LogLevel.INFO, scope, message));
    }
    static error(scope, message, error) {
        console.error(this.formatMessage(LogLevel.ERROR, scope, message));
        if (error)
            console.error(error);
    }
    static warn(scope, message) {
        console.warn(this.formatMessage(LogLevel.WARN, scope, message));
    }
    static debug(scope, message) {
        console.debug(this.formatMessage(LogLevel.DEBUG, scope, message));
    }
}
exports.Logger = Logger;
