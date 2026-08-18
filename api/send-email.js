var requestLog = new Map();

var SUPABASE_URL = 'https://trirxmcalxktampbujyr.supabase.co';
var SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function supabaseAdmin(table, method, body) {
    var url = SUPABASE_URL + '/rest/v1/' + table;
    var opts = {
        method: method,
        headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    };
    if (body) opts.body = JSON.stringify(body);
    var res = await fetch(url, opts);
    if (!res.ok) {
        var err = await res.text();
        throw new Error(err);
    }
    if (method === 'POST' || method === 'PATCH' || method === 'PUT') return res.json();
    return res.status === 204 ? null : res.json();
}

module.exports = async function handler(request, response) {
    response.setHeader('Cache-Control', 'no-store');
    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        return response.status(405).json({error:'Método não permitido'});
    }
    var body = request.body || {};
    var name = String(body.name || '').trim();
    var email = String(body.email || '').trim();
    var message = String(body.message || '').trim();
    var website = String(body.website || '').trim();
    if (website) return response.status(204).end();
    if (!name || !email || !message || name.length > 120 || email.length > 254 || message.length > 4000) return response.status(400).json({error:'Dados inválidos'});
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response.status(400).json({error:'E-mail inválido'});
    var ip = String(request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || 'unknown').split(',')[0].trim();
    var rateKey = ip + ':' + email.toLowerCase();
    var now = Date.now();
    var previous = requestLog.get(rateKey) || 0;
    if (now - previous < 60000) return response.status(429).json({error:'Aguarde um minuto antes de enviar outra mensagem.'});
    requestLog.set(rateKey, now);
    for (var entry of requestLog) if (now - entry[1] > 3600000) requestLog.delete(entry[0]);

    if (!SUPABASE_SERVICE_KEY) {
        console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
        return response.status(500).json({error:'Serviço temporariamente indisponível. Tente novamente mais tarde.'});
    }
    try {
        await supabaseAdmin('contato_mensagens', 'POST', {
            nome: name,
            email: email,
            mensagem: message
        });
    } catch (err) {
        console.error('Failed to save message to DB:', err.message);
        return response.status(500).json({error:'Não foi possível enviar sua mensagem. Tente novamente.'});
    }

    return response.status(200).json({ok:true, info:'Mensagem recebida. Entraremos em contato em breve.'});
};
