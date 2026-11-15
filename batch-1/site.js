
  // header turns solid after the hero starts scrolling
  (function () {
    var h = document.querySelector('.site-header');
    var hasHero = !!document.querySelector('.hero');
    function on() { h.classList.toggle('solid', !hasHero || window.scrollY > 40); }
    on(); window.addEventListener('scroll', on, { passive: true });
  })();

  // mobile menu
  (function () {
    var btn = document.querySelector('.menu-btn'), links = document.getElementById('navLinks');
    btn.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      document.body.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', open);
    });
  })();

  // hero video: keep trying to play (iOS low-power can block it; the still shows instead)
  (function () {
    var v = document.getElementById('heroVideo'); if (!v) return;
    var mq = window.matchMedia('(max-width: 820px), (orientation: portrait)');
    function load() {
      var k = mq.matches ? 'mobile' : 'desktop', src = v.getAttribute('data-' + k);
      if (v.getAttribute('src') === src) return;
      v.poster = src.replace('.mp4', '.jpg'); v.src = src; v.muted = true;
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    }
    load(); if (mq.addEventListener) mq.addEventListener('change', load);
  })();

  // recent work: arrows, play only what's on screen, hide clips that aren't uploaded
  (function () {
    var row = document.querySelector('.reel-row'); if (!row) return;
    var prev = document.querySelector('.arrow.prev'), next = document.querySelector('.arrow.next');
    var cards = [].slice.call(row.querySelectorAll('.reel'));
    cards.forEach(function (c) {
      var v = c.querySelector('video'); v.muted = true;
      v.addEventListener('error', function () { c.hidden = true; update(); });
    });
    function step() {
      var c = row.querySelector('.reel:not([hidden])'); if (!c) return row.clientWidth;
      var gap = parseFloat(getComputedStyle(row).columnGap) || 0, w = c.getBoundingClientRect().width + gap;
      return Math.max(w, Math.floor((row.clientWidth + gap) / w) * w);
    }
    function update() {
      var max = row.scrollWidth - row.clientWidth;
      prev.disabled = row.scrollLeft < 4; next.disabled = row.scrollLeft > max - 4;
    }
    prev.addEventListener('click', function () { row.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { row.scrollBy({ left: step(), behavior: 'smooth' }); });
    row.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev.click(); }
    });
    row.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update); update();
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target.querySelector('video');
        if (e.isIntersecting) { if (v.preload !== 'auto') { v.preload = 'auto'; } var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.4 });
    cards.forEach(function (c) { io.observe(c); });
  })();

  // gentle fade-in as sections scroll into view
  (function () {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  })();

  // ===== motion =====
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // split headings into words that rise in
  document.querySelectorAll('.split').forEach(function (el) {
    var i = 0;
    el.innerHTML = el.innerHTML.split(/(<br\s*\/?>)/).map(function (part) {
      if (/^<br/.test(part)) return part;
      return part.split(/(\s+)/).map(function (w) {
        if (!w.trim()) return w;
        return '<span class="w"><span style="--i:' + (i++) + '">' + w + '</span></span>';
      }).join('');
    }).join('');
  });
  document.querySelectorAll('.stagger').forEach(function (el) {
    [].forEach.call(el.children, function (c, i) { c.style.setProperty('--i', Math.min(i, 10)); });
  });
  (function () {
    var els = document.querySelectorAll('.split, .stagger, .wipe');
    if (REDUCED || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    els.forEach(function (e) { io.observe(e); });
  })();

  // header tucks away scrolling down, returns scrolling up
  (function () {
    var h = document.querySelector('.site-header'), last = window.scrollY, ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY, open = document.body.classList.contains('menu-open');
        h.classList.toggle('tuck', !open && y > 160 && y > last + 4);
        if (y < last - 4 || y < 160) h.classList.remove('tuck');
        last = y; ticking = false;
      });
    }, { passive: true });
  })();

  // hero parallax: video drifts, headline lifts and fades as you scroll away
  (function () {
    var hero = document.querySelector('.hero'); if (!hero || REDUCED) return;
    var v = hero.querySelector('video'), w = hero.querySelector('.wrap'), ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, window.innerHeight);
        if (v) v.style.transform = 'translateY(' + (y * 0.3) + 'px) scale(' + (1 + y / 4000) + ')';
        w.style.transform = 'translateY(' + (-y * 0.15) + 'px)';
        w.style.opacity = String(1 - y / (window.innerHeight * 0.85));
        ticking = false;
      });
    }, { passive: true });
  })();

  // page transitions: browsers with view transitions animate on their own;
  // others get a quick fade out on internal links and a fade in on arrival
  (function () {
    if (REDUCED || ('onpagereveal' in window)) return;
    document.body.classList.add('page-fade');
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a'); if (!a) return;
      var href = a.getAttribute('href') || '';
      if (a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || !/^\/(?!\/)/.test(href) || href.indexOf('#') > -1 && a.pathname === location.pathname) return;
      e.preventDefault(); document.body.classList.add('leaving');
      setTimeout(function () { location.href = href; }, 260);
    });
    window.addEventListener('pageshow', function () { document.body.classList.remove('leaving'); });
  })();

  // contact page: pre-select package from ?pkg=
  (function () {
    var sel = document.getElementById('need'); if (!sel) return;
    var m = location.search.match(/[?&]pkg=([^&]+)/);
    if (m) { var v = decodeURIComponent(m[1].replace(/\+/g, ' ')); [].forEach.call(sel.options, function (o) { if (o.text === v) sel.value = v; }); }
  })();
  var WEB3FORMS_KEY = '2c3a3cb8-7d8f-4af9-98ae-b95e6b4886d4';
  var inquiryForm = document.getElementById('inquiry');
  if (inquiryForm) (function () {
    var f = inquiryForm, emailIn = f.querySelector('#inqEmail'), err = f.querySelector('#emailErr'),
        status = f.querySelector('#formStatus'), btn = f.querySelector('#sendBtn');
    var BLOCK = ['mailinator.com','guerrillamail.com','10minutemail.com','tempmail.com','temp-mail.org','yopmail.com','trashmail.com',
      'getnada.com','sharklasers.com','dispostable.com','maildrop.cc','fakeinbox.com','throwawaymail.com','mintemail.com','mohmal.com',
      'emailondeck.com','tempail.com','burnermail.io','spamgourmet.com','example.com','test.com','email.com','asdf.com'];
    var TYPO = { 'gmial.com':'gmail.com','gmai.com':'gmail.com','gamil.com':'gmail.com','gmail.co':'gmail.com','gmail.con':'gmail.com',
      'yahoo.co':'yahoo.com','yaho.com':'yahoo.com','hotmial.com':'hotmail.com','outlok.com':'outlook.com','icloud.co':'icloud.com' };
    function showErr(m) { err.textContent = m; emailIn.setAttribute('aria-invalid', m ? 'true' : 'false'); }
    function mxCheck(domain) {
      return fetch('https://dns.google/resolve?name=' + encodeURIComponent(domain) + '&type=MX')
        .then(function (r) { return r.json(); })
        .then(function (j) { return j.Status === 0 && Array.isArray(j.Answer) && j.Answer.some(function (a) { return a.type === 15 && !/^0 \.$/.test(a.data); }); })
        .catch(function () { return true; }); // if the check itself can't run, don't block a real person
    }
    function checkEmail(v) {
      v = v.trim().toLowerCase();
      if (!/^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(v)) return Promise.resolve('Please enter a valid email address.');
      var d = v.split('@')[1];
      if (TYPO[d]) return Promise.resolve('Did you mean @' + TYPO[d] + '?');
      if (BLOCK.indexOf(d) > -1) return Promise.resolve('Please use a real, permanent email address.');
      return mxCheck(d).then(function (ok) { return ok ? '' : 'That email domain can’t receive mail. Please double-check it.'; });
    }
    emailIn.addEventListener('blur', function () { if (emailIn.value) checkEmail(emailIn.value).then(showErr); });
    emailIn.addEventListener('input', function () { if (err.textContent) showErr(''); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (f.botcheck.checked) return;
      var name = f.name.value.trim();
      if (!name) { f.name.focus(); status.textContent = 'Please add your name.'; return; }
      btn.disabled = true; status.textContent = 'Checking your email…';
      checkEmail(emailIn.value).then(function (msg) {
        if (msg) { showErr(msg); emailIn.focus(); btn.disabled = false; status.textContent = ''; return; }
        var org = f.org.value.trim();
        var subject = 'New Inquiry: ' + name + (org ? ' (' + org + ')' : '') + ' · ' + f.need.value;
        if (WEB3FORMS_KEY.indexOf('PASTE') === 0) { // not connected yet: fall back to email app
          var body = ['Name: ' + name, 'Email: ' + emailIn.value.trim(), 'Brand / Team / Organization: ' + org, 'Looking for: ' + f.need.value, 'Timeline: ' + f.timeline.value, '', f.msg.value.trim()].join('\n');
          window.location.href = 'mailto:info@weswaycreative.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
          btn.disabled = false; status.textContent = ''; return;
        }
        status.textContent = 'Sending…';
        fetch('https://api.web3forms.com/submit', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ access_key: WEB3FORMS_KEY, subject: subject, from_name: 'Wes Way Creative Website',
            replyto: emailIn.value.trim(), name: name, email: emailIn.value.trim(), organization: org,
            looking_for: f.need.value, timeline: f.timeline.value, message: f.msg.value.trim() })
        }).then(function (r) { return r.json(); }).then(function (j) {
          if (j.success) {
            f.innerHTML = '<div class="form-done full"><p class="form-done-t">Got it. Thank you!</p><p>Your inquiry is in. You&rsquo;ll get a reply at <b>' +
              emailIn.value.trim().replace(/[<>&"]/g, '') + '</b> within a couple of days.</p></div>';
          } else { throw new Error(); }
        }).catch(function () {
          btn.disabled = false;
          status.innerHTML = 'Something went wrong. Please email <a href="mailto:info@weswaycreative.com">info@weswaycreative.com</a> directly.';
        });
      });
    });
  })();
