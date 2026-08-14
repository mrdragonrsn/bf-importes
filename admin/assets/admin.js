(function(){
var USERS_KEY='bf_users', BANNER_KEY='bf_banner', ANUNCIOS_KEY='bf_anuncios', CONFIG_KEY='bf_config', CATEGORIES_KEY='bf_categories', PEDIDOS_KEY='bf_orders';

var SUPABASE_URL = 'https://trirxmcalxktampbujyr.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyaXJ4bWNhbHhrdGFtcGJ1anlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MjU3MzEsImV4cCI6MjEwMjIwMTczMX0.sr6dx1qSK8cqV4e1g6-jMz99T2WTw9Q0jX1iHb-Vwy4';
var supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

function load(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback}catch(e){return fallback||{}}}
function save(key,obj){localStorage.setItem(key,JSON.stringify(obj))}

function escAttr(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');}
function formatPrice(n){n=parseFloat(n)||0;return n.toFixed(2).replace('.',',');}
function parsePrice(s){return parseFloat(String(s==null?'':s).replace(/[^\d.,-]/g,'').replace(/\./g,'').replace(',','.'))||0;}

function showToast(msg){
    var c=document.getElementById('toastContainer');
    var t=document.createElement('div');t.className='toast';t.textContent=msg;
    c.appendChild(t);setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t)},2800);
}

/* === HASH (SHA-256 via Web Crypto) === */
function sha256(text){
    try {
        var enc = new TextEncoder();
        return crypto.subtle.digest('SHA-256', enc.encode(text)).then(function(buf){
            var arr = Array.from(new Uint8Array(buf));
            return arr.map(function(b){ return b.toString(16).padStart(2, '0'); }).join('');
        });
    } catch(e) {
        return Promise.resolve(String(text));
    }
}

/* === DEFAULTS === */
function defaultBanner(){return{title:'Impressoras, multifuncionais e peças',title2:'com garantia e procedência',subtitle:'Desde equipamentos e suprimentos até peças originais e genéricas.',bgUrl:'',bgColor:'linear-gradient(170deg, #0d2f5e 0%, #0a1f3f 100%)',btnText:'Ver Produtos'}}
function defaultConfig(){return{company:'BIANCO & FERREIRA - COMERCIO DE EQUIPAMENTOS PARA INFORMATICA LTDA',brand:'B&F Importes',cnpj:'03.108.169/0001-58',phone:'(16) 98138-6747',email:'atendimento@biancoeferreira.com.br',hours:'Seg–Sex 8h às 18h | Sáb 8h às 13h',address:'R. Rui Barbosa, 363 — Centro, Jaboticabal — SP, 14870-090',cep:'14870-090',cityState:'Jaboticabal — SP'}}
function defaultCategories(){return['impressoras','multifuncionais','pecas','suprimentos']}

/* === AUTH (Supabase) === */
var adminLayout=document.getElementById('adminLayout');

function showDashboard(){adminLayout.classList.add('active');renderAll();setTimeout(initCharts,100);refreshPreview()}
function logout(){
    supabase.auth.signOut().then(function(){
        window.location.replace('login.html');
    });
}

/* proteção da rota: sem sessão, volta para o login */
supabase.auth.getSession().then(function(res){
    if(!res.data || !res.data.session){ window.location.replace('login.html'); return; }
    showDashboard();
});
document.getElementById('btnAdminLogout').addEventListener('click',logout);

/* === TABS === */
document.querySelectorAll('#sideNav a').forEach(function(a){
    a.addEventListener('click',function(){
        document.querySelectorAll('#sideNav a').forEach(function(l){l.classList.remove('active')});
        a.classList.add('active');
        document.querySelectorAll('.tab-panel').forEach(function(p){p.classList.remove('active')});
        var tabName = a.getAttribute('data-tab');
        document.getElementById('tab-'+tabName).classList.add('active');
        if(tabName === 'pedidos') renderPedidos();
        if(tabName === 'anuncios') renderAnuncios();
        if(tabName === 'banners') loadBannerForm();
        if(tabName === 'dashboard'){ renderDashboard(); initCharts(); }
    });
});

/* === PRODUCT IMAGE UPLOAD (Storage - múltiplas imagens) === */
var prodImgFiles = [];

function renderProdImgThumbs(){
    var wrap = document.getElementById('prodImgThumbs');
    if(!wrap) return;
    if(!prodImgFiles.length){
        wrap.style.display = 'none';
        wrap.innerHTML = '';
        document.getElementById('prodImgName').textContent = 'Nenhuma';
        return;
    }
    document.getElementById('prodImgName').textContent = prodImgFiles.length + ' imagem(ns) selecionada(s)';
    wrap.style.display = 'flex';
    wrap.innerHTML = '';
    prodImgFiles.forEach(function(file, idx){
        var div = document.createElement('div');
        div.className = 'prod-img-thumb';
        var img = document.createElement('img');
        var reader = new FileReader();
        reader.onload = function(ev){ img.src = ev.target.result; };
        reader.readAsDataURL(file);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'prod-img-thumb-remove';
        btn.textContent = '×';
        btn.title = 'Remover imagem';
        btn.addEventListener('click', function(){
            prodImgFiles.splice(idx, 1);
            renderProdImgThumbs();
        });
        div.appendChild(img);
        div.appendChild(btn);
        wrap.appendChild(div);
    });
}

document.getElementById('btnProdImgChoose').addEventListener('click', function(){
    document.getElementById('prodImgFile').click();
});
document.getElementById('prodImgFile').addEventListener('change', function(e){
    var files = Array.prototype.slice.call(e.target.files || []);
    if(!files.length) return;
    files.forEach(function(f){ prodImgFiles.push(f); });
    renderProdImgThumbs();
});

