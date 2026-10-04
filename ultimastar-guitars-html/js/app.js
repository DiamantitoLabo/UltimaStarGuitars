/* UltimaStar Guitars — carrito compartido entre páginas (localStorage) */
(function () {
  "use strict";

  var PRODUCTS = {
    schecter: {
      name: "Schecter Guitar Research Synyster Custom-S",
      price: 1599.99,
      img: "img/schecter-synyster-custom-s.jpg",
      alt: "Guitarra eléctrica Schecter Synyster Custom-S negra con franjas doradas verticales",
      page: "producto-schecter.html"
    },
    squier: {
      name: "Squier Affinity Series Stratocaster",
      price: 320.0,
      img: "img/squier-affinity-stratocaster.jpg",
      alt: "Guitarra eléctrica Squier Affinity Stratocaster blanca con golpeador blanco y mástil de arce",
      page: "producto-squier.html"
    },
    mesa: {
      name: "MESA/Boogie Mark VII 1×12 90W Tube Guitar Combo Amp",
      price: 3849.0,
      img: "img/mesa-mark-vii.jpg",
      alt: "Amplificador combo MESA/Boogie Mark VII negro con panel de perillas superior",
      page: "producto-mesa.html"
    },
    marshall: {
      name: "Marshall MG15GFX 15W 1×8 Guitar Combo Amp",
      price: 199.99,
      img: "img/marshall-mg15gfx.jpg",
      alt: "Amplificador combo Marshall MG15GFX negro con panel de control dorado",
      page: "producto-marshall.html"
    }
  };

  var KEY = "ultimastar-cart";
  var memoryCart = {};

  function readCart() {
    try {
      var raw = window.localStorage.getItem(KEY);
      var data = raw ? JSON.parse(raw) : {};
      // Solo se aceptan productos conocidos con cantidades válidas
      var clean = {};
      Object.keys(data).forEach(function (id) {
        var q = parseInt(data[id], 10);
        if (PRODUCTS[id] && q > 0) clean[id] = q;
      });
      return clean;
    } catch (e) {
      return Object.assign({}, memoryCart);
    }
  }

  function writeCart(cart) {
    memoryCart = Object.assign({}, cart);
    try { window.localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { /* sin almacenamiento */ }
  }

  function addItem(id) {
    var cart = readCart();
    cart[id] = (cart[id] || 0) + 1;
    writeCart(cart);
  }

  function removeItem(id) {
    var cart = readCart();
    delete cart[id];
    writeCart(cart);
  }

  function clearCart() { writeCart({}); }

  function count(cart) {
    return Object.keys(cart).reduce(function (n, id) { return n + cart[id]; }, 0);
  }

  function total(cart) {
    return Object.keys(cart).reduce(function (s, id) { return s + PRODUCTS[id].price * cart[id]; }, 0);
  }

  var fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  function money(n) { return fmt.format(n); }

  /* ---------- Contador del carrito en el encabezado ---------- */
  function updateBadge() {
    var link = document.querySelector("[data-cart-link]");
    if (!link) return;
    var n = count(readCart());
    var badge = link.querySelector(".cart-count");
    badge.textContent = n > 0 ? String(n) : "";
    link.setAttribute("aria-label",
      n === 0 ? "Carrito, vacío" : "Carrito, " + n + (n === 1 ? " producto" : " productos"));
  }

  /* ---------- Diálogos ---------- */
  var lastFocus = null;

  function openDialog(dlg) {
    lastFocus = document.activeElement;
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
  }

  function closeDialog(dlg) {
    if (typeof dlg.close === "function") dlg.close();
    else dlg.removeAttribute("open");
  }

  function wireDialog(dlg) {
    dlg.addEventListener("close", function () {
      if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus();
    });
    dlg.querySelectorAll("[data-close]").forEach(function (b) {
      b.addEventListener("click", function () { closeDialog(dlg); });
    });
    // Clic en el fondo cierra el diálogo
    dlg.addEventListener("click", function (e) { if (e.target === dlg) closeDialog(dlg); });
  }

  /* ---------- Página de producto: añadir al carrito ---------- */
  function initAddButton() {
    var btn = document.querySelector("[data-add]");
    if (!btn) return;
    var dlg = document.getElementById("dlg-added");
    wireDialog(dlg);
    btn.addEventListener("click", function () {
      addItem(btn.getAttribute("data-add"));
      updateBadge();
      openDialog(dlg);
    });
  }

  /* ---------- Listas del carrito (carrito y pago) ---------- */
  var pendingRemoval = null;

  function renderList(container) {
    var cart = readCart();
    var ids = Object.keys(cart);
    var list = container.querySelector("[data-cart-list]");
    var empty = container.querySelector("[data-cart-empty]");
    list.innerHTML = "";

    ids.forEach(function (id) {
      var p = PRODUCTS[id];
      var li = document.createElement("li");
      li.className = "cart-item";

      var img = document.createElement("img");
      img.src = p.img;
      img.alt = p.alt;
      img.width = 86; img.height = 86;

      var info = document.createElement("div");
      var name = document.createElement("p");
      name.className = "name";
      name.textContent = p.name;
      var price = document.createElement("p");
      price.className = "price";
      price.textContent = money(p.price);
      info.appendChild(name);
      info.appendChild(price);
      if (cart[id] > 1) {
        var qty = document.createElement("p");
        qty.className = "qty";
        qty.textContent = "Cantidad: " + cart[id];
        info.appendChild(qty);
      }

      var actions = document.createElement("div");
      actions.className = "actions";
      var rm = document.createElement("button");
      rm.type = "button";
      rm.className = "btn-remove";
      rm.textContent = "Eliminar";
      rm.setAttribute("aria-label", "Eliminar " + p.name + " del carrito");
      rm.addEventListener("click", function () {
        pendingRemoval = id;
        openDialog(document.getElementById("dlg-remove"));
      });
      actions.appendChild(rm);

      li.appendChild(img);
      li.appendChild(info);
      li.appendChild(actions);
      list.appendChild(li);
    });

    list.hidden = ids.length === 0;
    if (empty) empty.hidden = ids.length !== 0;

    document.querySelectorAll("[data-cart-total]").forEach(function (el) {
      el.textContent = money(total(cart));
    });
    document.querySelectorAll("[data-needs-items]").forEach(function (el) {
      el.hidden = ids.length === 0;
    });
  }

  function initCartLists() {
    var container = document.querySelector("[data-cart]");
    if (!container) return;
    var dlg = document.getElementById("dlg-remove");
    wireDialog(dlg);
    var status = document.getElementById("cart-status");

    dlg.querySelector("[data-confirm]").addEventListener("click", function () {
      if (pendingRemoval) {
        var name = PRODUCTS[pendingRemoval].name;
        removeItem(pendingRemoval);
        pendingRemoval = null;
        // Tras eliminar, el foco va al título de la lista (el botón ya no existe)
        lastFocus = container.querySelector("[data-focus-target]");
        renderList(container);
        updateBadge();
        closeDialog(dlg);
        if (status) status.textContent = name + " eliminado del carrito. Total: " + money(total(readCart())) + ".";
      }
    });
    dlg.addEventListener("close", function () { pendingRemoval = null; });

    renderList(container);
  }

  /* ---------- Formulario de pago (sin validación) ---------- */
  function initCheckout() {
    var form = document.getElementById("checkout-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearCart();
      window.location.href = "gracias.html";
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    updateBadge();
    initAddButton();
    initCartLists();
    initCheckout();
  });

  // Mantener sincronizadas varias pestañas
  window.addEventListener("storage", function (e) {
    if (e.key !== KEY) return;
    updateBadge();
    var c = document.querySelector("[data-cart]");
    if (c) renderList(c);
  });
})();
