const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(html.includes('<textarea rows="2" placeholder="输入你想问的事情..." id="question"'), 'main Qimen question should support multi-line entry');
assert(html.includes('<textarea id="followupQuestion" rows="2"'), 'Qimen follow-up question should support multi-line entry');
assert(html.includes('handleQimenAiKeydown(event)') && html.includes('handleQimenAiKeydown(event,true)'), 'Qimen question fields should support Ctrl/Cmd+Enter sending');
assert(html.includes('function autoGrowQimenAiTextarea') && html.includes('max=164') && html.includes('function resetQimenAiTextarea'), 'Qimen question fields should auto-grow and reset after sending');
assert(html.includes('function showQimenAiPending') && html.includes('id="qimenAiPending"') && html.includes('AI 正在分析 · 已用 '), 'Qimen AI should show an elapsed analysis status');
assert(/async function analyzeWithAI\(\)[\s\S]*?showQimenAiPending\(aiRequestId\)[\s\S]*?clearQimenAiPending\(aiRequestId\)/.test(html), 'Qimen AI pending status should start and stop with each request');

console.log('qimen page checks ok');
