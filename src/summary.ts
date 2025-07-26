import redis from "./config/redis";

const PAYMENTS_KEY = "payments";

export async function storePayment(
  correlationId: string,
  paymentJSON: string
) {
  await redis.hSet(PAYMENTS_KEY, correlationId, paymentJSON);
}

async function getAllPayments(): Promise<Payment[]> {
  const storedPaymentsMap = await redis.hGetAll(PAYMENTS_KEY);
  const payments = [];

  for (const storedPaymentJSON of Object.values(storedPaymentsMap)) {
    const payment = JSON.parse(storedPaymentJSON);
    payments.push(payment);
  }

  return payments;
}

export async function getSummary(from: Date, to: Date): Promise<Summary> {
  const payments: Payment[] = await getAllPayments();

  let defaultCount = 0;
  let defaultAmount = 0;
  let fallbackCount = 0;
  let fallbackAmount = 0;

  for (const payment of payments) {
    const requestedAt = new Date(payment.requestedAt);

    if (from && requestedAt < from) continue;
    if (to && requestedAt > to) continue;

    switch (payment.processor) {
      case "default":
        defaultCount++;
        defaultAmount += payment.amount;
        break;
      case "fallback":
        fallbackCount++;
        fallbackAmount += payment.amount;
        break;
    }
  }

  return {
    default: {
      totalRequests: defaultCount,
      totalAmount: defaultAmount,
    },
    fallback: {
      totalRequests: fallbackCount,
      totalAmount: fallbackAmount,
    },
  };
}
