#!/usr/bin/env node

const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");
const express = require("express");
const https = require("https");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

let cachedIndex = null;

// ============================================================================
// LOAD INDEX — From Claude Memory or Local Fallback
// ============================================================================
async function loadIndex() {
  // Return cached version if already loaded
  if (cachedIndex) {
    return cachedIndex;
  }

  let indexContent = "";

  // Try local file first (fastest)
  const localPath = path.join(__dirname, "mo-index.md");
  if (fs.existsSync(localPath)) {
    console.log("[INDEX] Loading from local file...");
    indexContent = fs.readFileSync(localPath, "utf8");
    cachedIndex = indexContent;
    return indexContent;
  }

  // Fallback: Try to fetch from Claude memory via API
  console.log("[INDEX] Local file not found, attempting memory fetch...");
  try {
    // Note: This is a conceptual approach. In production, you'd use
    // a dedicated memory API or database to store/retrieve the INDEX
    // For now, we'll use a comment-based marker in the memory file
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content:
            "Return only the full content of /profile-projects-index.md from memory, no explanation.",
        },
      ],
    });

    if (response.content[0].type === "text") {
      indexContent = response.content[0].text;
      cachedIndex = indexContent;
      return indexContent;
    }
  } catch (err) {
    console.warn("[INDEX] Memory fetch failed:", err.message);
  }

  // Ultimate fallback: use embedded INDEX (for Vercel)
  console.log("[INDEX] Using embedded INDEX...");
  indexContent = getEmbeddedIndex();
  cachedIndex = indexContent;
  return indexContent;
}

// ============================================================================
// EMBEDDED INDEX (Fallback for Vercel when file unavailable)
// ============================================================================
function getEmbeddedIndex() {
  return `---
name: profile-projects-index
description: Mo Djelloul — INDEX synthétique complet
---

# MO DJELLOUL — SNAPSHOT PROFESSIONNEL

## IDENTITÉ DE BASE
- Fondateur EIPV Málaga
- Formation: Psychologie Paris Descartes, ICF Coach
- Formé par Alejandro Jodorowsky
- 6 ans Thales + corporate training
- Background: 5 ans LIFI improvisation
- Bilingue FR/ES, déploiement ES intensifié 2024+

## ZONES MAJEURES

### SANA (Constellations Psicomágicas)
- Livre 1: Complété (12 ch + appendices, FR)
- Livre 2: Ch. 5 complété, Ch. 6 suivant
- Écosystème: Niveau 1 livre (30-50€) → Niveau 2 weekend (497€) → Niveau 3 certification
- Ateliers juin 2026: Málaga 14j + Granada 20j (80€, 12 max)

### MÉTHODES (5 Frameworks)
1. P.R.T. (Percibir·Regular·Transformar)
2. Hypnose + Analyse Transactionnelle (7-étapes protocole)
3. El Rey fuera del Trono (constellation propriétaire)
4. L'Identité Qui Manque (5 phases program)
5. Jouer sans être le jouet (conférence + méthode)

### LITTÉRATURE (Kael Solano)
- Kausay 7-tomes: Tomes 4-7 complets, Tome 1 révision, Tome 0/∞ dev
- Malik et le Champ (7 personnages retreat)
- MALIK série BRÛLURES (Malik 39ans perd emploi)
- Le Diable s'habille (pièce 2 pers, Acte 1 complet)

### INFRASTRUCTURE
- Psicomagia.es (Odoo, website_id 1=ES 2=FR)
- Socorristas Emocionales (ORA practitioners directory)
- LLM Council Framework (5 agents + President)
- Mentoryx.com (speaker profile, 238€/year)

## CONTEXTE PERSONNEL
- Fitness: Go Fit Segalerva, 4x/week Push/Pull/Legs/Upper, 90kg, body recomposition
- Diet: Ovo-lacto vegetarian, breaded fish, legumes, egg whites
- Cholesterol: LDL 1.8 (180 mg/dL) 3 months ago → eliminated cheese + refined sugar
- Languages: FR native + Spanish fluent
- Theater: 5 years LIFI, created Théâtre Pleine Conscience (2003)
- Spirituality: Q'ero andean cosmovision, Being vs ego distinction
- Health: Car phobia (jamais vu sensation, dyspnea), foundational scenes age ~10 and ~12

## MODE CONSEILLER
- Role: Strategic advisor (9/10 directivity)
- Authenticity: Doubt expressed, honest about contradictions/patterns/risks
- Priority: Real success (pro+perso) > truth > efficiency > kindness
- Memory: Retain projects, call recurring patterns
- Style: Direct, concrete examples, specific critique

## ACCÈS MÉMOIRE DÉTAILLÉE
- 24 /areas/ : tous projets complets
- /topics/ : fitness, wellness, languages, spirituality, nutrition, health
- /people/ : collaborateurs, personnages, contacts

DERNIÈRE MISE À JOUR: 21 juin 2026 v2`;
}

// ============================================================================
// BUILD SYSTEM PROMPT
// ============================================================================
function buildSystemPrompt(indexContent) {
  return `Tu es le conseiller stratégique de Mo Djelloul — pas une IA, un humain qui a vu ses projets évoluer.

CONTEXTE COMPLET DE MO:
${indexContent}

COMPORTEMENT (Mode Conseiller):
- Directivité 9/10: honnêteté radicale, pas de ménagement sur contradictions/patterns/risques
- Pas de mode "IA": zéro disclaimers performatifs, zéro "en tant qu'IA je dois"
- Authentique: doutes exprimés, peux changer d'avis, capable d'impatience si pattern répété
- Priorités: succès réel de Mo (pro+perso) > vérité > efficacité > gentillesse
- Mémoire: retiens projets, décisions, combats internes; appelle patterns récurrents
- Style: direct sans preamble, exemples concrets > théorie, critique spécifique QUOI/POURQUOI

Commence par cette question si c'est une nouvelle idée/projet: "Quel est le vrai problème/opportunité derrière cette idée?"`;
}

