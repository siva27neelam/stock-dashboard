const express = require('express');
const app = express();
const path = require('path');

// Middleware
app.use(express.json());
app.use(express.static('public'));

// In-memory alerts storage
let alertsData = [];

// GET /alerts - Fetch all alerts
app.get('/alerts', (req, res) => {
    res.json({ alerts: alertsData });
});

// POST /webhook - Receive alerts from TradingView
app.post('/webhook', (req, res) => {
    try {
        const { ticker, message } = req.body;

        if (!ticker || !message) {
            return res.status(400).json({ error: 'Missing ticker or message' });
        }

        // Create new alert object
        const newAlert = {
            id: Date.now().toString(),
            stock: ticker,
            message: message,
            createdTimestamp: new Date().toISOString(),
            actionedTimestamp: null
        };

        // Add to beginning (latest first)
        alertsData.unshift(newAlert);

        res.json({ success: true, alert: newAlert });
    } catch (error) {
        console.error('Error saving alert:', error);
        res.status(500).json({ error: 'Failed to save alert' });
    }
});

// PUT /alerts/:id/action - Mark alert as actioned
app.put('/alerts/:id/action', (req, res) => {
    try {
        const { id } = req.params;

        // Find and update the alert
        const alert = alertsData.find(a => a.id === id);
        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        alert.actionedTimestamp = new Date().toISOString();

        res.json({ success: true, alert });
    } catch (error) {
        console.error('Error updating alert:', error);
        res.status(500).json({ error: 'Failed to update alert' });
    }
});

// DELETE /alerts/:id - Delete a specific alert
app.delete('/alerts/:id', (req, res) => {
    try {
        const { id } = req.params;

        // Find and remove the alert
        const alertIndex = alertsData.findIndex(a => a.id === id);
        if (alertIndex === -1) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        const deletedAlert = alertsData.splice(alertIndex, 1)[0];

        res.json({ success: true, alert: deletedAlert });
    } catch (error) {
        console.error('Error deleting alert:', error);
        res.status(500).json({ error: 'Failed to delete alert' });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ Webhook endpoint: POST http://localhost:${PORT}/webhook`);
    console.log(`✓ Alerts endpoint: GET http://localhost:${PORT}/alerts`);
    console.log(`✓ Delete endpoint: DELETE http://localhost:${PORT}/alerts/:id`);
    console.log(`✓ Action endpoint: PUT http://localhost:${PORT}/alerts/:id/action\n`);
});        // Find and update the alert
        const alert = alertsData.find(a => a.id === id);
        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        alert.actionedTimestamp = new Date().toISOString();

        // Sync to JSONBin
        syncAlertsToJSONBin();

        res.json({ success: true, alert });
    } catch (error) {
        console.error('Error updating alert:', error);
        res.status(500).json({ error: 'Failed to update alert' });
    }
});

// DELETE /alerts/:id - Delete a specific alert
app.delete('/alerts/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Find and remove the alert
        const alertIndex = alertsData.findIndex(a => a.id === id);
        if (alertIndex === -1) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        const deletedAlert = alertsData.splice(alertIndex, 1)[0];

        // Sync to JSONBin
        syncAlertsToJSONBin();

        res.json({ success: true, alert: deletedAlert });
    } catch (error) {
        console.error('Error deleting alert:', error);
        res.status(500).json({ error: 'Failed to delete alert' });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ Webhook endpoint: POST http://localhost:${PORT}/webhook`);
    console.log(`✓ Alerts endpoint: GET http://localhost:${PORT}/alerts`);
    console.log(`✓ Delete endpoint: DELETE http://localhost:${PORT}/alerts/:id`);
    console.log(`✓ Action endpoint: PUT http://localhost:${PORT}/alerts/:id/action\n`);
    initializeAlerts();
});
