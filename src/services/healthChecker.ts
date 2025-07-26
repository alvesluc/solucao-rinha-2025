import { config } from "../config/config";
import redis from "../config/redis";

export let assignedProcessor = {
  name: "default",
  url: config.PROCESSOR_DEFAULT_URL,
};

export function startHealthChecks() {
  setInterval(async () => {
    /* 
    Como existem múltiplas instâncias do servidor rodando em paralelo, somente
    uma delas poderá fazer a atualização dos status dos processors, para que
    isso aconteça é necessária a criação de uma trava - ou lock.
    Quem estiver responsável pela atualização, também é responsável por abrir,
    ou soltar, esta trava. 
    */
    if (await acquireLock()) {
      await updateProcessorsStatuses();
      await releaseLock();
      return;
    }

    await getAssignedFromRedis();
  }, 5100);
}

async function acquireLock() {
  /* 
  A trava se desfaz automaticamente após 10 segundos. Medida necessária para
  evitar a liberação caso o responsável não a faça.
  */
  const result = await redis.set("health_check_lock", "1", {
    condition: "NX",
    expiration: { type: "EX", value: 10 },
  });

  return result === "OK";
}

async function releaseLock() {
  await redis.del("health_check_lock");
}

async function updateProcessorsStatuses() {
  /* 
  Essa está sendo minha primeira implementação, por enquanto não vou fazer a
  comparação dos `minResponseTime` dos dois serviços. Priorizando o default
  por ter a menor taxa.
  */
  const defaultStatus = await getProcessorHealthStatus(
    config.PROCESSOR_DEFAULT_URL
  );

  if (!defaultStatus?.failing) {
    assignDefaultProcessor();
    saveAssignedOnRedis("default");
    return;
  }

  const fallbackStatus = await getProcessorHealthStatus(
    config.PROCESSOR_FALLBACK_URL
  );

  if (!fallbackStatus?.failing) {
    assignFallbackProcessor();
    saveAssignedOnRedis("fallback");
    return;
  }

  if (defaultStatus?.failing && fallbackStatus?.failing) {
    assignDefaultProcessor();
    saveAssignedOnRedis("default");
    return;
  }
}

async function getProcessorHealthStatus(processorUrl: string) {
  try {
    const response = await fetch(`${processorUrl}/payments/service-health`);
    const responseBody = await response.json();

    if (!response.ok) return null;

    return responseBody as PaymentProcessorStatus;
  } catch (error) {
    return null;
  }
}

async function saveAssignedOnRedis(processor: "default" | "fallback") {
  // https://redis.io/docs/latest/commands/hset
  await redis.hSet("assigned_processor", { processor });
}

async function getAssignedFromRedis() {
  // https://redis.io/docs/latest/commands/hget
  const data = await redis.hGet("assigned_processor", "processor");

  if (!data) return;

  if (data === "default") {
    assignDefaultProcessor();
    return;
  }

  if (data === "fallback") {
    assignFallbackProcessor();
    return;
  }
}

function assignDefaultProcessor() {
  assignedProcessor.name = "default";
  assignedProcessor.url = config.PROCESSOR_DEFAULT_URL;
}

function assignFallbackProcessor() {
  assignedProcessor.name = "fallback";
  assignedProcessor.url = config.PROCESSOR_FALLBACK_URL;
}
