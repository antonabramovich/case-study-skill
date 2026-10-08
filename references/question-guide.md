# Building questions

## Finding the good questions in a codebase

The best questions are about places where the user made a choice and a reasonable engineer
could have chosen differently. Look for:

- **Things tried and dropped:** reverted commits, migrations that add and then remove
  something, config flags for comparing approaches. "Why did you remove it?" is a strong
  question, and the answer is a strong story.
- **Experiment results in commit messages:** they let you ask "how do you know?" and check the
  answer.
- **Hand-written code where a library exists**, or a library where hand-written code would be
  simpler. Ask why.
- **Configuration values:** each tunable value invites "why that value, and did you measure it?"
  Phrase it as the concept ("your chunk size"), not the variable.
- **Comments explaining a workaround or limit:** these point to failure modes the user knows
  about but may not mention.
- **Plans and idea notes:** "what would you do next?" questions, and checks on whether the user
  can explain their own roadmap.
- **What's missing:** no tests for a critical path, no limits on input size, a single shared
  index. Ask about the consequence, not the absence.

## Topic checklists

Pick the checklist that matches the project's main domain, and always add the general one.
Not every item fits every project.

### General (every project)
- The simplest alternative and why they didn't use it
- The main architecture boundary and why it's there
- How they know it works: tests, evaluation, monitoring
- What breaks first at 10× and 100×
- Cost and latency budget
- Security and multi-tenancy, if there are users
- What they'd do differently, and what's next

### RAG and LLM applications
- RAG vs. long context; when each wins
- Chunking: size, boundaries, structure, measured how
- Embeddings: model choice, multilingual text, query vs. document embeddings
- Hybrid search, rank fusion, reranking: what each adds, measured how
- Query rewriting and routing
- Evaluation: dataset origin and its bias, metric definitions, sample size, offline vs. online
- Grounding: citations, faithfulness, "not found", near-misses, over-refusal
- Prompt management, caching, model choice per step, latency
- LLM-as-judge: how it was checked against human labels
- Cost per request and what drives it

### Web apps and APIs
- Data model and the decision behind it
- Consistency, transactions, concurrency, idempotency
- Auth and data isolation between users
- Background work: queues, retries, what happens when a job dies halfway
- Caching and invalidation
- Error handling the user sees vs. what's logged

### Data and ML pipelines
- Data quality checks, schema changes, backfills
- Train/test split, leakage, baselines
- Reproducibility of experiments
- Monitoring drift after launch

### Infrastructure and distributed systems
- Failure modes, timeouts, retries, back-pressure
- Deployment, rollback, migrations without downtime
- Observability: what's traced, what alerts

## Broader-topic follow-ups

When an answer touches a general concept, a follow-up can test the concept itself, because
interviewers use the project to test general knowledge. Examples:
- They mention recall: "What's the difference between recall@k and hit rate@k?"
- They mention an LLM judge: "How do you know the judge is right?"
- They mention a shared index: "Why does filtering break approximate nearest-neighbour search?"
- They mention an A/B result on 40 samples: "Is that difference real?"

Keep these to about one in five questions, unless the user asked for more breadth.
