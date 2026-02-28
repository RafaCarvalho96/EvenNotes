export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(msg: string, data?: Record<string, unknown>): void;
  info(msg: string, data?: Record<string, unknown>): void;
  warn(msg: string, data?: Record<string, unknown>): void;
  error(msg: string, data?: Record<string, unknown>): void;
}

export function createLogger(name: string): Logger {
  function log(level: LogLevel, msg: string, data?: Record<string, unknown>): void {
    const entry = JSON.stringify({ level, name, msg, time: new Date().toISOString(), ...data });
    if (level === 'error' || level === 'warn') {
      console.error(entry);
    } else {
      console.log(entry);
    }
  }

  return {
    debug: (msg, data) => log('debug', msg, data),
    info:  (msg, data) => log('info',  msg, data),
    warn:  (msg, data) => log('warn',  msg, data),
    error: (msg, data) => log('error', msg, data),
  };
}
