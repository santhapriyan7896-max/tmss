/* TMSS Educational Trust – site scripts */
(function () {
  "use strict";

  var WHATSAPP_NUMBER = "919944377762";
  var root = document.documentElement;
  var I18N = window.TMSS_I18N || { ta: {}, ui: { en: {}, ta: {} } };
  var lang = root.getAttribute("data-lang") === "ta" ? "ta" : "en";
  var motionOn = root.classList.contains("motion");

  function ui(key) { return (I18N.ui[lang] && I18N.ui[lang][key]) || I18N.ui.en[key] || ""; }

  document.getElementById("year").textContent = new Date().getFullYear();

  // ---------- Toast ----------
  var toastEl = document.getElementById("toast");
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 3600);
  }

  // ---------- Header ----------
  var hdr = document.getElementById("hdr");
  var nav = document.getElementById("nav");
  var burger = document.getElementById("burger");

  function setMenu(open) {
    nav.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", ui(open ? "menuClose" : "menuOpen"));
    document.body.style.overflow = open ? "hidden" : "";
    if (open) hdr.classList.remove("hide");
  }
  burger.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  window.addEventListener("resize", function () { if (window.innerWidth > 1120) setMenu(false); });

  // Active nav link
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
  if ("IntersectionObserver" in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navLinks.forEach(function (a) {
      var s = document.querySelector(a.getAttribute("href"));
      if (s) navIO.observe(s);
    });
  }

  // ---------- Language (English <-> Tamil) ----------
  var tNodes = Array.prototype.slice.call(document.querySelectorAll("[data-t]"));
  var phNodes = Array.prototype.slice.call(document.querySelectorAll("[data-t-ph]"));
  var ariaNodes = Array.prototype.slice.call(document.querySelectorAll("[data-t-aria]"));
  tNodes.forEach(function (el) { el.__en = el.innerHTML; });
  phNodes.forEach(function (el) { el.__en = el.getAttribute("placeholder"); });
  ariaNodes.forEach(function (el) { el.__enAria = el.getAttribute("aria-label"); });
  var enTitle = document.title;
  var langBtn = document.getElementById("langBtn");
  var heroAlt = document.getElementById("heroAlt");
  var afterLang = [];   // hooks that need to re-run after a language switch

  function tr(key, en) {
    if (lang !== "ta") return en;
    var v = I18N.ta[key];
    return v === undefined ? en : v;
  }

  function applyLang(next, save) {
    lang = next;
    root.lang = lang;
    root.setAttribute("data-lang", lang);
    tNodes.forEach(function (el) { el.innerHTML = tr(el.getAttribute("data-t"), el.__en); });
    phNodes.forEach(function (el) { el.setAttribute("placeholder", tr(el.getAttribute("data-t-ph"), el.__en)); });
    ariaNodes.forEach(function (el) { el.setAttribute("aria-label", tr(el.getAttribute("data-t-aria"), el.__enAria)); });
    document.title = lang === "ta" ? (I18N.ta["doc.title"] || enTitle) : enTitle;
    heroAlt.setAttribute("lang", lang === "ta" ? "en" : "ta");

    // WhatsApp links greet in the chosen language
    document.querySelectorAll("[data-wa]").forEach(function (a) {
      a.href = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(ui("waHello"));
    });

    langBtn.setAttribute("aria-label", ui("langBtn"));
    langBtn.setAttribute("data-active", lang);
    burger.setAttribute("aria-label", ui(nav.classList.contains("open") ? "menuClose" : "menuOpen"));

    if (save) { try { localStorage.setItem("tmss-lang", lang); } catch (e) {} }
    afterLang.forEach(function (fn) { fn(); });
  }

  langBtn.addEventListener("click", function () { applyLang(lang === "ta" ? "en" : "ta", true); });

  // ---------- Stream rows pre-fill the enquiry form ----------
  var courseSelect = document.getElementById("courseSelect");
  document.querySelectorAll("[data-course]").forEach(function (link) {
    link.addEventListener("click", function () { courseSelect.value = link.getAttribute("data-course"); });
  });

  // ---------- Cutoff marksheet ----------
  var ids = ["maths", "physics", "chemistry"];
  var weights = { maths: 1, physics: 0.5, chemistry: 0.5 };
  var sheet = document.getElementById("sheet");
  var cutoffValue = document.getElementById("cutoffValue");
  var stamp = document.getElementById("stamp");
  var stampValue = document.getElementById("stampValue");
  var calcMsg = document.getElementById("calcMsg");
  var calcCta = document.getElementById("calcCta");
  var lastCutoff = null;
  var calcState = "fill"; // fill | demo | turn | result

  function field(id) { return document.getElementById(id); }
  function fmt(n) { return n % 1 === 0 ? String(n) : n.toFixed(2).replace(/0$/, ""); }

  function renderCalcMsg() {
    if (calcState === "result" && lastCutoff !== null) {
      var c = lastCutoff;
      calcMsg.textContent = ui(c >= 190 ? "c190" : c >= 170 ? "c170" : c >= 140 ? "c140" : c >= 100 ? "c100" : "c0");
    } else if (calcState === "demo") {
      calcMsg.textContent = ui("calcDemo");
    } else if (calcState === "turn") {
      calcMsg.textContent = ui("calcTurn");
    } else {
      calcMsg.textContent = ui("calcFill");
    }
  }
  afterLang.push(renderCalcMsg);

  function recalc() {
    var total = 0;
    var complete = true;
    ids.forEach(function (id) {
      var input = field(id);
      var cell = document.querySelector('.w[data-for="' + id + '"]');
      var raw = input.value.trim();
      var v = parseFloat(raw);
      var ok = raw !== "" && !isNaN(v) && v >= 0 && v <= 100;
      input.classList.toggle("invalid", raw !== "" && !ok);
      if (ok) {
        var w = Math.round(v * weights[id] * 100) / 100;
        cell.textContent = fmt(w);
        total += w;
      } else {
        cell.textContent = "—";
        complete = false;
      }
    });

    if (complete) {
      lastCutoff = Math.round(total * 100) / 100;
      cutoffValue.textContent = fmt(lastCutoff);
      stampValue.textContent = fmt(lastCutoff);
      calcState = sheet.classList.contains("demo") ? "demo" : "result";
      // re-trigger the stamp (and the little thud of the sheet)
      stamp.classList.remove("on");
      sheet.classList.remove("thud");
      void stamp.offsetWidth;
      stamp.classList.add("on");
      sheet.classList.add("stamped", "thud");
    } else {
      lastCutoff = null;
      cutoffValue.textContent = "—";
      stamp.classList.remove("on");
      sheet.classList.remove("stamped");
      if (calcState === "result") calcState = "fill";
    }
    renderCalcMsg();
  }

  var typeTimer;
  ids.forEach(function (id) {
    field(id).addEventListener("input", function () {
      clearTimeout(typeTimer);
      typeTimer = setTimeout(recalc, 350);
    });
  });
  sheet.addEventListener("submit", function (e) { e.preventDefault(); recalc(); });

  // One-time demo the first time the sheet scrolls into view
  var demoTimers = [];
  function runDemo() {
    if (ids.some(function (id) { return field(id).value !== ""; })) return;
    sheet.classList.add("demo");
    var samples = [["maths", "98"], ["physics", "95"], ["chemistry", "96"]];
    var t = 300;
    samples.forEach(function (pair) {
      for (var k = 1; k <= pair[1].length; k++) {
        (function (id, text) { demoTimers.push(setTimeout(function () { field(id).value = text; }, t)); })(pair[0], pair[1].slice(0, k));
        t += 150;
      }
      demoTimers.push(setTimeout(recalc, t));
      t += 260;
    });
    demoTimers.push(setTimeout(function () {
      ids.forEach(function (id) { field(id).value = ""; });
      sheet.classList.remove("demo");
      recalc();
      calcState = "turn";
      renderCalcMsg();
    }, t + 3200));
  }
  function cancelDemo() {
    if (!sheet.classList.contains("demo")) return;
    demoTimers.forEach(clearTimeout);
    demoTimers = [];
    ids.forEach(function (id) { field(id).value = ""; });
    sheet.classList.remove("demo");
    calcState = "fill";
    recalc();
  }
  ids.forEach(function (id) {
    field(id).addEventListener("focus", cancelDemo);
    field(id).addEventListener("pointerdown", cancelDemo);
  });
  if (motionOn && "IntersectionObserver" in window) {
    var demoIO = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { demoIO.disconnect(); runDemo(); }
    }, { threshold: 0.6 });
    demoIO.observe(sheet);
  }

  calcCta.addEventListener("click", function () {
    if (lastCutoff === null || calcState !== "result") return;
    courseSelect.value = "Engineering";
    var msg = document.querySelector('#enquiryForm textarea[name="message"]');
    if (msg && !msg.value) msg.value = ui("calcNote").replace("{c}", fmt(lastCutoff));
  });

  // ---------- Enquiry forms -> WhatsApp ----------
  var LABELS = {
    name: "Student", phone: "Mobile", group: "12th group", marks: "12th marks",
    course: "Interested in", district: "Town", message: "Note"
  };

  document.querySelectorAll(".js-enquiry").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nameEl = form.elements.name;
      var phoneEl = form.elements.phone;
      var courseEl = form.elements.course;
      var phone = phoneEl.value.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");

      var nameOk = nameEl.value.trim().length >= 2;
      var phoneOk = /^[6-9]\d{9}$/.test(phone);
      var courseOk = courseEl.value !== "";
      // course is a <select> in one form and a group of radio chips in the other
      var courseBox = courseEl.tagName ? courseEl : form.querySelector(".chips");
      var courseFocus = courseEl.tagName ? courseEl : courseEl[0];
      nameEl.classList.toggle("invalid", !nameOk);
      phoneEl.classList.toggle("invalid", !phoneOk);
      courseBox.classList.toggle("invalid", !courseOk);

      if (!nameOk) { toast(ui("errName")); nameEl.focus(); return; }
      if (!phoneOk) { toast(ui("errPhone")); phoneEl.focus(); return; }
      if (!courseOk) { toast(ui("errCourse")); courseFocus.focus(); return; }

      var lines = ["*Admission enquiry* (" + form.getAttribute("data-source") + (lang === "ta" ? ", Tamil site" : "") + ")"];
      Object.keys(LABELS).forEach(function (key) {
        var f = form.elements[key];
        if (!f) return;
        var value = key === "phone" ? phone : f.value.trim();
        if (value) lines.push(LABELS[key] + ": " + value);
      });

      window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(lines.join("\n")), "_blank", "noopener");
      toast(ui("sent"));
      form.reset();
    });

    form.addEventListener("input", function (e) {
      e.target.classList.remove("invalid");
      var chips = e.target.closest(".chips");
      if (chips) chips.classList.remove("invalid");
    });
  });

  // ---------- Motion ----------
  if (motionOn) {
    var mark = function (sel, type, step, perRow) {
      document.querySelectorAll(sel).forEach(function (el, i) {
        el.setAttribute("data-reveal", type || "up");
        if (step) el.style.setProperty("--d", ((perRow ? Math.floor(i / perRow) : i) * step).toFixed(2) + "s");
      });
    };
    mark(".sec-top h2, .process-side h2, .calc-copy h2, .voices-h, .faq h2, .visit-info h2, .f-letter h2", "wipe");
    mark(".proof-line");
    mark(".proof-figs > div", "up", 0.09);
    mark(".sec-top p, .process-side p, .process-side .btn, .calc-copy > p, .sheet-wrap, .calc-result, .vq-big figcaption, .f-letter p, .f-photo, .map, .enquiry");
    mark(".index li", "up", 0.05, 2);
    mark(".vq-row figure", "up", 0.1);
    mark(".faq details", "up", 0.06);
    mark(".visit-dl > div", "up", 0.07);
    document.querySelectorAll(".proof-figs, .index, .vq-row, .faq-list").forEach(function (el) { el.classList.add("rule-draw"); });

    if ("IntersectionObserver" in window) {
      var revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add("in"); revealIO.unobserve(entry.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
      document.querySelectorAll("[data-reveal], .rule-draw").forEach(function (el) { revealIO.observe(el); });
    } else {
      document.querySelectorAll("[data-reveal], .rule-draw").forEach(function (el) { el.classList.add("in"); });
    }

    // Big testimonial: split into words (again after each language switch)
    var bigQuote = document.getElementById("bigQuote");
    var words = [];
    var splitQuote = function () {
      bigQuote.innerHTML = bigQuote.textContent.trim().split(/\s+/).map(function (w) {
        return '<span class="wd">' + w + "</span>";
      }).join(" ");
      words = Array.prototype.slice.call(bigQuote.querySelectorAll(".wd"));
    };

    // Process progress track
    var plist = document.querySelector(".process-list");
    var steps = Array.prototype.slice.call(plist.querySelectorAll("li"));
    var track = document.createElement("span");
    track.className = "p-track";
    track.setAttribute("aria-hidden", "true");
    track.innerHTML = "<i></i>";
    plist.appendChild(track);

    var hero = document.querySelector(".hero");
    var waPill = document.querySelector(".wa-pill");
    var fPhoto = document.querySelector(".f-photo");
    var founder = document.querySelector(".founder");
    var lastY = window.scrollY;
    var ticking = false;

    var clamp = function (v) { return Math.max(0, Math.min(1, v)); };

    var frame = function () {
      ticking = false;
      var y = window.scrollY;
      var vh = window.innerHeight;

      // header hides on the way down, returns on the way up
      if (!nav.classList.contains("open")) {
        if (y > lastY + 6 && y > 400) hdr.classList.add("hide");
        else if (y < lastY - 6 || y < 400) hdr.classList.remove("hide");
      }
      lastY = y;

      waPill.classList.toggle("show", y > hero.offsetHeight * 0.6);

      // process: light the step crossing the middle of the screen
      var mid = vh * 0.55;
      var active = 0;
      steps.forEach(function (li, i) { if (li.getBoundingClientRect().top < mid) active = i; });
      steps.forEach(function (li, i) { li.classList.toggle("active", i === active); });
      var pr = plist.getBoundingClientRect();
      track.style.setProperty("--p", clamp((mid - pr.top) / pr.height).toFixed(3));

      // testimonial words
      if (words.length) {
        var qr = bigQuote.getBoundingClientRect();
        var prog = clamp((vh * 0.85 - qr.top) / (vh * 0.5));
        var lit = Math.round(prog * words.length);
        words.forEach(function (w, i) { w.classList.toggle("lit", i < lit); });
      }

      // gentle parallax on the founder photo
      if (window.innerWidth > 920) {
        var fr = founder.getBoundingClientRect();
        if (fr.bottom > 0 && fr.top < vh) {
          fPhoto.style.translate = "0 " + ((fr.top + fr.height / 2 - vh / 2) * -0.08).toFixed(1) + "px";
        }
      } else {
        fPhoto.style.translate = "";
      }
    };

    afterLang.push(function () { splitQuote(); frame(); });

    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(frame); }
    }, { passive: true });
    window.addEventListener("resize", frame);
  }

  // First render in the saved / requested language (also runs the hooks above)
  applyLang(lang, false);
})();
