import { assignedProcessor, startHealthChecks } from "./services/healthChecker";
import { pushPayment, popPayment } from "./queue";
import { storePayment } from "./summary";

async function processPayment(payment: RequestPayment) {
  const url = `${assignedProcessor.url}/payments`;

  const paymentJSON = JSON.stringify({
    correlationId: payment.correlationId,
    processor: assignedProcessor.name,
    amount: payment.amount,
    requestedAt: new Date().toISOString(),
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: paymentJSON,
    });

    if (!response.ok) {
      await pushPayment(payment);
      return;
    }

    await storePayment(payment.correlationId, paymentJSON);
  } catch (error) {
    await pushPayment(payment);
  }
}

export async function startWorker() {
  startHealthChecks();

  while (true) {
    const payment = await popPayment();

    if (payment) {
      await processPayment(payment);
    } else {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}
