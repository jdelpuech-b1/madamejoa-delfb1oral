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
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: 'Clé API Mistral manquante côté serveur.' } });
  }

  try {
    const { system, messages, max_tokens } = req.body;

    // Conversion format Anthropic → Mistral
    const mistralMessages = [];
    if (system) mistralMessages.push({ role: 'system', content: system });
    messages.forEach(function(m) {
      mistralMessages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content });
    });
    if (mistralMessages.filter(m => m.role !== 'system').length === 0) {
      mistralMessages.push({ role: 'user', content: 'Commence.' });
    }

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: mistralMessages,
        max_tokens: max_tokens || 1000,
        temperature: 0.85
      })
    });

    const data = await response.json();
    if (data.error) return res.json({ error: { message: data.error.message } });

    const text = data.choices?.[0]?.message?.content || 'Erreur. Réessayez.';
    res.json({ content: [{ type: 'text', text: text }] });

  } catch (e) {
    res.status(500).json({ error: { message: 'Erreur serveur : ' + e.message } });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('DELF B1 Coach démarré sur le port ' + PORT));
