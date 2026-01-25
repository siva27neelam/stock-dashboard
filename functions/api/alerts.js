const JSONBIN_KEY = '$2a$10$B.MfltIsYbuMbVyKNTp/AOcFRPPHltKzNuA4Wa/SLNxnbIBF5HJaG';
const JSONBIN_ID = '695c0606ae596e708fc6f5b9';

export async function onRequestGet(context) {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
        headers: { 'X-Access-Key': JSONBIN_KEY }
    });
    const { record } = await res.json();
    return new Response(JSON.stringify({ alerts: record.alerts }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
