# Mo Context Agent

Your personal strategic advisor agent. Load your complete context (INDEX) automatically and get intelligent responses to any project idea, strategic question, or need for consultation.

---

## Setup

### 1. Prerequisites
- Node.js 18+ ([download](https://nodejs.org/))
- Anthropic API key ([get one free](https://console.anthropic.com/account/keys))

### 2. Install Dependencies

```bash
cd mo-context-agent
npm install
```

### 3. Configure API Key

Copy `.env.example` to `.env` and add your Anthropic API key:

```bash
cp .env.example .env
```

Then edit `.env`:
```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

### 4. Ensure INDEX File Exists

The agent looks for `mo-index.md` in:
1. `/home/claude/mo-index.md` (first priority)
2. `./mo-index.md` (current directory fallback)

If you're using the Claude memory filesystem, the INDEX is already stored in memory and will load automatically.

---

## Usage

### CLI Mode (Quick Query)

Ask a question directly from terminal:

```bash
node agent.js "I want to create a workshop combining SANA + transactional hypnosis for corporate clients"
```

**Output:**
```
---
[Claude's full contextual response with your complete project context loaded]
---
```

### Web Mode (Interactive UI)

Start the web interface:

```bash
node agent.js --web
# or
npm run start:web
```

Then open **http://localhost:3000** in your browser.

Features:
- Clean interface for typing longer questions
- Real-time response from Claude
- Loads INDEX automatically
- Works on mobile

---

## Examples

### 1. New Workshop Idea
```bash
node agent.js "Diseño un atelier de 3 días en Granada combinando Rey fuera del Trono + SANA intensivo para therapeutic practitioners"
```

### 2. Strategic Question
```bash
node agent.js "Should I pilot L'Identité Qui Manque with 8-12 people first, or launch full ecosystem now? What are the risks?"
```

### 3. Literary Consultation
```bash
node agent.js "I'm at Tome 5 YACHE Ch. X. Thomas enters the cave. How do I preserve the Andean code transmission while keeping the narrative momentum?"
```

### 4. Method Development
```bash
node agent.js "Can I combine El Rey fuera del Trono with Jouer sans être le jouet as a single 5-hour workshop? What's the pedagogical risk?"
```

---

## How It Works

1. **Loads INDEX** (~8,200 words) containing all 24 projects, methods, personal context, positioning
2. **Injects into system prompt** with your "Conseiller Mode" instructions (9/10 directivity, authentic behavior)
3. **Calls Claude API** with your question + full context
4. **Returns response** with intelligent, contextual advice

**Zero friction.** No re-explaining projects. No missing context.

---

## Modes

| Mode | Command | Use Case |
|------|---------|----------|
| **CLI** | `node agent.js "question"` | Quick queries, automation, piping |
| **Web** | `node agent.js --web` | Interactive, longer questions, mobile-friendly |
| **Help** | `node agent.js --help` | Show this help text |

---

## Deployment Options

### Local (Recommended for Start)
```bash
node agent.js --web
```
Runs on `http://localhost:3000` — accessible only on your machine.

### Vercel (Free Cloud Deployment)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

Follow prompts. Your agent will be live at a unique URL.

**Note:** Ensure `ANTHROPIC_API_KEY` is set in Vercel environment variables.

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["node", "agent.js", "--web"]
```

```bash
docker build -t mo-context-agent .
docker run -e ANTHROPIC_API_KEY=sk-ant-... -p 3000:3000 mo-context-agent
```

---

## Configuration

### Custom Port
```bash
node agent.js --web 5000
```

### Environment Variables (Optional)
```bash
# .env
ANTHROPIC_API_KEY=sk-ant-xxxxx
PORT=3000
```

---

## Troubleshooting

**Error: "INDEX not found"**
- Ensure `mo-index.md` exists in `/home/claude/` or current directory
- If using Claude memory, the INDEX should auto-load from memory filesystem

**Error: "ANTHROPIC_API_KEY not found"**
- Set environment variable: `export ANTHROPIC_API_KEY=sk-ant-...`
- Or add to `.env` file

**Web interface not loading**
- Check if port 3000 is available
- Try a different port: `node agent.js --web 5000`

**Slow response**
- First call loads INDEX (~2 seconds) — subsequent calls are faster
- Claude API calls take 2-10 seconds depending on prompt complexity

---

## Updating INDEX

The INDEX updates are handled via Claude's memory filesystem. To refresh:

1. If INDEX is in `/home/claude/mo-index.md` (file), edit directly
2. If INDEX is in Claude memory (recommended), use the memory_write function

The agent will always load the latest version automatically.

---

## Security

- **API Key:** Never commit `.env` to git. Use `.gitignore`:
  ```
  .env
  node_modules/
  .DS_Store
  ```

- **Deployment:** Use environment variables for API key, never hardcode
- **Data:** All queries go to Anthropic. No data stored locally (except INDEX)

---

## Development

### Adding Custom System Prompt
Edit the `buildSystemPrompt()` function in `agent.js` to modify instructions.

### Integrating New Context Sources
Extend `loadIndex()` to read from databases, files, or APIs.

### Customizing UI
Edit the HTML in the `runWeb()` function or create a separate `public/index.html`.

---

## License

MIT — Use freely for personal consulting purposes.

---

## Support

Questions or issues?
- Check `.env` is configured correctly
- Verify Node.js is 18+
- Test API key at https://console.anthropic.com/account/keys
- Run `node agent.js --help` for commands

---

**Ready to consult with your full context loaded?**

```bash
npm run start:web
# or
node agent.js "Your question here"
```
