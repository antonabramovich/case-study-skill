// Reads a case-study session from Claude Code's conversation log. Used by session-stats.mjs.
import fs from 'node:fs';

export const OPTIONS_LINE = 'Type your answer, reply **"answer"** for a model answer, or **"skip"**.';
const OPTIONS_MARKER = /reply \*\*"answer"\*\*/;
// "### Q4 of 8 · Chunking" or "### Q4a · Chunking · follow-up"
const HEADER = /^#{2,4}\s*(Q\d+)(?:\s+of\s+(\d+)\s*[·:]\s*(.+?)|([a-z])\s*[·:]\s*(.+?)\s*[·:]\s*follow-up)\s*$/gim;

export function readEntries(file) {
  return fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    })
    .filter((e) => (e.type === 'user' || e.type === 'assistant') && !e.isSidechain && e.timestamp);
}

function blocks(entry) {
  const c = entry.message?.content;
  return Array.isArray(c) ? c : [];
}

function rawText(message) {
  const c = message?.content;
  if (typeof c === 'string') return c;
  return Array.isArray(c) ? c.filter((b) => b.type === 'text').map((b) => b.text).join('\n') : '';
}

/** What the user typed, or null for tool results, injected text and slash commands. */
function userReply(entry) {
  if (entry.isMeta || blocks(entry).some((b) => b.type === 'tool_result')) return null;
  const text = rawText(entry.message).replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '').trim();
  if (!text || /^<(command|local-command)/.test(text) || text.startsWith('Base directory for this skill')) return null;
  return text;
}

export function classify(text) {
  if (/^\s*skip\b/i.test(text)) return 'skip';
  if (/^\s*(model answer|answer)\s*([.;,!:]|$)/i.test(text)) return 'model';
  if (/^\s*(stop\b|wrap up\b|end the interview\b|finish the interview\b)/i.test(text)) return 'stop';
  return 'own';
}

/** Index of the last time case-study was started in the log, or -1. */
export function sessionStart(entries) {
  for (let i = entries.length - 1; i >= 0; i--) {
    const { type, message } = entries[i];
    if (type === 'user' && rawText(message).includes('<command-name>/case-study')) return i;
    if (type === 'assistant' && blocks(entries[i]).some((b) => b.type === 'tool_use' && b.name === 'Skill' && /case-study/.test(b.input?.skill ?? ''))) return i;
  }
  return -1;
}

/** The question a text asks: the last header before the options line. */
export function findQuestion(text) {
  const marker = text.search(OPTIONS_MARKER);
  if (marker < 0) return null;
  const found = [...text.matchAll(HEADER)].filter((m) => m.index < marker).at(-1);
  if (!found) return null;
  const [, number, of, mainTopic, letter, followUpTopic] = found;
  return {
    id: number + (letter ?? ''),
    topic: (mainTopic ?? followUpTopic).replace(/\*+/g, '').trim(),
    mainPlanned: of ? Number(of) : null,
    followUp: Boolean(letter),
  };
}

/** The plan paragraph: "**Plan:** …" then one topic per line: "1. Name (2)", "2. Name (2)" … */
export function findPlan(text) {
  const at = text.indexOf('**Plan:**');
  if (at < 0) return null;
  const paragraph = text.slice(at).split(/\n\s*\n/)[0];
  const topics = [...paragraph.matchAll(/(\d+)\.\s+([^·\n(]+?)\s*\((\d+)\)/g)].map((m) => ({ name: m[2].trim(), questions: Number(m[3]) }));
  return { topics };
}

/** The session as a list of events: questions, replies, plans and product notes. */
export function timeline(entries) {
  const events = [];
  let lastQuestion = null;
  for (const e of entries) {
    if (e.type === 'user') {
      const text = userReply(e);
      if (text) events.push({ kind: 'reply', text, at: e.timestamp, how: classify(text), to: lastQuestion?.id ?? null });
      continue;
    }
    for (const b of blocks(e)) {
      if (b.type !== 'text') continue;
      for (const m of b.text.matchAll(/\*\*Product note:\*\*\s*(.+)/g)) {
        events.push({ kind: 'note', text: m[1].trim(), at: e.timestamp, fromQuestion: lastQuestion?.id ?? null });
      }
      const plan = findPlan(b.text);
      if (plan) events.push({ kind: 'plan', plan, at: e.timestamp });
      const q = findQuestion(b.text);
      if (q) {
        lastQuestion = q;
        events.push({ kind: 'question', ...q, at: e.timestamp });
      }
    }
  }
  return events;
}
