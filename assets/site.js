// AllEquip site behaviour. Everything here is an enhancement: with it off,
// every page still reads, every link works and the form still opens email.
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Mobile menu.
  var toggle = $(".menu-toggle"), nav = $("#site-nav");
  if (toggle && nav) toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

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
    var hash = (location.hash || "").slice(1);
    var pre = filters.filter(function (f) { return f.getAttribute("data-filter") === hash; })[0];
    if (pre) pre.click(); else apply();
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
