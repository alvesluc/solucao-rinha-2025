import redis from "./config/redis";

const QUEUE_NAME = "payment_queue";

export async function pushPayment(payment: RequestPayment) {
  await redis.rPush(QUEUE_NAME, JSON.stringify(payment));
}

export async function popPayment() {
  const payment = await redis.lPop(QUEUE_NAME);
  if (!payment) return null;
  return JSON.parse(payment);
}
