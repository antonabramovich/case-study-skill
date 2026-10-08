# case-study

A Claude Code skill that mock-interviews you about a project you'll present as a case study in a
job interview. It reads the repo, asks one interviewer-style question at a time, gives feedback,
times the session from the conversation log, and writes a debrief. See `SKILL.md` for the details.

## Install

Clone it into your personal skills folder:

```bash
git clone https://github.com/antonabramovich/case-study-skill.git ~/.claude/skills/case-study
```

On Windows that is `%USERPROFILE%\.claude\skills\case-study`. Restart Claude Code, then from
inside the project you want to practise run `/case-study`, or say "interview me about this project".

Requires Node 18+ for the timing script. Sessions are saved to `~/.claude/case-study/<project>/`.

## Modes

- **interview**: "interview me about this project"
- **drill**: "drill my weak spots" (uses earlier sessions)
- **debrief**: "stop" during a session
- **history**: "how am I doing", "compare with last time"
- **recover**: "recover my last session"

## Tests

```bash
node --test
```
