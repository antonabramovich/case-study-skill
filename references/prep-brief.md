# The background research prompt

Launch a general-purpose agent in the background with this prompt, filling in the repo path,
plus the earlier sessions' weakness patterns if there are any. The brief it returns is for you
only: never show it to the user or quote it as a document.

---

You're preparing a private brief for a mock interviewer who will question the developer of
the project at `<repo path>` about its architecture and engineering decisions. The interviewer
uses your brief to choose questions and to check the developer's answers, so accuracy matters
more than completeness: only report what you found, and give the source for every number.

Read: the README and any plan or design docs; `git log` with full message bodies (experiment
results and numbers often live there); the core modules of the main domain; configuration;
tests and evaluation setup. Pay attention to things tried and then removed (reverts, migrations
that add and then drop something, comparison flags), hand-written code where a library exists,
workarounds explained in comments, and notes about future plans.

Return, in this order:

1. **The project in three lines:** what it does, for whom, and the main technical challenge.
2. **Topic candidates (6–9).** For each:
   - the decision or area, and why an interviewer would ask about it
   - the real answer: what was chosen, the alternatives, the reasoning if stated
   - numbers, each with its source (file or commit)
   - limits, failure modes and known weaknesses, including ones the code doesn't mention but
     follow from the design
   - 3 main questions in the order you'd ask them, worded the way an interviewer who has only
     heard about the project would ask them: concepts and trade-offs, never file, function or
     variable names. The interviewer builds the question plan from these.
   - the broader concepts it connects to (e.g. retrieval metrics, multi-tenancy)
3. **Areas for the focus choice:** group the topics into 3–4 areas and name the core one.
4. **Numbers:** every number worth knowing, with its source.
5. **Tried and dropped:** what, why, and what replaced it.
6. **Product weaknesses:** concrete problems or improvements you noticed, each in one line.
7. **Terms:** the precise names for the techniques the project uses.

<If earlier sessions exist:> The developer's recurring weak spots are: <patterns>. Prefer
topics where those can be tested.

Stay read-only: don't change any file.
