type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

function formatLog(level: LogLevel, message: string, data?: unknown): void {
  const timestamp = new Date().toISOString();
  const payload = data !== undefined ? ` ${JSON.stringify(data)}` : '';
  const line = `[${timestamp}] [${level}] ${message}${payload}`;

  if (level === 'ERROR') {
    console.error(line);
    return;
  }

  if (level === 'WARN') {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  info(message: string, data?: unknown): void {
    formatLog('INFO', message, data);
  },
  warn(message: string, data?: unknown): void {
    formatLog('WARN', message, data);
  },
  error(message: string, data?: unknown): void {
    formatLog('ERROR', message, data);
  },
  debug(message: string, data?: unknown): void {
    if (process.env.NODE_ENV === 'development') {
      formatLog('DEBUG', message, data);
    }
  },
};
