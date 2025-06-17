const express = require('express');
const app = express();
const { spawn } = require('child_process');

// Démarrer le bot dans un processus séparé
const bot = spawn('node', ['../index.js'], {
    stdio: 'inherit'
});

app.get('/', (req, res) => {
    res.send('Bot is running!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

module.exports = app;
