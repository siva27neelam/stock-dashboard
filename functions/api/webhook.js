const JSONBIN_KEY = '$2a$10$B.MfltIsYbuMbVyKNTp/AOcFRPPHltKzNuA4Wa/SLNxnbIBF5HJaG';
const JSONBIN_ID = '695c0606ae596e708fc6f5b9';

export async function onRequestPost(context) {
    const { request } = context;
    const { ticker, message } = await request.json();

    if (!ticker || !message) {
        return new Response(JSON.stringify({ error: 'Missing ticker or message' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
        headers: { 'X-Access-Key': JSONBIN_KEY }
    });
    const { record } = await res.json();

    const newAlert = {
        id: Date.now().toString(),
        stock: ticker,
        message: message,
        createdTimestamp: new Date().toISOString(),
        actionedTimestamp: null,
        archived: false,
        archivedTimestamp: null
    };

    record.alerts.unshift(newAlert);

    await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Access-Key': JSONBIN_KEY
        },
        body: JSON.stringify(record)
    });

    return new Response(JSON.stringify({ success: true, alert: newAlert }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
