import { createClient, type RedisClientType } from "redis";
import { config } from "./config";

const redis: RedisClientType = createClient({
  url: config.REDIS_URL || "redis://localhost:6379",
});

redis.on("connect", () => console.log("Redis client connected"));
redis.on("ready", () => console.log("Redis client ready"));
redis.on("error", (err) => console.error("Redis client error:", err));
redis.on("end", () => console.log("Redis client disconnected"));

(async () => {
  try {
    await redis.connect();
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
    process.exit(1);
  }
})();

export default redis;
