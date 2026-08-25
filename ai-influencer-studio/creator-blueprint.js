(() => {
  const PROFILE_KEY = 'aii-creator-profile';
  const AVATAR_KEY = 'aii-avatar-dna';
  const PLAN_KEY = 'aii-blueprint-plan';
  const PROJECTS_KEY = 'aii-projects';

  const q = (s, root = document) => root.querySelector(s);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); } catch { return d; } };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const toast = (t) => window.showToast ? window.showToast(t) : alert(t);

  const style = document.createElement('style');
  style.textContent = `
    .bp-shell{display:grid;gap:14px}.bp-hero{background:linear-gradient(135deg,#151827,#25223a);color:#fff;border-radius:18px;padding:22px;border:1px solid rgba(255,255,255,.08)}
    .bp-hero h2{margin:4px 0 8px;font-size:24px}.bp-hero p{margin:0;color:#cfd3df;max-width:780px;line-height:1.55}.bp-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .bp-card{background:#fff;border:1px solid #e7e9f1;border-radius:16px;padding:18px}.bp-card.dark{background:#171925;color:#fff;border-color:#2c3040}.bp-card h3{margin:0 0 12px;font-size:14px}.bp-card p{line-height:1.55}
    .bp-form{display:grid;gap:10px}.bp-form label{display:grid;gap:5px;font-size:9px;font-weight:800;color:#747b8a}.bp-form input,.bp-form textarea{width:100%;box-sizing:border-box;border:1px solid #dfe2eb;border-radius:10px;padding:10px 11px;background:#fbfbfd;color:#252936;font:inherit}.bp-form textarea{min-height:78px;resize:vertical}
    .bp-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.bp-chip-row{display:flex;gap:6px;flex-wrap:wrap}.bp-chip{display:inline-flex;padding:6px 8px;border-radius:999px;background:#eef0f7;color:#4b5262;font-size:8px;font-weight:800}.bp-card.dark .bp-chip{background:#25293a;color:#d9deea}
    .bp-prompt{background:#10131e;color:#e8ebf4;border:1px solid #2a2f41;border-radius:12px;padding:14px;white-space:pre-wrap;line-height:1.6;font-size:9px;min-height:120px}.bp-mini{font-size:8px;color:#848b99;line-height:1.5}
    .bp-week{display:grid;gap:10px}.bp-day{border:1px solid #e8eaf1;border-radius:14px;padding:14px;background:#fff}.bp-day-head{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px}.bp-day-head b{font-size:11px}.bp-format{padding:5px 8px;border-radius:999px;background:#eef2ff;color:#5366a8;font-size:8px;font-weight:800}.bp-hook{font-weight:800;margin:6px 0;font-size:11px}.bp-copy{margin-top:8px}.bp-money{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.bp-money article{border:1px solid #e8eaf1;border-radius:14px;padding:14px;background:#fff}.bp-money b{display:block;margin-bottom:6px}.bp-money span{font-size:8px;color:#777f8d;line-height:1.5}.bp-section-title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
    @media(max-width:1000px){.bp-grid,.bp-money{grid-template-columns:1fr 1fr}}@media(max-width:720px){.bp-grid,.bp-money{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function defaults() {
    return {
      name: 'Moja influencerka',
      handle: '@moja.influencerka',
      niche: 'Beauty / lifestyle / UGC',
      tagline: 'Praktyczne treści, autentyczne rekomendacje i estetyczny lifestyle.',
      tone: 'naturalny, konkretny, ekspercki bez przesady',
      audience: 'osoby zainteresowane praktycznymi poradami, produktami i świadomymi zakupami',
      pillars: 'edukacja, testy i recenzje, lifestyle, kulisy, rekomendacje'
    };
  }

  function getProfile() {
    const p = read(PROFILE_KEY, {});
    return {...defaults(), ...p, handle: p.handle || defaults().handle, tagline: p.tagline || p.bio || defaults().tagline, pillars: p.pillars || defaults().pillars};
  }

  function getFormProfile() {
    return {
      name: q('#bpName')?.value.trim() || 'Moja influencerka',
      handle: q('#bpHandle')?.value.trim() || '@moja.influencerka',
      niche: q('#bpNiche')?.value.trim() || 'Lifestyle',
      tagline: q('#bpTagline')?.value.trim() || '',
      tone: q('#bpTone')?.value.trim() || '',
      audience: q('#bpAudience')?.value.trim() || '',
      pillars: q('#bpPillars')?.value.trim() || ''
    };
  }

  function visualPrompt(profile) {
    const dna = read(AVATAR_KEY, {});
    const parts = [
      'Hyper-realistic editorial portrait of a recurring AI creator.',
      `Creator niche: ${profile.niche}.`,
      profile.tagline ? `Brand mood: ${profile.tagline}.` : '',
      dna.age ? `Visual age: ${dna.age}.` : '',
      dna.hair ? `Hair: ${dna.hair}.` : '',
      dna.eyes ? `Eyes: ${dna.eyes}.` : '',
      dna.style ? `Personal style: ${dna.style}.` : '',
      dna.signature ? `Signature visual language: ${dna.signature}.` : '',
      'Natural skin texture, realistic anatomy and hands, clean premium lighting, shallow depth of field, commercial social-media photography, no watermark, no text.',
      'Keep the same facial identity, face proportions, hair color and eye color across every future generation.'
    ].filter(Boolean);
    return parts.join(' ');
  }

  const formats = [
    ['Karuzela edukacyjna', 'Wyjaśnij jeden praktyczny problem w 5 prostych slajdach.'],
    ['Reels – analiza przypadku', 'Zacznij od mocnego hooka, pokaż problem, rozwiązanie i jedno konkretne CTA.'],
    ['Post + mikro-esej', 'Obal popularny mit i zakończ jednym praktycznym wnioskiem do wdrożenia dziś.'],
    ['Reels – szybka lista', 'Pokaż 3–5 prostych rekomendacji w szybkim, czytelnym formacie.'],
    ['Karuzela – mity i fakty', 'Wybierz 3 mity z niszy i skonfrontuj je z praktycznym wyjaśnieniem.'],
    ['Mini-vlog / kulisy', 'Pokaż prosty proces, rutynę albo przygotowanie materiału od kuchni.'],
    ['Post refleksyjny + Q&A', 'Podsumuj tydzień, dodaj opinię i zaproś odbiorców do pytań.']
  ];

  function dayNames() { return ['Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota','Niedziela']; }

  function hashtags(profile) {
    const words = String(profile.niche || '').toLowerCase().split(/[^a-ząćęłńóśźż0-9]+/i).filter(x => x.length > 3).slice(0,3);
    const base = words.map(x => '#' + x.replace(/[^a-ząćęłńóśźż0-9]/gi,'')).join(' ');
    return `${base} #tworcatresci #socialmedia #contentcreator`.trim();
  }

  function createPlan(profile) {
    const pillars = String(profile.pillars || '').split(',').map(x => x.trim()).filter(Boolean);
    const start = new Date();
    return formats.map((f, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const pillar = pillars[i % Math.max(pillars.length,1)] || profile.niche;
      const hook = i === 0 ? `Najczęstszy błąd w temacie „${pillar}”, który łatwo poprawić.`
        : i === 1 ? `Jeśli robisz to w obszarze „${pillar}”, sprawdź ten prostszy sposób.`
        : i === 2 ? `Popularna rada z kategorii „${pillar}” brzmi dobrze, ale nie zawsze działa.`
        : i === 3 ? `Moje ${Math.min(5, i+2)} praktyczne wybory w kategorii „${pillar}”.`
        : i === 4 ? `3 mity o „${pillar}”, które warto przestać powtarzać.`
        : i === 5 ? `Tak naprawdę wygląda moje przygotowanie treści o „${pillar}”.`
        : `Jedna rzecz, którą zmieniłabym dziś w podejściu do „${pillar}”.`;
      const body = `${f[1]} Ton: ${profile.tone}. Kieruj treść do: ${profile.audience}. Zakończ prostym CTA: „Napisz, który punkt mam rozwinąć w kolejnym materiale.”`;
      return {day: dayNames()[i], date: d.toISOString().slice(0,10), format:f[0], pillar, hook, body, hashtags:hashtags(profile)};
    });
  }

  function renderPlan(plan) {
    const host = q('#bpWeek'); if (!host) return;
    host.innerHTML = plan.map((x,i) => `<article class="bp-day"><div class="bp-day-head"><b>${esc(x.day)}</b><span class="bp-format">${esc(x.format)}</span><span class="bp-chip">${esc(x.date)}</span></div><div class="bp-hook">${esc(x.hook)}</div><div class="bp-mini">${esc(x.body)}</div><div class="bp-mini" style="margin-top:7px">${esc(x.hashtags)}</div><button class="ghost bp-copy" data-bp-copy="${i}">Kopiuj post</button></article>`).join('');
    host.querySelectorAll('[data-bp-copy]').forEach(btn => btn.onclick = () => {
      const x = plan[Number(btn.dataset.bpCopy)];
      copy(`${x.hook}\n\n${x.body}\n\n${x.hashtags}`);
    });
  }

  function copy(text) {
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => toast('Skopiowano')).catch(() => fallbackCopy(text));
    else fallbackCopy(text);
  }
  function fallbackCopy(text) {
    const ta = document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('Skopiowano');
  }

  function addPlanToCalendar(plan) {
    const projects = read(PROJECTS_KEY, []);
    const existing = new Set(projects.map(x => `${x.date}|${x.name}`));
    let added = 0;
    plan.forEach(x => {
      const name = `${x.format} — ${x.pillar}`;
      const key = `${x.date}|${name}`;
      if (existing.has(key)) return;
      projects.push({id: Date.now() + added, name, type: x.format.includes('Reels') ? 'Reels' : 'Post', platform:'Instagram', date:x.date, notes:`${x.hook}\n\n${x.body}\n\n${x.hashtags}`});
      added++;
    });
    save(PROJECTS_KEY, projects);
    window.dispatchEvent(new StorageEvent('storage', {key:PROJECTS_KEY}));
    toast(`Dodano do kalendarza: ${added}`);
  }

  function renderBlueprint() {
    const content = q('#content'); if (!content) return;
    const p = getProfile();
    const savedPlan = read(PLAN_KEY, []);
    q('#pageTitle').textContent = 'Creator Blueprint';
    q('#pageSubtitle').textContent = 'Strategia persony, wyglądu, treści i monetyzacji w jednym miejscu.';
    document.querySelectorAll('.nav-item').forEach(a => a.classList.toggle('active', a.dataset.view === 'blueprint'));

    content.innerHTML = `<section class="bp-shell">
      <section class="bp-hero"><div class="eyebrow">CREATOR STRATEGY OS</div><h2>Creator Blueprint</h2><p>Zdefiniuj personę raz, a następnie wykorzystuj te same dane w Avatar DNA, generatorach, planie publikacji i kampaniach.</p></section>
      <section class="bp-grid">
        <article class="bp-card"><h3>Profil persony</h3><div class="bp-form">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><label>Nazwa<input id="bpName" value="${esc(p.name)}"></label><label>Nick / handle<input id="bpHandle" value="${esc(p.handle)}"></label></div>
          <label>Nisza / specjalizacja<input id="bpNiche" value="${esc(p.niche)}"></label>
          <label>Hasło marki<textarea id="bpTagline">${esc(p.tagline)}</textarea></label>
          <label>Głos marki<textarea id="bpTone">${esc(p.tone)}</textarea></label>
          <label>Odbiorcy<textarea id="bpAudience">${esc(p.audience)}</textarea></label>
          <label>Filary treści<input id="bpPillars" value="${esc(p.pillars)}"></label>
        </div><div class="bp-actions"><button class="primary" id="bpSave">Zapisz Blueprint</button><button class="ghost" id="bpRefreshPrompt">Odśwież prompt wyglądu</button></div></article>
        <article class="bp-card dark"><div class="bp-section-title"><h3>Prompt wyglądu</h3><span class="bp-chip">AVATAR DNA</span></div><div class="bp-prompt" id="bpVisualPrompt">${esc(visualPrompt(p))}</div><div class="bp-actions"><button class="ghost" id="bpCopyPrompt">Kopiuj prompt</button><button class="ghost" id="bpGoAvatar">Otwórz AI Avatar</button></div><p class="bp-mini">Prompt korzysta z danych profilu oraz zapisanych cech Avatar DNA. Nie zawiera fikcyjnych danych statystycznych.</p></article>
      </section>
      <section class="bp-card"><div class="bp-section-title"><div><h3>Plan treści na 7 dni</h3><div class="bp-mini">Generowany lokalnie z niszy, tonu, odbiorców i filarów treści.</div></div><div class="bp-actions" style="margin:0"><button class="primary" id="bpGenerateWeek">Generuj 7 dni</button><button class="ghost" id="bpCalendar">Dodaj do kalendarza</button></div></div><div class="bp-week" id="bpWeek"></div></section>
      <section class="bp-card"><h3>Pomysły na monetyzację</h3><div class="bp-money">
        <article><b>Pakiety UGC</b><span>Twórz zestawy: 1 video, 3 video, video + zdjęcia. Dopasuj ofertę do niszy: ${esc(p.niche)}.</span></article>
        <article><b>Afiliacja</b><span>Łącz edukacyjne treści z produktami, które naturalnie wynikają z rekomendacji i potrzeb odbiorców.</span></article>
        <article><b>Produkt cyfrowy</b><span>Checklista, mini e-book, szablon lub przewodnik oparty na najczęściej powtarzających się pytaniach społeczności.</span></article>
        <article><b>Współprace markowe</b><span>Buduj kampanie wokół filarów treści zamiast pojedynczych publikacji. To ułatwia sprzedaż pakietów długoterminowych.</span></article>
      </div></section>
    </section>`;

    let currentPlan = Array.isArray(savedPlan) && savedPlan.length === 7 ? savedPlan : createPlan(p);
    renderPlan(currentPlan);

    q('#bpSave').onclick = () => {
      const v = getFormProfile();
      const old = read(PROFILE_KEY, {});
      save(PROFILE_KEY, {...old, ...v, bio:v.tagline});
      q('#bpVisualPrompt').textContent = visualPrompt(v);
      toast('Creator Blueprint zapisany');
    };
    q('#bpRefreshPrompt').onclick = () => q('#bpVisualPrompt').textContent = visualPrompt(getFormProfile());
    q('#bpCopyPrompt').onclick = () => copy(q('#bpVisualPrompt').textContent);
    q('#bpGoAvatar').onclick = () => {
      const link = q('.nav-item[data-view="avatar"]');
      if (link) link.click();
    };
    q('#bpGenerateWeek').onclick = () => {
      currentPlan = createPlan(getFormProfile());
      save(PLAN_KEY, currentPlan);
      renderPlan(currentPlan);
      toast('Plan 7 dni wygenerowany');
    };
    q('#bpCalendar').onclick = () => addPlanToCalendar(currentPlan);
  }

  function bind() {
    const link = q('.nav-item[data-view="blueprint"]');
    if (link) link.onclick = (e) => { e?.preventDefault?.(); renderBlueprint(); };
  }

  document.addEventListener('DOMContentLoaded', bind);
  setTimeout(bind, 0);
  window.AII_CreatorBlueprint = {open: renderBlueprint};
})();