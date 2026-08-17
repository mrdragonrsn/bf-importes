function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function(character) {
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character];
    });
}

module.exports = async function handler(request, response) {
    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        return response.status(405).json({error:'Método não permitido'});
    }
    if (!process.env.RESEND_API_KEY) return response.status(500).json({error:'Serviço de e-mail não configurado'});
    var body = request.body || {};
    var name = String(body.name || '').trim();
    var email = String(body.email || '').trim();
    var message = String(body.message || '').trim();
    if (!name || !email || !message || name.length > 120 || email.length > 254 || message.length > 4000) return response.status(400).json({error:'Dados inválidos'});
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response.status(400).json({error:'E-mail inválido'});
    var resend = await fetch('https://api.resend.com/emails', {
        method:'POST',
        headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json'},
        body:JSON.stringify({
            from:process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
            to:[process.env.RESEND_TO_EMAIL || 'atendimento@biancoeferreira.com.br'],
            reply_to:email,
            subject:'Novo contato pelo site: '+name,
            html:'<h2>Novo contato pelo site</h2><p><strong>Nome:</strong> '+escapeHtml(name)+'</p><p><strong>E-mail:</strong> '+escapeHtml(email)+'</p><p><strong>Mensagem:</strong></p><p>'+escapeHtml(message).replace(/\n/g,'<br>')+'</p>'
        })
    });
    if (!resend.ok) return response.status(502).json({error:'Falha ao enviar e-mail'});
    return response.status(200).json({ok:true});
};
