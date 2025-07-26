export const config = {
  NODE_ENV: process.env.NODE_ENV ?? "production",
  REDIS_URL: process.env.REDIS_URL ?? "redis://redis:6379",
  PROCESSOR_DEFAULT_URL:
    process.env.PROCESSOR_DEFAULT_URL ??
    "http://payment-processor-default:8080",
  PROCESSOR_FALLBACK_URL:
    process.env.PROCESSOR_FALLBACK_URL ??
    "http://payment-processor-fallback:8080",
};
