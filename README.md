<p align="center">
  <img src="./assets/logo.png" alt="Tuteliq" width="200" />
</p>

<h1 align="center">Tuteliq CLI</h1>

<p align="center">
  <strong>AI-powered child safety analysis from your terminal</strong><br>
  Detect bullying, grooming, and unsafe content
</p>

## Installation

### Homebrew (macOS/Linux)

```bash
brew install tuteliq/tap/tuteliq
```

### npm

```bash
npm install -g @tuteliq/cli
```

## Quick Start

```bash
# Login with your API key
tuteliq login <your-api-key>

# Analyze text for safety
tuteliq analyze "Some text to check"

# Detect bullying
tuteliq detect-bullying "You're so stupid"

# Detect unsafe content
tuteliq detect-unsafe "I want to hurt myself"
```

## Commands

### Authentication

```bash
tuteliq login <api-key>   # Save your API key
tuteliq logout            # Remove saved API key
tuteliq whoami            # Show login status
```

### Safety Detection

```bash
# Quick analysis (bullying + unsafe)
tuteliq analyze "Text to analyze"

# Detect bullying/harassment
tuteliq detect-bullying "Text to check"
tuteliq bullying "Text to check"  # alias

# Detect unsafe content (self-harm, violence, etc.)
tuteliq detect-unsafe "Text to check"
tuteliq unsafe "Text to check"  # alias

# Detect grooming patterns in conversation
tuteliq detect-grooming -m '[{"role":"adult","content":"..."},{"role":"child","content":"..."}]'
tuteliq grooming -m '...' --age 12  # with child age
```

### Analysis & Guidance

```bash
# Analyze emotions
tuteliq emotions "I'm feeling really sad today"

# Get action plan for a situation
tuteliq action-plan "Child is being bullied at school"
tuteliq plan "..." --age 12 --audience parent --severity high
```

## Examples

### Check a message for bullying

```bash
$ tuteliq bullying "You're worthless and nobody likes you"

⚠ BULLYING DETECTED

Severity:    HIGH
Confidence:  92%
Risk Score:  85%
Types:       verbal, exclusion

Rationale:
The message contains degrading language and exclusionary statements...

Action: flag_for_moderator
```

### Analyze emotional content

```bash
$ tuteliq emotions "I don't want to go to school anymore, everyone hates me"

Emotion Analysis

Dominant:  sadness, anxiety, isolation
Trend:     📉 worsening

Summary:
The text indicates feelings of social rejection and school avoidance...

Recommended Follow-up:
Consider having a supportive conversation about their school experience...
```

## Get an API Key

Sign up at [tuteliq.ai](https://tuteliq.ai) to get your API key.

## Best Practices

### Message Batching

The `bullying` and `unsafe` commands analyze a single text input per request. If you're analyzing a conversation, concatenate a **sliding window of recent messages** into one string rather than piping each message individually. Single words or short fragments lack context for accurate detection and can be exploited to bypass safety filters.

```bash
# Bad — each line analyzed in isolation
cat messages.txt | while read line; do tuteliq bullying "$line"; done

# Good — analyze the full conversation
tuteliq bullying "$(cat messages.txt)"
```

The `grooming` command already accepts multiple messages and analyzes the full conversation in context.

### PII Redaction

Enable `PII_REDACTION_ENABLED=true` on your Tuteliq API to automatically strip emails, phone numbers, URLs, social handles, IPs, and other PII from detection summaries and webhook payloads. The original text is still analyzed in full — only stored outputs are scrubbed.

## License

MIT

---

## The Mission: Why This Matters

Before you decide to contribute or sponsor, read these numbers. They are not projections. They are not estimates from a pitch deck. They are verified statistics from the University of Edinburgh, UNICEF, NCMEC, and Interpol.

- **302 million** children are victims of online sexual exploitation and abuse every year. That is **10 children every second**. *(Childlight / University of Edinburgh, 2024)*
- **1 in 8** children globally have been victims of non-consensual sexual imagery in the past year. *(Childlight, 2024)*
- **370 million** girls and women alive today experienced rape or sexual assault in childhood. An estimated **240–310 million** boys and men experienced the same. *(UNICEF, 2024)*
- **29.2 million** incidents of suspected child sexual exploitation were reported to NCMEC's CyberTipline in 2024 alone — containing **62.9 million files** (images, videos). *(NCMEC, 2025)*
- **546,000** reports of online enticement (adults grooming children) in 2024 — a **192% increase** from the year before. *(NCMEC, 2025)*
- **1,325% increase** in AI-generated child sexual abuse material reports between 2023 and 2024. The technology that should protect children is being weaponized against them. *(NCMEC, 2025)*
- **100 sextortion reports per day** to NCMEC. Since 2021, at least **36 teenage boys** have taken their own lives because they were victimized by sextortion. *(NCMEC, 2025)*
- **84%** of reports resolve outside the United States. This is not an American problem. This is a **global emergency**. *(NCMEC, 2025)*

End-to-end encryption is making platforms blind. In 2024, platforms reported **7 million fewer incidents** than the year before — not because abuse stopped, but because they can no longer see it. The tools that catch known images are failing. The systems that rely on human moderators are overwhelmed. The technology to detect behavior — grooming patterns, escalation, manipulation — in real-time text conversations **exists right now**. It is running at [api.tuteliq.ai](https://api.tuteliq.ai).

The question is not whether this technology is possible. The question is whether we build the company to put it everywhere it needs to be.

**Every second we wait, another child is harmed.**

We have the technology. We need the support.

If this mission matters to you, consider [sponsoring our open-source work](https://github.com/sponsors/Tuteliq) so we can keep building the tools that protect children — and keep them free and accessible for everyone.

---

<p align="center">
  <sub>Built with care for child safety by the <a href="https://tuteliq.ai">Tuteliq</a> team</sub>
</p>