function uploadImagesToStorage(files){
    if(!files || !files.length) return Promise.resolve([]);
    return Promise.all(files.map(function(file){
        return new Promise(function(resolve, reject){
            var ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');
            var path='produtos/'+Date.now()+'-'+Math.random().toString(36).slice(2,8)+'.'+ext;
            supabase.storage.from('produtos').upload(path,file,{cacheControl:'3600',upsert:false}).then(function(res){
                if(res.error){ reject(res.error); return; }
                var url=supabase.storage.from('produtos').getPublicUrl(res.data.path);
                resolve(url.data.publicUrl);
            });
        });
    }));
}

function deleteImageByUrl(url){
    if(!url) return;
    var m=url.match(/\/object\/public\/produtos\/(.+)$/);
    if(m&&m[1]) supabase.storage.from('produtos').remove([m[1]]);
}

/* === RENDER ALL === */
function renderAll(){renderStock();renderAnuncios();loadBannerForm();loadConfigForm();renderUsers();renderCategories();renderPedidos();renderDashboard()}

/* === STOCK TABLE + ADD (Supabase) === */
function renderStock(){
    var tbody=document.getElementById('stockBody');
    tbody.innerHTML='<tr><td colspan="7" class="empty-state">Carregando produtos...</td></tr>';
    supabase.from('produtos').select('*').order('nome',{ascending:true}).then(function(res){
        if(res.error){ tbody.innerHTML='<tr><td colspan="7" class="empty-state">Erro ao carregar produtos.</td></tr>'; showToast('&#9888; '+res.error.message); return; }
        var produtos=res.data||[];
        var html='';
        produtos.forEach(function(p){
            var stock=parseInt(p.estoque)||0;
            var statusBadge=stock>20?'badge-green':stock>5?'badge-yellow':'badge-red';
            var statusText=stock>20?'OK':stock>5?'Últimas!!':'Crítico';
            var imgHtml=p.imagem_url?'<img src="'+escAttr(p.imagem_url)+'" class="tbl-img-preview">':'<span style="font-size:.64rem;color:var(--text-muted);">sem img</span>';
            html+='<tr data-id="'+p.id+'" data-name="'+escAttr(p.nome)+'">'+
                '<td><input class="tbl-input" value="'+escAttr(p.nome)+'" data-field="nome" style="min-width:140px;"></td>'+
                '<td><select class="tbl-input" data-field="categoria" style="min-width:110px;">'+
                    catOptions().map(function(c){return '<option value="'+c+'"'+(p.categoria===c?' selected':'')+'>'+c+'</option>'}).join('')+
                '</select></td>'+
                '<td><input class="tbl-input" value="'+formatPrice(p.preco)+'" data-field="preco" style="width:90px;"></td>'+
                '<td><input class="tbl-input" type="number" value="'+stock+'" data-field="estoque" min="0" style="width:65px;"></td>'+
                '<td><div class="flex-row" style="gap:6px;">'+imgHtml+'<label class="tbl-img-upload" title="Alterar imagem"><input type="file" accept="image/*" style="display:none;" onchange="uploadTblImg(this,\''+p.id+'\')">&#128247;</label></div></td>'+
                '<td><span class="badge '+statusBadge+'">'+statusText+'</span></td>'+
                '<td><button class="btn-icon danger" onclick="deleteProduct(\''+p.id+'\')" title="Remover">&#128465;</button></td>'+
            '</tr>';
        });
        tbody.innerHTML=html||'<tr><td colspan="7" class="empty-state">Nenhum produto cadastrado.</td></tr>';
        bindStockEdits(tbody);
        renderDashboard();
    });
}

function bindStockEdits(tbody){
    tbody.querySelectorAll('.tbl-input').forEach(function(inp){
        inp.addEventListener('change',function(){
            var row=inp.closest('tr'),id=row.getAttribute('data-id');
            var field=inp.getAttribute('data-field'),val=inp.value.trim();
            if(!id)return;
            var update={};
            if(field==='nome'){ if(!val)return; update.nome=val; }
            else if(field==='categoria'){ update.categoria=val; }
            else if(field==='preco'){ update.preco=parsePrice(val); }
            else if(field==='estoque'){ update.estoque=parseInt(val)||0; }
            else return;
            supabase.from('produtos').update(update).eq('id',id).then(function(res){
                if(res.error){ showToast('&#9888; '+res.error.message); return; }
                showToast('&#9989; Alteração salva!');
                if(field==='estoque')renderStock();
            });
        });
    });
}

window.uploadTblImg=function(input,id){
    var file=input.files[0];if(!file)return;
    uploadImagesToStorage([file]).then(function(urls){
        var url = urls[0] || null;
        return supabase.from('produtos').update({imagem_url:url}).eq('id',id);
    }).then(function(res){
        if(res.error){ showToast('&#9888; '+res.error.message); return; }
        showToast('&#128247; Imagem atualizada!');
        renderStock();
    }).catch(function(err){ showToast('&#9888; '+(err.message||err)); });
};

window.deleteProduct=function(id){
    if(!confirm('Remover produto permanentemente?'))return;
    supabase.from('produtos').select('imagem_url,imagens').eq('id',id).single().then(function(res){
        if(res.data){
            var urls = [];
            if(res.data.imagem_url) urls.push(res.data.imagem_url);
            if(Array.isArray(res.data.imagens)) urls = urls.concat(res.data.imagens);
            urls.forEach(function(u){ deleteImageByUrl(u); });
        }
        return supabase.from('produtos').delete().eq('id',id);
    }).then(function(res){
        if(res.error){ showToast('&#9888; '+res.error.message); return; }
        showToast('&#128465; Produto removido.');
        renderStock();
    });
};

