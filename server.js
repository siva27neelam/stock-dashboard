const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

// Middleware
app.use(express.json());
app.use(express.static('public'));

const ALERTS_FILE = path.join(__dirname, 'alerts.json');
const STOCKS_FILE = path.join(__dirname, 'stocks.json');

const JSONBIN_KEY = '$2a$10$B.MfltIsYbuMbVyKNTp/AOcFRPPHltKzNuA4Wa/SLNxnbIBF5HJaG';
const JSONBIN_ID = '695c0606ae596e708fc6f5b9';

// Helper to load data
function loadData(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error(`Error loading data from ${filePath}:`, err);
    }
    return filePath === ALERTS_FILE ? [] : { US: [], India: [] };
}

// Helper to save data with Cloud Backup
async function saveData(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        // If it's stocks, also sync to cloud
        if (filePath === STOCKS_FILE) {
            fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Access-Key': JSONBIN_KEY
                },
                body: JSON.stringify(data)
            }).catch(e => console.error('Cloud Sync Error:', e.message));
        }
    } catch (err) {
        console.error(`Error saving data to ${filePath}:`, err);
    }
}

// In-memory storage with persistence
let alertsData = loadData(ALERTS_FILE);
let stocksData = loadData(STOCKS_FILE);

// SSE Clients
let clients = [];

// SSE Endpoint
app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = {
        id: clientId,
        res
    };
    clients.push(newClient);

    req.on('close', () => {
        clients = clients.filter(c => c.id !== clientId);
    });
});

// Notify all clients
function notifyClients(type, data) {
    clients.forEach(c => {
        c.res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
    });
}

// --- ALERTS API ---

app.get('/alerts', (req, res) => {
    res.json({ alerts: alertsData });
});

app.post('/webhook', (req, res) => {
    try {
        const { ticker, message } = req.body;
        if (!ticker || !message) return res.status(400).json({ error: 'Missing ticker or message' });

        const newAlert = {
            id: Date.now().toString(),
            stock: ticker,
            message: message,
            createdTimestamp: new Date().toISOString(),
            actionedTimestamp: null,
            archived: false,
            archivedTimestamp: null
        };

        alertsData.unshift(newAlert);
        saveData(ALERTS_FILE, alertsData);
        notifyClients('new_alert', newAlert);
        res.json({ success: true, alert: newAlert });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save alert' });
    }
});

app.put('/alerts/:id/action', (req, res) => {
    try {
        const alert = alertsData.find(a => a.id === req.params.id);
        if (!alert) return res.status(404).json({ error: 'Alert not found' });

        alert.actionedTimestamp = new Date().toISOString();
        saveData(ALERTS_FILE, alertsData);
        notifyClients('update_alert', alert);
        res.json({ success: true, alert });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update alert' });
    }
});

app.delete('/alerts/:id', (req, res) => {
    try {
        const alert = alertsData.find(a => a.id === req.params.id);
        if (!alert) return res.status(404).json({ error: 'Alert not found' });

        alert.archived = true;
        alert.archivedTimestamp = new Date().toISOString();
        saveData(ALERTS_FILE, alertsData);
        notifyClients('archive_alert', alert);
        res.json({ success: true, alert });
    } catch (error) {
        res.status(500).json({ error: 'Failed to archive alert' });
    }
});

// --- STOCKS API ---

app.get('/stocks', (req, res) => {
    res.json(stocksData);
});

app.post('/stocks', (req, res) => {
    try {
        const { country, symbol, name } = req.body;
        if (!country || !symbol) return res.status(400).json({ error: 'Missing country or symbol' });

        if (!stocksData[country]) stocksData[country] = [];

        const newStock = {
            symbol: symbol.toUpperCase(),
            name: name || symbol.toUpperCase(),
            favorite: false,
            addedAt: new Date().toISOString()
        };

        // Prevent duplicates
        if (!stocksData[country].find(s => s.symbol === newStock.symbol)) {
            stocksData[country].unshift(newStock);
            saveData(STOCKS_FILE, stocksData);
            notifyClients('stocks_updated', stocksData);
        }

        res.json({ success: true, stocks: stocksData });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add stock' });
    }
});

app.delete('/stocks/:country/:symbol', (req, res) => {
    try {
        const { country, symbol } = req.params;
        if (!stocksData[country]) return res.status(404).json({ error: 'Country not found' });

        stocksData[country] = stocksData[country].filter(s => s.symbol !== symbol);
        saveData(STOCKS_FILE, stocksData);
        notifyClients('stocks_updated', stocksData);
        res.json({ success: true, stocks: stocksData });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove stock' });
    }
});

app.put('/stocks/:country/:symbol/toggle-favorite', (req, res) => {
    try {
        const { country, symbol } = req.params;
        const stock = stocksData[country].find(s => s.symbol === symbol);
        if (!stock) return res.status(404).json({ error: 'Stock not found' });

        stock.favorite = !stock.favorite;
        saveData(STOCKS_FILE, stocksData);
        notifyClients('stocks_updated', stocksData);
        res.json({ success: true, stock });
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle favorite' });
    }
});


// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`\n\x1b[32m✓ Server running on http://localhost:${PORT}\x1b[0m`);
    console.log(`✓ Webhook endpoint: POST http://localhost:${PORT}/webhook`);
    console.log(`✓ SSE events: GET http://localhost:${PORT}/events\n`);
});

