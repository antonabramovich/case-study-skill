# Session file

One JSON file per session: `~/.claude/case-study/<project-slug>/<YYYY-MM-DD>-<n>.json`.
`<n>` starts at 1 and counts sessions on the same day. Write it once, at the end, from the
stats script's output (`--out`) merged with your grading.

```json
{
  "project": "appliancy",
  "repoPath": "C:/Users/me/projects/appliancy",
  "mode": "interview",
  "rubricVersion": 1,
  "startedAt": "2026-10-07T10:00:00Z",
  "focus": { "main": "RAG", "mainShare": 0.8, "level": "Senior", "length": "Standard" },
  "plan": { "topics": ["Retrieval quality", "Chunking", "Evaluation"], "mainQuestions": 6 },
  "timing": {
    "totalSec": 1500, "setupSec": 190, "yourSec": 900, "coachSec": 410,
    "topics": [{ "name": "Chunking", "mainQuestions": 2, "mainPlanned": 2, "followUps": 1, "yourSec": 420, "wallSec": 610 }]
  },
  "counts": { "asked": 8, "main": 6, "mainPlanned": 6, "followUps": 2, "own": 6, "model": 1, "skip": 1, "notReached": 0 },
  "questions": [
    {
      "id": "Q4",
      "topic": "Chunking",
      "area": "deep-dive",
      "question": "Your chunks never cross a page boundary. What does that cost you?",
      "followUpOf": null,
      "how": "own",
      "answer": "the user's answer, word for word",
      "responseSec": 123, "words": 43,
      "rating": "partial",
      "strengths": ["Measured: swept sizes and picked the best on the eval set"],
      "gaps": ["No figures from the sweep", "Didn't answer the page-boundary cost"],
      "patterns": ["no-numbers", "missing-failure-modes", "validation-gaps"],
      "strongerVersion": "I swept 600/50 to 3200/600 ...",
      "drilledPattern": null,
      "patternFixed": null
    }
  ],
  "fixList": [
    { "fromQuestion": "Q7", "kind": "improvement", "title": "Squash per-round commits on approval", "detail": "Keep per-round commits on a temporary branch and squash on approval: checkpoints plus a clean history." }
  ],
  "numbers": [
    { "what": "Reranker effect", "value": "hit@6 24/33 → 32/33", "status": "known" },
    { "what": "Chunk sweep results", "value": null, "status": "fill-in" }
  ],
  "debrief": { "url": null, "path": null }
}
```

Field notes:
- `timing`, `counts` and each question's `id`, `how`, `answer` and time fields come from the
  script. Don't edit them.
- `area`: `framing`, `deep-dive`, `evaluation`, `scale`, `broader`.
- `how`: `own`, `model`, `skip`, `not_reached`.
- `rating`: from `rubric.md`. `not_answered` for `model` and `skip`.
- `followUpOf`: the id of the question this follows up on, e.g. `"Q4"` for `"Q4a"` and `"Q4b"`.
- `fixList[].kind`: `bug`, `improvement`, `experiment`.
- `drilledPattern` and `patternFixed`: drill mode only. `patternFixed` is true when the answer
  no longer shows the drilled pattern.