document.getElementById('btnAddProduct').addEventListener('click',function(){
    var name=document.getElementById('prodName').value.trim();
    var cat=document.getElementById('prodCat').value;
    var price=document.getElementById('prodPrice').value.trim();
    var stock=parseInt(document.getElementById('prodStock').value)||0;
    var desc=document.getElementById('prodDesc').value.trim();
    var longDesc=document.getElementById('prodLongDesc').value.trim();
    var installments=parseInt(document.getElementById('prodInstallments').value)||10;
    var msg=document.getElementById('prodAddMsg');
    if(!name){msg.textContent='Informe o nome.';msg.style.color='var(--danger)';return}
    if(!price){msg.textContent='Informe o preço.';msg.style.color='var(--danger)';return}
    msg.textContent='Salvando...';msg.style.color='var(--text-muted)';
    uploadImagesToStorage(prodImgFiles).then(function(urls){
        var primary = urls[0] || null;
        var rest = urls.slice(1);
        return supabase.from('produtos').insert([{
            nome:name,
            categoria:cat,
            preco:parsePrice(price),
            estoque:stock,
            descricao_curta:desc||name,
            imagem_url:primary,
            imagens: rest.length ? rest : null
        }]);
    }).then(function(res){
        if(res.error){
            msg.textContent='Erro ao salvar.';msg.style.color='var(--danger)';
            showToast('&#9888; '+res.error.message);
            return;
        }
        showToast('&#9989; "'+name+'" adicionado!');
        renderStock();
        ['prodName','prodPrice','prodDesc','prodLongDesc'].forEach(function(id){document.getElementById(id).value=''});
        document.getElementById('prodImgFile').value='';
        prodImgFiles = [];
        renderProdImgThumbs();
        document.getElementById('prodStock').value='10';
        msg.textContent='Adicionado com sucesso!';msg.style.color='var(--success)';
        setTimeout(function(){msg.textContent=''},3000);
    }).catch(function(err){ msg.textContent='Erro ao salvar.';msg.style.color='var(--danger)'; showToast('&#9888; '+(err.message||err)); });
});

/* === CATEGORIES === */
function getCategories(){
    var cats=load(CATEGORIES_KEY,[]);
    if(!cats.length){cats=defaultCategories();save(CATEGORIES_KEY,cats)}
    return cats;
}
function catOptions(){return getCategories()}
function updateCatSelects(){
    var cats=getCategories();
    document.querySelectorAll('#prodCat, select[data-field="categoria"]').forEach(function(sel){
        var cur=sel.value;
        sel.innerHTML=cats.map(function(c){return '<option value="'+c+'">'+c+'</option>'}).join('');
        if(cats.indexOf(cur)>=0)sel.value=cur;
    });
}
function renderCategories(){
    var cats=getCategories();
    var html='';
    cats.forEach(function(c,i){
        html+='<div style="background:var(--bg-input);border:1px solid var(--border);border-radius:6px;padding:4px 10px;display:flex;align-items:center;gap:8px;">'+
            '<input class="tbl-input" value="'+c+'" data-idx="'+i+'" data-cat-orig="'+c+'" style="font-size:.8rem;width:140px;padding:3px 6px;" onchange="editCat(this)">'+
            '<button class="btn-icon danger" onclick="removeCat('+i+')" title="Remover" style="font-size:.8rem;">&#128465;</button>'+
        '</div>';
    });
    document.getElementById('catList').innerHTML=html||'<span style="font-size:.78rem;color:var(--text-muted);">Nenhuma categoria.</span>';
    updateCatSelects();
}
document.getElementById('btnAddCat').addEventListener('click',function(){
    var input=document.getElementById('catInput');
    var name=input.value.trim().toLowerCase().replace(/\s+/g,'-');
    if(!name)return;
    var cats=getCategories();
    if(cats.indexOf(name)>=0){showToast('&#9888; Categoria já existe.');return}
    cats.push(name);
    save(CATEGORIES_KEY,cats);
    input.value='';
    renderCategories();
    renderStock();
    showToast('&#9989; Categoria "'+name+'" adicionada!');
});
document.getElementById('catInput').addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('btnAddCat').click()});
window.editCat=function(el){
    var idx=parseInt(el.getAttribute('data-idx'));
    var orig=el.getAttribute('data-cat-orig');
    var val=el.value.trim().toLowerCase().replace(/\s+/g,'-');
    if(!val||val===orig)return;
    var cats=getCategories();
    if(cats.indexOf(val)>=0&&val!==orig){showToast('&#9888; Categoria já existe.');el.value=orig;return}
    cats[idx]=val;
    save(CATEGORIES_KEY,cats);
    el.setAttribute('data-cat-orig',val);
    renderCategories();
    showToast('&#9989; Categoria renomeada: "'+orig+'" → "'+val+'"');
};
window.removeCat=function(i){
    var cats=getCategories();
    if(cats.length<=1){showToast('&#9888; Precisa de ao menos 1 categoria.');return}
    if(!confirm('Remover categoria "'+cats[i]+'"? Produtos com esta categoria serão afetados.'))return;
    cats.splice(i,1);
    save(CATEGORIES_KEY,cats);
    renderCategories();
    renderStock();
    showToast('&#128465; Categoria removida.');
};

/* === ANÚNCIOS === */
var anunciosTemp=null;
function renderAnuncios(){
    var list=document.getElementById('anunciosList'),html='';
    if(!anunciosTemp||!anunciosTemp.length){anunciosTemp=load(ANUNCIOS_KEY,[]);if(!anunciosTemp.length){anunciosTemp=[{name:'Anúncio 1',data:''},{name:'Anúncio 2',data:''},{name:'Anúncio 3',data:''},{name:'Anúncio 4',data:''}]}}
    anunciosTemp.forEach(function(a,idx){
        var imgTag=a.data?'<img src="'+a.data+'">':'<div style="width:100px;height:80px;background:var(--bg-input);border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:.7rem;">Sem imagem</div>';
        html+='<div class="anuncio-card" data-idx="'+idx+'">'+
            imgTag+
            '<div class="info">'+
                '<input class="tbl-input" value="'+(a.name||'')+'" placeholder="Nome do anúncio" data-idx="'+idx+'" data-field="name" style="margin-bottom:4px;">'+
                '<div class="actions">'+
                    '<label class="tbl-img-upload" style="cursor:pointer;"><input type="file" accept="image/*" style="display:none;" onchange="uploadAnuncioImg(this,'+idx+')">&#128247; Trocar Imagem</label>'+
                    '<button class="btn btn-outline btn-sm" onclick="removeAnuncio('+idx+')">&#128465; Remover</button>'+
                '</div>'+
            '</div>'+
        '</div>';
    });
    list.innerHTML=html||'<div class="empty-state">Nenhum anúncio.</div>';

    list.querySelectorAll('.tbl-input').forEach(function(inp){
        inp.addEventListener('change',function(){
            var idx=parseInt(inp.getAttribute('data-idx'));
            if(anunciosTemp[idx])anunciosTemp[idx].name=inp.value.trim();
        });
    });
}

