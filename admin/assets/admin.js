(function(){
var USERS_KEY='bf_users', STOCK_KEY='bf_stock', BANNER_KEY='bf_banner', ANUNCIOS_KEY='bf_anuncios', CONFIG_KEY='bf_config', ADMIN_KEY='bf_admin_session', CATEGORIES_KEY='bf_categories', PEDIDOS_KEY='bf_orders';

function load(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback}catch(e){return fallback||{}}}
function save(key,obj){localStorage.setItem(key,JSON.stringify(obj))}

function showToast(msg){
    var c=document.getElementById('toastContainer');
    var t=document.createElement('div');t.className='toast';t.textContent=msg;
    c.appendChild(t);setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t)},2800);
}

/* === DEFAULTS === */
function defaultStock(){return {
'HP LaserJet Pro M404dn':{cat:'impressoras',price:'2199,00',stock:12,desc:'Monocromática, duplex automático, 40 ppm.',longDesc:'Impressora monocromática de alto desempenho, ideal para escritórios. Duplex automático, 40 ppm, Ethernet e USB.',installments:10,img:''},
'Epson EcoTank L3250':{cat:'multifuncionais',price:'1149,00',stock:25,desc:'Tanque de tinta colorida, Wi-Fi, baixo custo.',longDesc:'Solução perfeita para economia. Tanque de tinta de alta capacidade, Wi-Fi integrado.',installments:10,img:''},
'Elgin i9':{cat:'impressoras',price:'479,00',stock:40,desc:'Impressora de cupom não fiscal, 250 mm/s, USB.',longDesc:'Impressora térmica de cupom, 250 mm/s, USB. Ideal para PDV e comércio.',installments:10,img:''},
'Kit Fusor HP LaserJet':{cat:'pecas',price:'349,00',stock:8,desc:'Compatível com M402/M404/M426.',longDesc:'Kit Fusor compatível com HP LaserJet. Unidade de fusão premium.',installments:10,img:''},
'Brother DCP-L5652DN':{cat:'multifuncionais',price:'3299,00',stock:6,desc:'Laser monocromática, duplex, ADF.',longDesc:'Multifuncional laser monocromática. Duplex, ADF, rede, 40 ppm.',installments:10,img:''},
'Placa Lógica Principal':{cat:'pecas',price:'289,00',stock:15,desc:'Placa controladora compatível com Epson.',longDesc:'Placa lógica principal compatível com diversas Epson. Revisada e testada.',installments:10,img:''},
'Zebra ZD421':{cat:'impressoras',price:'2799,00',stock:10,desc:'Etiquetas térmicas, 203 dpi, USB/Ethernet.',longDesc:'Impressora de etiquetas térmicas. 203 dpi, USB/Ethernet, ZPL/EPL.',installments:10,img:''},
'Toner HP 58A Original':{cat:'suprimentos',price:'419,00',stock:30,desc:'Cartucho toner preto CF258A. 3.000 pág.',longDesc:'Toner HP 58A Original. Rendimento de até 3.000 páginas. JetIntelligence.',installments:10,img:''}
}}

function defaultBanner(){return{title:'Impressoras, multifuncionais e peças',title2:'com garantia e procedência',subtitle:'Desde equipamentos e suprimentos até peças originais e genéricas.',bgUrl:'',bgColor:'linear-gradient(170deg, #0d2f5e 0%, #0a1f3f 100%)',btnText:'Ver Produtos'}}
function defaultConfig(){return{company:'BIANCO & FERREIRA - COMERCIO DE EQUIPAMENTOS PARA INFORMATICA LTDA',brand:'B&F Importes',cnpj:'03.108.169/0001-58',phone:'(16) 98138-6747',email:'atendimento@biancoeferreira.com.br',hours:'Seg–Sex 8h às 18h | Sáb 8h às 13h',address:'R. Rui Barbosa, 363 — Centro, Jaboticabal — SP, 14870-090',cep:'14870-090',cityState:'Jaboticabal — SP'}}
function defaultCategories(){return['impressoras','multifuncionais','pecas','suprimentos']}

