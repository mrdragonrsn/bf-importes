function openLightbox(src){
    var lb = document.getElementById('lightbox');
    var img = document.getElementById('lightboxImg');
    if(lb && img){ img.src = src; lb.classList.add('active'); }
}

(function(){
    /* ── DADOS DOS PRODUTOS ─────────── */
    var productData = {
        'HP LaserJet Pro M404dn': {
            images: ['&#128424;','&#128196;','&#128295;','&#128203;'],
            stock: 12,
            longDesc: 'A HP LaserJet Pro M404dn é uma impressora monocromática de alto desempenho, ideal para escritórios que precisam de velocidade e qualidade. Com impressão duplex automática e velocidade de até 40 ppm, oferece produtividade sem abrir mão da segurança. Conexão Ethernet e USB, compatível com HP Smart e soluções de gerenciamento em nuvem. Bandeja de 250 folhas e bandeja multiuso para 100 folhas adicionais.'
        },
        'Epson EcoTank L3250': {
            images: ['&#128424;','&#127912;','&#128167;','&#128203;'],
            stock: 25,
            longDesc: 'A Epson EcoTank L3250 é a solução perfeita para quem busca economia. Com tanque de tinta de alta capacidade, imprime até 4.500 páginas em preto e 7.500 em cores sem se preocupar com cartuchos. Conexão Wi-Fi integrada, compatível com Epson Smart Panel. Impressão frente e verso manual, velocidade de 10 ppm em preto e 5 ppm em cores. Ideal para uso doméstico e pequenos escritórios.'
        },
        'Elgin i9': {
            images: ['&#129534;','&#128722;','&#128179;','&#128203;'],
            stock: 40,
            longDesc: 'A Elgin i9 é uma impressora térmica de cupom não fiscal de alta velocidade, atingindo até 250 mm/s. Com conexão USB, é perfeita para pontos de venda, comércios e estabelecimentos que exigem agilidade na emissão de comprovantes. Design robusto, guilhotina integrada e compatível com os principais sistemas de automação comercial do mercado.'
        },
        'Kit Fusor HP LaserJet': {
            images: ['&#9881;','&#128296;','&#128295;','&#128203;'],
            stock: 8,
            longDesc: 'O Kit Fusor para HP LaserJet é compatível com os modelos M402, M404, M426 e similares. Esta unidade de fusão de alta durabilidade garante impressões nítidas e sem falhas. Fabricado com materiais de qualidade premium, oferece vida útil estendida comparado aos fusores convencionais. Fácil instalação com guia passo a passo incluso. Testado individualmente antes do envio.'
        },
        'Brother DCP-L5652DN': {
            images: ['&#128424;','&#128224;','&#128196;','&#128203;'],
            stock: 6,
            longDesc: 'A Brother DCP-L5652DN é uma multifuncional laser monocromática completa. Com impressão duplex automática, scanner ADF para múltiplas páginas e conexão de rede, é a escolha certa para grupos de trabalho que precisam de alta produtividade. Velocidade de 40 ppm, bandeja de 250 folhas, display LCD touchscreen de 3,5". Ideal para escritórios de médio a grande porte.'
        },
        'Placa Lógica Principal': {
            images: ['&#128268;','&#128295;','&#128187;','&#128203;'],
            stock: 15,
            longDesc: 'Placa lógica principal compatível com diversas impressoras Epson. Revisada e testada individualmente antes do envio. Esta placa controladora é responsável pelo processamento central da impressora, gerenciando desde a comunicação com o computador até o controle dos motores e cabeçotes de impressão. Acompanha manual de instalação e garantia de 90 dias.'
        },
        'Zebra ZD421': {
            images: ['&#127991;','&#128230;','&#128203;','&#128295;'],
            stock: 10,
            longDesc: 'A Zebra ZD421 é uma impressora de etiquetas térmicas de alto desempenho com resolução de 203 dpi. Ideal para logística, almoxarifado e varejo. Conexão USB e Ethernet, compatível com as principais linguagens de impressão como ZPL e EPL. Design compacto e construção robusta para ambientes exigentes. Velocidade de impressão de até 152 mm/s.'
        },
        'Toner HP 58A Original': {
            images: ['&#128424;','&#128137;','&#128267;','&#128203;'],
            stock: 30,
            longDesc: 'O Toner HP 58A Original (CF258A) é o suprimento oficial para impressoras HP LaserJet. Com rendimento de até 3.000 páginas, garante impressões nítidas e de qualidade profissional. A tecnologia JetIntelligence da HP assegura desempenho consistente página após página, além de proteção contra falsificações. Fácil instalação, design de troca rápida.'
        }
    };

    /* ── SYNC FROM ADMIN ─────────────── */
    try {
        var adminStock = JSON.parse(localStorage.getItem('bf_stock')||'{}');
        var productGrid = document.querySelector('.product-grid');
        var defaultCatNames = {'impressoras':'Impressora','multifuncionais':'Multifuncional','pecas':'Peça','suprimentos':'Suprimento'};
        Object.keys(adminStock).forEach(function(name){
            if(adminStock[name]._deleted) return;
            if(!productData[name]){
                productData[name] = {
                    images: ['&#128424;','&#128196;','&#128295;','&#128203;'],
                    stock: adminStock[name].stock || 0,
                    longDesc: adminStock[name].longDesc || adminStock[name].desc || ''
                };
                if(productGrid && !document.querySelector('.product-card[data-name="'+name.replace(/"/g,'&quot;')+'"]')){
                    var p = adminStock[name];
                    var card = document.createElement('div');
                    card.className = 'product-card';
                    card.setAttribute('data-category', p.cat||'impressoras');
                    card.setAttribute('data-name', name);
                    var imgHtml = p.img ? '<img src="'+p.img+'" style="width:100%;height:100%;object-fit:cover;border-radius:8px 8px 0 0;">' : '&#128424;';
                    var priceStr = 'R$ ' + (parseFloat((p.price||'0').replace(',','.'))).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
                    var inst = parseFloat((p.price||'0').replace(',','.')) / (p.installments||10);
                    card.innerHTML = '<div class="thumb">'+imgHtml+'</div>' +
                        '<div class="body">' +
                            '<span class="cat">'+(defaultCatNames[p.cat]||p.cat||'Produto')+'</span>' +
                            '<h3>'+name+'</h3>' +
                            '<p class="desc">'+(p.desc||'')+'</p>' +
                            '<div class="stock-info" data-product="'+name+'"></div>' +
                            '<div class="price">'+priceStr+'</div>' +
                            '<div class="installment">ou '+(p.installments||10)+'x de R$ '+(inst.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})).replace('.',',')+'</div>' +
                        '</div>';
                    productGrid.appendChild(card);
                }
            }
            if(productData[name]){
                if(typeof adminStock[name].stock === 'number') productData[name].stock = adminStock[name].stock;
                if(adminStock[name].img) productData[name].img = adminStock[name].img;
            }
        });
    } catch(e){}

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
                var thumb = productData[item.title] && productData[item.title].images ? productData[item.title].images[0] : '&#128424;';
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
                var thumb = productData[item.title] && productData[item.title].images ? productData[item.title].images[0] : '&#128424;';
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
                var adminBtn = currentUser.role === 'admin' ? '<a href="admin/" class="user-menu-link" style="display:flex;align-items:center;gap:6px;padding:10px 18px;font-size:0.84rem;color:#334155;text-decoration:none;transition:background 0.15s;" onmouseover="this.style.background=\'var(--cinza-claro)\'" onmouseout="this.style.background=\'none\'">&#128736; Painel Admin</a>' : '';
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

        var btnL = document.getElementById('btnLogin');
        if (btnL) btnL.addEventListener('click', function(){
            var login = document.getElementById('loginEmail').value.trim();
            var pass = document.getElementById('loginPass').value;
            var u = users.find(function(u){ return (u.email === login || u.name === login) && u.pass === pass; });
            if (u) {
                currentUser = u;
                localStorage.setItem(SESSION_KEY, JSON.stringify(u));
                authOverlay.classList.remove('active');
                showToast('&#128100; Bem-vindo, ' + u.name + '!');
                setTimeout(function(){ location.reload(); }, 600);
            } else {
                var le = document.getElementById('loginError'); if (le) le.textContent = 'Usuário ou senha inválidos.';
            }
        });

        var btnR = document.getElementById('btnRegister');
        if (btnR) btnR.addEventListener('click', function(){
            var name = document.getElementById('regName').value.trim();
            var email = document.getElementById('regEmail').value.trim();
            var pass = document.getElementById('regPass').value;
            if (!name || !email || !pass) { var re = document.getElementById('regError'); if (re) re.textContent = 'Preencha todos os campos.'; return; }
            if (pass.length < 4) { var re = document.getElementById('regError'); if (re) re.textContent = 'Senha deve ter ao menos 4 caracteres.'; return; }
            if (users.find(function(u){ return u.email === email; })) { var re = document.getElementById('regError'); if (re) re.textContent = 'Este e-mail já está cadastrado.'; return; }
            var newUser = {name: name, email: email, pass: pass, role: 'user'};
            users.push(newUser);
            saveUsers(users);
            currentUser = newUser;
            localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
            authOverlay.classList.remove('active');
            showToast('&#127881; Conta criada com sucesso!');
            setTimeout(function(){ location.reload(); }, 600);
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
            if(u) { u.pass = p1; saveUsers(users); }
            var rd = getReset();
            delete rd[email];
            saveReset(rd);
            authOverlay.classList.remove('active');
            if(boxReset) boxReset.style.display = 'none';
            showToast('&#9989; Senha redefinida com sucesso!');
            var le = document.getElementById('loginError'); if(le) le.textContent = '';
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
            var btn = e.target.closest('.add-to-cart');
            if (btn) {
                e.stopPropagation();
                var card = btn.closest('.product-card');
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

        var btns = document.querySelectorAll('.filter-btn');
        var cards = document.querySelectorAll('.product-card');
        btns.forEach(function(btn){
            btn.addEventListener('click', function(){
                btns.forEach(function(b){ b.classList.remove('active'); });
                btn.classList.add('active');
                var filter = btn.getAttribute('data-filter');
                cards.forEach(function(card){
                    if (filter === 'todas' || card.getAttribute('data-category') === filter) {
                        card.classList.remove('hidden');
                    } else {
                        card.classList.add('hidden');
                    }
                });
            });
        });
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

                if (mainImg) {
                    var productImg = null;
                    try {
                        var stock = JSON.parse(localStorage.getItem('bf_stock')||'{}');
                        if (stock[title] && stock[title].img) productImg = stock[title].img;
                    } catch(e){}
                    if (productImg) {
                        mainImg.innerHTML = '<img src="'+productImg+'" style="width:100%;height:100%;object-fit:contain;border-radius:10px;">';
                    } else {
                        mainImg.innerHTML = data.images[0];
                    }
                }

                if (thumbs) {
                    thumbs.innerHTML = '';
                    data.images.forEach(function(img, idx){
                        var t = document.createElement('div');
                        t.className = 'modal-thumb' + (idx === 0 ? ' active' : '');
                        t.innerHTML = img;
                        t.addEventListener('click', function(){
                            if (mainImg) mainImg.innerHTML = img;
                            var all = thumbs.querySelectorAll('.modal-thumb');
                            all.forEach(function(a){ a.classList.remove('active'); });
                            t.classList.add('active');
                        });
                        thumbs.appendChild(t);
                    });
                    try {
                        var stock = JSON.parse(localStorage.getItem('bf_stock')||'{}');
                        if (stock[title] && stock[title].img) {
                            var imgThumb = document.createElement('div');
                            imgThumb.className = 'modal-thumb';
                            imgThumb.innerHTML = '<img src="'+stock[title].img+'" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">';
                            imgThumb.addEventListener('click', function(){
                                if (mainImg) mainImg.innerHTML = '<img src="'+stock[title].img+'" style="width:100%;height:100%;object-fit:contain;border-radius:10px;">';
                                var all = thumbs.querySelectorAll('.modal-thumb');
                                all.forEach(function(a){ a.classList.remove('active'); });
                                imgThumb.classList.add('active');
                            });
                            thumbs.insertBefore(imgThumb, thumbs.firstChild);
                        }
                    } catch(e){}
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

    /* ── BARRA DE BUSCA ──────────────── */
    (function(){
        var searchWrap = document.getElementById('headerSearchWrap');
        if(!searchWrap) return;
        var input = document.getElementById('headerSearch');
        if(!input) return;

        function doSearch(){
            var term = input.value.trim().toLowerCase();
            var cards = document.querySelectorAll('.product-card');
            var found = 0;
            cards.forEach(function(card){
                var title = (card.querySelector('h3')||{}).textContent||'';
                var desc = (card.querySelector('.desc')||{}).textContent||'';
                if(!term || title.toLowerCase().indexOf(term) !== -1 || desc.toLowerCase().indexOf(term) !== -1){
                    card.classList.remove('hidden-by-search');
                    found++;
                } else {
                    card.classList.add('hidden-by-search');
                }
            });
            var noResults = document.getElementById('searchNoResults');
            if(noResults){
                noResults.style.display = (term && found === 0) ? 'block' : 'none';
            }

            var allCards = document.querySelectorAll('.product-card');
            if(!term){
                document.querySelectorAll('.filter-btn').forEach(function(b){ b.classList.remove('active'); });
                var btnTodos = document.querySelector('.filter-btn[data-filter="todas"]');
                if(btnTodos) btnTodos.classList.add('active');
            }
        }

        input.addEventListener('input', doSearch);
        var searchBtn = document.getElementById('headerSearchBtn');
        if(searchBtn) searchBtn.addEventListener('click', doSearch);
        input.addEventListener('keydown', function(e){ if(e.key==='Escape'){ input.value=''; doSearch(); input.blur(); } });
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
                        html += '<img src="'+a.data+'" alt="'+(a.name||'Anúncio')+'" style="width:100%;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,.08);cursor:pointer;transition:transform .3s;" onclick="openLightbox(this.src)" onmouseover="this.style.transform=\'scale(1.03)\'" onmouseout="this.style.transform=\'scale(1)\'">';
                    }
                });
                if(html) grid.innerHTML = html;
            }
        }
    } catch(e) {}
})();
