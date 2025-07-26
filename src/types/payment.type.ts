type Payment = {
  processor: "default" | "fallback";
  amount: number;
  requestedAt: string;
};
