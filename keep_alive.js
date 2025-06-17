const express = require('express');
const app = express();
const config = require('./config.json');

app.get('/', (req, res) => {
    res.send('Bot is alive!');
});

function startServer() {
    const port = process.env.PORT || config.port || 3002;
    
    try {
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error('Server error:', error);
        // Try alternative port if main port is in use
        const altPort = port + 1;
        app.listen(altPort, () => {
            console.log(`Server running on alternative port ${altPort}`);
        });
    }
}

module.exports = startServer;
