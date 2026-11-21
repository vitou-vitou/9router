#!/usr/bin/env node
// Native Gemini API chat — zero dependencies, uses Node's built-in fetch
// Usage:
//   set GEMINI_API_KEY=your_key_here
//   node scripts/gemini-chat.mjs "What is the capital of France?"

const query = process.argv[2];
if (!query) {
  console.error('Usage: node gemini-chat.mjs "your question" [model]');
  process.exit(1);
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Error: Set GEMINI_API_KEY environment variable.');
  console.error('Get a free key at: https://aistudio.google.com/app/apikey');
  process.exit(1);
}

const model = process.argv[3] || 'gemini-2.5-flash';
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

const resp = await fetch(url, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: query }] }],
    generationConfig: { maxOutputTokens: 2048 },
  }),
});

if (!resp.ok) {
  console.error(`HTTP ${resp.status}: ${resp.statusText}`);
  console.error(await resp.text());
  process.exit(1);
}

// Stream SSE chunks
const reader = resp.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop(); // keep last incomplete line

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const json = JSON.parse(line.slice(6));
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) process.stdout.write(text);
      } catch { /* skip non-json keepalives */ }
    }
  }
}
console.log(); // final newline
