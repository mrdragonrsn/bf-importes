function openLightbox(src){
    var lb = document.getElementById('lightbox');
    var img = document.getElementById('lightboxImg');
    if(lb && img){ img.src = src; lb.classList.add('active'); }
}

(function(){
    /* ── SUPABASE CLIENT ───────────── */
    var SUPABASE_URL = 'https://trirxmcalxktampbujyr.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyaXJ4bWNhbHhrdGFtcGJ1anlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MjU3MzEsImV4cCI6MjEwMjIwMTczMX0.sr6dx1qSK8cqV4e1g6-jMz99T2WTw9Q0jX1iHb-Vwy4';
    var supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

    /* ── DADOS DOS PRODUTOS (fonte: Supabase) ── */
    var productData = {};

    var PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e2e8f0'/%3E%3Cg transform='translate(188,138)' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z'/%3E%3Ccircle cx='12' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E";
    var defaultCatNames = {'impressoras':'Impressora','multifuncionais':'Multifuncional','pecas':'Peça','suprimentos':'Suprimento'};

    function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

    /* Normaliza as imagens de um produto em array de URLs.
       Compatível com: `imagens` (array), `imagem_url` (string), `image`/`imagem` (string legada). */
    function getImages(p){
        if(!p) return [];
        var arr = [];
        if(p.imagem_url) arr.push(p.imagem_url);
        if(Array.isArray(p.imagens)) arr = arr.concat(p.imagens.filter(function(u){ return u; }));
        if(!arr.length && p.imagem) arr = [p.imagem];
        if(!arr.length && p.image) arr = [p.image];
        return arr;
    }

    function buildProductCard(p){
        var name = esc(p.nome);
        var cat = defaultCatNames[p.categoria] || p.categoria || 'Produto';
        var imgs = getImages(p);
        var img = imgs[0] || PLACEHOLDER_IMG;
        var preco = parseFloat(p.preco) || 0;
        var priceStr = 'R$ ' + preco.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
        var inst = preco / 10;
        var photoBadge = imgs.length > 1 ? '<span class="thumb-photo-count">'+imgs.length+' fotos</span>' : '';
        return '<div class="product-card" data-category="'+esc(p.categoria||'impressoras')+'" data-name="'+name+'">' +
            '<div class="thumb">'+photoBadge+'<img src="'+esc(img)+'" alt="'+name+'" loading="lazy"></div>' +
            '<div class="body">' +
                '<span class="cat">'+esc(cat)+'</span>' +
                '<h3>'+name+'</h3>' +
                '<p class="desc">'+esc(p.descricao_curta||'')+'</p>' +
                '<div class="stock-info" data-product="'+name+'"></div>' +
                '<div class="card-footer">' +
                    '<div class="price">'+priceStr+'</div>' +
                    '<div class="installment">ou 10x de R$ '+inst.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}).replace('.',',')+'</div>' +
                    '<button class="btn-card-add" type="button"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>Adicionar</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function renderGrid(rows){
        var grid = document.getElementById('productGrid') || document.querySelector('.product-grid');
        if(!grid) return;
        productData = {};
        var html = '';
        rows.forEach(function(p){
            productData[p.nome] = {
                images: getImages(p),
                stock: parseInt(p.estoque)||0,
                longDesc: p.descricao_curta || '',
                img: getImages(p)[0] || '',
                preco: parseFloat(p.preco)||0
            };
            html += buildProductCard(p);
        });
        grid.innerHTML = html;
        renderStock();
        renderProductImages();
    }

    async function renderProducts(){
        var grid = document.getElementById('productGrid') || document.querySelector('.product-grid');
        if(!grid) return;

        if(!supabase){
            grid.innerHTML = '<div class="empty-state">Não foi possível conectar ao servidor.</div>';
            return;
        }

        grid.innerHTML = '<div class="empty-state">Carregando produtos...</div>';

        // lê ?busca= da URL
        var params = new URLSearchParams(window.location.search);
        var termo = (params.get('busca') || '').trim();

        if(termo){
            var titleEl = document.querySelector('.section-title');
            if(titleEl) titleEl.textContent = 'Resultados para: ' + termo;

            var res = await supabase.rpc('buscar_produtos_inteligente', { termo_busca: termo });
            if(res.error){
                // fallback: função RPC ainda não criada — usa ilike direto
                res = await supabase.from('produtos').select('*').ilike('nome', '%'+termo+'%').order('nome',{ascending:true});
            }
            if(res.error){
                grid.innerHTML = '<div class="empty-state">Erro ao buscar produtos.</div>';
                return;
            }

            var found = res.data || [];
            if(found.length === 0){
                grid.innerHTML =
                    '<div class="empty-state" style="text-align:center;padding:70px 20px;">' +
                        '<div style="font-size:3rem;margin-bottom:12px;">&#128269;</div>' +
                        '<p style="font-size:1.05rem;font-weight:700;color:#334155;margin-bottom:6px;">Nenhum produto encontrado para "'+esc(termo)+'"</p>' +
                        '<p style="font-size:.9rem;color:#64748b;margin-bottom:22px;">Verifique a ortografia ou tente termos mais gerais.</p>' +
                        '<a href="/produtos" class="btn-cta" style="display:inline-block;">Ver catálogo completo</a>' +
                    '</div>';
                return;
            }
            renderGrid(found);
            return;
        }

        var res = await supabase.from('produtos').select('*').order('nome',{ascending:true});
        if(res.error){
            grid.innerHTML = '<div class="empty-state">Erro ao carregar produtos.</div>';
            return;
        }

        var rows = res.data || [];
        if(rows.length === 0){
            grid.innerHTML = '<div class="empty-state">Nenhum produto disponível no momento.</div>';
            return;
        }
        renderGrid(rows);
    }
    renderProducts();

    /* ── CARROSSEL DE DESTAQUES DA HOME (dinâmico do Supabase) ── */
    async function renderHomeFeatured(){
        var track = document.getElementById('featuredTrack');
        if(!track || !supabase) return;

        var res = await supabase.from('produtos').select('*').order('nome',{ascending:true});
        if(res.error || !res.data || !res.data.length) return;

        var rows = res.data;
        // popula productData para stock-info e modal funcionarem na home
        rows.forEach(function(p){
            productData[p.nome] = {
                images: getImages(p),
                stock: parseInt(p.estoque)||0,
                longDesc: p.descricao_curta || '',
                img: getImages(p)[0] || '',
                preco: parseFloat(p.preco)||0
            };
        });

        var html = '';
        rows.forEach(function(p){
            html += buildProductCard(p);
        });
        track.innerHTML = html;

        renderStock();
        renderProductImages();

        if(typeof window.initFeaturedCarousel === 'function'){
            window.initFeaturedCarousel();
        }
    }
    renderHomeFeatured();

    /* ── RENDER ESTOQUE ──────────────── */
    function renderStock() {
        document.querySelectorAll('.stock-info').forEach(function(el){
            var name = el.getAttribute('data-product');
            var data = productData[name];
            if (!data) return;
            var s = data.stock;
            var cls, txt;
            if (s > 20) { cls = 'high'; txt = 'Em estoque (' + s + ' un.)'; }
            else if (s > 5) { cls = 'medium'; txt = 'Últimas unidades!! (' + s + ' un.)'; }
            else { cls = 'low'; txt = 'Últimas unidades (' + s + ' un.)'; }
            el.innerHTML = '<span class="stock-dot ' + cls + '"></span><span class="stock-text ' + cls + '">' + txt + '</span>';
        });
    }
    renderStock();

    /* ── IMAGENS DOS PRODUTOS (placeholder + img do admin) ── */
    function renderProductImages(){
        document.querySelectorAll('.product-card').forEach(function(card){
            var si = card.querySelector('.stock-info');
            var name = si ? si.getAttribute('data-product') : null;
            if(!name){
                var h3 = card.querySelector('h3');
                name = h3 ? h3.textContent.trim() : '';
            }
            var img = card.querySelector('.thumb img');
            if(!img) return;
            var data = productData[name] || {};
            var imgs = data.images || [];
            img.src = imgs[0] || PLACEHOLDER_IMG;
            if(name) img.alt = name;
        });
    }
    renderProductImages();

    /* ── CARRINHO ────────────────────── */
    var CART_KEY = 'bf_cart';
    function loadCart(){ try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch(e){ return []; } }
    function saveCart(arr){ localStorage.setItem(CART_KEY, JSON.stringify(arr)); }
    var cart = loadCart();

    var cartSidebar = document.getElementById('cartSidebar');
    var cartOverlay = document.getElementById('cartOverlay');
    var cartItemsEl = document.getElementById('cartItems');
    var cartTotalEl = document.getElementById('cartTotal');
    var cartFooter = document.getElementById('cartFooter');
    var cartBadge = document.getElementById('cartBadge');

    function cartCount(){ return cart.reduce(function(s,i){ return s + i.qty; }, 0); }

    function updateBadge(){
        if (!cartBadge) return;
        var c = cartCount();
        if (c > 0) { cartBadge.style.display = 'flex'; cartBadge.textContent = c; cartBadge.classList.add('pop'); setTimeout(function(){ cartBadge.classList.remove('pop'); }, 200); }
        else { cartBadge.style.display = 'none'; }
    }

    function cartPrice(str){
        return parseFloat((str||'').replace(/[^\d,]/g,'').replace(',','.')) || 0;
    }

    function cartTotal(){
        return cart.reduce(function(s,i){ return s + (cartPrice(i.price) * i.qty); }, 0);
    }

    function fmtReal(v){ return 'R$ ' + v.toFixed(2).replace('.',','); }

    function renderCart(){
        if (!cartItemsEl || !cartFooter || !cartTotalEl) return;
        if (cart.length === 0) {
            cartItemsEl.innerHTML = '<div class="cart-empty">Seu carrinho est&aacute; vazio.</div>';
            cartFooter.style.display = 'none';
        } else {
            var h = '';
            cart.forEach(function(item, idx){
                var pd = productData[item.title];
                var thumb = (pd && pd.images && pd.images[0]) ? '<img src="'+pd.images[0]+'" alt="" style="width:100%;height:100%;object-fit:cover;">' : '&#128424;';
                h += '<div class="cart-item">' +
                    '<div class="cart-item-img">' + thumb + '</div>' +
                    '<div class="cart-item-info">' +
                        '<h4>' + item.title + '</h4>' +
                        '<div class="cart-item-price">' + item.price + '</div>' +
                        '<div class="cart-qty">' +
                            '<button data-idx="'+idx+'" data-act="dec">&minus;</button>' +
                            '<span>' + item.qty + '</span>' +
                            '<button data-idx="'+idx+'" data-act="inc">+</button>' +
                        '</div>' +
                    '</div>' +
                    '<button class="cart-item-remove" data-idx="'+idx+'" data-act="del">&times;</button>' +
                '</div>';
            });
            cartItemsEl.innerHTML = h;
            cartFooter.style.display = 'block';
            cartTotalEl.textContent = fmtReal(cartTotal());
        }
        saveCart(cart);
        updateBadge();
    }

    if (cartItemsEl) {
        cartItemsEl.addEventListener('click', function(e){
            var btn = e.target.closest('button');
            if (!btn) return;
            var idx = parseInt(btn.getAttribute('data-idx'));
            var act = btn.getAttribute('data-act');
            if (act === 'inc') { cart[idx].qty++; }
            else if (act === 'dec') { cart[idx].qty--; if (cart[idx].qty <= 0) cart.splice(idx,1); }
            else if (act === 'del') { cart.splice(idx,1); }
            renderCart();
        });
    }

    function addToCart(title, price){
        var exist = cart.find(function(i){ return i.title === title; });
        if (exist) { exist.qty++; }
        else { cart.push({title: title, price: price, qty: 1}); }
        renderCart();
        showToast('&#9989; ' + title + ' adicionado ao carrinho!');
    }

    function openCart(){ if(cartOverlay){cartOverlay.classList.add('active');} if(cartSidebar){cartSidebar.classList.add('active');} document.body.style.overflow = 'hidden'; }
    function closeCart(){ if(cartOverlay){cartOverlay.classList.remove('active');} if(cartSidebar){cartSidebar.classList.remove('active');} document.body.style.overflow = ''; }
    var cartCloseBtn = document.getElementById('cartClose');
    if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);
    let btnClearCart = document.getElementById('btnClearCart');
    if (btnClearCart) btnClearCart.addEventListener('click', function(){
        if (cart.length === 0) return;
        if (confirm('Tem certeza que deseja limpar todos os itens do carrinho?')) {
            cart = [];
            renderCart();
            saveCart(cart);
            showToast('&#128465; Carrinho limpo.');
        }
    });
    if (cartOverlay) cartOverlay.addEventListener('click', function(e){ if (e.target === cartOverlay) closeCart(); });
    var btnCartH = document.getElementById('btnCartHeader');
    if (btnCartH) btnCartH.addEventListener('click', openCart);

    /* ── CHECKOUT ────────────────────── */
    var checkoutOverlay = document.getElementById('checkoutOverlay');
    var checkoutSummary = document.getElementById('checkoutSummary');

    if (checkoutOverlay && checkoutSummary) {
        function renderCheckoutSummary(){
            var h = '<h4>&#128722; Resumo do Pedido</h4>';
            cart.forEach(function(item){
                var pd = productData[item.title];
                var thumb = (pd && pd.images && pd.images[0]) ? '<img src="'+pd.images[0]+'" alt="" style="width:100%;height:100%;object-fit:cover;">' : '&#128424;';
                h += '<div class="checkout-item-mini">' +
                    '<div class="checkout-item-img">' + thumb + '</div>' +
                    '<div class="info"><strong>' + item.title + '</strong><span>' + item.qty + 'x ' + item.price + '</span></div>' +
                '</div>';
            });
            var subtotal = cartTotal();
            var shipping = subtotal > 500 ? 0 : 29.90;
            var total = subtotal + shipping;
            h += '<div class="checkout-totals">' +
                '<div class="row"><span>Subtotal</span><span>' + fmtReal(subtotal) + '</span></div>' +
                '<div class="row"><span>Frete</span><span id="checkoutShippingRow">' + (shipping === 0 ? 'Grátis' : fmtReal(shipping)) + '</span></div>' +
                '<div class="row total"><span>Total</span><span id="checkoutTotalValue" data-total="' + total + '">' + fmtReal(total) + '</span></div>' +
            '</div>';
            checkoutSummary.innerHTML = h;
            renderInstallments(total);
        }

        function renderInstallments(total){
            var sel = document.getElementById('cardInstallments');
            if (!sel) return;
            var h = '';
            for (var i = 1; i <= 10; i++) {
                var val = total / i;
                h += '<option value="' + i + '">' + i + 'x de ' + fmtReal(val) + (i === 1 ? ' (à vista)' : '') + '</option>';
            }
            sel.innerHTML = h;
        }

        function openCheckout(){
            renderCheckoutSummary();
            var gate = document.getElementById('checkoutLoginGate');
            var ff = document.getElementById('checkoutFormFields');
            var cs = document.getElementById('checkoutSuccess');
            var bc = document.getElementById('btnConfirmOrder');
            if(gate) gate.style.display = currentUser ? 'none' : 'block';
            if (ff) ff.style.display = currentUser ? 'block' : 'none';
            if (cs) cs.style.display = 'none';
            if (bc) bc.style.display = currentUser ? 'block' : 'none';

            if(currentUser){
                var coName = document.getElementById('coName');
                var coEmail = document.getElementById('coEmail');
                if(coName && !coName.value) coName.value = currentUser.name || '';
                if(coEmail && !coEmail.value) coEmail.value = currentUser.email || '';
            }
            checkoutOverlay.classList.add('active');
            closeCart();
            document.body.style.overflow = 'hidden';
        }
        function closeCheckout(){
            checkoutOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        var coClose = document.getElementById('checkoutClose');
        if (coClose) coClose.addEventListener('click', closeCheckout);
        checkoutOverlay.addEventListener('click', function(e){ if (e.target === checkoutOverlay) closeCheckout(); });
        var btnBack = document.getElementById('btnBackToCart');
        if (btnBack) btnBack.addEventListener('click', function(){
            closeCheckout();
            setTimeout(openCart, 200);
        });

        document.querySelectorAll('.payment-tab').forEach(function(tab){
            tab.addEventListener('click', function(){
                document.querySelectorAll('.payment-tab').forEach(function(t){ t.classList.remove('active'); });
                tab.classList.add('active');
                var pay = tab.getAttribute('data-pay');
                document.querySelectorAll('.payment-body').forEach(function(b){ b.classList.remove('active'); });
                var target = document.getElementById(pay === 'card' ? 'payCard' : pay === 'pix' ? 'payPix' : 'payBoleto');
                if (target) target.classList.add('active');
            });
        });

        var pixKeyEl = document.getElementById('pixKey');
        if (pixKeyEl) {
            pixKeyEl.addEventListener('click', function(){
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(pixKeyEl.textContent).then(function(){
                        showToast('&#128247; Chave PIX copiada!');
                    });
                }
            });
        }

    /* ── SYNC CATEGORIAS DO ADMIN ────── */
    (function(){
        var filterBar = document.getElementById('filterBar');
        if(!filterBar) return;
        try {
            var cats = JSON.parse(localStorage.getItem('bf_categories')||'[]');
            cats.forEach(function(cat){
                if(!filterBar.querySelector('.filter-btn[data-filter="'+cat+'"]')) {
                    var btn = document.createElement('button');
                    btn.className = 'filter-btn';
                    btn.setAttribute('data-filter', cat);
                    btn.textContent = cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g,' ');
                    filterBar.appendChild(btn);
                }
            });
        } catch(e) {}
    })();

        var btnConfirm = document.getElementById('btnConfirmOrder');
        if (btnConfirm) {
            btnConfirm.addEventListener('click', function(){
                var name = document.getElementById('coName').value.trim();
                var email = document.getElementById('coEmail').value.trim();
                var phone = document.getElementById('coPhone').value.trim();
                var address = document.getElementById('coAddress').value.trim();
                var number = document.getElementById('coNumber').value.trim();
                var city = document.getElementById('coCity').value.trim();
                var state = document.getElementById('coState').value;

                if (!name || !email || !phone || !address || !number || !city || !state) {
                    showToast('&#9888; Preencha todos os campos obrigatórios.');
                    return;
                }

                var activePayTab = document.querySelector('.payment-tab.active');
                var payMethod = activePayTab ? activePayTab.getAttribute('data-pay') : 'card';
                var payLabel = payMethod === 'card' ? 'Cartão de Crédito' : payMethod === 'pix' ? 'PIX' : 'Boleto';

                var orderId = 'BF-' + Date.now().toString(36).toUpperCase();
                var now = new Date();
                var dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});

                var nfNum = document.getElementById('nfOrderNum');
                var nfDate = document.getElementById('nfDate');
                if (nfNum) nfNum.textContent = orderId;
                if (nfDate) nfDate.textContent = dateStr;

                var cpf = document.getElementById('coCPF').value.trim() || '---';
                var addrFull = address + ', ' + number;
                var coComp = document.getElementById('coComplement');
                if (coComp && coComp.value.trim()) addrFull += ' — ' + coComp.value.trim();
                addrFull += ' — ' + city + '/' + state;

                var custHtml = '<div><span class="lbl">Nome</span><span class="val">'+name+'</span></div>';
                custHtml += '<div><span class="lbl">CPF</span><span class="val">'+cpf+'</span></div>';
                custHtml += '<div><span class="lbl">E-mail</span><span class="val">'+email+'</span></div>';
                custHtml += '<div><span class="lbl">Telefone</span><span class="val">'+phone+'</span></div>';
                custHtml += '<div style="grid-column:1/-1;"><span class="lbl">Endereço</span><span class="val">'+addrFull+'</span></div>';
                var nfCust = document.getElementById('nfCustomerInfo');
                if (nfCust) nfCust.innerHTML = custHtml;

                var itemsHtml = '';
                var subtotal = 0;
                cart.forEach(function(item){
                    var pu = cartPrice(item.price);
                    var tot = pu * item.qty;
                    subtotal += tot;
                    itemsHtml += '<tr><td>'+item.title+'</td><td class="num">'+item.qty+'</td><td class="num">'+item.price+'</td><td class="num">'+fmtReal(tot)+'</td></tr>';
                });
                var nfItems = document.getElementById('nfItemsBody');
                if (nfItems) nfItems.innerHTML = itemsHtml;

                var shipping = subtotal > 500 ? 0 : 29.90;
                var uf = state;
                if (window.calcFrete && uf) { shipping = window.calcFrete(uf, subtotal); }
                var totalCheckoutEl = document.getElementById('checkoutTotalValue');
                var total = totalCheckoutEl ? (parseFloat(totalCheckoutEl.getAttribute('data-total')) || (subtotal + shipping)) : (subtotal + shipping);
                var totalsHtml = '<div class="nf-row"><span>Subtotal</span><span>'+fmtReal(subtotal)+'</span></div>';
                totalsHtml += '<div class="nf-row"><span>Frete</span><span>'+ (shipping === 0 ? 'Grátis' : fmtReal(shipping)) +'</span></div>';
                totalsHtml += '<div class="nf-row total"><span>TOTAL</span><span>'+fmtReal(total)+'</span></div>';
                var nfTot = document.getElementById('nfTotals');
                if (nfTot) nfTot.innerHTML = totalsHtml;

                var nfPay = document.getElementById('nfPayment');
                if (nfPay) nfPay.innerHTML = '<strong>Forma de pagamento:</strong> ' + payLabel;

                document.getElementById('checkoutFormFields').style.display = 'none';
                document.getElementById('checkoutSuccess').style.display = 'block';
                document.getElementById('btnConfirmOrder').style.display = 'none';

                /* ── SALVAR PEDIDO NO localStorage ── */
                try {
                    var orders = JSON.parse(localStorage.getItem('bf_orders')||'[]');
                    orders.push({
                        id: orderId,
                        cliente: name,
                        email: email,
                        phone: phone,
                        cpf: cpf,
                        endereco: addrFull,
                        data: dateStr,
                        timestamp: Date.now(),
                        total: total,
                        pagamento: payMethod,
                        status: 'pendente',
                        dataEntrega: '',
                        itens: cart.map(function(item){
                            return {titulo: item.title, qtd: item.qty, preco: item.price};
                        })
                    });
                    localStorage.setItem('bf_orders', JSON.stringify(orders));
                } catch(e){}

                showToast('&#9989; Pedido ' + orderId + ' confirmado! (' + payLabel + ')');
                cart = [];
                renderCart();
                saveCart(cart);
            });
        }

        var btnPrint = document.getElementById('btnPrintNF');
        if (btnPrint) btnPrint.addEventListener('click', function(){ window.print(); });

        var btnChk = document.getElementById('btnCheckout');
        if (btnChk) btnChk.addEventListener('click', function(){
            if (cart.length === 0) { showToast('&#9888; Carrinho vazio.'); return; }
            openCheckout();
        });
    }

    /* ── MÁSCARAS DE INPUT ──────────── */
    (function(){
        function applyMask(input, fn){
            if(!input) return;
            input.addEventListener('input', function(){ this.value = fn(this.value); });
        }
        function maskCPF(v){
            v = v.replace(/\D/g,'').slice(0,11);
            return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4').replace(/(\d{3})(\d{3})(\d{3})/,'$1.$2.$3').replace(/(\d{3})(\d{3})/,'$1.$2').replace(/(\d{3})/,'$1');
        }
        function maskPhone(v){
            v = v.replace(/\D/g,'').slice(0,11);
            if(v.length===11) return v.replace(/(\d{2})(\d{5})(\d{4})/,'($1) $2-$3');
            if(v.length>=6) return v.replace(/(\d{2})(\d{4})(\d*)/,'($1) $2-$3');
            if(v.length>=3) return v.replace(/(\d{2})(\d*)/,'($1) $2');
            return v.replace(/(\d*)/,'($1');
        }
        function maskCEP(v){
            v = v.replace(/\D/g,'').slice(0,8);
            return v.replace(/(\d{5})(\d{3})/,'$1-$2').replace(/(\d{5})/,'$1');
        }
        function maskCard(v){
            v = v.replace(/\D/g,'').slice(0,16);
            return v.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/,'$1 $2 $3 $4').replace(/(\d{4})(\d{4})(\d{4})/,'$1 $2 $3').replace(/(\d{4})(\d{4})/,'$1 $2').replace(/(\d{4})/,'$1');
        }
        function maskExpiry(v){
            v = v.replace(/\D/g,'').slice(0,4);
            if(v.length>=3) return v.replace(/(\d{2})(\d{2})/,'$1/$2');
            return v;
        }
        function validateExpiry(v){
            v = v.replace(/\D/g,'');
            if(v.length<4) return true;
            var m = parseInt(v.slice(0,2)), y = parseInt('20'+v.slice(2,4));
            if(m<1||m>12) return false;
            var now = new Date();
            if(y < now.getFullYear()) return false;
            if(y === now.getFullYear() && m < (now.getMonth()+1)) return false;
            return true;
        }

        applyMask(document.getElementById('coCPF'), maskCPF);
        applyMask(document.getElementById('coPhone'), maskPhone);
        applyMask(document.getElementById('coCEP'), maskCEP);
        applyMask(document.getElementById('cardNumber'), maskCard);
        applyMask(document.getElementById('cardExpiry'), maskExpiry);

        var cvvEl = document.getElementById('cardCVV');
        if(cvvEl){ cvvEl.setAttribute('maxlength','3'); cvvEl.addEventListener('input',function(){ this.value=this.value.replace(/\D/g,'').slice(0,3); }); }

        var expiryEl = document.getElementById('cardExpiry');
        if(expiryEl){
            expiryEl.addEventListener('blur',function(){
                if(this.value.replace(/\D/g,'').length===4 && !validateExpiry(this.value)){
                    showToast('&#9888; Data de validade do cartão inválida ou expirada.');
                    this.style.borderColor = '#ef4444';
                } else { this.style.borderColor = ''; }
            });
            expiryEl.addEventListener('input',function(){ this.style.borderColor = ''; });
        }
    })();

    /* ── CEP AUTOCOMPLETE ───────────── */
    (function(){
        var cepInput = document.getElementById('coCEP');
        if(!cepInput) return;
        cepInput.addEventListener('blur', function(){
            var raw = this.value.replace(/\D/g,'');
            if(raw.length !== 8) return;
            var cityEl = document.getElementById('coCity');
            var stateEl = document.getElementById('coState');
            var addrEl = document.getElementById('coAddress');
            var bairroEl = document.getElementById('coNeighborhood');
            if(cityEl) cityEl.placeholder = 'Buscando...';
            fetch('https://viacep.com.br/ws/'+raw+'/json/')
                .then(function(r){ return r.json(); })
                .then(function(data){
                    if(data.erro){ showToast('&#9888; CEP não encontrado.'); if(cityEl) cityEl.placeholder = 'Sua cidade'; return; }
                    if(cityEl){ cityEl.value = data.localidade||''; cityEl.placeholder = 'Sua cidade'; }
                    if(stateEl && data.uf){ stateEl.value = data.uf; }
                    if(addrEl) addrEl.value = data.logradouro||'';
                    if(bairroEl) bairroEl.value = data.bairro||'';
                    showToast('&#128205; Endereço preenchido: '+(data.localidade||'')+'/'+(data.uf||''));
                    if(typeof renderCheckoutSummary === 'function') renderCheckoutSummary();
                }).catch(function(){
                    if(cityEl) cityEl.placeholder = 'Sua cidade';
                    showToast('&#9888; Erro ao consultar CEP.');
                });
        });
    })();

    /* ── HASH (SHA-256 via Web Crypto) ── */
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

    /* ── AUTH ─────────────────────────── */
    var USERS_KEY = 'bf_users';
    var SESSION_KEY = 'bf_session';
    function loadUsers(){ try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch(e){ return []; } }
    function saveUsers(arr){ localStorage.setItem(USERS_KEY, JSON.stringify(arr)); }
    function getSession(){ try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch(e){ return null; } }

    var users = loadUsers();
    if (users.length === 0) {
        users.push({name:'Admin', email:'admin', pass:'admin', role:'admin'});
        saveUsers(users);
    }

    var currentUser = getSession();
    var authOverlay = document.getElementById('authOverlay');
    var boxLogin = document.getElementById('authBoxLogin');
    var boxRegister = document.getElementById('authBoxRegister');
    var btnLoginHeader = document.getElementById('btnLoginHeader');

    if (authOverlay && boxLogin && boxRegister) {
        function updateAuthUI(){
            if (currentUser && btnLoginHeader) {
                var adminBtn = currentUser.role === 'admin' ? '<a href="/admin" class="user-menu-link" style="display:flex;align-items:center;gap:6px;padding:10px 18px;font-size:0.84rem;color:#334155;text-decoration:none;transition:background 0.15s;" onmouseover="this.style.background=\'var(--cinza-claro)\'" onmouseout="this.style.background=\'none\'">&#128736; Painel Admin</a>' : '';
                btnLoginHeader.outerHTML = '<div class="user-dropdown" id="userDropdown"><button class="user-name-header" id="userNameBtn">&#128100; ' + currentUser.name + '</button><div class="user-menu" id="userMenu"><button id="btnPerfil">&#9881; Perfil</button><button id="btnMeusPedidos">&#128230; Meus Pedidos</button>'+adminBtn+'<button id="btnLogout">&#128682; Sair</button></div></div>';
                var unameBtn = document.getElementById('userNameBtn');
                if (unameBtn) unameBtn.addEventListener('click', function(e){ e.stopPropagation(); var m = document.getElementById('userMenu'); if (m) m.classList.toggle('open'); });
                var logoutBtn = document.getElementById('btnLogout');
                if (logoutBtn) logoutBtn.addEventListener('click', function(){
                    localStorage.removeItem(SESSION_KEY);
                    currentUser = null;
                    location.reload();
                });
                document.addEventListener('click', function(){
                    var m = document.getElementById('userMenu');
                    if (m) m.classList.remove('open');
                });
            }
        }
        updateAuthUI();

        if (btnLoginHeader && btnLoginHeader.parentNode) {
            btnLoginHeader.addEventListener('click', function(){
                authOverlay.classList.add('active');
                boxLogin.style.display = 'block';
                boxRegister.style.display = 'none';
                var le = document.getElementById('loginError'); if (le) le.textContent = '';
                var re = document.getElementById('regError'); if (re) re.textContent = '';
                if(boxReset) boxReset.style.display = 'none';
            });
        }
        authOverlay.addEventListener('click', function(e){ if (e.target === authOverlay) authOverlay.classList.remove('active'); });

        var swReg = document.getElementById('switchToRegister');
        if (swReg) swReg.addEventListener('click', function(){
            boxLogin.style.display = 'none';
            boxRegister.style.display = 'block';
            var le = document.getElementById('loginError'); if (le) le.textContent = '';
            var re = document.getElementById('regError'); if (re) re.textContent = '';
        });
        var swLog = document.getElementById('switchToLogin');
        if (swLog) swLog.addEventListener('click', function(){
            boxRegister.style.display = 'none';
            boxLogin.style.display = 'block';
            var le = document.getElementById('loginError'); if (le) le.textContent = '';
            var re = document.getElementById('regError'); if (re) re.textContent = '';
        });

        function doLogin(){
            var login = document.getElementById('loginEmail').value.trim();
            var pass = document.getElementById('loginPass').value;
            var u = users.find(function(u){ return (u.email === login || u.name === login); });
            if (!u) {
                var le = document.getElementById('loginError'); if (le) le.textContent = 'Usuário ou senha inválidos.';
                return;
            }
            sha256(pass).then(function(hash){
                var ok = (u.pass === hash) || (u.pass === pass);
                if (!ok) {
                    var le = document.getElementById('loginError'); if (le) le.textContent = 'Usuário ou senha inválidos.';
                    return;
                }
                if (u.pass !== hash) { u.pass = hash; saveUsers(users); }
                currentUser = u;
                localStorage.setItem(SESSION_KEY, JSON.stringify(u));
                authOverlay.classList.remove('active');
                showToast('&#128100; Bem-vindo, ' + u.name + '!');
                setTimeout(function(){ location.reload(); }, 600);
            });
        }

        function fazerLogin(e){
            if (e) e.preventDefault();
            doLogin();
        }
        window.fazerLogin = fazerLogin;

        ['loginEmail','loginPass'].forEach(function(id){
            var el = document.getElementById(id);
            if (el) el.addEventListener('keydown', function(e){
                if (e.key === 'Enter') {
                    e.preventDefault();
                    var btn = document.getElementById('btnLogin');
                    if (btn) btn.click();
                    else fazerLogin();
                }
            });
        });

        var btnR = document.getElementById('btnRegister');
        if (btnR) btnR.addEventListener('click', function(){
            var name = document.getElementById('regName').value.trim();
            var email = document.getElementById('regEmail').value.trim();
            var pass = document.getElementById('regPass').value;
            if (!name || !email || !pass) { var re = document.getElementById('regError'); if (re) re.textContent = 'Preencha todos os campos.'; return; }
            if (pass.length < 4) { var re = document.getElementById('regError'); if (re) re.textContent = 'Senha deve ter ao menos 4 caracteres.'; return; }
            if (users.find(function(u){ return u.email === email; })) { var re = document.getElementById('regError'); if (re) re.textContent = 'Este e-mail já está cadastrado.'; return; }
            sha256(pass).then(function(hash){
                var newUser = {name: name, email: email, pass: hash, role: 'user'};
                users.push(newUser);
                saveUsers(users);
                currentUser = newUser;
                localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
                authOverlay.classList.remove('active');
                showToast('&#127881; Conta criada com sucesso!');
                setTimeout(function(){ location.reload(); }, 600);
            });
        });

        /* ── FORGOT PASSWORD ───────────── */
        var boxReset = document.getElementById('authBoxReset');
        var RESET_KEY = 'bf_reset';

        function getReset(){ try { return JSON.parse(localStorage.getItem(RESET_KEY)) || {}; } catch(e){ return {}; } }
        function saveReset(r){ localStorage.setItem(RESET_KEY, JSON.stringify(r)); }

        function showResetPanel(cur, next){
            document.querySelectorAll('.reset-steps').forEach(function(el){ el.classList.remove('active'); });
            if(document.getElementById(next)) document.getElementById(next).classList.add('active');
        }

        var forgotLink = document.getElementById('forgotLink');
        if(forgotLink) {
            forgotLink.addEventListener('click', function(){
                boxLogin.style.display = 'none';
                boxRegister.style.display = 'none';
                if(boxReset) boxReset.style.display = 'block';
                showResetPanel('', 'resetStep1');
                var errs = ['resetError','resetCodeError','resetPassError'];
                errs.forEach(function(id){ var el=document.getElementById(id); if(el) el.textContent=''; el.classList.remove('success'); });
            });
        }

        var switchR2L = document.getElementById('switchResetToLogin');
        if(switchR2L) switchR2L.addEventListener('click', function(){
            if(boxReset) boxReset.style.display = 'none';
            boxLogin.style.display = 'block';
            boxRegister.style.display = 'none';
        });

        var btnSendReset = document.getElementById('btnSendReset');
        if(btnSendReset) btnSendReset.addEventListener('click', function(){
            var email = (document.getElementById('resetEmail')||{}).value.trim();
            var err = document.getElementById('resetError');
            if (!email) { if(err) err.textContent = 'Informe o e-mail.'; return; }
            var u = users.find(function(u){ return u.email === email; });
            if (!u) { if(err) err.textContent = 'E-mail não encontrado.'; return; }
            if(err) err.textContent = '';
            var code = String(Math.floor(100000 + Math.random() * 900000));
            var rd = getReset();
            rd[email] = {code: code, ts: Date.now()};
            saveReset(rd);
            document.getElementById('resetEmailDisplay').textContent = email;
            showResetPanel('resetStep1', 'resetStep2');
            showToast('&#128231; Código de 6 dígitos: ' + code + ' (enviado para ' + email + ')');
            var ci = document.getElementById('resetCodeInputs');
            if(ci) {
                ci.querySelectorAll('input').forEach(function(inp){ inp.value = ''; });
                var first = ci.querySelector('input');
                if(first) first.focus();
            }
        });

        var resetCodeInputs = document.getElementById('resetCodeInputs');
        if(resetCodeInputs) {
            resetCodeInputs.addEventListener('input', function(e){
                var inp = e.target;
                if(inp.value && inp.nextElementSibling) inp.nextElementSibling.focus();
            });
            resetCodeInputs.addEventListener('keydown', function(e){
                if(e.key === 'Backspace' && !e.target.value && e.target.previousElementSibling) {
                    e.target.previousElementSibling.focus();
                }
                if(e.key === 'Enter') {
                    var btnV = document.getElementById('btnVerifyCode');
                    if(btnV) btnV.click();
                }
            });
        }

        var btnVerify = document.getElementById('btnVerifyCode');
        if(btnVerify) btnVerify.addEventListener('click', function(){
            var email = document.getElementById('resetEmailDisplay').textContent.trim();
            var rd = getReset();
            var entry = rd[email];
            var err = document.getElementById('resetCodeError');
            if(!entry) { if(err) err.textContent = 'Código expirado. Solicite novamente.'; return; }
            if(Date.now() - entry.ts > 600000) { if(err) err.textContent = 'Código expirado (10 min). Solicite novo.'; return; }
            var inputs = document.querySelectorAll('#resetCodeInputs input');
            var entered = '';
            inputs.forEach(function(inp){ entered += inp.value; });
            if(entered.length !== 6) { if(err) err.textContent = 'Digite os 6 dígitos.'; return; }
            if(entered !== entry.code) { if(err) err.textContent = 'Código incorreto.'; return; }
            if(err) err.textContent = '';
            showResetPanel('resetStep2', 'resetStep3');
            document.getElementById('resetNewPass').value = '';
            document.getElementById('resetNewPass2').value = '';
        });

        var btnResend = document.getElementById('btnResendCode');
        if(btnResend) btnResend.addEventListener('click', function(){
            var email = document.getElementById('resetEmailDisplay').textContent.trim();
            var code = String(Math.floor(100000 + Math.random() * 900000));
            var rd = getReset();
            rd[email] = {code: code, ts: Date.now()};
            saveReset(rd);
            showToast('&#128231; Novo código: ' + code);
            var ci = document.getElementById('resetCodeInputs');
            if(ci) ci.querySelectorAll('input').forEach(function(inp){ inp.value = ''; });
        });

        var btnResetPass = document.getElementById('btnResetPassword');
        if(btnResetPass) btnResetPass.addEventListener('click', function(){
            var email = document.getElementById('resetEmailDisplay').textContent.trim();
            var p1 = document.getElementById('resetNewPass').value;
            var p2 = document.getElementById('resetNewPass2').value;
            var err = document.getElementById('resetPassError');
            if(!p1 || p1.length < 4) { if(err) err.textContent = 'Senha deve ter ao menos 4 caracteres.'; return; }
            if(p1 !== p2) { if(err) err.textContent = 'Senhas não conferem.'; return; }
            if(err) err.textContent = '';
            var u = users.find(function(u){ return u.email === email; });
            sha256(p1).then(function(hash){
                if(u) { u.pass = hash; saveUsers(users); }
                var rd = getReset();
                delete rd[email];
                saveReset(rd);
                authOverlay.classList.remove('active');
                if(boxReset) boxReset.style.display = 'none';
                showToast('&#9989; Senha redefinida com sucesso!');
                var le = document.getElementById('loginError'); if(le) le.textContent = '';
            });
        });
    }

    /* ── TOAST ────────────────────────── */
    function showToast(msg){
        var container = document.getElementById('toastContainer');
        if (!container) return;
        var t = document.createElement('div');
        t.className = 'toast';
        t.textContent = msg;
        container.appendChild(t);
        setTimeout(function(){ if (t.parentNode) t.parentNode.removeChild(t); }, 2500);
    }

    /* ── CONTATO INTERATIVO ───────────── */
    var phoneEl = document.getElementById('contactPhone');
    if (phoneEl) {
        phoneEl.addEventListener('click', function(){
            var num = phoneEl.getAttribute('data-copy');
            if (navigator.clipboard) {
                navigator.clipboard.writeText(num).then(function(){
                    phoneEl.classList.add('copied');
                    setTimeout(function(){ phoneEl.classList.remove('copied'); }, 1800);
                    showToast('&#128222; Número copiado: (16) 98138-6747');
                });
            }
        });
    }
    var emailEl = document.getElementById('contactEmail');
    if (emailEl) {
        emailEl.addEventListener('click', function(){
            var em = emailEl.getAttribute('data-email');
            window.location.href = 'mailto:' + em;
        });
    }

    /* ── PRODUTOS: add-to-cart + modal + filtro ── */
    var productGrid = document.querySelector('.product-grid');
    if (productGrid) {
        productGrid.addEventListener('click', function(e){
            var addBtn = e.target.closest('.btn-card-add, .add-to-cart');
            if (addBtn) {
                e.stopPropagation();
                if (!currentUser) {
                    showToast('&#128274; Faça login para adicionar ao carrinho.');
                    if (authOverlay) authOverlay.classList.add('active');
                    return;
                }
                var card = addBtn.closest('.product-card');
                var title = card.querySelector('h3').textContent.trim();
                var price = card.querySelector('.price').textContent.trim();
                addToCart(title, price);
                return;
            }
            var card = e.target.closest('.product-card');
            if (!card) return;
            if (e.target.closest('.btn-card')) return;
            openModal(card);
        });

        var filterBar2 = document.getElementById('filterBar');
        if(filterBar2) {
            filterBar2.addEventListener('click', function(e){
                var btn = e.target.closest('.filter-btn');
                if(!btn) return;
                document.querySelectorAll('.filter-btn').forEach(function(b){ b.classList.remove('active'); });
                btn.classList.add('active');
                var filter = btn.getAttribute('data-filter');
                document.querySelectorAll('.product-card').forEach(function(card){
                    if(filter === 'todas' || card.getAttribute('data-category') === filter){
                        card.classList.remove('hidden');
                    } else {
                        card.classList.add('hidden');
                    }
                });
            });
        }
    }

    /* ── MODAL DE PRODUTO ────────────── */
    var overlay = document.getElementById('productModal');
    if (overlay) {
        var modalClose = document.getElementById('modalClose');
        var mainImg = document.getElementById('modalMainImg');
        var thumbs = document.getElementById('modalThumbs');
        var modalCat = document.getElementById('modalCat');
        var modalTitle = document.getElementById('modalTitle');
        var modalDesc = document.getElementById('modalDesc');
        var modalPrice = document.getElementById('modalPrice');
        var modalInstall = document.getElementById('modalInstallment');
        var modalBtn = document.getElementById('modalBtn');
        var modalStock = document.getElementById('modalStock');
        var modalAddCart = document.getElementById('modalAddCart');
        var currentModalProduct = null;

        document.querySelectorAll('.modal-tab').forEach(function(tab){
            tab.addEventListener('click', function(){
                document.querySelectorAll('.modal-tab').forEach(function(t){ t.classList.remove('active'); });
                tab.classList.add('active');
                var target = tab.getAttribute('data-tab');
                document.querySelectorAll('.modal-tab-panel').forEach(function(p){ p.classList.remove('active'); });
                document.getElementById(target === 'galeria' ? 'tabGaleria' : 'tabDescricao').classList.add('active');
            });
        });

        function openModal(card) {
            var title = card.querySelector('h3').textContent.trim();
            var cat = card.querySelector('.cat').textContent.trim();
            var desc = card.querySelector('.desc').textContent.trim();
            var price = card.querySelector('.price').textContent.trim();
            var inst = card.querySelector('.installment').textContent.trim();
            var data = productData[title] || null;
            currentModalProduct = title;

            if (modalCat) modalCat.textContent = cat;
            if (modalTitle) modalTitle.textContent = title;
            if (modalPrice) modalPrice.textContent = price;
            if (modalInstall) modalInstall.textContent = inst;

            if (data) {
                if (modalDesc) modalDesc.textContent = data.longDesc;

                var gallery = (data.images && data.images.length) ? data.images : (data.img ? [data.img] : []);

                if (mainImg) {
                    if (gallery.length) {
                        mainImg.innerHTML = '<img src="'+gallery[0]+'" style="width:100%;height:100%;object-fit:contain;border-radius:10px;">';
                    } else {
                        mainImg.innerHTML = '&#128424;';
                    }
                }

                if (thumbs) {
                    thumbs.innerHTML = '';
                    if (gallery.length > 1) {
                        gallery.forEach(function(url, idx){
                            var t = document.createElement('div');
                            t.className = 'modal-thumb' + (idx === 0 ? ' active' : '');
                            t.innerHTML = '<img src="'+url+'" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">';
                            t.addEventListener('click', function(){
                                if (mainImg) mainImg.innerHTML = '<img src="'+url+'" style="width:100%;height:100%;object-fit:contain;border-radius:10px;">';
                                var all = thumbs.querySelectorAll('.modal-thumb');
                                all.forEach(function(a){ a.classList.remove('active'); });
                                t.classList.add('active');
                            });
                            thumbs.appendChild(t);
                        });
                    }
                }
                if (modalStock) {
                    var s = data.stock;
                    var cls, txt;
                    if (s > 20) { cls = 'high'; txt = s + ' unidades em estoque'; }
                    else if (s > 5) { cls = 'medium'; txt = 'Apenas ' + s + ' unidades'; }
                    else { cls = 'low'; txt = 'Últimas ' + s + ' unidades!'; }
                    modalStock.innerHTML = '<span class="stock-dot ' + cls + '"></span><span class="stock-text ' + cls + '">' + txt + '</span>';
                }
            } else {
                if (modalDesc) modalDesc.textContent = desc;
                if (mainImg) mainImg.innerHTML = '&#128424;';
                if (thumbs) thumbs.innerHTML = '';
                if (modalStock) modalStock.innerHTML = '';
            }

            document.querySelectorAll('.modal-tab').forEach(function(t){ t.classList.remove('active'); });
            var galTab = document.querySelector('.modal-tab[data-tab="galeria"]');
            if (galTab) galTab.classList.add('active');
            document.querySelectorAll('.modal-tab-panel').forEach(function(p){ p.classList.remove('active'); });
            var galPanel = document.getElementById('tabGaleria');
            if (galPanel) galPanel.classList.add('active');

            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        // expõe a abertura do modal para reuso (ex.: carrossel da home)
        window.openProductModal = openModal;

        if (modalAddCart) modalAddCart.addEventListener('click', function(){
            if (!currentUser) {
                showToast('&#128274; Faça login para adicionar ao carrinho.');
                if (authOverlay) authOverlay.classList.add('active');
                return;
            }
            if (currentModalProduct) {
                var cardEls = document.querySelectorAll('.product-card');
                var price = '';
                cardEls.forEach(function(c){
                    if (c.querySelector('h3').textContent.trim() === currentModalProduct) {
                        price = c.querySelector('.price').textContent.trim();
                    }
                });
                if (price) addToCart(currentModalProduct, price);
            }
        });

        var modalBuyNow = document.getElementById('modalBuyNow');
        if (modalBuyNow) modalBuyNow.addEventListener('click', function(){
            if (currentModalProduct) {
                var cardEls = document.querySelectorAll('.product-card');
                var price = '';
                cardEls.forEach(function(c){
                    if (c.querySelector('h3').textContent.trim() === currentModalProduct) {
                        price = c.querySelector('.price').textContent.trim();
                    }
                });
                if (price) addToCart(currentModalProduct, price);
                closeModal();
                if (!currentUser) {
                    showToast('&#128274; Faça login para finalizar a compra.');
                    localStorage.setItem('bf_pending_checkout', '1');
                    if (authOverlay) authOverlay.classList.add('active');
                } else {
                    setTimeout(openCheckout, 300);
                }
            }
        });

        function closeModal() {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        if (modalClose) modalClose.addEventListener('click', closeModal);
        if (modalBtn) modalBtn.addEventListener('click', function(e){
            e.preventDefault();
            var name = currentModalProduct || 'um produto';
            var msg = 'Ol\u00E1! Gostaria de solicitar or\u00E7amento para: ' + name;
            window.open('https://wa.me/5516981386747?text=' + encodeURIComponent(msg), '_blank');
            setTimeout(closeModal, 300);
        });
        overlay.addEventListener('click', function(e){
            if (e.target === overlay) closeModal();
        });
    }

    /* ── KEYDOWN ESCAPE ──────────────── */
    document.addEventListener('keydown', function(e){
        if (e.key === 'Escape') {
            if (overlay && overlay.classList.contains('active')) {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
            if (cartSidebar && cartSidebar.classList.contains('active')) closeCart();
            if (authOverlay && authOverlay.classList.contains('active')) authOverlay.classList.remove('active');
            if (checkoutOverlay && checkoutOverlay.classList.contains('active')) {
                checkoutOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    });

    /* ── CHAT WIDGET ────────────────── */
    var panel = document.getElementById('chatPanel');
    if (panel) {
        var toggle = document.getElementById('chatToggle');
        var close = document.getElementById('closeChat');
        var body = document.getElementById('chatBody');
        var input = document.getElementById('chatInput');
        var send = document.getElementById('chatSend');

        var respostas = {
            'oi':'Olá! Bem-vindo à B&F. Em que posso ajudar?',
            'ola':'Olá! Bem-vindo à B&F. Em que posso ajudar?',
            'bom dia':'Bom dia! Em que podemos ajudar hoje?',
            'boa tarde':'Boa tarde! Como posso auxiliá-lo?',
            'boa noite':'Boa noite! Estamos aqui para ajudar.',
            'preço':'Temos impressoras a partir de R$ 479,00 e peças a partir de R$ 289,00. Qual modelo lhe interessa?',
            'preco':'Temos impressoras a partir de R$ 479,00 e peças a partir de R$ 289,00. Qual modelo lhe interessa?',
            'orçamento':'Claro! Pode nos enviar um e-mail para atendimento@biancoeferreira.com.br ou ligar para (16) 98138-6747. Qual produto deseja?',
            'orcamento':'Claro! Pode nos enviar um e-mail para atendimento@biancoeferreira.com.br ou ligar para (16) 98138-6747. Qual produto deseja?',
            'entrega':'Realizamos entregas para todo o Brasil. O prazo varia conforme a região. Informe seu CEP para consulta.',
            'garantia':'Todos os nossos produtos possuem garantia mínima de 90 dias. Peças originais contam com garantia do fabricante.',
            'peças':'Trabalhamos com peças originais e compatíveis para HP, Epson, Brother, Zebra, Elgin e outras marcas. Qual você precisa?',
            'pecas':'Trabalhamos com peças originais e compatíveis para HP, Epson, Brother, Zebra, Elgin e outras marcas. Qual você precisa?',
            'obrigado':'Por nada! Estamos à disposição. Tenha um ótimo dia!',
            'valeu':'Por nada! Estamos à disposição. Tenha um ótimo dia!',
            'tchau':'Até logo! Qualquer dúvida é só chamar. Tenha um ótimo dia!'
        };

        function addMsg(texto, tipo){
            var div = document.createElement('div');
            div.className = 'chat-msg ' + tipo;
            div.textContent = texto;
            body.appendChild(div);
            body.scrollTop = body.scrollHeight;
        }

        function botReply(msg){
            var t = msg.toLowerCase().trim();
            var reply = null;
            for (var k in respostas) {
                if (t.indexOf(k) !== -1) { reply = respostas[k]; break; }
            }
            if (!reply) {
                reply = 'Obrigado pelo contato! Um de nossos atendentes retornará em breve. Enquanto isso, pode nos ligar em (16) 98138-6747.';
            }
            setTimeout(function(){ addMsg(reply, 'bot'); }, 600);
        }

        if (toggle) toggle.addEventListener('click', function(){
            panel.classList.toggle('open');
        });
        if (close) close.addEventListener('click', function(){
            panel.classList.remove('open');
        });
        if (send) send.addEventListener('click', function enviar(){
            var msg = input.value.trim();
            if (!msg) return;
            addMsg(msg, 'user');
            input.value = '';
            botReply(msg);
        });
        if (input) input.addEventListener('keydown', function(e){
            if (e.key === 'Enter' && send) send.click();
        });
    }

    renderCart();
    updateBadge();

    /* ── PENDING CHECKOUT ──────────────── */
    try {
        if (currentUser && localStorage.getItem('bf_pending_checkout')) {
            localStorage.removeItem('bf_pending_checkout');
            var co = document.getElementById('checkoutOverlay');
            if (co) setTimeout(openCheckout, 500);
        }
    } catch(e) {}

    /* ── BUSCA INTELIGENTE (Autocomplete + Histórico) ── */
    (function(){
        var wrap = document.getElementById('headerSearchWrap');
        if(!wrap) return;
        var input = document.getElementById('headerSearch');
        if(!input) return;
        var dropdown = document.getElementById('searchDropdown');
        var searchBtn = document.getElementById('headerSearchBtn');

        var RECENT_KEY = 'bf_search_recent';
        var activeIndex = -1;
        var items = [];
        var debounceTimer = null;

        function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

        function getRecent(){
            try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch(e){ return []; }
        }
        function saveRecent(term){
            var list = getRecent().filter(function(t){ return t.toLowerCase() !== term.toLowerCase(); });
            list.unshift(term);
            list = list.slice(0, 6);
            localStorage.setItem(RECENT_KEY, JSON.stringify(list));
        }
        function clearRecent(){ localStorage.removeItem(RECENT_KEY); }

        function closeDropdown(){ if(dropdown) dropdown.classList.remove('open'); activeIndex = -1; items = []; }

        function fmtPrice(n){
            n = parseFloat(n) || 0;
            return 'R$ ' + n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
        }

        function renderRecent(){
            var recent = getRecent();
            if(!recent.length){
                dropdown.innerHTML = '<div class="search-empty">Comece a digitar para buscar produtos.</div>';
                dropdown.classList.add('open');
                items = [];
                return;
            }
            var html = '<div class="sd-header"><span>Buscas recentes</span><button type="button" class="sd-clear" id="sdClearRecent">Limpar</button></div>';
            recent.forEach(function(term){
                html += '<div class="search-recent-item" data-term="'+esc(term)+'" role="option">' +
                    '<span class="sr-icon">&#128269;</span><span>'+esc(term)+'</span></div>';
            });
            dropdown.innerHTML = html;
            dropdown.classList.add('open');

            var clearBtn = document.getElementById('sdClearRecent');
            if(clearBtn) clearBtn.addEventListener('click', function(e){
                e.stopPropagation();
                clearRecent();
                closeDropdown();
            });

            items = Array.prototype.slice.call(dropdown.querySelectorAll('.search-recent-item'));
            items.forEach(function(el, i){
                el.addEventListener('click', function(){
                    var t = el.getAttribute('data-term');
                    input.value = t;
                    saveRecent(t);
                    submitSearch(t);
                });
                el.addEventListener('mouseenter', function(){ setActive(i); });
            });
        }

        function renderResults(rows, term){
            if(!rows || !rows.length){
                dropdown.innerHTML = '<div class="search-empty">Nenhum produto encontrado para "'+esc(term)+'".</div>';
                dropdown.classList.add('open');
                items = [];
                return;
            }
            var html = '<div class="sd-header"><span>Produtos</span></div>';
            rows.forEach(function(p){
                var firstImg = getImages(p)[0];
                var img = firstImg
                    ? '<img class="si-img" src="'+esc(firstImg)+'" alt="">'
                    : '<span class="si-img">&#128424;</span>';
                html += '<div class="search-item" data-term="'+esc(p.nome)+'" role="option">' +
                    img +
                    '<div class="si-info">' +
                        '<div class="si-name">'+esc(p.nome)+'</div>' +
                        '<div class="si-cat">'+esc(p.categoria||'')+'</div>' +
                    '</div>' +
                    '<div class="si-price">'+fmtPrice(p.preco)+'</div>' +
                '</div>';
            });
            dropdown.innerHTML = html;
            dropdown.classList.add('open');

            items = Array.prototype.slice.call(dropdown.querySelectorAll('.search-item'));
            items.forEach(function(el, i){
                el.addEventListener('click', function(){
                    var t = el.getAttribute('data-term');
                    input.value = t;
                    saveRecent(t);
                    submitSearch(t);
                });
                el.addEventListener('mouseenter', function(){ setActive(i); });
            });
        }

        function setActive(i){
            activeIndex = i;
            items.forEach(function(el, idx){ el.classList.toggle('active', idx === i); });
        }

        function submitSearch(term){
            closeDropdown();
            input.blur();
            window.location.href = '/produtos?busca=' + encodeURIComponent(term);
        }

        async function runAutocomplete(term){
            if(!supabase){
                dropdown.innerHTML = '<div class="search-empty">Busca indisponível no momento.</div>';
                dropdown.classList.add('open');
                return;
            }
            var res = await supabase.rpc('buscar_produtos_inteligente', { termo_busca: term });
            if(res.error){
                // fallback: função RPC ainda não criada — usa ilike direto na tabela
                res = await supabase.from('produtos').select('*').ilike('nome', '%'+term+'%').limit(10);
            }
            if(res.error){ renderResults([], term); return; }
            renderResults(res.data || [], term);
        }

        input.addEventListener('input', function(){
            var term = input.value.trim();
            if(!term){ closeDropdown(); return; }
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function(){
                runAutocomplete(term);
            }, 300);
        });

        input.addEventListener('focus', function(){
            if(!input.value.trim()) renderRecent();
        });

        input.addEventListener('keydown', function(e){
            if(e.key === 'Escape'){ closeDropdown(); input.blur(); return; }
            if(!dropdown.classList.contains('open')) return;

            if(e.key === 'ArrowDown'){
                e.preventDefault();
                if(!items.length) return;
                activeIndex = (activeIndex + 1) % items.length;
                setActive(activeIndex);
            } else if(e.key === 'ArrowUp'){
                e.preventDefault();
                if(!items.length) return;
                activeIndex = (activeIndex - 1 + items.length) % items.length;
                setActive(activeIndex);
            } else if(e.key === 'Enter'){
                var term = input.value.trim();
                if(!term) return;
                if(activeIndex >= 0 && items[activeIndex]){
                    var chosen = items[activeIndex].getAttribute('data-term');
                    if(chosen){ e.preventDefault(); input.value = chosen; term = chosen; }
                }
                saveRecent(term);
                submitSearch(term);
            }
        });

        if(searchBtn) searchBtn.addEventListener('click', function(){
            var term = input.value.trim();
            if(!term){ input.focus(); return; }
            saveRecent(term);
            submitSearch(term);
        });

        document.addEventListener('click', function(e){
            if(!wrap.contains(e.target)) closeDropdown();
        });
    })();

    /* ── MEUS PEDIDOS ────────────────── */
    (function(){
        function openMeusPedidos(){
            var overlay = document.getElementById('pedidosOverlay');
            if(!overlay) return;

            var orders = JSON.parse(localStorage.getItem('bf_orders')||'[]');
            var myOrders = currentUser ? orders.filter(function(o){ return o.email === currentUser.email; }) : [];
            myOrders.sort(function(a,b){ return b.timestamp - a.timestamp; });

            var tbody = document.getElementById('pedidosBodyCliente');
            if(!tbody) return;

            if(myOrders.length === 0){
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#94a3b8;">Nenhum pedido encontrado.</td></tr>';
            } else {
                var html = '';
                myOrders.forEach(function(p){
                    var statusClass = p.status === 'entregue' ? 'badge-verde' : p.status === 'cancelado' ? 'badge-vermelho' : 'badge-amarelo';
                    var statusText = p.status.charAt(0).toUpperCase() + p.status.slice(1);
                    var pagLabel = p.pagamento === 'card' ? 'Cartão' : p.pagamento === 'pix' ? 'PIX' : 'Boleto';
                    var entrega = p.dataEntrega || '—';
                    html += '<tr>' +
                        '<td><strong>' + p.id + '</strong></td>' +
                        '<td>' + p.data + '</td>' +
                        '<td>R$ ' + parseFloat(p.total).toFixed(2).replace('.',',') + '</td>' +
                        '<td>' + pagLabel + '</td>' +
                        '<td><span class="status-badge ' + statusClass + '">' + statusText + '</span></td>' +
                        '<td>' + entrega + '</td>' +
                    '</tr>';
                });
                tbody.innerHTML = html;
            }
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeMeusPedidos(){
            var overlay = document.getElementById('pedidosOverlay');
            if(overlay){ overlay.classList.remove('active'); document.body.style.overflow = ''; }
        }

        var btnMeusPedidos = document.getElementById('btnMeusPedidos');
        if(btnMeusPedidos) btnMeusPedidos.addEventListener('click', function(e){
            e.stopPropagation();
            var m = document.getElementById('userMenu');
            if(m) m.classList.remove('open');
            openMeusPedidos();
        });

        var closePedidosBtn = document.getElementById('pedidosClose');
        if(closePedidosBtn) closePedidosBtn.addEventListener('click', closeMeusPedidos);

        var pedidosOverlay = document.getElementById('pedidosOverlay');
        if(pedidosOverlay) pedidosOverlay.addEventListener('click', function(e){
            if(e.target === pedidosOverlay) closeMeusPedidos();
        });
    })();

    /* ── PERFIL DO USUÁRIO ────────────── */
    (function(){
        var PERFIL_KEY = 'bf_profiles';

        function getPerfilKey(){ return currentUser ? ('bf_profile_' + currentUser.email) : null; }
        function loadPerfil(){
            var key = getPerfilKey();
            if(!key) return null;
            try { return JSON.parse(localStorage.getItem(key)) || {}; } catch(e){ return {}; }
        }
        function savePerfil(data){
            var key = getPerfilKey();
            if(!key) return;
            var current = loadPerfil() || {};
            Object.keys(data).forEach(function(k){ current[k] = data[k]; });
            localStorage.setItem(key, JSON.stringify(current));
        }

        function openPerfil(){
            var overlay = document.getElementById('perfilOverlay');
            if(!overlay || !currentUser) return;
            var perfil = loadPerfil();

            document.getElementById('perfilNome').value = perfil.nome || currentUser.name || '';
            document.getElementById('perfilEmail').value = currentUser.email || '';
            document.getElementById('perfilPhone').value = perfil.phone || '';

            if(perfil.foto){
                document.getElementById('perfilFoto').innerHTML = '<img src="'+perfil.foto+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
            } else {
                document.getElementById('perfilFoto').innerHTML = '&#128100;';
            }

            if(perfil.endereco){
                document.getElementById('perfilCEP').value = perfil.endereco.cep || '';
                document.getElementById('perfilRua').value = perfil.endereco.rua || '';
                document.getElementById('perfilNumero').value = perfil.endereco.numero || '';
                document.getElementById('perfilBairro').value = perfil.endereco.bairro || '';
                document.getElementById('perfilCidade').value = perfil.endereco.cidade || '';
                document.getElementById('perfilEstado').value = perfil.endereco.estado || '';
                document.getElementById('perfilComplemento').value = perfil.endereco.complemento || '';
            } else {
                ['perfilCEP','perfilRua','perfilNumero','perfilBairro','perfilCidade','perfilEstado','perfilComplemento'].forEach(function(id){
                    document.getElementById(id).value = '';
                });
            }

            renderCartoes(perfil);
            document.querySelector('.perfil-tab.active').click();

            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closePerfil(){
            var overlay = document.getElementById('perfilOverlay');
            if(overlay){ overlay.classList.remove('active'); document.body.style.overflow = ''; }
        }

        function renderCartoes(perfil){
            var lista = document.getElementById('cartoesLista');
            if(!lista) return;
            var cartoes = (perfil && perfil.cartoes) || [];
            if(cartoes.length === 0){
                lista.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:16px 0;">Nenhum cartão salvo.</p>';
            } else {
                var html = '';
                cartoes.forEach(function(c, i){
                    var num = c.numero.replace(/\D/g,'');
                    var numFormatado = num.replace(/(\d{4})/g,'$1 ').trim();
                    var ultimos4 = num.slice(-4);
                    var cvv = c.cvv || '***';
                    var bandeiraCls = c.bandeira || 'outro';
                    html += '<div class="cartao-3d-wrap">' +
                        '<div class="cartao-3d" onclick="this.classList.toggle(\'flipped\')">' +
                            '<div class="cartao-3d-face cartao-3d-front '+bandeiraCls+'">' +
                                '<button class="cartao-3d-remove" onclick="event.stopPropagation();window.removeCartao('+i+')" title="Remover">&times;</button>' +
                                '<div class="cartao-3d-top"><span class="cartao-3d-band">'+c.bandeira.toUpperCase()+'</span><span class="cartao-3d-chip">💳</span></div>' +
                                '<div class="cartao-3d-numero">•••• •••• •••• '+ultimos4+'</div>' +
                                '<div class="cartao-3d-bottom">' +
                                    '<div><span class="cartao-3d-nome">'+c.nome+'</span></div>' +
                                    '<div class="cartao-3d-validade"><span>VÁLIDO ATÉ</span>'+c.validade+'</div>' +
                                '</div>' +
                                '<div class="cartao-3d-hint">Clique para ver CVV</div>' +
                            '</div>' +
                            '<div class="cartao-3d-face cartao-3d-back">' +
                                '<div class="cartao-3d-tarja"></div>' +
                                '<div class="cartao-3d-cvv-area"><span class="cartao-3d-cvv-label">CVV</span><span class="cartao-3d-cvv">'+cvv+'</span></div>' +
                                '<div class="cartao-3d-hint" style="margin-top:16px;">Clique para voltar</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>';
                });
                lista.innerHTML = html;
            }
        }

        window.removeCartao = function(idx){
            if(!confirm('Remover este cartão?')) return;
            var perfil = loadPerfil() || {};
            if(perfil.cartoes) perfil.cartoes.splice(idx,1);
            savePerfil({cartoes: perfil.cartoes || []});
            renderCartoes(perfil);
            showToast('&#128465; Cartão removido.');
        };

        var fotoInput = document.getElementById('perfilFotoInput');
        if(fotoInput){
            fotoInput.addEventListener('change', function(){
                var file = this.files[0];
                if(!file) return;
                var reader = new FileReader();
                reader.onload = function(e){
                    document.getElementById('perfilFoto').innerHTML = '<img src="'+e.target.result+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
                    savePerfil({foto: e.target.result});
                    showToast('&#128247; Foto atualizada!');
                };
                reader.readAsDataURL(file);
            });
        }

        document.getElementById('btnSalvarDados').addEventListener('click', function(){
            var nome = document.getElementById('perfilNome').value.trim();
            var phone = document.getElementById('perfilPhone').value.trim();
            if(!nome){ showToast('&#9888; Informe seu nome.'); return; }
            savePerfil({nome: nome, phone: phone});
            currentUser.name = nome;
            localStorage.setItem('bf_session', JSON.stringify(currentUser));
            var btn = document.getElementById('userNameBtn');
            if(btn) btn.innerHTML = '&#128100; ' + nome;
            showToast('&#9989; Dados salvos!');
        });

        var adminLink = document.getElementById('perfilAdminLink');
        if(adminLink && currentUser && currentUser.role === 'admin'){
            adminLink.style.display = 'block';
        }

        document.getElementById('btnSalvarEndereco').addEventListener('click', function(){
            var endereco = {
                cep: document.getElementById('perfilCEP').value.trim(),
                rua: document.getElementById('perfilRua').value.trim(),
                numero: document.getElementById('perfilNumero').value.trim(),
                bairro: document.getElementById('perfilBairro').value.trim(),
                cidade: document.getElementById('perfilCidade').value.trim(),
                estado: document.getElementById('perfilEstado').value.trim(),
                complemento: document.getElementById('perfilComplemento').value.trim()
            };
            if(!endereco.rua || !endereco.numero || !endereco.cidade || !endereco.estado){
                showToast('&#9888; Preencha rua, número, cidade e estado.');
                return;
            }
            savePerfil({endereco: endereco});
            showToast('&#9989; Endereço salvo! Este endereço será usado no checkout.');
        });

        document.getElementById('btnAddCartao').addEventListener('click', function(){
            document.getElementById('cartaoForm').style.display = 'block';
            this.style.display = 'none';
            ['cartaoNumero','cartaoNome','cartaoValidade','cartaoCVV'].forEach(function(id){ document.getElementById(id).value = ''; });
        });

        document.getElementById('btnCancelCartao').addEventListener('click', function(){
            document.getElementById('cartaoForm').style.display = 'none';
            document.getElementById('btnAddCartao').style.display = 'block';
        });

        document.getElementById('btnSalvarCartao').addEventListener('click', function(){
            var numero = document.getElementById('cartaoNumero').value.trim();
            var nome = document.getElementById('cartaoNome').value.trim();
            var validade = document.getElementById('cartaoValidade').value.trim();
            var bandeira = document.getElementById('cartaoBandeira').value;
            var cvv = document.getElementById('cartaoCVV').value.trim();
            if(!numero || !nome || !validade){ showToast('&#9888; Preencha todos os campos do cartão.'); return; }
            var perfil = loadPerfil() || {};
            if(!perfil.cartoes) perfil.cartoes = [];
            perfil.cartoes.push({numero: numero, nome: nome, validade: validade, bandeira: bandeira, cvv: cvv});
            savePerfil({cartoes: perfil.cartoes});
            renderCartoes(perfil);
            document.getElementById('cartaoForm').style.display = 'none';
            document.getElementById('btnAddCartao').style.display = 'block';
            showToast('&#9989; Cartão salvo!');
        });

        var btnPerfil = document.getElementById('btnPerfil');
        if(btnPerfil) btnPerfil.addEventListener('click', function(e){
            e.stopPropagation();
            var m = document.getElementById('userMenu');
            if(m) m.classList.remove('open');
            openPerfil();
        });

        var perfilCloseBtn = document.getElementById('perfilClose');
        if(perfilCloseBtn) perfilCloseBtn.addEventListener('click', closePerfil);

        var perfilOverlay = document.getElementById('perfilOverlay');
        if(perfilOverlay) perfilOverlay.addEventListener('click', function(e){
            if(e.target === perfilOverlay) closePerfil();
        });

        document.querySelectorAll('.perfil-tab').forEach(function(tab){
            tab.addEventListener('click', function(){
                document.querySelectorAll('.perfil-tab').forEach(function(t){ t.classList.remove('active'); });
                tab.classList.add('active');
                document.querySelectorAll('.perfil-panel').forEach(function(p){ p.classList.remove('active'); });
                document.getElementById(tab.getAttribute('data-ptab')).classList.add('active');
            });
        });

        var perfilCEP = document.getElementById('perfilCEP');
        if(perfilCEP){
            perfilCEP.addEventListener('blur', function(){
                var raw = this.value.replace(/\D/g,'');
                if(raw.length !== 8) return;
                fetch('https://viacep.com.br/ws/'+raw+'/json/')
                    .then(function(r){ return r.json(); })
                    .then(function(data){
                        if(data.erro){ showToast('&#9888; CEP não encontrado.'); return; }
                        document.getElementById('perfilRua').value = data.logradouro || '';
                        document.getElementById('perfilBairro').value = data.bairro || '';
                        document.getElementById('perfilCidade').value = data.localidade || '';
                        document.getElementById('perfilEstado').value = data.uf || '';
                    });
            });
        }

        function maskCardPerfil(v){
            v = v.replace(/\D/g,'').slice(0,16);
            return v.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/,'$1 $2 $3 $4').replace(/(\d{4})(\d{4})(\d{4})/,'$1 $2 $3').replace(/(\d{4})(\d{4})/,'$1 $2').replace(/(\d{4})/,'$1');
        }
        function maskExpiryPerfil(v){
            v = v.replace(/\D/g,'').slice(0,4);
            if(v.length>=3) return v.replace(/(\d{2})(\d{2})/,'$1/$2');
            return v;
        }
        var cartaoNumero = document.getElementById('cartaoNumero');
        var cartaoValidade = document.getElementById('cartaoValidade');
        if(cartaoNumero) cartaoNumero.addEventListener('input', function(){ this.value = maskCardPerfil(this.value); });
        if(cartaoValidade) cartaoValidade.addEventListener('input', function(){ this.value = maskExpiryPerfil(this.value); });

        /* ── Auto-fill checkout from profile ── */
        var origOpenCheckout = openCheckout;
        openCheckout = function(){
            origOpenCheckout();
            if(!currentUser) return;
            var perfil = loadPerfil();
            if(!perfil || !perfil.endereco) return;
            var end = perfil.endereco;
            var coName = document.getElementById('coName');
            var coPhone = document.getElementById('coPhone');
            var coCEP = document.getElementById('coCEP');
            var coAddress = document.getElementById('coAddress');
            var coNumber = document.getElementById('coNumber');
            var coNeighborhood = document.getElementById('coNeighborhood');
            var coCity = document.getElementById('coCity');
            var coState = document.getElementById('coState');
            var coComplement = document.getElementById('coComplement');
            if(coName && !coName.value) coName.value = perfil.nome || currentUser.name || '';
            if(coPhone && !coPhone.value) coPhone.value = perfil.phone || '';
            if(end.cep && coCEP && !coCEP.value) coCEP.value = end.cep;
            if(end.rua && coAddress && !coAddress.value) coAddress.value = end.rua;
            if(end.numero && coNumber && !coNumber.value) coNumber.value = end.numero;
            if(end.bairro && coNeighborhood && !coNeighborhood.value) coNeighborhood.value = end.bairro;
            if(end.cidade && coCity && !coCity.value) coCity.value = end.cidade;
            if(end.estado && coState && !coState.value) coState.value = end.estado;
            if(end.complemento && coComplement && !coComplement.value) coComplement.value = end.complemento;
        };
    })();

    /* ── FRETE DINÂMICO ─────────────── */
    (function(){
        renderCheckoutSummary = (function(original){
            return function(){
                original();
                var state = document.getElementById('coState');
                if(!state) return;
                var uf = state.value;
                var totalEl = document.getElementById('checkoutTotalValue');
                if(!totalEl) return;
                var subtotal = cartTotal();
                var shipping = calcFrete(uf, subtotal);
                var total = subtotal + shipping;
                totalEl.setAttribute('data-total', total);
                totalEl.textContent = fmtReal(total);

                var shippingRow = document.getElementById('checkoutShippingRow');
                if(shippingRow) shippingRow.textContent = (shipping === 0 ? 'Grátis' : fmtReal(shipping));
                renderInstallments(total);
            };
        })(renderCheckoutSummary);

        function calcFrete(uf, subtotal){
            if(!uf || subtotal > 500) return 0;
            var sp = ['SP'];
            var sudeste = ['RJ','MG','ES'];
            var sul = ['PR','SC','RS'];
            var centro = ['DF','GO','MT','MS'];
            var nordeste = ['BA','PE','CE','MA','PB','RN','AL','SE'];
            var norte = ['AM','PA','RO','TO','AC','AP','RR'];
            if(sp.indexOf(uf) >= 0) return subtotal > 300 ? 0 : 19.90;
            if(sudeste.indexOf(uf) >= 0) return 29.90;
            if(sul.indexOf(uf) >= 0) return 39.90;
            if(centro.indexOf(uf) >= 0) return 49.90;
            if(nordeste.indexOf(uf) >= 0) return 59.90;
            if(norte.indexOf(uf) >= 0) return 69.90;
            return 29.90;
        }
        window.calcFrete = calcFrete;
    })();

    /* ── WHATSAPP NOTIFICAÇÃO ─────────── */
    (function(){
        var btnWpp = document.getElementById('btnWppShare');
        if(!btnWpp) return;
        btnWpp.addEventListener('click', function(){
            var lastOrder = JSON.parse(localStorage.getItem('bf_orders')||'[]');
            if(!lastOrder.length) return;
            var o = lastOrder[lastOrder.length - 1];
            var msg = '🔹 *Pedido Confirmado* - B&F Importes\n\n';
            msg += '📦 *Pedido:* ' + o.id + '\n';
            msg += '📅 *Data:* ' + o.data + '\n';
            msg += '💳 *Pagamento:* ' + (o.pagamento === 'card' ? 'Cartão' : o.pagamento === 'pix' ? 'PIX' : 'Boleto') + '\n';
            msg += '💰 *Total:* R$ ' + parseFloat(o.total).toFixed(2).replace('.',',') + '\n\n';
            msg += '👤 *Cliente:* ' + o.cliente + '\n';
            msg += '📧 *E-mail:* ' + (o.email || '') + '\n\n';
            msg += '📋 *Itens:*\n';
            o.itens.forEach(function(item, i){
                msg += '  ' + (i+1) + '. ' + item.titulo + ' (' + item.qtd + 'x ' + item.preco + ')\n';
            });
            msg += '\nAcompanhe seus pedidos em: https://mrdragonrsn.github.io/bf-importes/';
            window.open('https://wa.me/5516981386747?text=' + encodeURIComponent(msg), '_blank');
        });
    })();

})();
(function(){
    try {
        var cfg = JSON.parse(localStorage.getItem('bf_config')||'{}');
        if(cfg.company){
            var fi = document.getElementById('footerInfo');
            if(fi) fi.textContent = '\u00A9 2026 ' + cfg.company + ' CNPJ: ' + (cfg.cnpj||'');
        }
    } catch(e) {}

    /* ── SYNC: BANNER ─────────────── */
    try {
        var banner = JSON.parse(localStorage.getItem('bf_banner')||'{}');
        if(banner.title){
            var ht = document.getElementById('heroTitle');
            if(ht) ht.innerHTML = (banner.title2 ? banner.title + '<br>' + banner.title2 : banner.title);
        }
        if(banner.subtitle){
            var hs = document.getElementById('heroSub');
            if(hs) hs.textContent = banner.subtitle;
        }
        if(banner.btnText){
            var hb = document.getElementById('heroBtn');
            if(hb) hb.textContent = banner.btnText;
        }
        if(banner.bgUrl){
            var heroSec = document.getElementById('heroSection');
            if(heroSec) heroSec.style.backgroundImage = 'url(' + banner.bgUrl + ')';
        }
        if(banner.bgColor){
            var heroSec = document.getElementById('heroSection');
            if(heroSec) heroSec.style.background = banner.bgColor;
        }
    } catch(e) {}

    /* ── SYNC: ANÚNCIOS ────────────── */
    try {
        var anun = JSON.parse(localStorage.getItem('bf_anuncios')||'[]');
        if(anun && anun.length > 0){
            var grid = document.getElementById('anunciosGrid');
            if(grid){
                var html = '';
                anun.forEach(function(a){
                    if(a.data){
                        html += '<img src="'+a.data+'" alt="'+(a.name||'Anúncio')+'" class="ad-img" loading="lazy">';
                    }
                });
                if(html) grid.innerHTML = html;
            }
        }
    } catch(e) {}
})();

/* ══════════════════════════════════════════════════════════════════
   MELHORIAS DE UX / ANIMAÇÕES / ACESSIBILIDADE (aditivo)
══════════════════════════════════════════════════════════════════ */
(function(){
    'use strict';

    /* ── LIGHTBOX (delegação de eventos) ─────────────────────────── */
    (function(){
        var lb = document.getElementById('lightbox');
        if (!lb) return;
        var img = document.getElementById('lightboxImg');
        var closeBtn = lb.querySelector('.lightbox-close');

        function closeLightbox(){ lb.classList.remove('active'); }
        function openLightbox(src, alt){
            if (img) { img.src = src; img.alt = alt || ''; }
            lb.classList.add('active');
        }

        /* abre ao clicar em qualquer imagem com a classe .ad-img */
        document.addEventListener('click', function(e){
            var ad = e.target.closest ? e.target.closest('.ad-img') : null;
            if (ad) { openLightbox(ad.src, ad.alt || ad.getAttribute('alt') || ''); }
        });

        /* fecha ao clicar no overlay (fora da imagem) ou no botão */
        lb.addEventListener('click', function(e){ if (e.target === lb) closeLightbox(); });
        if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
        document.addEventListener('keydown', function(e){
            if (e.key === 'Escape' && lb.classList.contains('active')) closeLightbox();
        });

        /* mantém compatibilidade com chamadas antigas */
        window.openLightbox = openLightbox;
    })();

    /* ── SCROLL REVEAL / FADE-UP (IntersectionObserver) ───────────── */
    (function(){
        // Aplica a classe .fade-up nos elementos-chave e um delay em cascata
        function applyFadeUp(){
            var groups = [
                '.section-title',
                '.section-subtitle',
                '.product-grid .product-card',
                '.diferencial-card',
                '.service-card',
                '.about-grid',
                '.contact-item'
            ];
            groups.forEach(function(selector){
                var items = document.querySelectorAll(selector);
                items.forEach(function(el, i){
                    if (el.classList.contains('fade-up')) return;
                    el.classList.add('fade-up');
                    el.style.transitionDelay = Math.min(i * 0.08, 0.6) + 's';
                });
            });
        }

        // Observa todos os .fade-up e revela quando entram na viewport
        function observeFadeUp(){
            var els = document.querySelectorAll('.fade-up');
            if (!('IntersectionObserver' in window)) {
                els.forEach(function(el){ el.classList.add('visible'); });
                return;
            }
            var observer = new IntersectionObserver(function(entries){
                entries.forEach(function(entry){
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        // limpa o delay após a entrada para não atrasar os hovers
                        entry.target.addEventListener('transitionend', function onEnd(){
                            entry.target.style.transitionDelay = '';
                            entry.target.removeEventListener('transitionend', onEnd);
                        });
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.15 });
            els.forEach(function(el){ observer.observe(el); });
        }

        // Revela o hero imediatamente após o carregamento, sem depender do
        // IntersectionObserver (que pode não disparar a tempo para o topo)
        function revealHero(){
            var hero = document.getElementById('heroSection');
            if (!hero || !hero.classList.contains('fade-up')) return;
            setTimeout(function(){
                hero.classList.add('visible');
                hero.style.transitionDelay = '';
            }, 50);
        }

        function init(){
            applyFadeUp();
            observeFadeUp();
            revealHero();
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    })();

    /* ── CARROSSEL DE DESTAQUES (autoplay + responsivo) ───────────── */
    (function(){
        var track = document.getElementById('featuredTrack');
        if (!track) return;

        var prevBtn = document.getElementById('featuredPrev');
        var nextBtn = document.getElementById('featuredNext');
        var dotsWrap = document.getElementById('featuredDots');
        var viewport = track.parentElement;

        var index = 0;
        var cardsPerView = 4;
        var autoplayTimer = null;
        var AUTOPLAY_MS = 4000;
        var cards = [];

        function cardsPerViewForWidth(){
            var w = window.innerWidth;
            if (w >= 1024) return 4;
            if (w >= 768) return 3;
            if (w >= 480) return 2;
            return 1;
        }

        function maxIndex(){
            return Math.max(0, cards.length - cardsPerView);
        }

        function update(){
            if(!cards.length) return;
            var gap = 20;
            cards.forEach(function(card){
                card.style.flex = '0 0 calc((100% - ' + (gap * (cardsPerView - 1)) + 'px) / ' + cardsPerView + ')';
            });
            var step = cards[0].getBoundingClientRect().width + gap;
            track.style.transform = 'translateX(' + (-index * step) + 'px)';

            if (dotsWrap) {
                var totalDots = maxIndex() + 1;
                dotsWrap.innerHTML = '';
                for (var i = 0; i < totalDots; i++) {
                    (function(slide){
                        var dot = document.createElement('button');
                        dot.type = 'button';
                        dot.className = 'carousel__dot' + (slide === index ? ' active' : '');
                        dot.setAttribute('aria-label', 'Ir para slide ' + (slide + 1));
                        dot.addEventListener('click', function(){
                            index = slide;
                            update();
                            restartAutoplay();
                        });
                        dotsWrap.appendChild(dot);
                    })(i);
                }
            }

            if (prevBtn) prevBtn.disabled = index === 0;
            if (nextBtn) nextBtn.disabled = index >= maxIndex();
        }

        function goNext(){
            index = index >= maxIndex() ? 0 : index + 1;
            update();
        }
        function goPrev(){
            index = index <= 0 ? maxIndex() : index - 1;
            update();
        }

        function startAutoplay(){
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            stopAutoplay();
            autoplayTimer = setInterval(goNext, AUTOPLAY_MS);
        }
        function stopAutoplay(){
            if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
        }
        function restartAutoplay(){ stopAutoplay(); startAutoplay(); }

        function init(){
            cards = Array.prototype.slice.call(track.children);
            if (!cards.length) return;
            cardsPerView = cardsPerViewForWidth();
            index = 0;
            update();
            startAutoplay();
        }

        // expõe re-inicialização após renderização dinâmica
        window.initFeaturedCarousel = init;

        if (nextBtn) nextBtn.addEventListener('click', function(){ goNext(); restartAutoplay(); });
        if (prevBtn) prevBtn.addEventListener('click', function(){ goPrev(); restartAutoplay(); });

        // pausa o autoplay ao passar o mouse
        viewport.addEventListener('mouseenter', stopAutoplay);
        viewport.addEventListener('mouseleave', startAutoplay);

        // suporte a toque (swipe) no mobile
        var startX = null;
        viewport.addEventListener('touchstart', function(e){
            startX = e.touches[0].clientX;
        }, { passive: true });
        viewport.addEventListener('touchend', function(e){
            if (startX === null) return;
            var dx = e.changedTouches[0].clientX - startX;
            startX = null;
            if (Math.abs(dx) > 40) {
                if (dx < 0) goNext(); else goPrev();
                restartAutoplay();
            }
        }, { passive: true });

        // recalcula ao redimensionar
        var resizeTimer;
        window.addEventListener('resize', function(){
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function(){
                cardsPerView = cardsPerViewForWidth();
                if (index > maxIndex()) index = maxIndex();
                update();
            }, 150);
        });

        // abre o modal do produto ao clicar em um card (sem redirecionar)
        track.addEventListener('click', function(e){
            var card = e.target.closest('.product-card');
            if (!card) return;
            if (typeof window.openProductModal === 'function') {
                window.openProductModal(card);
            }
        });

        // suporte a teclado (Enter/Espaço) para acessibilidade
        track.addEventListener('keydown', function(e){
            if (e.key !== 'Enter' && e.key !== ' ') return;
            var card = e.target.closest('.product-card');
            if (!card) return;
            e.preventDefault();
            if (typeof window.openProductModal === 'function') {
                window.openProductModal(card);
            }
        });

        init();
    })();
})();

/* ══════════════════════════════════════════════════════════════════
   ANÚNCIOS DINÂMICOS (Rotação aleatória de promos do Facebook)
══════════════════════════════════════════════════════════════════ */
(function(){
    'use strict';

    var PROMOS = [
        { img: '/assets/images/promos/promo1.jpg', tag: 'Locação Comercial', title: 'Economize com Locação de Impressoras', text: 'Solução ideal para empresas imprimirem sem custos extras com compra de equipamentos.', link: 'https://www.facebook.com/bfjaboticabal/posts/pfbid024EgBApiJszkqFSrxEWeMCvrf1scVPa3Z6WkNntgf3teMqEwQEXuLB8v2yX95d6nFl' },
        { img: '/assets/images/promos/promo2.jpg', tag: 'Suprimentos', title: 'Sua Impressora Pronta para a Semana', text: 'Inicie a semana com estoque de tintas e cartuchos renovados.', link: 'https://www.facebook.com/bfjaboticabal/posts/pfbid036BVL8xTLTJTzrUiErTCPvLgspjmxd2NfmG3xTPKFDwLp8oZRSHAjvbHf7a7dRy2Ml' },
        { img: '/assets/images/promos/promo3.svg', tag: 'Assistência Técnica', title: 'Luz Vermelha Piscando?', text: 'Se a sua impressora apresentou falha ou luz de alerta, chame nossa assistência especializada.', link: 'https://www.facebook.com/bfjaboticabal/posts/pfbid0TU7QFKtihHe6ApZBB9X11xAEgP8d2EwFjL7EdsQNiNQ61vtZY5rEVwE8sTgDcbBMl' },
        { img: '/assets/images/promos/promo4.jpg', tag: 'Planos Corporativos', title: 'Planos de Locação sem Custo Inicial', text: 'Equipamentos modernos com manutenção inclusa e flexibilidade para o seu negócio.', link: 'https://www.facebook.com/bfjaboticabal/posts/pfbid036SfnM8N1Vj8vm71FpriZt4SNRDjctN8uLrnMV3prwgZ7jqJtRgAmnkXHhheJ12QFl' },
        { img: '/assets/images/promos/promo5.jpg', tag: 'Loja Física', title: 'Recarga Rápida de Cartuchos', text: 'Traga seu cartucho até nossa loja física para recarga rápida com valor especial.', link: 'https://www.facebook.com/bfjaboticabal/posts/pfbid02UmnxVnfUTnjaLLRqmXDuPvcMEHoMVTEpp2xdLpiAgVkhUiLwMgRacgv4Q8Z7ELeul' },
        { img: '/assets/images/promos/promo6.jpg', tag: 'Solução Rápida', title: 'Papel em Branco? A Gente Resolve', text: 'Quando a folha sai em branco ou falhada, conte com a nossa assistência para voltar a imprimir.', link: 'https://www.facebook.com/bfjaboticabal/posts/pfbid02tdA6Uytg81ssnQ1nUkh2Lw4wBX4dhrGfUHerEtw9PZprCa65WqJfbXN6AXCxGPQCl' },
        { img: '/assets/images/promos/promo7.jpg', tag: 'Atendimento', title: 'Produtos com a Melhor Qualidade', text: 'Oferecemos a melhor qualidade e atendimento para nossos clientes. Vem pra B&F!', link: 'https://www.facebook.com/bfjaboticabal/posts/pfbid02ZzrKnC44gqEBc4DWccRSB9zSNmCQa5BhSNT3P7GYfDd1i5g5uV7wPeFxmVXgj3eVl' },
        { img: '/assets/images/promos/promo8.jpg', tag: 'Rotina', title: 'Hora de Voltar aos Trabalhos', text: 'Garanta todos os suprimentos necessários para manter a produtividade em dia.', link: 'https://www.facebook.com/bfjaboticabal/posts/pfbid0ERirNtEkeYAp1fpCbiXc8bFSYP5ZAK3HB14eHFEsSe6wnXADK4j5csFKx1vtcV2yl' },
        { img: '/assets/images/promos/promo9.jpg', tag: 'Referência', title: 'Referência em Impressoras e Cartuchos', text: 'Conheça nossos produtos e serviços e descubra por que somos referência na região.', link: 'https://www.facebook.com/bfjaboticabal/posts/pfbid0Ej5zF7EvFv6UDExkAfwvQKsgvpWCpokjwbpDDicLvAEp5qUFJELjQHsJrAnFCFonl' },
        { img: '/assets/images/promos/promo10.jpg', tag: 'Guia de Compra', title: 'Pensando em Comprar uma Impressora Nova?', text: 'Confira as dicas que podem ajudar na hora da decisão de compra.', link: 'https://www.facebook.com/bfjaboticabal/posts/pfbid02kSXipBp9ReXvxua6W6jTkjv8AYrPvE6nQpC5bEiSzyqxR5a6ZZqYzLL1SQiXHUthl' }
    ];

    function shuffle(arr){
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
        }
        return a;
    }

    function initPromos(){
        var slots = Array.prototype.slice.call(document.querySelectorAll('[data-promo-slot]'));
        if(!slots.length) return;

        var lastSelection = [];

        function applySelection(){
            var selection = shuffle(PROMOS).slice(0, slots.length);
            // evita repetir o mesmo anúncio no mesmo slot entre ciclos consecutivos
            slots.forEach(function(slot, idx){
                if(selection[idx] && lastSelection[idx] && selection[idx].img === lastSelection[idx].img){
                    var alt = PROMOS.find(function(p){ return p.img !== selection[idx].img && selection.indexOf(p) === -1; });
                    if(alt) selection[idx] = alt;
                }
            });
            lastSelection = selection;

            slots.forEach(function(slot, idx){
                var promo = selection[idx];
                if(!promo) return;
                var img = slot.querySelector('[data-promo-img]');
                var tag = slot.querySelector('[data-promo-tag]');
                var title = slot.querySelector('[data-promo-title]');
                var text = slot.querySelector('[data-promo-text]');
                var link = slot.querySelector('[data-promo-link]');

                slot.classList.add('is-swapping');
                setTimeout(function(){
                    if(img){ img.src = promo.img; img.alt = promo.title; }
                    if(tag) tag.textContent = promo.tag;
                    if(title) title.textContent = promo.title;
                    if(text) text.textContent = promo.text;
                    if(link) link.href = promo.link;
                    slot.classList.remove('is-swapping');
                }, 400);
            });
        }

        applySelection();
        setInterval(applySelection, 7000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPromos);
    } else {
        initPromos();
    }
})();