window.uploadAnuncioImg=function(input,idx){
    var file=input.files[0];if(!file)return;
    var reader=new FileReader();
    reader.onload=function(ev){
        if(anunciosTemp[idx])anunciosTemp[idx].data=ev.target.result;
        showToast('&#128247; Imagem carregada!');
        renderAnuncios();
    };
    reader.readAsDataURL(file);
};

window.removeAnuncio=function(idx){
    if(!confirm('Remover este anúncio?'))return;
    anunciosTemp.splice(idx,1);
    renderAnuncios();
    showToast('&#128465; Anúncio removido. Salve para confirmar.');
};

document.getElementById('btnAddAnuncio').addEventListener('click',function(){
    anunciosTemp.push({name:'Novo Anúncio',data:''});
    renderAnuncios();
    showToast('&#10133; Novo slot adicionado.');
});

document.getElementById('btnSaveAnuncios').addEventListener('click',function(){
    anunciosTemp.forEach(function(a){if(!a.name)a.name='Anúncio'});
    save(ANUNCIOS_KEY,anunciosTemp);
    document.getElementById('anuncioMsg').textContent='Salvos! Recarregue o site.';document.getElementById('anuncioMsg').style.color='var(--success)';
    showToast('&#9989; Anúncios salvos!');
});

/* === BANNERS === */
function loadBannerForm(){
    var b=load(BANNER_KEY,defaultBanner());
    ['bannerTitle','bannerSubtitle','bannerBgUrl','bannerBgColor','bannerBtnText'].forEach(function(id){document.getElementById(id).value=b[id.replace('banner','').replace(/([A-Z])/g,'-$1').toLowerCase().replace(/^-/,'')]||''});
    document.getElementById('bannerTitle').value=b.title||'';
    document.getElementById('bannerSubtitle').value=b.subtitle||'';
    document.getElementById('bannerBgUrl').value=b.bgUrl||'';
    document.getElementById('bannerBgColor').value=b.bgColor||'';
    document.getElementById('bannerBtnText').value=b.btnText||'';
}

document.getElementById('btnSaveBanner').addEventListener('click',function(){
    save(BANNER_KEY,{title:document.getElementById('bannerTitle').value,title2:'',subtitle:document.getElementById('bannerSubtitle').value,bgUrl:document.getElementById('bannerBgUrl').value,bgColor:document.getElementById('bannerBgColor').value,btnText:document.getElementById('bannerBtnText').value});
    document.getElementById('bannerMsg').textContent='Salvo!';document.getElementById('bannerMsg').style.color='var(--success)';
    showToast('&#9989; Banner salvo!');
});
document.getElementById('btnResetBanner').addEventListener('click',function(){save(BANNER_KEY,defaultBanner());loadBannerForm();showToast('&#8635; Restaurado ao padrão.')});

/* === CONFIG === */
function loadConfigForm(){
    var c=load(CONFIG_KEY,defaultConfig());
    ['cfgCompany','cfgBrand','cfgCNPJ','cfgPhone','cfgEmail','cfgHours','cfgAddress','cfgCEP','cfgCityState'].forEach(function(id){document.getElementById(id).value=''});
    document.getElementById('cfgCompany').value=c.company||'';
    document.getElementById('cfgBrand').value=c.brand||'';
    document.getElementById('cfgCNPJ').value=c.cnpj||'';
    document.getElementById('cfgPhone').value=c.phone||'';
    document.getElementById('cfgEmail').value=c.email||'';
    document.getElementById('cfgHours').value=c.hours||'';
    document.getElementById('cfgAddress').value=c.address||'';
    document.getElementById('cfgCEP').value=c.cep||'';
    document.getElementById('cfgCityState').value=c.cityState||'';
}
document.getElementById('btnSaveConfig').addEventListener('click',function(){
    save(CONFIG_KEY,{company:document.getElementById('cfgCompany').value,brand:document.getElementById('cfgBrand').value,cnpj:document.getElementById('cfgCNPJ').value,phone:document.getElementById('cfgPhone').value,email:document.getElementById('cfgEmail').value,hours:document.getElementById('cfgHours').value,address:document.getElementById('cfgAddress').value,cep:document.getElementById('cfgCEP').value,cityState:document.getElementById('cfgCityState').value});
    document.getElementById('configMsg').textContent='Salvo!';document.getElementById('configMsg').style.color='var(--success)';
    showToast('&#9989; Configurações salvas!');
});

/* === USERS === */
function renderUsers(){
    var users=load(USERS_KEY,[]),html='';
    users.forEach(function(u,i){
        var roleBadge=u.role==='admin'?'<span class="badge badge-green">Admin</span>':'<span class="badge" style="background:rgba(59,130,246,.15);color:var(--accent);">Usuário</span>';
        html+='<tr><td>'+u.name+'</td><td>'+u.email+'</td><td>'+roleBadge+'</td>'+
            '<td><div class="flex-row" style="gap:4px;">'+
                '<button class="btn btn-outline btn-sm" onclick="editUser('+i+')" title="Editar">&#9998;</button>'+
                '<button class="btn btn-outline btn-sm" onclick="showResetPass('+i+')" title="Resetar senha">&#128274;</button>'+
                '<button class="btn btn-danger btn-sm" onclick="deleteUser('+i+')" title="Remover">&#128465;</button>'+
            '</div></td></tr>';
    });
    document.getElementById('usersBody').innerHTML=html||'<tr><td colspan="4" class="empty-state">Nenhum.</td></tr>';
    renderDashboard();
}