/* === AUTH === */
var loginScreen=document.getElementById('loginScreen'),adminLayout=document.getElementById('adminLayout'),btnLogin=document.getElementById('btnAdminLogin');

function getAdminSession(){try{return JSON.parse(localStorage.getItem(ADMIN_KEY))}catch(e){return null}}
function login(user,pass){
    var users=load(USERS_KEY,[]);
    if(!users.length){users.push({name:'Admin',email:'admin',pass:'admin',role:'admin'});save(USERS_KEY,users)}
    var found=users.find(function(u){return (u.email===user||u.name===user)&&u.pass===pass});
    if(found&&(found.role==='admin'||found.email==='admin')){localStorage.setItem(ADMIN_KEY,JSON.stringify(found));showDashboard();return}
    if(found){document.getElementById('loginError').textContent='Apenas administradores podem acessar.';}
    else{document.getElementById('loginError').textContent='Usuário ou senha incorreto.';}
}
function showDashboard(){loginScreen.style.display='none';adminLayout.classList.add('active');renderAll();refreshPreview()}
function logout(){localStorage.removeItem(ADMIN_KEY);loginScreen.style.display='flex';adminLayout.classList.remove('active')}

if(getAdminSession())showDashboard();
btnLogin.addEventListener('click',function(){login(document.getElementById('adminUser').value.trim()||'admin',document.getElementById('adminPass').value||'admin')});
document.getElementById('adminPass').addEventListener('keydown',function(e){if(e.key==='Enter')btnLogin.click()});
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
    });
});

/* === PRODUCT IMAGE UPLOAD === */
var prodImgData='';
document.getElementById('prodImgFile').addEventListener('change',function(e){
    var file=e.target.files[0];if(!file)return;
    document.getElementById('prodImgName').textContent=file.name;
    var reader=new FileReader();
    reader.onload=function(ev){
        prodImgData=ev.target.result;
        document.getElementById('prodImgPreview').src=prodImgData;
        document.getElementById('prodImgPreview').style.display='block';
        showToast('&#128247; Imagem carregada!');
    };
    reader.readAsDataURL(file);
});

/* === RENDER ALL === */
function renderAll(){renderStock();renderAnuncios();loadBannerForm();loadConfigForm();renderUsers();renderCategories();renderPedidos()}

