# Rubric (version 1)

Store `"rubricVersion": 1` in every session. If you change the ratings or the pattern list,
increase the version, so history mode knows which ratings compare.

## Ratings

Rate only answers the user gave themselves.

| Rating | Meaning |
|---|---|
| `strong` | Answers the whole question, with reasoning and at least one number or concrete example. Gaps are minor. |
| `partial` | The core is right, but part of the question is unanswered, or numbers, costs or failure modes are missing, or a term is wrong. |
| `weak` | Misses the point, is mostly wrong, or is too vague to evaluate. |
| `not_answered` | Skipped or model answer requested. In a real interview there's nobody to hand the question to. |
| `not_reached` | Asked, then the session stopped. |

## The complete answer

Feedback compares each answer to this chain. Most answers stop after the second or third link.

**Decision → Why → Evidence (a number) → Cost → Where it breaks → What's next**

## Weakness patterns

Use only these ids. They describe how someone answers, not what the project is, so they
compare across projects. One answer can show several.

| id | What it looks like |
|---|---|
| `no-numbers` | Claims a result without the figure ("it scored best", "cost is small"), even though the figure exists. |
| `missing-failure-modes` | Doesn't answer "where does it break" or "what does it cost", or gives only one generic case. |
| `validation-gaps` | Trusts a result without noting confounds, test bias, small samples or stale experiments. |
| `imprecise-terms` | Uses the wrong word for a concept ("recall" for hit rate, "layout model" for PDF tags). |
| `undersold-decisions` | Leaves out their own non-obvious, good decisions that would show judgment. |
| `vague-loop` | Describes intent ("I'll use the signals to improve it") without the concrete process. |
| `overclaiming` | Treats a mechanism as a guarantee (citations as proof of correctness, tests as proof of quality). |
| `no-scale-thinking` | Doesn't consider 10× data, 100× users, cost or latency when the question invites it. |
| `no-alternatives` | Can't say what else they considered, or when the alternative would win. |
| `misstated-mechanism` | Describes their own system's behaviour inaccurately. |

## Feedback tone

Direct and specific, like a senior colleague who wants them to get the job. Quote their words.
No praise that isn't tied to something they said. "Good answer!" teaches nothing; "naming the
2×2 design shows experimental discipline" does.
