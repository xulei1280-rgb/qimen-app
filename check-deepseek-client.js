"use strict";

const assert = require("assert");
const client = require("./deepseek-client.js");

function mockResponse(body, ok = true, status = 200, statusText = "OK") {
  return { ok, status, statusText, async json() { return body; } };
}

async function run() {
  assert.strictEqual(client.MODEL, "deepseek-v4-flash");
  const directCalls = [];
  const direct = await client.requestFinal({
    apiKey: "sk-test",
    messages: [{ role: "user", content: "test" }],
    fetchImpl: async (_url, options) => {
      directCalls.push(JSON.parse(options.body));
      return mockResponse({ choices: [{ finish_reason: "stop", message: { content: "  final answer  " } }] });
    },
  });
  assert.deepStrictEqual({ answer: direct.answer, retried: direct.retried }, { answer: "final answer", retried: false });
  assert.strictEqual(directCalls.length, 1);
  assert.deepStrictEqual(directCalls[0].thinking, { type: "enabled" });
  assert.strictEqual(directCalls[0].reasoning_effort, "high");

  const retryCalls = [];
  let retryNotice = 0;
  const recovered = await client.requestFinal({
    apiKey: "sk-test",
    messages: [{ role: "user", content: "test" }],
    maxTokens: 16384,
    onRetry() { retryNotice += 1; },
    fetchImpl: async (_url, options) => {
      const request = JSON.parse(options.body);
      retryCalls.push(request);
      if (retryCalls.length === 1) return mockResponse({ choices: [{ finish_reason: "length", message: { content: "", reasoning_content: "thinking" } }] });
      return mockResponse({ choices: [{ finish_reason: "stop", message: { content: "recovered" } }] });
    },
  });
  assert.deepStrictEqual({ answer: recovered.answer, retried: recovered.retried }, { answer: "recovered", retried: true });
  assert.strictEqual(retryNotice, 1);
  assert.strictEqual(retryCalls.length, 2);
  assert.strictEqual(retryCalls[0].max_tokens, 16384);
  assert.deepStrictEqual(retryCalls[1].thinking, { type: "disabled" });
  assert.ok(!("reasoning_effort" in retryCalls[1]));

  let filteredCalls = 0;
  await assert.rejects(() => client.requestFinal({
    apiKey: "sk-test",
    fetchImpl: async () => {
      filteredCalls += 1;
      return mockResponse({ choices: [{ finish_reason: "content_filter", message: { content: "" } }] });
    },
  }), /内容过滤/);
  assert.strictEqual(filteredCalls, 1);

  await assert.rejects(() => client.requestFinal({
    apiKey: "sk-test",
    fetchImpl: async () => mockResponse({ error: { message: "invalid key" } }, false, 401, "Unauthorized"),
  }), /DeepSeek 请求失败：invalid key/);

  console.log("deepseek client checks ok: final answer fallback and API errors");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
