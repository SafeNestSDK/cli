# SafeNest CLI

AI-powered child safety analysis from your terminal. Detect bullying, grooming, and unsafe content.

## Installation

### Homebrew (macOS/Linux)

```bash
brew install safenest/tap/safenest
```

### npm

```bash
npm install -g @safenest/cli
```

## Quick Start

```bash
# Login with your API key
safenest login <your-api-key>

# Analyze text for safety
safenest analyze "Some text to check"

# Detect bullying
safenest detect-bullying "You're so stupid"

# Detect unsafe content
safenest detect-unsafe "I want to hurt myself"
```

## Commands

### Authentication

```bash
safenest login <api-key>   # Save your API key
safenest logout            # Remove saved API key
safenest whoami            # Show login status
```

### Safety Detection

```bash
# Quick analysis (bullying + unsafe)
safenest analyze "Text to analyze"

# Detect bullying/harassment
safenest detect-bullying "Text to check"
safenest bullying "Text to check"  # alias

# Detect unsafe content (self-harm, violence, etc.)
safenest detect-unsafe "Text to check"
safenest unsafe "Text to check"  # alias

# Detect grooming patterns in conversation
safenest detect-grooming -m '[{"role":"adult","content":"..."},{"role":"child","content":"..."}]'
safenest grooming -m '...' --age 12  # with child age
```

### Analysis & Guidance

```bash
# Analyze emotions
safenest emotions "I'm feeling really sad today"

# Get action plan for a situation
safenest action-plan "Child is being bullied at school"
safenest plan "..." --age 12 --audience parent --severity high
```

## Examples

### Check a message for bullying

```bash
$ safenest bullying "You're worthless and nobody likes you"

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
$ safenest emotions "I don't want to go to school anymore, everyone hates me"

Emotion Analysis

Dominant:  sadness, anxiety, isolation
Trend:     📉 worsening

Summary:
The text indicates feelings of social rejection and school avoidance...

Recommended Follow-up:
Consider having a supportive conversation about their school experience...
```

## Get an API Key

Sign up at [safenest.dev](https://safenest.dev) to get your API key.

## Best Practices

### Message Batching

The `bullying` and `unsafe` commands analyze a single text input per request. If you're analyzing a conversation, concatenate a **sliding window of recent messages** into one string rather than piping each message individually. Single words or short fragments lack context for accurate detection and can be exploited to bypass safety filters.

```bash
# Bad — each line analyzed in isolation
cat messages.txt | while read line; do safenest bullying "$line"; done

# Good — analyze the full conversation
safenest bullying "$(cat messages.txt)"
```

The `grooming` command already accepts multiple messages and analyzes the full conversation in context.

### PII Redaction

Enable `PII_REDACTION_ENABLED=true` on your SafeNest API to automatically strip emails, phone numbers, URLs, social handles, IPs, and other PII from detection summaries and webhook payloads. The original text is still analyzed in full — only stored outputs are scrubbed.

## License

MIT
