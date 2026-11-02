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

  /* ---------- Background music ---------- */
  var bgm = document.getElementById("bgm");
  var musicBtn = document.getElementById("music-toggle");
  var musicOn = false, fadeTimer = null, TARGET_VOL = 0.55;
  function setMusicUI(on) {
    musicBtn.classList.toggle("off", !on);
    musicBtn.setAttribute("aria-pressed", on ? "true" : "false");
    musicBtn.setAttribute("aria-label", on ? "Mute music" : "Play music");
  }
  function fadeTo(v, ms, done) {
    clearInterval(fadeTimer);
    var from = bgm.volume, steps = Math.max(1, Math.round(ms / 50)), i = 0;
    fadeTimer = setInterval(function () {
      i++; bgm.volume = Math.min(1, Math.max(0, from + (v - from) * i / steps));
      if (i >= steps) { clearInterval(fadeTimer); if (done) done(); }
    }, 50);
  }
  function startMusic() {
    musicBtn.hidden = false;
    bgm.volume = 0;
    var p = bgm.play();
    var ok = function () { musicOn = true; setMusicUI(true); fadeTo(TARGET_VOL, 2500); };
    if (p && p.then) p.then(ok).catch(function () { musicOn = false; setMusicUI(false); });
    else ok();
  }
  musicBtn.addEventListener("click", function () {
    if (musicOn) { musicOn = false; setMusicUI(false); fadeTo(0, 400, function () { bgm.pause(); }); }
    else { musicOn = true; setMusicUI(true); bgm.volume = 0; bgm.play().catch(function () {}); fadeTo(TARGET_VOL, 800); }
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { if (musicOn) bgm.pause(); }
    else if (musicOn) { bgm.play().catch(function () {}); }
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
  var openBtn = document.getElementById("open-invitation");
  var btnShown = false;

  // The opening holds on its last frame and shows "Open Invitation".
  function showOpenButton() {
    if (btnShown || finished) return; btnShown = true;
    skip.hidden = true;
    openBtn.hidden = false;
    if (hasGsap && !reduce) gsap.fromTo(openBtn, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1, ease: "power2.out" });
  }
  function showStill() {                      // static last frame (no autoplay / reduced motion / error)
    try { video.pause(); } catch (e) {}
    video.hidden = true; still.hidden = false;
    showOpenButton();
  }

  skip.addEventListener("click", function () {  // jump to the last frame; the guest still taps Open Invitation
    try { video.pause(); if (video.duration) video.currentTime = video.duration - 0.05; } catch (e) {}
    showOpenButton();
  });
  video.addEventListener("ended", showOpenButton);
  video.addEventListener("timeupdate", function () { if (video.duration && video.currentTime > video.duration - 1.3) showOpenButton(); });
  video.addEventListener("error", showStill);

  // Tap = user gesture, so the song is allowed to start.
  openBtn.addEventListener("click", function () {
    startMusic();
    endIntro();
  });

  if (reduce) {
    showStill();
  } else {
    video.muted = true;
    var p = video.play();
    if (p && p.catch) p.catch(showStill);
    setTimeout(function () { if (!btnShown && video.currentTime === 0) showStill(); }, 5000);
  }

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