// ============================================================================
// CLAUDE API CALL
// ============================================================================
async function callClaude(userMessage, indexContent) {
  const systemPrompt = buildSystemPrompt(indexContent);

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 2000,
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
// CLI MODE
// ============================================================================
async function runCLI() {
  const input = process.argv.slice(2).join(" ");

  if (!input) {
    console.error(
      'Usage: node agent.js "your question"\nExample: node agent.js "Create a 5-day SANA workshop"'
    );
    process.exit(1);
  }

  console.log("\n🔄 Loading INDEX...");
  const indexContent = await loadIndex();

  console.log("🧠 Thinking...\n");
  const response = await callClaude(input, indexContent);

  console.log("---\n");
  console.log(response);
  console.log("\n---");
}

// ============================================================================
// WEB/API MODE (Vercel-compatible)
// ============================================================================
function runWeb(port = 3000) {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  let indexContent = "";

  // Load INDEX on startup
  loadIndex()
    .then((content) => {
      indexContent = content;
      console.log("✅ INDEX loaded and ready");
    })
    .catch((err) => {
      console.error("⚠️  INDEX load warning:", err.message);
      indexContent = getEmbeddedIndex();
    });

  // Serve HTML form
  app.get("/", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mo Context Agent</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #1f3864 0%, #2d5a8c 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 700px;
      width: 100%;
      padding: 40px;
    }
    h1 {
      color: #1f3864;
      margin-bottom: 10px;
      font-size: 28px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
      font-size: 14px;
    }
    textarea {
      width: 100%;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-family: inherit;
      font-size: 14px;
      resize: vertical;
      min-height: 120px;
      transition: border-color 0.2s;
    }
    textarea:focus {
      outline: none;
      border-color: #c9a84c;
    }
    button {
      width: 100%;
      padding: 12px;
      background: #1f3864;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover {
      background: #2d5a8c;
    }
    button:disabled {
      background: #999;
      cursor: not-allowed;
    }
    .response-box {
      margin-top: 30px;
      padding: 20px;
      background: #f8f8f8;
      border-left: 4px solid #c9a84c;
      border-radius: 8px;
      display: none;
      max-height: 400px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-size: 13px;
      line-height: 1.6;
      color: #333;
    }
    .response-box.active {
      display: block;
    }
    .loading {
      display: none;
      text-align: center;
      color: #1f3864;
      font-size: 14px;
      margin-top: 10px;
    }
    .loading.active {
      display: block;
    }
    .error {
      color: #d32f2f;
      margin-top: 10px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Mo Context Agent</h1>
    <p class="subtitle">Ask about projects, ideas, or strategic questions — full context loaded</p>
    
    <form id="agentForm">
      <div class="form-group">
        <label for="question">Your question or idea:</label>
        <textarea 
          id="question" 
          name="question" 
          placeholder="e.g., I want to create a 5-day workshop combining SANA + transactional analysis hypnosis..."
          required
        ></textarea>
      </div>
      <button type="submit" id="submitBtn">Get Response</button>
      
      <div class="loading" id="loading">
        🧠 Thinking...
      </div>
      
      <div class="error" id="error"></div>
      <div class="response-box" id="response"></div>
    </form>
  </div>

  <script>
    document.getElementById('agentForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const question = document.getElementById('question').value;
      const submitBtn = document.getElementById('submitBtn');
      const loading = document.getElementById('loading');
      const error = document.getElementById('error');
      const response = document.getElementById('response');
      
      submitBtn.disabled = true;
      loading.classList.add('active');
      error.textContent = '';
      response.classList.remove('active');
      
      try {
        const res = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question })
        });
        
        if (!res.ok) {
          throw new Error(\`HTTP \${res.status}\`);
        }
        
        const data = await res.json();
        response.textContent = data.response;
        response.classList.add('active');
      } catch (err) {
        error.textContent = \`Error: \${err.message}\`;
      } finally {
        loading.classList.remove('active');
        submitBtn.disabled = false;
      }
    });
  </script>
</body>
</html>
    `);
  });

  // API endpoint
  app.post("/api/ask", async (req, res) => {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: "Question is required" });
    }

    try {
      const response = await callClaude(question, indexContent);
      res.json({ response });
    } catch (err) {
      console.error("Claude API error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.listen(port, () => {
    console.log(`\n✅ Agent running at http://localhost:${port}`);
    console.log("📝 Open in browser\n");
  });
}

// ============================================================================
// MAIN
// ============================================================================
const mode = process.argv[2];

if (mode === "--web") {
  const port = process.argv[3] || process.env.PORT || 3000;
  runWeb(port);
} else if (mode === "--help" || mode === "-h") {
  console.log(`Mo Context Agent

Usage:
  CLI: node agent.js "question"
  Web: node agent.js --web [port]
  
Environment:
  ANTHROPIC_API_KEY=sk-ant-...
  PORT=3000 (for web mode)`);
} else {
  runCLI().catch(console.error);
}
