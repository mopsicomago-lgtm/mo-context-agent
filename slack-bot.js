#!/usr/bin/env node

/**
 * Mo Context Agent — Slack Bot
 * 
 * Slash command: /mo "your question"
 * Responds with contextual advice from Claude using full INDEX
 */

const Anthropic = require("@anthropic-ai/sdk");
const { App } = require("@slack/bolt");
const fs = require("fs");
const path = require("path");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================================================
// SLACK APP SETUP
// ============================================================================
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

let cachedIndex = null;

// ============================================================================
// LOAD INDEX
// ============================================================================
async function loadIndex() {
  if (cachedIndex) return cachedIndex;

  const localPath = path.join(__dirname, "mo-index.md");
  if (fs.existsSync(localPath)) {
    cachedIndex = fs.readFileSync(localPath, "utf8");
    return cachedIndex;
  }

  // Fallback to embedded minimal INDEX
  cachedIndex = `Mo Djelloul — 24 projects: SANA (Books 1-2), Kausay 7-tomes, 5 methods, Slack bot, workshops Málaga/Granada, fitness 4x/week, bilingual FR/ES`;
  return cachedIndex;
}

// ============================================================================
// BUILD SYSTEM PROMPT
// ============================================================================
function buildSystemPrompt(indexContent) {
  return `Tu es le conseiller stratégique de Mo Djelloul dans Slack.

CONTEXTE:
${indexContent}

STYLE:
- Direct et concis (Slack format, pas de long prose)
- 9/10 directivity — honnête sur contradictions/risques
- Ligne ou deux de question exploratoire si besoin
- Pas de "en tant qu'IA..." ou disclaimers

Réponds BRIÈVEMENT — c'est Slack, pas un email.`;
}

// ============================================================================
// CLAUDE CALL (SHORT FORMAT FOR SLACK)
// ============================================================================
async function callClaudeSlack(userMessage, indexContent) {
  const systemPrompt = buildSystemPrompt(indexContent);

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 500, // Short responses for Slack
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

// ============================================================================
// SLACK SLASH COMMAND: /mo
// ============================================================================
app.command("/mo", async ({ command, ack, respond }) => {
  // Acknowledge immediately
  ack();

  const userQuestion = command.text || "No question provided";

  // Load INDEX
  const indexContent = await loadIndex();

  // Show thinking indicator
  respond({
    text: "🧠 Thinking...",
    replace_original: false,
  });

  try {
    const response = await callClaudeSlack(userQuestion, indexContent);

    // Reply with response
    await respond({
      text: response,
      replace_original: true,
    });
  } catch (err) {
    await respond({
      text: `❌ Error: ${err.message}`,
      replace_original: true,
    });
  }
});

// ============================================================================
// SLACK MESSAGE EVENT (Optional: respond to @mentions)
// ============================================================================
app.message("<!here>|@mo", async ({ message, say }) => {
  const userQuestion = message.text
    .replace(/<@U.*?>/, "")
    .replace(/<!here>/, "")
    .trim();

  if (!userQuestion) return;

  const indexContent = await loadIndex();

  say("🧠 Thinking...");

  try {
    const response = await callClaudeSlack(userQuestion, indexContent);
    say(response);
  } catch (err) {
    say(`❌ Error: ${err.message}`);
  }
});

// ============================================================================
// START SERVER
// ============================================================================
(async () => {
  const port = process.env.PORT || 3001;
  await app.start(port);
  console.log(`✅ Slack bot listening on port ${port}`);
  console.log(`📝 Use /mo "your question" in Slack to ask`);
})();
