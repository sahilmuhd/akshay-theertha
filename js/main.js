(function () {
  "use strict";
  var CFG = window.INVITE_CONFIG || {};
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined";
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  var body = document.body;
  var intro = document.getElementById("intro");
  var video = document.getElementById("intro-video");
  var still = document.getElementById("intro-static");
  var skip = document.getElementById("skip-intro");
  var finished = false;

  /* ---------- Configurable map links ---------- */
  document.querySelectorAll("[data-map]").forEach(function (a) {
    var url = (CFG.mapUrls || {})[a.getAttribute("data-map")];
    if (url) { a.href = url; }
    else { a.removeAttribute("href"); a.removeAttribute("target"); a.classList.add("pending"); a.setAttribute("aria-disabled", "true"); a.textContent = "Location link coming soon"; }
  });

  /* ---------- Intro ---------- */
  function endIntro() {
    if (finished) return; finished = true;
    try { video.pause(); } catch (e) {}
    var done = function () {
      intro.remove();
      body.classList.remove("intro-active");
      window.scrollTo(0, 0);
      initScroll();
    };
    if (hasGsap && !reduce) gsap.to(intro, { opacity: 0, duration: 1.1, ease: "power2.inOut", onComplete: done });
    else done();
  }
  function showStill(ms) {
    video.removeAttribute("src"); video.hidden = true;
    still.hidden = false;
    setTimeout(endIntro, ms);
  }

  var gate = document.getElementById("gate");
  var openBtn = document.getElementById("open-invitation");

  skip.addEventListener("click", endIntro);
  video.addEventListener("ended", function () { setTimeout(endIntro, 500); });
  video.addEventListener("error", function () { showStill(2600); });

  // Guests tap "Open Invitation": a user gesture, so the video may play with its sound.
  openBtn.addEventListener("click", function () {
    skip.hidden = false;
    var hideGate = function () { gate.hidden = true; };
    if (hasGsap && !reduce) gsap.to(gate, { opacity: 0, duration: .6, onComplete: hideGate }); else hideGate();
    if (reduce) { endIntro(); return; }          // reduced motion: go straight to the invitation
    video.muted = false;
    var p = video.play();
    if (p && p.catch) p.catch(function () {
      video.muted = true;                         // sound blocked -> try silent
      video.play().catch(function () { showStill(2800); });
    });
    setTimeout(function () { if (!finished && video.currentTime === 0 && !video.hidden) showStill(2000); }, 5000);
  });

  /* ---------- Scroll animations ---------- */
  var scrollReady = false;
  function initScroll() {
    if (scrollReady) return; scrollReady = true;
    if (!hasGsap || !window.ScrollTrigger || reduce) return;

    // hero: gentle entrance continuing from the intro
    gsap.from("#hero .reveal", { opacity: 0, y: 18, duration: 1.1, stagger: .14, ease: "power2.out" });

    // generic section fade-ins
    gsap.utils.toArray(".sec:not(.hero) .reveal").forEach(function (el) {
      gsap.from(el, { opacity: 0, y: 22, duration: 1, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    });

    // event circles + text (Wedding Party Departs / Wedding Ceremony)
    gsap.utils.toArray(".timeline li").forEach(function (li) {
      var t = gsap.timeline({ scrollTrigger: { trigger: li, start: "top 85%", once: true } });
      t.from(li.querySelector(".event-circle"), { opacity: 0, scale: .85, duration: 1, ease: "power2.out" })
       .from(li.querySelectorAll(".tl-date, h3, .tl-time, .tl-place"), { opacity: 0, y: 22, duration: 1, stagger: .12, ease: "power2.out" }, 0.15);
    });

    // photo collage
    var tl = gsap.timeline({ scrollTrigger: { trigger: ".collage", start: "top 75%", once: true } });
    tl.from(".photo-1", { opacity: 0, y: 45, scale: .96, duration: 1.2, ease: "power2.out" })
      .from(".photo-2", { opacity: 0, y: 45, scale: .96, duration: 1.2, ease: "power2.out" }, 0.3)
      .from(".tape", { opacity: 0, duration: 1, stagger: .2, ease: "power1.out" }, 0.6)
      .from(".fade-txt", { opacity: 0, y: 10, duration: 1, stagger: .25, ease: "power1.out" }, 0.8);

    // subtle background parallax
    gsap.utils.toArray(".bg").forEach(function (bg) {
      gsap.fromTo(bg, { yPercent: -3 }, { yPercent: 3, ease: "none",
        scrollTrigger: { trigger: bg.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });
  }

  /* ---------- Countdown (IST) ---------- */
  var start = new Date(CFG.weddingStart).getTime();
  var end = new Date(CFG.weddingEnd).getTime();
  var cd = document.getElementById("countdown");
  var grid = document.getElementById("cd-grid");
  var msg = document.getElementById("cd-msg");
  var el = { d: document.getElementById("cd-d"), h: document.getElementById("cd-h"), m: document.getElementById("cd-m"), s: document.getElementById("cd-s") };
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function tick() {
    var now = Date.now(), diff = start - now;
    if (diff > 0) {
      var s = Math.floor(diff / 1000);
      el.d.textContent = pad(Math.floor(s / 86400));
      el.h.textContent = pad(Math.floor(s % 86400 / 3600));
      el.m.textContent = pad(Math.floor(s % 3600 / 60));
      el.s.textContent = pad(s % 60);
      return;
    }
    grid.hidden = true; msg.hidden = false; cd.classList.add("done");
    msg.textContent = now < end
      ? "The Muhurtham is taking place now."
      : "Thank you for celebrating with us. Your blessings mean the world to us.";
    if (now >= end) clearInterval(timer);
  }
  var timer = setInterval(tick, 1000);
  tick();
})();