window.editUser=function(i){
    var users=load(USERS_KEY,[]);
    if(!users[i])return;
    document.getElementById('userFormTitle').textContent='&#9998; Editar Usuário';
    document.getElementById('userFormName').value=users[i].name||'';
    document.getElementById('userFormEmail').value=users[i].email||'';
    document.getElementById('userFormPass').value='';
    document.getElementById('userFormPass').placeholder='Deixe vazio para manter';
    document.getElementById('userFormRole').value=users[i].role||'user';
    document.getElementById('userFormIdx').value=i;
    document.getElementById('userFormCard').style.display='block';
};

window.showResetPass=function(i){
    var users=load(USERS_KEY,[]);
    if(!users[i])return;
    document.getElementById('resetPassUser').textContent=users[i].name+' ('+users[i].email+')';
    document.getElementById('resetPassIdx').value=i;
    document.getElementById('resetNewPass').value='';
    document.getElementById('resetNewPass2').value='';
    document.getElementById('userFormCard').style.display='none';
    document.getElementById('resetPassCard').style.display='block';
};

document.getElementById('btnShowAddUser').addEventListener('click',function(){
    document.getElementById('userFormTitle').textContent='&#10133; Adicionar Usuário';
    document.getElementById('userFormName').value='';
    document.getElementById('userFormEmail').value='';
    document.getElementById('userFormPass').value='';
    document.getElementById('userFormPass').placeholder='Mínimo 4 caracteres';
    document.getElementById('userFormRole').value='user';
    document.getElementById('userFormIdx').value='-1';
    document.getElementById('userFormCard').style.display='block';
    document.getElementById('resetPassCard').style.display='none';
});

document.getElementById('btnCancelUser').addEventListener('click',function(){
    document.getElementById('userFormCard').style.display='none';
});
document.getElementById('btnCancelReset').addEventListener('click',function(){
    document.getElementById('resetPassCard').style.display='none';
});

document.getElementById('btnSaveUser').addEventListener('click',function(){
    var name=document.getElementById('userFormName').value.trim();
    var email=document.getElementById('userFormEmail').value.trim();
    var pass=document.getElementById('userFormPass').value;
    var role=document.getElementById('userFormRole').value;
    var idx=parseInt(document.getElementById('userFormIdx').value);
    if(!name||!email){showToast('&#9888; Nome e e-mail são obrigatórios.');return}
    var users=load(USERS_KEY,[]);

    function persist(hashedPass){
        if(idx>=0){
            if(users[idx].email==='admin'&&email!=='admin'){showToast('&#9888; Não pode mudar o e-mail do admin.');return}
            users[idx].name=name;
            if(email!==users[idx].email){
                if(users.find(function(u,i){return i!==idx&&u.email===email})){showToast('&#9888; E-mail já cadastrado.');return}
                users[idx].email=email;
            }
            if(hashedPass)users[idx].pass=hashedPass;
            if(users[idx].email==='admin')users[idx].role='admin';
            else users[idx].role=role;
            save(USERS_KEY,users);
            showToast('&#9989; Usuário "'+name+'" atualizado!');
        }else{
            if(users.find(function(u){return u.email===email})){showToast('&#9888; E-mail já cadastrado.');return}
            users.push({name:name,email:email,pass:hashedPass,role:role});
            save(USERS_KEY,users);
            showToast('&#9989; Usuário "'+name+'" adicionado!');
        }
        document.getElementById('userFormCard').style.display='none';
        renderUsers();
    }

    if(idx>=0){
        if(pass&&pass.length<4){showToast('&#9888; Senha mínima: 4 caracteres.');return}
        if(pass){sha256(pass).then(function(h){persist(h)});}
        else{persist(null);}
    }else{
        if(!pass||pass.length<4){showToast('&#9888; Senha mínima: 4 caracteres.');return}
        sha256(pass).then(function(h){persist(h)});
    }
});

document.getElementById('btnConfirmReset').addEventListener('click',function(){
    var idx=parseInt(document.getElementById('resetPassIdx').value);
    var p1=document.getElementById('resetNewPass').value;
    var p2=document.getElementById('resetNewPass2').value;
    if(!p1||p1.length<4){showToast('&#9888; Senha mínima: 4 caracteres.');return}
    if(p1!==p2){showToast('&#9888; Senhas não conferem.');return}
    var users=load(USERS_KEY,[]);
    if(!users[idx])return;
    sha256(p1).then(function(hash){
        users[idx].pass=hash;
        save(USERS_KEY,users);
        showToast('&#9989; Senha de "'+users[idx].name+'" redefinida!');
        document.getElementById('resetPassCard').style.display='none';
    });
});

window.deleteUser=function(i){
    var users=load(USERS_KEY,[]);
    if(users[i]&&users[i].email==='admin'){showToast('&#9888; Não pode remover admin.');return}
    if(!confirm('Remover usuário "'+users[i].name+'"?'))return;
    users.splice(i,1);save(USERS_KEY,users);renderUsers();showToast('&#9989; Removido.');
};

/* === PEDIDOS === */
var pedidosFilterAtual = 'todos';

