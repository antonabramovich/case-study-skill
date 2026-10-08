// node --test   (from the skill folder)
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { findQuestion, OPTIONS_LINE } from '../scripts/session-log.mjs';

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'session-stats.mjs');
let clock = 0;
const at = () => new Date(Date.UTC(2026, 9, 8, 10, 0, (clock += 10))).toISOString();
const user = (text) => ({ type: 'user', timestamp: at(), message: { content: text } });
const said = (text) => ({ type: 'assistant', timestamp: at(), message: { content: [{ type: 'text', text }] } });
const ask = (header, body = '**Why does it work that way?**') => `### ${header}\n\n${body}\n\n${OPTIONS_LINE}`;
const plan = '**Plan:** 3 main questions on 2 topics.\n1. Chunking (2)\n2. Evaluation (1)';

function stats(entries) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'case-study-'));
  const transcript = path.join(dir, 'session.jsonl');
  fs.writeFileSync(transcript, entries.map((e) => JSON.stringify(e)).join('\n'));
  const result = spawnSync(process.execPath, [script, '--transcript', transcript], { encoding: 'utf8' });
  fs.rmSync(dir, { recursive: true });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test('headers: main questions carry the planned total, follow-ups a letter', () => {
  assert.deepEqual(findQuestion(ask('Q2 of 6 · Chunking')), { id: 'Q2', topic: 'Chunking', mainPlanned: 6, followUp: false });
  assert.deepEqual(findQuestion(ask('Q2a · Chunking · follow-up')), { id: 'Q2a', topic: 'Chunking', mainPlanned: null, followUp: true });
  assert.equal(findQuestion('### Q2, model answer\n\nNo options line here.'), null);
});

test('a model answer heading before the next question is not taken for it', () => {
  const reply = `### Q1 of 3 · Chunking\n\n**Model answer:**\n\n> **1. Citations.** One page each.\n\n---\n\n${ask('Q2 of 3 · Chunking')}`;
  assert.equal(findQuestion(reply).id, 'Q2');
});

test('counts, topics and the fix list', () => {
  const s = stats([
    user('<command-name>/case-study</command-name>'),
    said(`${plan}\n\n${ask('Q1 of 3 · Chunking')}`),
    user('Because each chunk has one page to cite.'),
    said(`Good.\n\n${ask('Q1a · Chunking · follow-up')}`),
    user('answer'),
    said(`**Model answer:**\n\n> **1. Cost.** Fine.\n\n**Product note:** cache the reranker.\n\n---\n\n${ask('Q2 of 3 · Chunking')}`),
    user('skip'),
    said(ask('Q3 of 3 · Evaluation')),
    user('stop'),
  ]);
  assert.deepEqual(s.counts, { asked: 4, main: 3, mainPlanned: 3, followUps: 1, own: 1, model: 1, skip: 1, notReached: 1 });
  assert.equal(s.topicsPlanned, 2);
  assert.deepEqual(
    s.topics.map((t) => [t.name, t.mainQuestions, t.mainPlanned, t.followUps]),
    [
      ['Chunking', 2, 2, 1],
      ['Evaluation', 1, 1, 0],
    ],
  );
  assert.deepEqual(s.fixList, [{ fromQuestion: 'Q1a', text: 'cache the reranker.' }]);
});
