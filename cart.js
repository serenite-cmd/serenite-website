// ===== Serenité shared cart logic =====
(function () {
  const CART_KEY = 'serenite_cart';

  // --- Storage ---
  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch { return []; }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    refreshCartUI();
  }

  // --- Calculations ---
  function cartSubtotal() {
    return loadCart().reduce((s, i) => s + i.qty * i.price, 0);
  }

  // --- API ---
  function addToCart(item) {
    // expects: { id, title, price, image, qty? }
    const cart = loadCart();
    const found = cart.find(c => c.id === item.id);
    const qty = Math.max(1, item.qty || 1);
    if (found) found.qty += qty;
    else cart.push({ id: item.id, title: item.title, price: item.price, image: item.image, qty });
    saveCart(cart);
    showBanner(`${item.title} added to cart`);
    openCart();
  }

  function setQty(id, qty) {
    const cart = loadCart()
      .map(c => c.id === id ? { ...c, qty: Math.max(0, qty) } : c)
      .filter(c => c.qty > 0);
    saveCart(cart);
  }

  function removeFromCart(id) {
    saveCart(loadCart().filter(c => c.id !== id));
  }

  // --- UI Elements (optional on pages) ---
  const els = {
    drawer: null, backdrop: null, items: null, count: null, subtotal: null, banner: null,
    openBtn: null, closeBtn: null, proceedBtn: null,
  };

  function queryUI() {
    els.drawer   = document.getElementById('cartDrawer');
    els.backdrop = document.getElementById('backdrop');
    els.items    = document.getElementById('cartItems');
    els.count    = document.getElementById('cartCount');
    els.subtotal = document.getElementById('cartSubtotal');
    els.banner   = document.getElementById('banner');
    els.openBtn  = document.getElementById('openCartBtn');
    els.closeBtn = document.getElementById('closeCartBtn');
    els.proceedBtn = document.getElementById('proceedCheckout');
  }

  // --- Drawer ---
  function openCart() {
    if (!els.drawer || !els.backdrop) return;
    els.drawer.classList.add('open');
    els.drawer.setAttribute('aria-hidden', 'false');
    els.backdrop.style.display = 'block';
    refreshCartUI();
  }

  function closeCart() {
    if (!els.drawer || !els.backdrop) return;
    els.drawer.classList.remove('open');
    els.drawer.setAttribute('aria-hidden', 'true');
    els.backdrop.style.display = 'none';
  }

  // --- Banner (optional) ---
  let bannerTimer = null;
  function showBanner(text) {
    if (!els.banner) return;
    els.banner.textContent = text;
    els.banner.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => els.banner.classList.remove('show'), 1700);
  }

  // --- Render UI (safe if elements don’t exist) ---
  function refreshCartUI() {
    if (!els.items) return; // page without drawer
    const cart = loadCart();
    els.items.innerHTML = '';
    cart.forEach(item => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <img src="${item.image}" alt="">
        <div style="flex:1">
          <div style="font-weight:700">${escapeHtml(item.title)}</div>
          <div class="small" style="color:var(--muted)">$${item.price.toFixed(2)} × ${item.qty}</div>
          <div style="margin-top:6px;display:flex;gap:8px;align-items:center">
            <button class="btn btn-ghost" data-dec="${item.id}">−</button>
            <div class="small">${item.qty}</div>
            <button class="btn btn-ghost" data-inc="${item.id}">+</button>
            <button class="btn btn-ghost" data-remove="${item.id}">Remove</button>
          </div>
        </div>
      `;
      els.items.appendChild(row);
    });

    if (els.count)   els.count.innerText   = cart.reduce((s, i) => s + i.qty, 0);
    if (els.subtotal) els.subtotal.innerText = '$' + cartSubtotal().toFixed(2);

    // qty/remove handlers
    els.items.querySelectorAll('[data-dec]').forEach(b => b.onclick = () => {
      const id = b.getAttribute('data-dec');
      const found = loadCart().find(i => i.id === id);
      setQty(id, (found?.qty || 1) - 1);
    });
    els.items.querySelectorAll('[data-inc]').forEach(b => b.onclick = () => {
      const id = b.getAttribute('data-inc');
      const found = loadCart().find(i => i.id === id);
      setQty(id, (found?.qty || 0) + 1);
    });
    els.items.querySelectorAll('[data-remove]').forEach(b => b.onclick = () => {
      const id = b.getAttribute('data-remove');
      removeFromCart(id);
    });
  }

  // --- Helpers ---
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
  }

  // --- Wiring (only if elements exist) ---
  function wirePage() {
    queryUI();

    // header buttons
    if (els.openBtn)  els.openBtn.onclick  = openCart;
    if (els.closeBtn) els.closeBtn.onclick = closeCart;

    // prevent clicks inside drawer from closing it
    if (els.drawer) {
      els.drawer.addEventListener('click', (e) => e.stopPropagation());
    }

    // click outside to close
    document.addEventListener('click', (e) => {
      if (!els.drawer || !els.backdrop) return;
      const clickedOpenBtn = e.target.closest && e.target.closest('#openCartBtn');
      const clickedInsideDrawer = els.drawer.contains(e.target);
      if (
        els.drawer.classList.contains('open') &&
        !clickedInsideDrawer &&
        !clickedOpenBtn
      ) {
        closeCart();
      }
    });

    // backdrop click closes drawer
    if (els.backdrop) els.backdrop.onclick = closeCart;

    // any element with data-open-cart opens the drawer
    document.querySelectorAll('[data-open-cart]').forEach(a => {
      a.addEventListener('click', (e) => { e.preventDefault(); openCart(); });
    });

    // initial paint
    refreshCartUI();
  }

  // expose minimal API
  window.cartAPI = { addToCart, loadCart, saveCart, refreshCartUI, openCart, closeCart };

  document.addEventListener('DOMContentLoaded', wirePage);
})();