/* === STOCK TABLE + ADD === */
function renderStock(){
    var stock=load(STOCK_KEY,{});
    var def=defaultStock();
    var merged={};
    Object.keys(def).forEach(function(k){merged[k]=Object.assign({},def[k],stock[k]||{})});
    Object.keys(stock).forEach(function(k){if(!merged[k])merged[k]=stock[k]});
    save(STOCK_KEY,merged);

    var tbody=document.getElementById('stockBody'),html='';
    Object.keys(merged).forEach(function(name){
        var p=merged[name],statusBadge=p.stock>20?'badge-green':p.stock>5?'badge-yellow':'badge-red';
        var statusText=p.stock>20?'OK':p.stock>5?'Últimas!!':'Crítico';
        var imgHtml=p.img?'<img src="'+p.img+'" class="tbl-img-preview">':'<span style="font-size:.64rem;color:var(--text-muted);">sem img</span>';
        html+='<tr data-name="'+name.replace(/"/g,'&quot;')+'">'+
            '<td><input class="tbl-input" value="'+name.replace(/"/g,'&quot;')+'" data-field="name" style="min-width:140px;"></td>'+
            '<td><select class="tbl-input" data-field="cat" style="min-width:110px;">'+
                catOptions().map(function(c){return '<option value="'+c+'"'+(p.cat===c?' selected':'')+'>'+c+'</option>'}).join('')+
            '</select></td>'+
            '<td><input class="tbl-input" value="'+(p.price||'')+'" data-field="price" style="width:90px;"></td>'+
            '<td><input class="tbl-input" type="number" value="'+p.stock+'" data-field="stock" min="0" style="width:65px;"></td>'+
            '<td><div class="flex-row" style="gap:6px;">'+imgHtml+'<label class="tbl-img-upload" title="Alterar imagem"><input type="file" accept="image/*" style="display:none;" onchange="uploadTblImg(this,\''+name.replace(/'/g,"\\'")+'\')">&#128247;</label></div></td>'+
            '<td><span class="badge '+statusBadge+'">'+statusText+'</span></td>'+
            '<td><button class="btn-icon danger" onclick="deleteProduct(\''+name.replace(/'/g,"\\'")+'\')" title="Remover">&#128465;</button></td>'+
        '</tr>';
    });
    tbody.innerHTML=html||'<tr><td colspan="7" class="empty-state">Nenhum produto.</td></tr>';

    tbody.querySelectorAll('.tbl-input').forEach(function(inp){
        inp.addEventListener('change',function(){
            var row=inp.closest('tr'),oldName=row.getAttribute('data-name');
            var field=inp.getAttribute('data-field'),val=inp.value.trim();
            var stock=load(STOCK_KEY,{});
            if(field==='name'){
                if(!val||val===oldName)return;
                stock[val]=Object.assign({},stock[oldName]||{});
                delete stock[oldName];
                row.setAttribute('data-name',val);
            }else if(field==='stock'){
                if(!stock[oldName])stock[oldName]={};
                stock[oldName].stock=parseInt(val)||0;
            }else{
                if(!stock[oldName])stock[oldName]={};
                stock[oldName][field]=val;
            }
            save(STOCK_KEY,stock);
            showToast('&#9989; Alteração salva!');
            if(field==='stock')renderStock();
        });
    });
}

window.uploadTblImg=function(input,name){
    var file=input.files[0];if(!file)return;
    var reader=new FileReader();
    reader.onload=function(ev){
        var stock=load(STOCK_KEY,{});
        if(!stock[name])stock[name]={};
        stock[name].img=ev.target.result;
        save(STOCK_KEY,stock);
        showToast('&#128247; Imagem de "'+name+'" atualizada!');
        renderStock();
    };
    reader.readAsDataURL(file);
};

window.deleteProduct=function(name){
    if(!confirm('Remover "'+name+'" permanentemente?'))return;
    var stock=load(STOCK_KEY,{});
    var def=defaultStock();
    if(def[name]){if(!stock[name])stock[name]={};stock[name]._deleted=true;save(STOCK_KEY,stock)}
    else{delete stock[name];save(STOCK_KEY,stock)}
    showToast('&#128465; "'+name+'" removido.');
    renderStock();
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
    var stockData=load(STOCK_KEY,{});
    if(stockData[name]&&!stockData[name]._deleted){msg.textContent='Já existe.';msg.style.color='var(--danger)';return}
    stockData[name]={cat:cat,price:price.replace(',','.'),stock:stock,desc:desc||name,longDesc:longDesc||desc||name,installments:installments,img:prodImgData};
    delete stockData[name]._deleted;
    save(STOCK_KEY,stockData);
    showToast('&#9989; "'+name+'" adicionado!');
    renderStock();
    ['prodName','prodPrice','prodDesc','prodLongDesc','prodImgFile'].forEach(function(id){document.getElementById(id).value=''});
    document.getElementById('prodImgName').textContent='Nenhuma';
    document.getElementById('prodImgPreview').style.display='none';
    prodImgData='';
    document.getElementById('prodStock').value='10';
    msg.textContent='Adicionado com sucesso!';msg.style.color='var(--success)';
    setTimeout(function(){msg.textContent=''},3000);
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
    document.querySelectorAll('#prodCat, select[data-field="cat"]').forEach(function(sel){
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
    ['cfgCompany','cfgBrand','cfgCNPJ','cfgPhone','cfgEmail','cfgHours','cfgAddress','cfgCEP','cfgCityState','cfgPhone','cfgEmail','cfgHours'].forEach(function(id){document.getElementById(id).value=''});
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
    if(idx>=0){
        if(users[idx].email==='admin'&&email!=='admin'){showToast('&#9888; Não pode mudar o e-mail do admin.');return}
        users[idx].name=name;
        if(email!==users[idx].email){
            if(users.find(function(u,i){return i!==idx&&u.email===email})){showToast('&#9888; E-mail já cadastrado.');return}
            users[idx].email=email;
        }
        if(pass&&pass.length>=4)users[idx].pass=pass;
        if(users[idx].email==='admin')users[idx].role='admin';
        else users[idx].role=role;
        save(USERS_KEY,users);
        showToast('&#9989; Usuário "'+name+'" atualizado!');
    }else{
        if(users.find(function(u){return u.email===email})){showToast('&#9888; E-mail já cadastrado.');return}
        if(!pass||pass.length<4){showToast('&#9888; Senha mínima: 4 caracteres.');return}
        users.push({name:name,email:email,pass:pass,role:role});
        save(USERS_KEY,users);
        showToast('&#9989; Usuário "'+name+'" adicionado!');
    }
    document.getElementById('userFormCard').style.display='none';
    renderUsers();
});

document.getElementById('btnConfirmReset').addEventListener('click',function(){
    var idx=parseInt(document.getElementById('resetPassIdx').value);
    var p1=document.getElementById('resetNewPass').value;
    var p2=document.getElementById('resetNewPass2').value;
    if(!p1||p1.length<4){showToast('&#9888; Senha mínima: 4 caracteres.');return}
    if(p1!==p2){showToast('&#9888; Senhas não conferem.');return}
    var users=load(USERS_KEY,[]);
    if(!users[idx])return;
    users[idx].pass=p1;
    save(USERS_KEY,users);
    showToast('&#9989; Senha de "'+users[idx].name+'" redefinida!');
    document.getElementById('resetPassCard').style.display='none';
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
                '<select class="tbl-input" onchange="alterarStatusPedido(' + i + ', this.value)" style="width:100px;">' +
                    '<option value="pendente"' + (p.status === 'pendente' ? ' selected' : '') + '>Pendente</option>' +
                    '<option value="entregue"' + (p.status === 'entregue' ? ' selected' : '') + '>Entregue</option>' +
                    '<option value="cancelado"' + (p.status === 'cancelado' ? ' selected' : '') + '>Cancelado</option>' +
                '</select>' +
            '</td>' +
        '</tr>';
    });

    tbody.innerHTML = html || '<tr><td colspan="8" class="empty-state">Nenhum pedido encontrado.</td></tr>';
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

/* === PREVIEW === */
function refreshPreview(){
    var f = document.getElementById('previewFrame');
    if(f) f.src = '../index.html?t=' + Date.now();
}
document.getElementById('btnRefreshPreview').addEventListener('click', refreshPreview);
var _saveIds = ['btnSaveBanner','btnSaveAnuncios','btnSaveConfig','btnAddProduct','btnSaveUser','btnConfirmReset','btnAddCat'];
_saveIds.forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.addEventListener('click', function(){ setTimeout(refreshPreview, 300); });
});
/* updateStock with refresh */
window.updateStock = function(el){
    var name = el.getAttribute('data-product');
    var val = parseInt(el.value) || 0;
    var stock = load(STOCK_KEY, {});
    if (!stock[name]) stock[name] = {};
    stock[name].stock = val;
    save(STOCK_KEY, stock);
    showToast('&#9989; Estoque de "' + name + '" atualizado para ' + val + ' un.');
    setTimeout(renderStock, 300);
    setTimeout(refreshPreview, 500);
};

})();
