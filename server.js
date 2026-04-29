const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/claude', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: 'Clé API Gemini manquante côté serveur.' } });
  }

  try {
    const { system, messages, max_tokens } = req.body;

    const contents = messages.map(function(m) {
      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      };
    });

    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: 'Commence.' }] });
    }

    const geminiBody = {
      system_instruction: system ? { parts: [{ text: system }] } : undefined,
      contents: contents,
      generationConfig: {
        maxOutputTokens: max_tokens || 1000,
        temperature: 0.85
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody)
    });

    const data = await response.json();

    if (data.error) {
      return res.json({ error: { message: data.error.message } });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Erreur. Réessayez.';
    res.json({ content: [{ type: 'text', text: text }] });

  } catch (e) {
    res.status(500).json({ error: { message: 'Erreur serveur : ' + e.message } });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('DELF B1 Coach démarré sur le port ' + PORT));
