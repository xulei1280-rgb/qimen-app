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
assert(html.includes('src="deepseek-client.js?v=20260817.1"') && html.includes('DeepSeekClient.requestFinal({apiKey:apiKey,messages:messages,maxTokens:16384'), 'Qimen AI should use the shared DeepSeek final-answer fallback');
assert(html.includes('src="bazi-engine.js?v=20260820.2"') && html.includes('id="qimenBaziRecord"') && html.includes('function createQimenBaziProfile'), 'Qimen should support selecting or creating a linked Bazi profile');
assert(html.includes('BAZI_RECORDS_STORAGE') && html.includes('BaziEngine.createBaziProfile') && html.includes('清除关联'), 'new Qimen Bazi profiles should reuse the Bazi record store and allow clearing');
assert(html.includes('plateData.linkedBazi=cloneQimenBazi(qimenLinkedBazi)') && html.includes('qimenLinkedBazi=cloneQimenBazi(plateData.linkedBazi)'), 'Qimen plate creation and history loading should retain a frozen Bazi snapshot');
assert(html.includes('奇门是当前问题、决策与短期应期的主依据') && html.includes('八字只能补充长期趋势、所处阶段与个人倾向'), 'Qimen AI prompt should keep Qimen primary and Bazi supplemental');
assert(/href="index\.html" aria-current="page">奇门<\/a>[\s\S]*href="bazi\.html">八字<\/a>[\s\S]*href="liuyao\.html">六爻<\/a>[\s\S]*href="ziwei\.html">紫微<\/a>[\s\S]*href="daily\.html">日运<\/a>/.test(html), 'Qimen should expose the unified five-module navigation');

console.log('qimen page checks ok');
