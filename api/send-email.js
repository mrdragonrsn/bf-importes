var requestLog = new Map();

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
    return response.status(200).json({ok:true, info:'Mensagem recebida. Entraremos em contato em breve.'});
};
