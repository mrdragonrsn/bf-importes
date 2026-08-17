(function(){
    var client=window.supabase.createClient('https://trirxmcalxktampbujyr.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyaXJ4bWNhbHhrdGFtcGJ1anlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MjU3MzEsImV4cCI6MjEwMjIwMTczMX0.sr6dx1qSK8cqV4e1g6-jMz99T2WTw9Q0jX1iHb-Vwy4');
    var page=document.body.getAttribute('data-account-page');
    function setStatus(text){var el=document.getElementById('accountStatus');if(el)el.textContent=text}
    function formatDate(value){return new Date(value).toLocaleDateString('pt-BR')}
    client.auth.getUser().then(function(result){
        if(result.error||!result.data.user){window.location.replace('/');return}
        var user=result.data.user;
        if(page==='profile'){
            return client.from('profiles').select('nome,telefone').eq('id',user.id).maybeSingle().then(function(profile){
                var data=profile.data||{};
                document.getElementById('profileName').value=data.nome||user.user_metadata&&user.user_metadata.nome||'';
                document.getElementById('profileEmail').value=user.email||'';
                document.getElementById('profilePhone').value=data.telefone||'';
                document.getElementById('profileForm').addEventListener('submit',function(event){
                    event.preventDefault();
                    client.from('profiles').update({nome:document.getElementById('profileName').value.trim(),telefone:document.getElementById('profilePhone').value.trim()}).eq('id',user.id).then(function(update){setStatus(update.error?update.error.message:'Dados atualizados.')});
                });
            });
        }
        return client.from('pedidos').select('codigo,created_at,total,pagamento,status').eq('user_id',user.id).order('created_at',{ascending:false}).then(function(result){
            var body=document.getElementById('ordersBody');
            if(result.error){body.innerHTML='<tr><td colspan="5" class="account-empty">Não foi possível carregar seus pedidos.</td></tr>';return}
            if(!result.data.length){body.innerHTML='<tr><td colspan="5" class="account-empty">Nenhum pedido encontrado.</td></tr>';return}
            body.innerHTML=result.data.map(function(order){return '<tr><td>'+order.codigo+'</td><td>'+formatDate(order.created_at)+'</td><td>R$ '+Number(order.total).toFixed(2).replace('.',',')+'</td><td>'+order.pagamento+'</td><td>'+order.status+'</td></tr>'}).join('');
        });
    }).catch(function(){setStatus('Não foi possível carregar seus dados.')});
})();
