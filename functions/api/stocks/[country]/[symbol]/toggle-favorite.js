const JSONBIN_KEY = '$2a$10$B.MfltIsYbuMbVyKNTp/AOcFRPPHltKzNuA4Wa/SLNxnbIBF5HJaG';
const JSONBIN_ID = '695c0606ae596e708fc6f5b9';

export async function onRequestPut(context) {
    const { country, symbol } = context.params;

    const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
        headers: { 'X-Access-Key': JSONBIN_KEY }
    });
    const { record } = await res.json();

    const stock = record.stocks[country]?.find(s => s.symbol === symbol);
    if (stock) {
        stock.favorite = !stock.favorite;

        await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Access-Key': JSONBIN_KEY
            },
            body: JSON.stringify(record)
        });
    }

    return new Response(JSON.stringify({ success: true, stock }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
