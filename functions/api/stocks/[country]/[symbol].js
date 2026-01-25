const JSONBIN_KEY = '$2a$10$B.MfltIsYbuMbVyKNTp/AOcFRPPHltKzNuA4Wa/SLNxnbIBF5HJaG';
const JSONBIN_ID = '695c0606ae596e708fc6f5b9';

export async function onRequestDelete(context) {
    const { country, symbol } = context.params;

    const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
        headers: { 'X-Access-Key': JSONBIN_KEY }
    });
    const { record } = await res.json();

    if (record.stocks[country]) {
        record.stocks[country] = record.stocks[country].filter(s => s.symbol !== symbol);

        await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Access-Key': JSONBIN_KEY
            },
            body: JSON.stringify(record)
        });
    }

    return new Response(JSON.stringify({ success: true, stocks: record.stocks }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
