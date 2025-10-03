interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: any) => boolean;
}

const defaultShouldRetry = (error: any): boolean => {
  // Códigos de error que vale la pena reintentar
  const retryableErrorCodes = ['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED'];
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  
  if (error.code && retryableErrorCodes.includes(error.code)) {
    return true;
  }
  
  if (error.status && retryableStatusCodes.includes(error.status)) {
    return true;
  }
  
  if (error.message && error.message.includes('timeout')) {
    return true;
  }
  
  return false;
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 5,
    baseDelay = 1000,
    maxDelay = 30000,
    shouldRetry = defaultShouldRetry
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Si no es un error reintentar o es el último intento, lanzar error
      if (!shouldRetry(error) || attempt === maxAttempts - 1) {
        throw error;
      }
      
      // Calcular delay con exponential backoff + jitter
      const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.random() * 1000; // 0-1000ms de jitter
      const delay = exponentialDelay + jitter;
      
      console.log(
        `Intento ${attempt + 1}/${maxAttempts} falló: ${error.message || error.code || 'Error desconocido'}. ` +
        `Reintentando en ${Math.round(delay)}ms...`
      );
      
      // Esperar antes de reintentar
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