function renderPedidos(){
    var pedidos = load(PEDIDOS_KEY, []);
    var tbody = document.getElementById('pedidosBody');
    var html = '';

    pedidos.sort(function(a, b){ return b.timestamp - a.timestamp; });

    pedidos.forEach(function(p, i){
        if(pedidosFilterAtual !== 'todos' && p.status !== pedidosFilterAtual) return;

        var statusClass = p.status === 'entregue' ? 'badge-green' : p.status === 'cancelado' ? 'badge-red' : 'badge-yellow';
        var statusText = p.status.charAt(0).toUpperCase() + p.status.slice(1);
        var entrega = p.dataEntrega || '—';

        var pagLabel = p.pagamento === 'card' ? 'Cartão' : p.pagamento === 'pix' ? 'PIX' : 'Boleto';

        html += '<tr>' +
            '<td><strong>' + p.id + '</strong></td>' +
            '<td>' + (p.cliente || p.name || '—') + '</td>' +
            '<td>' + p.data + '</td>' +
            '<td>R$ ' + parseFloat(p.total).toFixed(2).replace('.', ',') + '</td>' +
            '<td>' + pagLabel + '</td>' +
            '<td><span class="badge ' + statusClass + '">' + statusText + '</span></td>' +
            '<td>' + entrega + '</td>' +
            '<td>' +
                '<div class="flex-row" style="gap:6px;flex-wrap:nowrap;">' +
                    '<select class="tbl-input" onchange="alterarStatusPedido(' + i + ', this.value)" style="width:100px;">' +
                        '<option value="pendente"' + (p.status === 'pendente' ? ' selected' : '') + '>Pendente</option>' +
                        '<option value="entregue"' + (p.status === 'entregue' ? ' selected' : '') + '>Entregue</option>' +
                        '<option value="cancelado"' + (p.status === 'cancelado' ? ' selected' : '') + '>Cancelado</option>' +
                    '</select>' +
                    '<button class="btn btn-outline btn-sm" onclick="verDetalhesPedido(\'' + (p.id || '') + '\')" title="Ver detalhes">&#128065;</button>' +
                '</div>' +
            '</td>' +
        '</tr>';
    });

    tbody.innerHTML = html || '<tr><td colspan="8" class="empty-state">Nenhum pedido encontrado.</td></tr>';
    renderDashboard();
}
window.renderPedidos = renderPedidos;

window.alterarStatusPedido = function(idx, novoStatus){
    var pedidos = load(PEDIDOS_KEY, []);
    if(!pedidos[idx]) return;
    pedidos[idx].status = novoStatus;
    if(novoStatus === 'entregue'){
        pedidos[idx].dataEntrega = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
    } else {
        pedidos[idx].dataEntrega = '';
    }
    save(PEDIDOS_KEY, pedidos);
    renderPedidos();
    showToast('&#9989; Pedido ' + pedidos[idx].id + ' atualizado para "' + novoStatus + '"');
};

document.querySelectorAll('.filter-pedido').forEach(function(btn){
    btn.addEventListener('click', function(){
        document.querySelectorAll('.filter-pedido').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        pedidosFilterAtual = btn.getAttribute('data-filter');
        renderPedidos();
    });
});

/* === DASHBOARD (métricas) === */
function renderDashboard(){
    var pedidos = load(PEDIDOS_KEY, []);
    var users = load(USERS_KEY, []);
    var vendas = 0, pendentes = 0;
    pedidos.forEach(function(p){
        if(p.status !== 'cancelado') vendas += parseFloat(p.total) || 0;
        if(p.status === 'pendente') pendentes++;
    });
    document.getElementById('metricVendas').textContent = 'R$ ' + vendas.toFixed(2).replace('.', ',');
    document.getElementById('metricPendentes').textContent = pendentes;
    document.getElementById('metricUsuarios').textContent = users.length;
    document.getElementById('metricAlertas').textContent = '...';
    supabase.from('produtos').select('estoque').then(function(res){
        var alertas = 0;
        (res.data||[]).forEach(function(p){ if((parseInt(p.estoque)||0) <= 5) alertas++; });
        if(!res.error) document.getElementById('metricAlertas').textContent = alertas;
    });
    renderPedidosPendentes();
}

/* === ÚLTIMOS PEDIDOS PENDENTES (mini-tabela) === */
function renderPedidosPendentes(){
    var tbody = document.getElementById('pedidosPendentesBody');
    if(!tbody) return;
    var pedidos = load(PEDIDOS_KEY, []);
    var pendentes = pedidos
        .filter(function(p){ return p.status === 'pendente'; })
        .sort(function(a,b){ return (b.timestamp || 0) - (a.timestamp || 0); })
        .slice(0, 5);

    // dados fictícios temporários (apenas visual) quando não há pedidos pendentes
    if(pendentes.length === 0){
        pendentes = [
            { id: 'BF-DEMO01', cliente: 'Maria Oliveira', total: 1149.00 },
            { id: 'BF-DEMO02', cliente: 'João Pereira', total: 479.00 }
        ];
    }

    var html = '';
    pendentes.forEach(function(p){
        html += '<tr>' +
            '<td><strong>' + p.id + '</strong></td>' +
            '<td>' + (p.cliente || '—') + '</td>' +
            '<td>R$ ' + (parseFloat(p.total) || 0).toFixed(2).replace('.', ',') + '</td>' +
            '<td><button class="btn btn-outline btn-sm" onclick="verDetalhesPedido(\'' + (p.id || '') + '\')" title="Ver detalhes">&#128065;</button></td>' +
        '</tr>';
    });
    tbody.innerHTML = html;
}

