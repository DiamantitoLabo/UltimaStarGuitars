/* UltimaStar Guitars — carrito compartido entre páginas (localStorage) */
(function () {
  "use strict";

  var PRODUCTS = {
    schecter: {
      name: "Guitarra eléctrica Schecter Synyster Custom-S",
      price: 1599.99,
      img: "img/schecter-synyster-custom-s.jpg",
      alt: "Guitarra eléctrica Schecter Synyster Custom-S negra con franjas doradas verticales",
      page: "producto-schecter.html"
    },
    squier: {
      name: "Guitarra eléctrica Squier Stratocaster serie Affinity",
      price: 320.0,
      img: "img/squier-affinity-stratocaster.jpg",
      alt: "Guitarra eléctrica Squier Affinity Stratocaster blanca con golpeador blanco y mástil de arce",
      page: "producto-squier.html"
    },
    mesa: {
      name: "Amplificador a válvulas MESA/Boogie Mark VII 1×12 de 90 W",
      price: 3849.0,
      img: "img/mesa-mark-vii.jpg",
      alt: "Amplificador combo MESA/Boogie Mark VII negro con panel de perillas superior",
      page: "producto-mesa.html"
    },
    marshall: {
      name: "Amplificador Marshall MG15GFX 1×8 de 15 W",
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

  function removeOne(id) {
    var cart = readCart();
    if (!cart[id]) return;
    cart[id] -= 1;
    if (cart[id] <= 0) delete cart[id];
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
  // { id, one }: one = true quita una unidad; false elimina el producto completo
  var pendingRemoval = null;
  var REMOVE_TITLES = {
    all: "¿Seguro que deseas eliminar este producto del carrito?",
    one: "¿Seguro que deseas quitar una unidad de este producto?"
  };

  function askRemoval(id, one) {
    var dlg = document.getElementById("dlg-remove");
    document.getElementById("dlg-remove-title").textContent = one ? REMOVE_TITLES.one : REMOVE_TITLES.all;
    pendingRemoval = { id: id, one: one };
    openDialog(dlg);
  }

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
      if (cart[id] > 1) {
        var one = document.createElement("button");
        one.type = "button";
        one.className = "btn-remove";
        one.textContent = "Quitar uno";
        one.setAttribute("data-remove-one", id);
        one.setAttribute("aria-label", "Quitar una unidad de " + p.name);
        one.addEventListener("click", function () { askRemoval(id, true); });
        actions.appendChild(one);
      }
      var rm = document.createElement("button");
      rm.type = "button";
      rm.className = "btn-remove";
      rm.textContent = "Eliminar";
      rm.setAttribute("data-remove", id);
      rm.setAttribute("aria-label", "Eliminar " + p.name + " del carrito");
      rm.addEventListener("click", function () { askRemoval(id, false); });
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
        var id = pendingRemoval.id;
        var one = pendingRemoval.one;
        var name = PRODUCTS[id].name;
        if (one) removeOne(id); else removeItem(id);
        pendingRemoval = null;
        renderList(container);
        updateBadge();
        // El foco vuelve al mismo producto si sigue en la lista; si no, al título
        lastFocus = container.querySelector('[data-remove-one="' + id + '"]') ||
          container.querySelector('[data-remove="' + id + '"]') ||
          container.querySelector("[data-focus-target]");
        closeDialog(dlg);
        if (status) {
          status.textContent = (one ? "Se quitó una unidad de " + name : name + " eliminado del carrito") +
            ". Total: " + money(total(readCart())) + ".";
        }
      }
    });
    dlg.addEventListener("close", function () { pendingRemoval = null; });

    renderList(container);
  }

  /* ---------- Formulario de pago ---------- */
  var EMPTY_MSG = "Este campo no puede quedar vacío.";

  var MIN_YEAR = 2026;

  function fieldError(input) {
    var value = input.value.trim();
    if (!value) return EMPTY_MSG;
    if (input.id === "tarjeta" && !/^\d{16}$/.test(value)) {
      return "El número de tarjeta debe tener exactamente 16 dígitos.";
    }
    if (input.id === "anio" && parseInt(value, 10) < MIN_YEAR) {
      return "El año no puede ser anterior a " + MIN_YEAR + ".";
    }
    if (input.id === "mes") {
      var year = parseInt(document.getElementById("anio").value, 10);
      var now = new Date();
      if (year === now.getFullYear() && parseInt(value, 10) < now.getMonth() + 1) {
        return "Esta fecha de vencimiento ya pasó.";
      }
    }
    return "";
  }

  function showFieldError(input, msg) {
    var id = input.id + "-error";
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement("p");
      el.id = id;
      el.className = "field-error";
      input.parentNode.appendChild(el);
    }
    el.textContent = msg;
    el.hidden = !msg;
    input.classList.toggle("invalid", !!msg);
    if (msg) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");

    var described = (input.getAttribute("aria-describedby") || "").split(" ").filter(function (x) { return x && x !== id; });
    if (msg) described.push(id);
    if (described.length) input.setAttribute("aria-describedby", described.join(" "));
    else input.removeAttribute("aria-describedby");
  }

  function initCheckout() {
    var form = document.getElementById("checkout-form");
    if (!form) return;
    var alertBox = document.getElementById("form-alert");
    var inputs = Array.prototype.slice.call(form.querySelectorAll("input, select"));
    var card = document.getElementById("tarjeta");

    card.addEventListener("input", function () {
      var digits = card.value.replace(/\D/g, "").slice(0, 16);
      if (digits !== card.value) card.value = digits;
    });

    // Una vez marcado un error, se re-evalúa mientras el usuario corrige
    inputs.forEach(function (input) {
      var evt = input.tagName === "SELECT" ? "change" : "input";
      input.addEventListener(evt, function () {
        if (input.classList.contains("invalid")) showFieldError(input, fieldError(input));
        if (input.id === "anio") {
          var month = document.getElementById("mes");
          if (month.value) showFieldError(month, fieldError(month));
        }
        if (alertBox.textContent && !form.querySelector(".invalid") && count(readCart()) > 0) alertBox.textContent = "";
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (count(readCart()) === 0) {
        alertBox.textContent = "Tu carrito está vacío. Agrega al menos un producto antes de completar la compra.";
        return;
      }
      var firstInvalid = null;
      var anyEmpty = false;
      inputs.forEach(function (input) {
        var msg = fieldError(input);
        showFieldError(input, msg);
        if (msg === EMPTY_MSG) anyEmpty = true;
        if (msg && !firstInvalid) firstInvalid = input;
      });

      if (firstInvalid) {
        alertBox.textContent = anyEmpty
          ? "No puedes dejar campos vacíos. Revisa los campos marcados en rojo."
          : "Revisa los campos marcados en rojo.";
        firstInvalid.focus();
        return;
      }

      alertBox.textContent = "";
      clearCart();
      window.location.href = "gracias.html";
    });
  }

  /* ---------- Reseñas (prototipo: no se guardan) ---------- */
  function updateReviewSummary(list) {
    var summary = document.querySelector("[data-review-summary]");
    if (!summary) return;
    var ratings = Array.prototype.map.call(list.querySelectorAll(".review .stars"), function (s) {
      return (s.textContent.match(/★/g) || []).length;
    });
    var avg = ratings.reduce(function (a, b) { return a + b; }, 0) / ratings.length;
    var rounded = Math.round(avg);
    summary.textContent = avg.toFixed(1) + " de 5 · " + ratings.length + (ratings.length === 1 ? " reseña" : " reseñas");
    summary.previousElementSibling.textContent = "★★★★★".slice(0, rounded) + "☆☆☆☆☆".slice(rounded);
  }

  function initReviewForm() {
    var form = document.querySelector("[data-review-form]");
    if (!form) return;
    var list = document.querySelector("[data-review-list]");
    var status = form.querySelector("[data-review-status]");
    var nameInput = form.querySelector("#review-name");
    var textInput = form.querySelector("#review-text");
    var dateFmt = new Intl.DateTimeFormat("es-EC", { day: "numeric", month: "long", year: "numeric" });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var checked = form.querySelector("input[name=rating]:checked");
      var name = nameInput.value.trim();
      var text = textInput.value.trim();

      if (!checked || !name || !text) {
        status.className = "review-status is-error";
        status.textContent = "Elige una calificación y completa tu nombre y tu opinión.";
        (!checked ? form.querySelector("input[name=rating]") : !name ? nameInput : textInput).focus();
        return;
      }

      var rating = parseInt(checked.value, 10);
      var now = new Date();
      var li = document.createElement("li");
      li.className = "review is-new";
      var head = document.createElement("div");
      head.className = "review-head";
      var stars = document.createElement("span");
      stars.className = "stars";
      stars.setAttribute("aria-hidden", "true");
      stars.textContent = "★★★★★".slice(0, rating) + "☆☆☆☆☆".slice(rating);
      var sr = document.createElement("span");
      sr.className = "visually-hidden";
      sr.textContent = "Calificación: " + rating + " de 5.";
      var author = document.createElement("strong");
      author.className = "review-author";
      author.textContent = name;
      var time = document.createElement("time");
      time.dateTime = now.toISOString().slice(0, 10);
      time.textContent = dateFmt.format(now);
      head.appendChild(stars);
      head.appendChild(sr);
      head.appendChild(author);
      head.appendChild(time);
      var body = document.createElement("p");
      body.textContent = text;
      li.appendChild(head);
      li.appendChild(body);
      list.insertBefore(li, list.firstChild);
      updateReviewSummary(list);

      form.reset();
      status.className = "review-status";
      status.textContent = "¡Gracias por tu opinión! (Vista previa: la reseña no se guarda.)";
    });
  }

  /* ---------- Saltar al contenido ---------- */
  // El tabindex solo existe mientras dura el salto; si fuera permanente, cualquier
  // clic dentro de <main> lo enfocaría y el lector anunciaría "punto de referencia principal".
  function initSkipLink() {
    var link = document.querySelector(".skip-link");
    var main = document.getElementById("contenido");
    if (!link || !main) return;
    link.addEventListener("click", function (e) {
      e.preventDefault();
      main.setAttribute("tabindex", "-1");
      main.focus();
      main.addEventListener("blur", function () { main.removeAttribute("tabindex"); }, { once: true });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initSkipLink();
    initReviewForm();
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
