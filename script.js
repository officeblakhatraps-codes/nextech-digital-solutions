/* =========================================================
   Bonginkosi Website Developer — scripts (vanilla JS)
   1. Mobile navigation
   2. Sticky header + scroll spy
   3. Portfolio filtering
   4. Testimonial slider
   5. Booking time slots + WhatsApp handoff
   6. Form validation
   7. Pricing plan -> contact form
   8. Scroll reveal, floating button, footer year
   ========================================================= */

(function () {
  "use strict";

  var WHATSAPP_NUMBER = "27608010938";
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- 1. Mobile navigation ---------- */
  var nav = $("#mainNav");
  var navToggle = $("#navToggle");

  function closeNav() {
    if (!nav || !navToggle) return;
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
    document.body.classList.remove("nav-open");
  }

  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.classList.toggle("nav-open", open);
    });

    // Close after tapping any link inside the panel
    $$("a", nav).forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        closeNav();
        navToggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) closeNav();
    });
  }

  /* ---------- 2. Sticky header + scroll spy ---------- */
  var header = $("#siteHeader");
  var navLinks = $$('.main-nav a[href^="#"]');
  var sections = navLinks
    .map(function (link) { return document.getElementById(link.getAttribute("href").slice(1)); })
    .filter(Boolean);
  var waFloat = $(".wa-float");
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;

    if (header) header.classList.toggle("is-stuck", y > 8);
    if (waFloat) waFloat.classList.toggle("is-visible", y > 500);

    // Highlight the section currently under the header
    var current = null;
    sections.forEach(function (section) {
      if (section.getBoundingClientRect().top <= 140) current = section.id;
    });
    navLinks.forEach(function (link) {
      link.classList.toggle("is-active", link.getAttribute("href") === "#" + current);
    });

    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  /* ---------- 3. Portfolio filtering ---------- */
  var filterButtons = $$(".filter-btn");
  var workCards = $$(".work-card");
  var workEmpty = $("#workEmpty");

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var filter = button.dataset.filter;
      var shown = 0;

      filterButtons.forEach(function (b) {
        var active = b === button;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", String(active));
      });

      workCards.forEach(function (card) {
        var match = filter === "all" || card.dataset.category === filter;
        card.classList.toggle("is-hidden", !match);
        if (match) shown++;
      });

      if (workEmpty) workEmpty.hidden = shown !== 0;
    });
  });

  /* ---------- 4. Testimonial slider ---------- */
  var track = $("#sliderTrack");
  var slides = $$(".slide", track || document);
  var dotsBox = $("#sliderDots");
  var index = 0;
  var autoplayId = null;

  function goTo(i) {
    if (!track || !slides.length) return;
    index = (i + slides.length) % slides.length;
    track.style.transform = "translateX(-" + index * 100 + "%)";
    $$("button", dotsBox).forEach(function (dot, d) {
      dot.classList.toggle("is-active", d === index);
      dot.setAttribute("aria-selected", String(d === index));
    });
    slides.forEach(function (slide, s) {
      slide.setAttribute("aria-hidden", String(s !== index));
    });
  }

  function startAutoplay() {
    if (prefersReducedMotion || slides.length < 2) return;
    stopAutoplay();
    autoplayId = window.setInterval(function () { goTo(index + 1); }, 7000);
  }
  function stopAutoplay() {
    if (autoplayId) window.clearInterval(autoplayId);
    autoplayId = null;
  }

  if (track && slides.length) {
    slides.forEach(function (slide, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", "Testimonial " + (i + 1));
      dot.addEventListener("click", function () { goTo(i); startAutoplay(); });
      if (dotsBox) dotsBox.appendChild(dot);
    });

    var prev = $("#prevSlide");
    var next = $("#nextSlide");
    if (prev) prev.addEventListener("click", function () { goTo(index - 1); startAutoplay(); });
    if (next) next.addEventListener("click", function () { goTo(index + 1); startAutoplay(); });

    var slider = $("#testimonialSlider");
    slider.addEventListener("mouseenter", stopAutoplay);
    slider.addEventListener("mouseleave", startAutoplay);
    slider.addEventListener("focusin", stopAutoplay);

    // Touch swipe
    var startX = 0;
    slider.addEventListener("touchstart", function (e) {
      startX = e.changedTouches[0].clientX;
      stopAutoplay();
    }, { passive: true });
    slider.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 45) goTo(dx < 0 ? index + 1 : index - 1);
      startAutoplay();
    }, { passive: true });

    goTo(0);
    startAutoplay();
  }

  /* ---------- 5. Booking time slots ---------- */
  var slots = $$(".slot");
  var selectedTime = "";

  slots.forEach(function (slot) {
    slot.setAttribute("aria-pressed", "false");
    slot.addEventListener("click", function () {
      slots.forEach(function (s) {
        s.classList.remove("is-selected");
        s.setAttribute("aria-pressed", "false");
      });
      slot.classList.add("is-selected");
      slot.setAttribute("aria-pressed", "true");
      selectedTime = slot.dataset.time;
      hideError("timeSlots");
    });
  });

  /* ---------- 6. Form validation ---------- */
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var phonePattern = /^[0-9+\s()-]{9,16}$/;

  function showError(id, message) {
    var msg = document.querySelector('[data-error-for="' + id + '"]');
    var input = document.getElementById(id);
    if (msg) { msg.textContent = message; msg.classList.add("is-shown"); }
    if (input) input.classList.add("is-invalid");
  }

  function hideError(id) {
    var msg = document.querySelector('[data-error-for="' + id + '"]');
    var input = document.getElementById(id);
    if (msg) { msg.textContent = ""; msg.classList.remove("is-shown"); }
    if (input) input.classList.remove("is-invalid");
  }

  function validate(rules) {
    var firstBad = null;
    rules.forEach(function (rule) {
      var el = document.getElementById(rule.id);
      var value = el ? el.value.trim() : "";
      var problem = "";

      if (rule.required && !value) problem = rule.message || "This field is required.";
      else if (value && rule.type === "email" && !emailPattern.test(value)) problem = "Enter a valid email address.";
      else if (value && rule.type === "phone" && !phonePattern.test(value)) problem = "Enter a valid phone number.";
      else if (value && rule.min && value.length < rule.min) problem = "Please add a little more detail.";

      if (problem) {
        showError(rule.id, problem);
        if (!firstBad) firstBad = el;
      } else {
        hideError(rule.id);
      }
    });

    if (firstBad) firstBad.focus();
    return firstBad === null;
  }

  // Clear an error as soon as the person starts fixing it
  $$("input, select, textarea").forEach(function (el) {
    el.addEventListener("input", function () { if (el.id) hideError(el.id); });
  });

  function succeed(form, message) {
    var box = $("[data-success]", form);
    if (!box) return;
    box.textContent = message;
    box.classList.add("is-shown");
    window.setTimeout(function () { box.classList.remove("is-shown"); }, 8000);
  }

  // Quote form (hero)
  var quoteForm = $("#quoteForm");
  if (quoteForm) {
    quoteForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = validate([
        { id: "q-name", required: true, message: "Tell us your name." },
        { id: "q-contact", required: true, message: "Add an email address or phone number." },
        { id: "q-type", required: true, message: "Choose the type of website you need." }
      ]);
      if (!ok) return;
      succeed(quoteForm, "Thanks — your quote request is in. We reply the same working day.");
      quoteForm.reset();
    });
  }

  // Booking form -> opens WhatsApp with the details filled in
  var bookingForm = $("#bookingForm");
  if (bookingForm) {
    bookingForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = validate([
        { id: "b-name", required: true, message: "Tell us your name." },
        { id: "b-phone", required: true, type: "phone", message: "Add a phone number we can call." },
        { id: "b-date", required: true, message: "Pick a date that suits you." }
      ]);

      if (!selectedTime) {
        showError("timeSlots", "Choose a preferred time.");
        ok = false;
      }
      if (!ok) return;

      var text =
        "Hi Bonginkosi, I'd like to book a free website consultation.\n" +
        "Name: " + $("#b-name").value.trim() + "\n" +
        "Business: " + ($("#b-business").value.trim() || "—") + "\n" +
        "Phone: " + $("#b-phone").value.trim() + "\n" +
        "Date: " + $("#b-date").value + "\n" +
        "Time: " + selectedTime;

      window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text), "_blank", "noopener");
      succeed(bookingForm, "Opening WhatsApp — send the message to confirm your slot.");
    });

    // Block past dates in the date picker
    var dateInput = $("#b-date");
    if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];
  }

  // Contact form
  var contactForm = $("#contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = validate([
        { id: "c-name", required: true, message: "Tell us your name." },
        { id: "c-email", required: true, type: "email", message: "Add an email address." },
        { id: "c-phone", type: "phone" },
        { id: "c-message", required: true, min: 10, message: "Tell us what you need." }
      ]);
      if (!ok) return;
      succeed(contactForm, "Message sent. We'll get back to you the same working day.");
      contactForm.reset();
    });
  }

  /* ---------- 7. Pricing plan -> contact form ---------- */
  $$("[data-plan]").forEach(function (link) {
    link.addEventListener("click", function () {
      var message = $("#c-message");
      if (!message) return;
      message.value = "I'm interested in the " + link.dataset.plan + " package. ";
      hideError("c-message");
      window.setTimeout(function () { message.focus({ preventScroll: true }); }, 600);
    });
  });

  /* ---------- 8. Scroll reveal ---------- */
  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    var targets = $$(".section-head, .service-card, .work-card, .plan, .process-step, .booking-profile, .contact-list");
    targets.forEach(function (el) { el.classList.add("reveal"); });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px" });

    targets.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- 9. Footer year ---------- */
  var year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
