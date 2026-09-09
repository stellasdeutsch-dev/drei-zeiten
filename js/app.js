/* =========================================================
   Stellas Deutsch — интерактив лонгрида
   ========================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  /* Итоговые значения уже стоят в разметке — без JS страница остаётся верной.
     Анимацию «от нуля» проигрываем только в момент появления блока в кадре:
     сбрасываем состояние и на следующем кадре возвращаем финальное. */
  var replay = function (reset, apply) {
    if (reduced) { apply(); return; }
    reset();
    requestAnimationFrame(function () { requestAnimationFrame(apply); });
  };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- 1. появление блоков ---------- */
  var revealed = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      var sibs = el.parentElement ? $$('.reveal', el.parentElement) : [];
      var i = Math.max(0, sibs.indexOf(el));
      setTimeout(function () { el.classList.add('is-in'); }, reduced ? 0 : Math.min(i, 6) * 70);
      revealed.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('.reveal').forEach(function (el) { revealed.observe(el); });

  /* Подстраховка: если наблюдатель по какой-то причине промолчит,
     блок всё равно проявится, как только окажется в кадре. */
  var pending = $$('.reveal');
  function sweep() {
    if (!pending.length) return;
    var vh = window.innerHeight;
    pending = pending.filter(function (el) {
      if (el.classList.contains('is-in')) return false;
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.94 && r.bottom > 0) { el.classList.add('is-in'); return false; }
      return true;
    });
  }
  window.addEventListener('load', sweep);
  window.addEventListener('resize', sweep, { passive: true });

  /* ---------- 2. наклон карточек ---------- */
  $$('[data-tilt]').forEach(function (el) {
    el.style.setProperty('--t', el.getAttribute('data-tilt') + 'deg');
    if (el.classList.contains('polaroid')) {
      el.style.transform = 'rotate(' + el.getAttribute('data-tilt') + 'deg)';
    }
  });

  /* ---------- 3. полоса чтения + кораблик ---------- */
  var fill = $('#readbar-fill'), boat = $('#readbar-boat'), sticky = $('#sticky');
  var ticking = false;
  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
    fill.style.width = (p * 100) + '%';
    boat.style.left  = (p * 100) + '%';
    if (sticky) sticky.classList.toggle('is-on', window.scrollY > window.innerHeight * 1.4);
    sweep();
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- 4. заголовок героя построчно ---------- */
  (function () {
    var lines = $$('#heroTitle .ln');
    lines.forEach(function (ln, i) {
      ln.style.opacity = '0';
      ln.style.transform = 'translateY(26px)';
      ln.style.transition = 'opacity .8s cubic-bezier(.22,.9,.3,1), transform .8s cubic-bezier(.22,.9,.3,1)';
      setTimeout(function () {
        ln.style.opacity = '1';
        ln.style.transform = 'none';
      }, reduced ? 0 : 160 + i * 150);
    });
  })();

  /* ---------- 5. карточки «три брата» ---------- */
  $$('.bro').forEach(function (card) {
    function toggle() {
      var open = card.classList.toggle('is-open');
      card.setAttribute('aria-expanded', open ? 'true' : 'false');
      $('.bro__more', card).textContent = open ? 'свернуть' : 'развернуть';
    }
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });

  /* ---------- 6. шкала «разговор ↔ текст» ---------- */
  var SCALE = {
    talk: {
      perfekt:     { v: 92, tag: 'почти всё прошлое', note: 'В баре, в чате, на кухне — любой обычный глагол в прошлом идёт сюда.' },
      praeteritum: { v: 34, tag: 'только восемь',     note: 'sein, haben и модальные. Остальные глаголы в речи звучат книжно.' },
      praesens:    { v: 70, tag: 'сегодня и завтра',  note: 'Настоящее плюс будущее — если в предложении сказано, когда именно.' }
    },
    text: {
      perfekt:     { v: 26, tag: 'редкий гость',      note: 'В письменном рассказе почти не нужен. Разве что в прямой речи героя.' },
      praeteritum: { v: 95, tag: 'основное время',    note: 'Книги, новости, сочинения, тексты на экзамене. Все глаголы без исключений.' },
      praesens:    { v: 40, tag: 'факты и правила',   note: 'Общие истины и описания, которые не привязаны к моменту.' }
    }
  };
  var barsBox = $('#bars');
  function paintBars(mode) {
    if (!barsBox) return;
    $$('.bar', barsBox).forEach(function (bar) {
      var d = SCALE[mode][bar.getAttribute('data-key')];
      $('.bar__track i', bar).style.width = d.v + '%';
      $('.bar__tag', bar).textContent = d.tag;
      $('.bar__note', bar).textContent = d.note;
    });
  }
  var switcher = $('.switcher');
  if (switcher) {
    $$('.switcher__btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var mode = b.getAttribute('data-mode');
        $$('.switcher__btn').forEach(function (x) {
          x.classList.toggle('is-on', x === b);
          x.setAttribute('aria-selected', x === b ? 'true' : 'false');
        });
        switcher.classList.toggle('is-text', mode === 'text');
        paintBars(mode);
      });
    });
    var barsSeen = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        replay(
          function () { $$('.bar__track i', barsBox).forEach(function (i) { i.style.width = '0'; }); },
          function () { paintBars('talk'); }
        );
        barsSeen.disconnect();
      });
    }, { threshold: 0.25 });
    barsSeen.observe(barsBox);
  }

  /* ---------- 7. карточки ошибок ---------- */
  $$('[data-flip]').forEach(function (c) {
    c.addEventListener('click', function () { c.classList.toggle('is-flip'); });
  });

  /* ---------- 8. счётчики, диаграмма, уровни ---------- */
  function countUp(el) {
    var to = parseInt(el.getAttribute('data-to'), 10), t0 = null, dur = 1300;
    if (reduced) { el.textContent = to.toLocaleString('ru-RU'); return; }
    el.textContent = '0';
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(to * e).toLocaleString('ru-RU');
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var once = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;

      if (el.classList.contains('count')) countUp(el);

      if (el.id === 'chart') {
        var rows = $$('.crow', el);
        var max = Math.max.apply(null, rows.map(function (r) { return +r.getAttribute('data-val'); }));
        replay(
          function () {
            rows.forEach(function (r) {
              $('i', r).style.width = '0';
              $('.crow__num', r).textContent = '0';
            });
          },
          function () {
            rows.forEach(function (r, i) {
              var v = +r.getAttribute('data-val');
              setTimeout(function () {
                $('i', r).style.width = (v / max * 100) + '%';
                var n = $('.crow__num', r), c = 0;
                var iv = setInterval(function () { n.textContent = ++c; if (c >= v) clearInterval(iv); }, 70);
              }, i * 110);
            });
          }
        );
      }

      if (el.classList.contains('levels')) {
        replay(
          function () { $('#levelsFill').style.width = '0'; },
          function () { $('#levelsFill').style.width = '42%'; }
        );
      }

      once.unobserve(el);
    });
  }, { threshold: 0.35 });

  $$('.count, #chart, .levels').forEach(function (el) { once.observe(el); });

  /* ---------- 9. видео: грузим и играем по видимости ---------- */
  var vObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) {
        if (!v.src && v.dataset.src) v.src = v.dataset.src;
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      } else if (!v.paused) {
        v.pause();
      }
    });
  }, { threshold: 0.35 });
  $$('.lazyv').forEach(function (v) { vObs.observe(v); });

  /* ---------- 10. кнопка «вниз» ---------- */
  var sd = $('#scrolldown');
  if (sd) sd.addEventListener('click', function () {
    var t = $('#hook');
    if (t) t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  });

  /* ---------- 11. тест ---------- */
  var QUESTIONS = [
    {
      q: '«___ du gestern im Kino?»',
      hint: 'Обычный вопрос приятелю за столом.',
      opts: ['Warst', 'Bist … gewesen', 'Wirst'],
      right: 0,
      why: 'sein в прошлом — всегда Präteritum. Даже в самой разговорной ситуации.'
    },
    {
      q: 'Как ты скажешь вслух: «Вчера я приготовил суп»?',
      hint: 'Именно вслух, не в сочинении.',
      opts: ['Gestern kochte ich Suppe.', 'Gestern habe ich Suppe gekocht.', 'Gestern koche ich Suppe.'],
      right: 1,
      why: 'Обычный глагол в устной речи идёт в Perfekt. Präteritum здесь звучит как строчка из романа.'
    },
    {
      q: 'Что звучит естественнее в разговоре про следующую неделю?',
      hint: 'Оба варианта грамматически живы. Вопрос в том, как говорят.',
      opts: ['Nächste Woche fahre ich nach Wien.', 'Nächste Woche werde ich nach Wien fahren.', 'Nächste Woche fuhr ich nach Wien.'],
      right: 0,
      why: 'Есть указатель времени — werden не нужен. Немцы роняют его по дороге и берут Präsens.'
    },
    {
      q: '«Wir ___ lange warten.» — нам пришлось долго ждать',
      hint: 'Модальный глагол в прошлом.',
      opts: ['mussten', 'haben … müssen', 'müssen'],
      right: 0,
      why: 'Модальные живут в Präteritum. В речи тоже — это те самые восемь глаголов, которым можно всё.'
    },
    {
      q: 'В сочинении на экзамене: «В детстве я много играл в футбол».',
      hint: 'Письменный текст, не устный ответ.',
      opts: ['Als Kind habe ich viel Fußball gespielt.', 'Als Kind spielte ich viel Fußball.', 'Als Kind spiele ich viel Fußball.'],
      right: 1,
      why: 'На письме — Präteritum для всех глаголов. Экзаменатор это видит и ставит галочку.'
    },
    {
      q: '«Er ___ letztes Jahr nach Deutschland gezogen.»',
      hint: 'Выбери вспомогательный глагол.',
      opts: ['ist', 'hat', 'war'],
      right: 0,
      why: 'ziehen здесь — перемещение в пространстве, а движение берёт sein, а не haben.'
    }
  ];

  var stage = $('#quizStage'), qFill = $('#quizFill'), qNo = $('#quizNo'),
      qRes = $('#quizResult'), qBox = $('#quizBox');
  var idx = 0, score = 0;

  function verdict(s) {
    if (s === 6) return 'Шесть из шести. Тему можно закрывать. Следующая очередь — артикли, они страшнее.';
    if (s >= 4)  return 'Почти. Вернись к шпаргалке выше, она на четыре строки — это две минуты.';
    if (s >= 2)  return 'Половина. Это нормально: тему обычно объясняют один раз и мимо. Перечитай трёх братьев — там всё разложено по характерам.';
    return 'Честный результат лучше угаданного. Вернись к трём братьям наверху и пройди тест ещё раз — со второго захода заходит.';
  }

  function render() {
    if (!stage) return;
    if (idx >= QUESTIONS.length) return finish();

    var Q = QUESTIONS[idx];
    qNo.textContent = idx + 1;
    qFill.style.width = (idx / QUESTIONS.length * 100) + '%';

    stage.innerHTML = '';
    var h = document.createElement('p');
    h.className = 'q__text';
    h.innerHTML = Q.q.replace(/«([^»]*)»/, '«<u>$1</u>»');
    stage.appendChild(h);

    var hint = document.createElement('p');
    hint.className = 'q__hint';
    hint.textContent = Q.hint;
    stage.appendChild(hint);

    var box = document.createElement('div');
    box.className = 'q__opts';
    Q.opts.forEach(function (text, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'q__opt';
      b.lang = 'de';
      b.textContent = text;
      b.addEventListener('click', function () { answer(i, box, Q); });
      box.appendChild(b);
    });
    stage.appendChild(box);
  }

  function answer(i, box, Q) {
    var btns = $$('.q__opt', box);
    btns.forEach(function (b) { b.disabled = true; });
    btns[Q.right].classList.add('is-right');
    if (i !== Q.right) btns[i].classList.add('is-wrong'); else score++;

    var why = document.createElement('p');
    why.className = 'q__why';
    why.innerHTML = '<b>' + (i === Q.right ? 'Верно. ' : 'Мимо. ') + '</b>' + Q.why;
    stage.appendChild(why);

    var next = document.createElement('button');
    next.type = 'button';
    next.className = 'btn btn--ghost q__next';
    next.textContent = idx === QUESTIONS.length - 1 ? 'посмотреть результат' : 'дальше';
    next.addEventListener('click', function () { idx++; render(); });
    stage.appendChild(next);
    next.focus({ preventScroll: true });
  }

  function finish() {
    qFill.style.width = '100%';
    stage.hidden = true;
    $('.quiz__count').hidden = true;
    qRes.hidden = false;
    $('#scoreNum').textContent = score;
    $('#verdict').textContent = verdict(score);
    var C = 2 * Math.PI * 52;
    setTimeout(function () {
      $('#ringFg').style.strokeDashoffset = String(C - (score / QUESTIONS.length) * C);
    }, 120);
  }

  var againBtn = $('#quizAgain');
  if (againBtn) againBtn.addEventListener('click', function () {
    idx = 0; score = 0;
    qRes.hidden = true;
    stage.hidden = false;
    $('.quiz__count').hidden = false;
    $('#ringFg').style.strokeDashoffset = '327';
    render();
    qBox.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  });

  render();

  /* ---------- 12. лёгкий параллакс в шапке ---------- */
  if (!reduced) {
    var wash = $('.hero__wash'), pol = $('.polaroid--hero');
    var run = false;
    window.addEventListener('scroll', function () {
      if (run) return;
      run = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y < window.innerHeight * 1.2) {
          if (wash) wash.style.transform = 'translateY(' + (y * 0.12) + 'px)';
          if (pol)  pol.style.transform  = 'rotate(-3.5deg) translateY(' + (y * -0.05) + 'px)';
        }
        run = false;
      });
    }, { passive: true });
  }
})();
