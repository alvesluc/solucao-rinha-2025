import Fastify, { FastifyInstance } from "fastify";

const fastify: FastifyInstance = Fastify();

type RequestPayment = {
  correlationId: string;
  amount: number;
};

type PaymentPayload = RequestPayment & {
  requestedAt: string;
};

fastify.post("/payments", (request, reply) => {
  const { correlationId, amount } = request.body as RequestPayment;

  const payload: PaymentPayload = {
    correlationId,
    amount,
    requestedAt: new Date().toISOString(),
  };

  console.log(JSON.stringify(payload, null, 2));

  return reply.status(202);
});

fastify.get("/payments-summary", () => {});

fastify.listen({ port: 8080, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(`Server listening on ${address}`);
});
