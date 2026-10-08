#!/usr/bin/env node
// Exact counts, timings and the fix list for a case-study session, read from Claude Code's conversation log.
//   node session-stats.mjs [--transcript <file.jsonl>] [--since <ISO time>] [--text] [--out <file.json>]
// Without --transcript: the newest log of the project in the current directory.
// Without --since: from the last time the case-study skill was started in that log.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { readEntries, sessionStart, timeline } from './session-log.mjs';

const { values } = parseArgs({
  options: {
    transcript: { type: 'string' },
    since: { type: 'string' },
    text: { type: 'boolean', default: false },
    out: { type: 'string' },
  },
});

const transcript = values.transcript ?? findTranscript();
const entries = readEntries(transcript);
const start = values.since ? entries.findIndex((e) => e.timestamp >= values.since) : sessionStart(entries);
const stats = summarize(entries.slice(Math.max(start, 0)));
if (values.out) fs.writeFileSync(values.out, JSON.stringify(stats, null, 2));
console.log(values.text ? asText(stats) : JSON.stringify(stats, null, 2));

function findTranscript() {
  const root = path.join(os.homedir(), '.claude', 'projects');
  const newest = (dir) =>
    fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.jsonl'))
      .map((f) => path.join(dir, f))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
  const own = path.join(root, process.cwd().replace(/[^a-zA-Z0-9]/g, '-'));
  const found = fs.existsSync(own) ? newest(own) : undefined;
  if (found) return found;
  const all = fs.readdirSync(root).map((d) => path.join(root, d)).filter((d) => fs.statSync(d).isDirectory()).map(newest).filter(Boolean);
  if (!all.length) throw new Error(`No conversation logs under ${root}`);
  return all.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
}

function summarize(list) {
  const events = timeline(list);
  const questions = [];
  let current = null;
  for (const e of events) {
    if (e.kind === 'question') {
      // Asked again after a side question: the same question, with only the replies after this
      if (current && current.id === e.id) current.replies = [];
      else questions.push((current = { ...e, askedAt: e.at, replies: [] }));
    } else if (e.kind === 'reply' && current) {
      current.replies.push(e);
      if (e.how === 'stop') current = null;
    }
  }

  const byId = new Map(questions.map((q) => [q.id, q]));
  const rows = questions.map((q, i) => {
    const parent = q.followUp ? byId.get(q.id.replace(/[a-z]+$/, '')) : null;
    const kind = q.replies.filter((r) => r.how !== 'own').at(-1)?.how;
    const how = !q.replies.length || kind === 'stop' ? 'not_reached' : kind ?? 'own';
    const answer = q.replies.filter((r) => r.how === 'own').map((r) => r.text).join('\n\n');
    const next = questions[i + 1];
    return {
      id: q.id,
      topic: parent?.topic || q.topic,
      followUp: q.followUp,
      how,
      askedAt: q.askedAt,
      repliedAt: q.replies[0]?.at ?? null,
      // A stop isn't an answer, so it isn't counted as answering time
      responseSec: how !== 'not_reached' ? seconds(q.askedAt, q.replies[0].at) : null,
      words: how === 'own' ? (answer.match(/\S+/g) ?? []).length : 0,
      coachSec: next && q.replies.length ? seconds(q.replies.at(-1).at, next.askedAt) : null,
      answer: how === 'own' ? answer : null,
    };
  });

  const startedAt = list[0]?.timestamp ?? null;
  const lastReply = events.filter((e) => e.kind === 'reply').at(-1)?.at;
  const endedAt = rows.length ? (rows.at(-1).repliedAt ?? rows.at(-1).askedAt) : (lastReply ?? startedAt);
  const count = (how) => rows.filter((r) => r.how === how).length;
  const sum = (key) => rows.reduce((s, r) => s + (r[key] ?? 0), 0);

  // A changed plan lists the remaining topics, so later plans override earlier counts
  const plannedByTopic = new Map();
  for (const e of events) if (e.kind === 'plan') for (const t of e.plan.topics) plannedByTopic.set(t.name.toLowerCase(), t.questions);

  const topics = [...new Set(rows.map((r) => r.topic))].map((name) => {
    const inTopic = rows.filter((r) => r.topic === name);
    const firstAsked = inTopic[0].askedAt;
    const nextTopicStart = rows.find((r) => r.askedAt > firstAsked && r.topic !== name)?.askedAt;
    return {
      name,
      mainQuestions: inTopic.filter((r) => !r.followUp).length,
      mainPlanned: plannedByTopic.get(name.toLowerCase()) ?? null,
      followUps: inTopic.filter((r) => r.followUp).length,
      yourSec: inTopic.reduce((s, r) => s + (r.responseSec ?? 0), 0),
      wallSec: seconds(firstAsked, nextTopicStart ?? endedAt),
    };
  });

  return {
    transcript,
    startedAt,
    firstQuestionAt: rows[0]?.askedAt ?? null,
    endedAt,
    totalSec: startedAt && endedAt ? seconds(startedAt, endedAt) : 0,
    setupSec: rows[0] ? seconds(startedAt, rows[0].askedAt) : null,
    yourSec: sum('responseSec'),
    coachSec: sum('coachSec'),
    counts: {
      asked: rows.length,
      main: rows.filter((r) => !r.followUp).length,
      mainPlanned: questions.filter((q) => !q.followUp).at(-1)?.mainPlanned ?? null,
      followUps: rows.filter((r) => r.followUp).length,
      own: count('own'),
      model: count('model'),
      skip: count('skip'),
      notReached: count('not_reached'),
    },
    topicsPlanned: plannedByTopic.size || null,
    topics,
    questions: rows,
    fixList: events.filter((e) => e.kind === 'note').map((e) => ({ fromQuestion: e.fromQuestion, text: e.text })),
  };
}