/* === GRÁFICOS (Chart.js) === */
var _vendasChart = null;
var _statusChart = null;
function initCharts(){
    if(typeof Chart === 'undefined') return;
    var canvasVendas = document.getElementById('chartVendas');
    var canvasStatus = document.getElementById('chartStatus');
    if(!canvasVendas || !canvasStatus) return;

    if(!_vendasChart){
        var labels = [];
        for(var i = 6; i >= 0; i--){
            var d = new Date();
            d.setDate(d.getDate() - i);
            labels.push(d.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'}));
        }
        var ctx = canvasVendas.getContext('2d');
        var grad = ctx.createLinearGradient(0, 0, 0, 240);
        grad.addColorStop(0, 'rgba(59,130,246,0.35)');
        grad.addColorStop(1, 'rgba(59,130,246,0)');
        _vendasChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Vendas (R$)',
                    data: [1200, 1900, 1500, 2400, 2100, 3000, 2800],
                    borderColor: '#3b82f6',
                    backgroundColor: grad,
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2.5,
                    pointBackgroundColor: '#60a5fa',
                    pointBorderColor: '#0f172a',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#94a3b8', boxWidth: 12 } } },
                scales: {
                    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(51,65,85,0.4)' } },
                    y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(51,65,85,0.4)' } }
                }
            }
        });
    }

    if(!_statusChart){
        var pedidos = load(PEDIDOS_KEY, []);
        var counts = { pendente: 0, entregue: 0, cancelado: 0 };
        pedidos.forEach(function(p){ if(counts[p.status] !== undefined) counts[p.status]++; });
        var ctx2 = canvasStatus.getContext('2d');
        _statusChart = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Pendentes', 'Entregues', 'Cancelados'],
                datasets: [{
                    data: [counts.pendente, counts.entregue, counts.cancelado],
                    backgroundColor: ['#f59e0b', '#22c55e', '#ef4444'],
                    borderColor: '#1e293b',
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 12 } } }
            }
        });
    }
}

/* === PESQUISA NAS TABELAS (filtro em tempo real) === */
function bindTableSearch(inputId, tbodyId){
    var input = document.getElementById(inputId);
    var tbody = document.getElementById(tbodyId);
    if(!input || !tbody) return;
    input.addEventListener('keyup', function(){
        var term = this.value.trim().toLowerCase();
        tbody.querySelectorAll('tr').forEach(function(row){
            if(row.querySelector('.empty-state')) return;
            var text = row.textContent.toLowerCase();
            row.style.display = (text.indexOf(term) !== -1) ? '' : 'none';
        });
    });
}
bindTableSearch('searchStock', 'stockBody');
bindTableSearch('searchPedidos', 'pedidosBody');

