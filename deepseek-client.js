(function (root, factory) {
  var client = factory();
  if (typeof module === "object" && module.exports) module.exports = client;
  if (root) root.DeepSeekClient = client;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var API_URL = "https://api.deepseek.com/v1/chat/completions";
  var MODEL = "deepseek-v4-flash";

  function extractAnswer(body) {
    var choice = body && body.choices && body.choices[0];
    var answer = choice && choice.message && typeof choice.message.content === "string" ? choice.message.content.trim() : "";
    if (answer) return answer;
    var reason = choice && choice.finish_reason;
    if (reason === "length") throw new Error("DeepSeek 输出额度已用尽，未生成最终回答，请缩短问题后重试。");
    if (reason === "content_filter") throw new Error("DeepSeek 因内容过滤没有返回回答，请调整问题后重试。");
    if (reason === "insufficient_system_resource") throw new Error("DeepSeek 当前推理资源不足，请稍后重试。");
    if (reason === "tool_calls") throw new Error("DeepSeek 返回了当前页面不支持的工具调用，请重试。");
    if (choice && choice.message && choice.message.reasoning_content) throw new Error("DeepSeek 只返回了思考过程，没有生成最终回答，请重试。");
    throw new Error("DeepSeek 返回了空回答，请重试。");
  }

  function canRetryWithoutThinking(body) {
    var choice = body && body.choices && body.choices[0];
    var reason = choice && choice.finish_reason;
    return reason !== "content_filter" && reason !== "insufficient_system_resource" && reason !== "tool_calls";
  }

  async function post(fetchImpl, apiKey, messages, maxTokens, thinkingEnabled) {
    var body = { model: MODEL, messages: messages, max_tokens: maxTokens, thinking: { type: thinkingEnabled ? "enabled" : "disabled" } };
    if (thinkingEnabled) body.reasoning_effort = "high";
    var response = await fetchImpl(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
      body: JSON.stringify(body)
    });
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok) {
      var message = data && data.error && data.error.message || (response.status + " " + (response.statusText || "")).trim();
      throw new Error("DeepSeek 请求失败：" + message);
    }
    return data;
  }

  async function requestFinal(options) {
    options = options || {};
    var fetchImpl = options.fetchImpl || (typeof fetch === "function" && fetch);
    if (!fetchImpl) throw new Error("当前浏览器不支持网络请求。");
    if (!String(options.apiKey || "").trim()) throw new Error("请先填写 DeepSeek API Key。");
    var maxTokens = Number(options.maxTokens) || 16384;
    var first = await post(fetchImpl, String(options.apiKey).trim(), options.messages || [], maxTokens, true);
    try {
      return { answer: extractAnswer(first), retried: false, response: first };
    } catch (firstError) {
      if (!canRetryWithoutThinking(first)) throw firstError;
      if (typeof options.onRetry === "function") options.onRetry(firstError);
      var second = await post(fetchImpl, String(options.apiKey).trim(), options.messages || [], maxTokens, false);
      return { answer: extractAnswer(second), retried: true, response: second };
    }
  }

  return Object.freeze({ API_URL: API_URL, MODEL: MODEL, extractAnswer: extractAnswer, requestFinal: requestFinal });
});