function seconds(from, to) {
  return Math.round((new Date(to) - new Date(from)) / 1000);
}

function mmss(sec) {
  if (sec === null || sec === undefined) return '—';
  const m = Math.floor(sec / 60);
  return `${m}:${String(sec % 60).padStart(2, '0')}`;
}

function asText(s) {
  const c = s.counts;
  const lines = [
    `Session ${mmss(s.totalSec)} · setup ${mmss(s.setupSec)} · your time ${mmss(s.yourSec)} · coach ${mmss(s.coachSec)}`,
    `${c.asked} questions (${c.main}${c.mainPlanned ? ` of ${c.mainPlanned} planned` : ''} main, ${c.followUps} follow-ups) · ${c.own} answered · ${c.model} model answers · ${c.skip} skipped · ${c.notReached} not reached`,
    `Topics: ${s.topics.length}${s.topicsPlanned ? ` of ${s.topicsPlanned} planned` : ''}`,
    '',
    'Topic                              Main  Planned  Follow  Your time  Wall',
    ...s.topics.map(
      (t) =>
        `${t.name.slice(0, 34).padEnd(34)} ${String(t.mainQuestions).padStart(4)}  ${String(t.mainPlanned ?? '—').padStart(7)}  ${String(t.followUps).padStart(6)}  ${mmss(t.yourSec).padStart(9)}  ${mmss(t.wallSec).padStart(5)}`,
    ),
    '',
    'Q      How          Reply  Words',
    ...s.questions.map((q) => `${q.id.padEnd(6)} ${q.how.padEnd(11)} ${mmss(q.responseSec).padStart(6)} ${String(q.words || '').padStart(6)}`),
    '',
    `Fix list (${s.fixList.length})`,
    ...(s.fixList.length ? s.fixList.map((f) => `- ${f.fromQuestion ?? '—'}: ${f.text}`) : ['- none']),
  ];
  return lines.join('\n');
}