/* === EXPORTAÇÃO CSV === */
function csvCell(v){
    var s = String(v == null ? '' : v);
    if(/[";\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
}
function downloadCSV(filename, header, rows){
    var lines = [header.map(csvCell).join(';')];
    rows.forEach(function(r){ lines.push(r.map(csvCell).join(';')); });
    var blob = new Blob(['\uFEFF' + lines.join('\r\n')], {type:'text/csv;charset=utf-8;'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
}

function exportStockCSV(){
    supabase.from('produtos').select('*').order('nome',{ascending:true}).then(function(res){
        if(res.error){ showToast('&#9888; '+res.error.message); return; }
        var produtos=res.data||[];
        var term = (document.getElementById('searchStock').value || '').trim().toLowerCase();
        var header = ['Nome','Categoria','Preço','Estoque','Status'];
        var rows = [];
        produtos.forEach(function(p){
            var stock=parseInt(p.estoque)||0;
            var status = stock > 20 ? 'OK' : stock > 5 ? 'Últimas unidades' : 'Crítico';
            var hay = (p.nome + ' ' + (p.categoria || '') + ' ' + formatPrice(p.preco) + ' ' + stock).toLowerCase();
            if(term && hay.indexOf(term) === -1) return;
            rows.push([p.nome, p.categoria || '', formatPrice(p.preco), stock, status]);
        });
        if(!rows.length){ showToast('&#9888; Nenhum produto para exportar.'); return; }
        downloadCSV('estoque.csv', header, rows);
        showToast('&#128190; Estoque exportado em CSV!');
    });
}

function exportPedidosCSV(){
    var pedidos = load(PEDIDOS_KEY, []).slice().sort(function(a,b){ return b.timestamp - a.timestamp; });
    var term = (document.getElementById('searchPedidos').value || '').trim().toLowerCase();
    var header = ['Pedido','Cliente','Data','Total','Pagamento','Status','Entrega'];
    var rows = [];
    pedidos.forEach(function(p){
        if(pedidosFilterAtual !== 'todos' && p.status !== pedidosFilterAtual) return;
        var pagLabel = p.pagamento === 'card' ? 'Cartão' : p.pagamento === 'pix' ? 'PIX' : 'Boleto';
        var statusText = p.status.charAt(0).toUpperCase() + p.status.slice(1);
        var hay = (p.id + ' ' + (p.cliente || '') + ' ' + statusText).toLowerCase();
        if(term && hay.indexOf(term) === -1) return;
        rows.push([p.id, p.cliente || '—', p.data, 'R$ ' + (parseFloat(p.total)||0).toFixed(2).replace('.',','), pagLabel, statusText, p.dataEntrega || '—']);
    });
    if(!rows.length){ showToast('&#9888; Nenhum pedido para exportar.'); return; }
    downloadCSV('pedidos.csv', header, rows);
    showToast('&#128190; Pedidos exportados em CSV!');
}

document.getElementById('btnExportStock').addEventListener('click', exportStockCSV);
document.getElementById('btnExportPedidos').addEventListener('click', exportPedidosCSV);

/* === DETALHES DO PEDIDO (modal) === */
window.verDetalhesPedido = function(id){
    var pedidos = load(PEDIDOS_KEY, []);
    var p = null;
    pedidos.forEach(function(o){ if(o.id === id) p = o; });
    if(!p) return;

    var pagLabel = p.pagamento === 'card' ? 'Cartão' : p.pagamento === 'pix' ? 'PIX' : 'Boleto';
    var itensHtml = '';
    (p.itens || []).forEach(function(item){
        itensHtml += '<tr><td>' + item.titulo + '</td><td class="qtd">' + item.qtd + '</td><td class="num">' + item.preco + '</td></tr>';
    });

    var html = '';
    html += '<div class="detail-row"><span class="lbl">Pedido</span><span>' + p.id + '</span></div>';
    html += '<div class="detail-row"><span class="lbl">Data</span><span>' + p.data + '</span></div>';
    html += '<div class="detail-row"><span class="lbl">Pagamento</span><span>' + pagLabel + '</span></div>';
    html += '<div class="detail-row"><span class="lbl">Total</span><span>R$ ' + (parseFloat(p.total) || 0).toFixed(2).replace('.', ',') + '</span></div>';
    html += '<div class="detail-row"><span class="lbl">Cliente</span><span>' + (p.cliente || '—') + '</span></div>';
    html += '<div class="detail-row"><span class="lbl">E-mail</span><span>' + (p.email || '—') + '</span></div>';
    html += '<div class="detail-row"><span class="lbl">Telefone</span><span>' + (p.phone || '—') + '</span></div>';
    html += '<div class="detail-row" style="align-items:flex-start;"><span class="lbl">Endereço</span><span style="max-width:60%;">' + (p.endereco || '—') + '</span></div>';
    html += '<h4 class="detail-sub">Itens do Pedido</h4>';
    html += '<table class="detail-table"><thead><tr><th>Produto</th><th style="width:50px;text-align:center;">Qtd</th><th style="width:90px;text-align:right;">Preço</th></tr></thead><tbody>' +
        (itensHtml || '<tr><td colspan="3" class="empty-state">Sem itens.</td></tr>') +
    '</tbody></table>';

    document.getElementById('pedidoDetalhesBody').innerHTML = html;
    document.getElementById('pedidoDetalhesModal').style.display = 'flex';

    // botão de WhatsApp com mensagem pré-preenchida
    var btnWpp = document.getElementById('btnWhatsPedido');
    if(btnWpp){
        var digits = (p.phone || '').replace(/\D/g, '');
        if(digits.length >= 10){
            if(digits.length <= 11) digits = '55' + digits;
            var msg = 'Olá ' + (p.cliente || 'cliente') + '! Aqui é da B&F Importes, referente ao seu pedido ' + p.id + '.';
            btnWpp.href = 'https://wa.me/' + digits + '?text=' + encodeURIComponent(msg);
            btnWpp.style.display = 'inline-flex';
        } else {
            btnWpp.style.display = 'none';
        }
    }
};

function closePedidoDetalhes(){
    document.getElementById('pedidoDetalhesModal').style.display = 'none';
}
document.getElementById('closePedidoDetalhes').addEventListener('click', closePedidoDetalhes);
document.getElementById('pedidoDetalhesModal').addEventListener('click', function(e){
    if(e.target === this) closePedidoDetalhes();
});
document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closePedidoDetalhes();
});

/* === TOGGLE DO FORMULÁRIO DE PRODUTO === */
document.getElementById('btnToggleProductForm').addEventListener('click', function(){
    var card = document.getElementById('productFormCard');
    var showing = card.style.display !== 'none';
    card.style.display = showing ? 'none' : 'block';
    this.innerHTML = showing ? '&#10133; Novo Produto' : '&#10005; Fechar Formulário';
    if(!showing){
        card.scrollIntoView({behavior:'smooth'});
        document.getElementById('prodName').focus();
    }
});

/* === PREVIEW === */
function refreshPreview(){
    var f = document.getElementById('previewFrame');
    if(f) f.src = '../index.html?t=' + Date.now();
}
document.getElementById('btnRefreshPreview').addEventListener('click', refreshPreview);

/* ── JANELA FLUTUANTE: abrir/fechar, modo mobile/desktop e arrastar ── */
var _previewPanel = document.getElementById('previewPanel');
var _previewHeader = _previewPanel.querySelector('.preview-header');

function openPreview(){
    if(!_previewPanel) return;
    _previewPanel.classList.add('open');
    refreshPreview();
}
function closePreview(){
    if(!_previewPanel) return;
    _previewPanel.classList.remove('open');
}
document.getElementById('previewFab').addEventListener('click', openPreview);
document.getElementById('previewClose').addEventListener('click', closePreview);

/* alterna Mobile (375px) / Desktop (1000px) */
function setPreviewMode(mode){
    var mobile = (mode === 'mobile');
    if(_previewPanel) _previewPanel.classList.toggle('mode-mobile', mobile);
    document.getElementById('previewMobile').classList.toggle('active', mobile);
    document.getElementById('previewDesktop').classList.toggle('active', !mobile);
}
document.getElementById('previewMobile').addEventListener('click', function(){ setPreviewMode('mobile'); });
document.getElementById('previewDesktop').addEventListener('click', function(){ setPreviewMode('desktop'); });

/* arrastar a janela pelo cabeçalho */
var _drag = null;
_previewHeader.addEventListener('mousedown', function(e){
    if(e.target.closest('button')) return;
    var rect = _previewPanel.getBoundingClientRect();
    _drag = { offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
    _previewPanel.style.right = 'auto';
    _previewPanel.style.left = rect.left + 'px';
    _previewPanel.style.top = rect.top + 'px';
    _previewHeader.classList.add('grabbing');
    e.preventDefault();
});
document.addEventListener('mousemove', function(e){
    if(!_drag) return;
    _previewPanel.style.left = (e.clientX - _drag.offsetX) + 'px';
    _previewPanel.style.top = (e.clientY - _drag.offsetY) + 'px';
});
document.addEventListener('mouseup', function(){
    _drag = null;
    if(_previewHeader) _previewHeader.classList.remove('grabbing');
});
var _saveIds = ['btnSaveBanner','btnSaveAnuncios','btnSaveConfig','btnAddProduct','btnSaveUser','btnConfirmReset','btnAddCat'];
_saveIds.forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.addEventListener('click', function(){ setTimeout(refreshPreview, 300); });
});
/* updateStock with refresh */
window.updateStock = function(el){
    var id = el.getAttribute('data-id');
    var val = parseInt(el.value) || 0;
    supabase.from('produtos').update({estoque: val}).eq('id', id).then(function(res){
        if(res.error){ showToast('&#9888; '+res.error.message); return; }
        showToast('&#9989; Estoque atualizado para ' + val + ' un.');
        setTimeout(renderStock, 300);
        setTimeout(refreshPreview, 500);
    });
};

})();
