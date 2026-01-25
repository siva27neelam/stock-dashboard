const JSONBIN_KEY = '$2a$10$B.MfltIsYbuMbVyKNTp/AOcFRPPHltKzNuA4Wa/SLNxnbIBF5HJaG';
const JSONBIN_ID = '695c0606ae596e708fc6f5b9';

async function getBin() {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
        headers: { 'X-Access-Key': JSONBIN_KEY }
    });
    return await res.json();
}

async function saveBin(data) {
    await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Access-Key': JSONBIN_KEY
        },
        body: JSON.stringify(data)
    });
}

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const method = request.method;

    if (method === 'GET') {
        const { record } = await getBin();
        return new Response(JSON.stringify(record.stocks), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (method === 'POST') {
        const { country, symbol, name } = await request.json();
        const { record } = await getBin();

        if (!record.stocks[country]) record.stocks[country] = [];

        const newStock = {
            symbol: symbol.toUpperCase(),
            name: name || symbol.toUpperCase(),
            favorite: false,
            addedAt: new Date().toISOString()
        };

        if (!record.stocks[country].find(s => s.symbol === newStock.symbol)) {
            record.stocks[country].unshift(newStock);
            await saveBin(record);
        }

        return new Response(JSON.stringify({ success: true, stocks: record.stocks }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response('Method not allowed', { status: 405 });
}

// Handle DELETE and PUT (Toggle Favorite) in separate paths or check URL params
export async function onRequestGet(context) {
    return onRequest(context);
}

export async function onRequestPost(context) {
    return onRequest(context);
}
