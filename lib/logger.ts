import { AsyncLocalStorage } from "async_hooks";

// AsyncLocalStorage untuk menyimpan traceId per request
export const traceStorage = new AsyncLocalStorage<string>();

/**
 * Generate traceId unik untuk setiap request
 */
export function generateTraceId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get traceId dari context saat ini
 */
export function getTraceId(): string {
  return traceStorage.getStore() || "no-trace";
}

/**
 * Logger dengan format [$traceId][Nama File] Stage - Message
 */
export class Logger {
  private fileName: string;

  constructor(fileName: string) {
    this.fileName = fileName;
  }

  private formatMessage(stage: string, message: string): string {
    const traceId = getTraceId();
    return `[${traceId}][${this.fileName}] ${stage} - ${message}`;
  }

  info(stage: string, message: string, data?: any) {
    const formatted = this.formatMessage(stage, message);
    if (data !== undefined) {
      console.log(formatted, JSON.stringify(data, null, 2));
    } else {
      console.log(formatted);
    }
  }

  error(stage: string, message: string, error?: any) {
    const formatted = this.formatMessage(stage, message);
    if (error) {
      console.error(formatted, error);
    } else {
      console.error(formatted);
    }
  }

  warn(stage: string, message: string, data?: any) {
    const formatted = this.formatMessage(stage, message);
    if (data !== undefined) {
      console.warn(formatted, JSON.stringify(data, null, 2));
    } else {
      console.warn(formatted);
    }
  }

  debug(stage: string, message: string, data?: any) {
    const formatted = this.formatMessage(stage, message);
    if (data !== undefined) {
      console.debug(formatted, JSON.stringify(data, null, 2));
    } else {
      console.debug(formatted);
    }
  }
}

/**
 * Helper untuk log request masuk
 */
export function logRequest(logger: Logger, method: string, url: string, params?: any, body?: any) {
  const requestData: any = {
    method,
    url,
  };

  if (params && Object.keys(params).length > 0) {
    requestData.params = params;
  }

  if (body && Object.keys(body).length > 0) {
    requestData.body = body;
  }

  logger.info("Request", "Incoming request", requestData);
}

/**
 * Helper untuk log response keluar
 */
export function logResponse(logger: Logger, status: number, data?: any) {
  const responseData: any = {
    status,
  };

  if (data !== undefined) {
    responseData.data = data;
  }

  logger.info("Response", "Outgoing response", responseData);
}
