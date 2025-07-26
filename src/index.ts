import Fastify, { type FastifyInstance } from "fastify";
import { pushPayment } from "./queue";
import { startWorker } from "./worker";
import { getSummary } from "./summary";

const fastify: FastifyInstance = Fastify({
  logger: false,
});

const requestPaymentBodySchema = {
  type: "object",
  required: ["correlationId", "amount"],
  properties: {
    correlationId: {
      type: "string",
      minLength: 36,
      maxLength: 36,
      format: "uuid",
    },
    amount: { type: "number" },
  },
  additionalProperties: false,
} as const;

const paymentsSummaryQuerySchema = {
  type: "object",
  properties: {
    from: { type: "string", format: "date-time" },
    to: { type: "string", format: "date-time" },
  },
} as const;

fastify.post<{
  Body: RequestPayment;
}>("/payments", {
  schema: { body: requestPaymentBodySchema },
  async handler(request, reply) {
    await pushPayment(request.body);
    return reply.status(202).send();
  },
});

type PaymentsSummaryFilters = {
  from: string;
  to: string;
};

fastify.get<{
  Querystring: PaymentsSummaryFilters;
}>("/payments-summary", {
  schema: { querystring: paymentsSummaryQuerySchema },
  async handler(request, reply) {
    const { from, to } = request.query;
    const summary = await getSummary(new Date(from), new Date(to));

    return reply.status(200).send(summary);
  },
});

fastify.listen({ port: 8080, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  
  startWorker();
  console.log(`Server listening on ${address}`);
});
