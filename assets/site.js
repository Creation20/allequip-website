// AllEquip site behaviour. Everything here is an enhancement: with it off,
// every page still reads, every link works and the form still opens email.
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Mobile menu: the hamburger opens the whole nav as a panel under the header.
  var toggle = $(".menu-toggle"), nav = $("#site-nav");
  var setNav = function (open) {
    if (!toggle || !nav) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  };
  if (toggle && nav) toggle.addEventListener("click", function () { setNav(!nav.classList.contains("is-open")); });

  // Products dropdown. A button that opens a panel: click or tap toggles it,
  // a mouse opens it on hover (desktop), Esc or a click elsewhere closes it,
  // and the arrow keys move between its links.
  var desktop = window.matchMedia("(min-width: 981px)");
  $$(".has-menu").forEach(function (item) {
    var btn = $(".nav-trigger", item), menu = $(".menu", item), timer;
    if (!btn || !menu) return;
    var links = $$("a", menu);
    var set = function (open) {
      item.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    };
    btn.addEventListener("click", function (e) { e.stopPropagation(); set(!item.classList.contains("is-open")); });
    item.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse" && desktop.matches) { clearTimeout(timer); set(true); } });
    item.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse" && desktop.matches) { timer = setTimeout(function () { set(false); }, 140); } });
    item.addEventListener("keydown", function (e) {
      var i = links.indexOf(document.activeElement);
      if (e.key === "Escape") { set(false); btn.focus(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); set(true); links[Math.min(i + 1, links.length - 1)].focus(); }
      else if (e.key === "ArrowUp" && i > -1) { e.preventDefault(); (i === 0 ? btn : links[i - 1]).focus(); }
    });
    item.addEventListener("focusout", function (e) { if (desktop.matches && !item.contains(e.relatedTarget)) set(false); });
    document.addEventListener("click", function (e) { if (!item.contains(e.target)) set(false); });
    // Choosing a link (often a #category on the same page) closes the menus.
    links.forEach(function (a) { a.addEventListener("click", function () { set(false); setNav(false); }); });
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav && nav.classList.contains("is-open")) { setNav(false); toggle.focus(); } });
  desktop.addEventListener && desktop.addEventListener("change", function () { setNav(false); });

  // A hairline under the header once the page scrolls.
  var header = $(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Sections ease in once as they come into view (never for reduced motion).
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var reveals = $$(".reveal");
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
    // Safety net: anything still hidden after a while is shown anyway.
    setTimeout(function () { reveals.forEach(function (el) { el.classList.add("is-visible"); }); }, 4000);
  } else reveals.forEach(function (el) { el.classList.add("is-visible"); });

  // Year in the footer.
  $$("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  // Parts catalogue: search box and category filters.
  var parts = $$(".part");
  var search = $("#part-search"), filters = $$(".filter"), count = $("#parts-count"), empty = $("#parts-empty");
  if (parts.length && (search || filters.length)) {
    var active = "all";
    var apply = function () {
      var q = (search ? search.value : "").trim().toLowerCase();
      var shown = 0;
      parts.forEach(function (p) {
        var ok = (active === "all" || p.getAttribute("data-cat") === active) && (!q || p.getAttribute("data-text").indexOf(q) !== -1);
        p.hidden = !ok; if (ok) shown++;
      });
      if (count) count.textContent = shown + (shown === 1 ? " part" : " parts");
      if (empty) empty.hidden = shown !== 0;
    };
    filters.forEach(function (f) {
      f.addEventListener("click", function () {
        active = f.getAttribute("data-filter");
        filters.forEach(function (x) { x.setAttribute("aria-pressed", x === f ? "true" : "false"); });
        apply();
      });
    });
    if (search) search.addEventListener("input", apply);
    // Arriving from a category link (products.html#brakes) opens that filter.
    var fromHash = function () {
      var hash = (location.hash || "").slice(1);
      var pre = filters.filter(function (f) { return f.getAttribute("data-filter") === hash; })[0];
      if (pre) { pre.click(); return true; }
      return false;
    };
    if (!fromHash()) apply();
    // The header's Products menu links to #category on this same page too.
    window.addEventListener("hashchange", function () {
      if (fromHash()) { var top = $(".catalogue-tools"); if (top) top.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
    });
  }

  // Quote form: filled in from the part finder or an "Ask for price" link,
  // then opens the visitor's email app with the request written out.
  var form = $("#quote-form");
  if (form) {
    var params = new URLSearchParams(location.search);
    var msg = form.elements.message, cat = form.elements.category;
    if (params.get("part") && msg && !msg.value) msg.value = params.get("part") + (params.get("qty") ? " × " + params.get("qty") : "") + "\n";
    if (params.get("category") && cat) {
      for (var i = 0; i < cat.options.length; i++) if (cat.options[i].text === params.get("category")) cat.selectedIndex = i;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var v = function (n) { var el = form.elements[n]; return el ? String(el.value || "").trim() : ""; };
      var subject = "Quote request" + (v("company") ? " — " + v("company") : " — " + v("name"));
      var body = [
        "Name: " + v("name"), v("company") ? "Company: " + v("company") : "", "Phone: " + v("phone"),
        v("email") ? "Email: " + v("email") : "", v("category") ? "Category: " + v("category") : "",
      ].filter(Boolean).join("\n") + "\n\nParts needed:\n" + v("message");
      window.location.href = "mailto:" + form.getAttribute("data-to") + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      var note = $("#quote-sent"); if (note) note.hidden = false;
    });
  }
})();
