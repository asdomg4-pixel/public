// =====================
// STATO GENERALE
// =====================
let families = {};
let dorkFamilies = {};
let landFamilies = {};
let showSimulationsOnCalculate = false;
const commanderColors = new Set();

// Salva l'ultimo risultato del calcolatore, usato per il copy-to-clipboard
// al click sulla percentuale di successo
let lastCalculationSummary = null;

// ROCKS
const activeFamilies = new Set();
const selected = new Set();
const preselectedFamilies = ["signet", "talisman", "commander"];

// DORKS
const activeDorkFamilies = new Set();
const selectedDorks = new Set();

// LANDS
const activeLandFamilies = new Set();
const selectedLands = new Set();
const preselectedLands = ["Shock", "Triome", "Triland", "PainLand", "FilterDual", "Pathway", "Commander", "BondLand", "VergeLand", "Filter", "Horizon"];

// UI
const decklist = document.getElementById("decklistContainer");
const dorksDecklist = document.getElementById("dorksDecklist");
const landsDecklist = document.getElementById("landsDecklist");

// =====================
// FETCH DATI
// =====================
fetch("Families.json")
  .then(r => r.json())
  .then(data => {
    families = data;
    renderFamilies();
    initImages().then(initPreselectedFamilies);
  });

fetch("ManaDorks.json")
  .then(r => r.json())
  .then(data => {
    dorkFamilies = data;
    renderDorksFamilies();
  });

fetch("Landa.json")
  .then(r => r.json())
  .then(data => {
    landFamilies = data;
    renderLandsFamilies();
    initPreselectedLands();
  });

// =====================
// COLOR LOGIC
// =====================
function legalByColor(card) {
  if (commanderColors.size === 0) {
    return card.colors.length === 0;
  }
  if (card.colors.length === 0) return true;
  return card.colors.every(c => commanderColors.has(c));
}

// =====================
// EVENT LISTENERS
// =====================

// START SCREEN
document.querySelectorAll(".start-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    selectMode(btn.dataset.mode, btn);
  });
});

// Bad Apple dynamic loader: minimal loader in main Script.js
async function loadBadAppleWidget() {
  // avoid loading multiple times
  if (document.getElementById('badAppleContainer')) return;

  // create container
  const container = document.createElement('div');
  container.id = 'badAppleContainer';
  container.style.padding = '12px';
  container.style.maxWidth = '960px';
  container.style.margin = '12px auto';
  container.style.background = '#111';
  container.style.border = '1px solid #222';
  container.style.borderRadius = '8px';
  container.style.color = '#eee';

  // close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Chiudi Bad Apple';
  closeBtn.className = 'color-btn';
  closeBtn.style.marginBottom = '8px';
  closeBtn.addEventListener('click', () => {
    // remove loaded CSS
    const link = document.getElementById('badAppleCss');
    if (link) link.remove();
    // remove loaded script
    const scr = document.getElementById('badAppleScript');
    if (scr) scr.remove();
    container.remove();
  });
  container.appendChild(closeBtn);

  // fetch badapple/index.html and inject inner body content
  try {
    const res = await fetch('badapple/index.html');
    if (!res.ok) throw new Error('badapple/index.html not found');
    const text = await res.text();
    // Extract body content
    const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyHtml = bodyMatch ? bodyMatch[1] : text;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = bodyHtml;
    // rewrite relative src/href to point into badapple/ folder
    const elems = wrapper.querySelectorAll('[src], [href]');
    elems.forEach(el => {
      if (el.hasAttribute('src')) {
        const v = el.getAttribute('src');
        if (v && !v.match(/^(https?:|\/)/i)) {
          el.setAttribute('src', 'badapple/' + v);
        }
      }
      if (el.hasAttribute('href')) {
        const v = el.getAttribute('href');
        if (v && !v.match(/^(https?:|\/)/i)) {
          el.setAttribute('href', 'badapple/' + v);
        }
      }
    });

    // Append wrapper after close button
    container.appendChild(wrapper);

    // load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'badapple/style.css';
    link.id = 'badAppleCss';
    document.head.appendChild(link);

    // load p5 libraries if needed (index.html used CDN); ensure p5 exists
    if (typeof window.p5 === 'undefined') {
      const p5lib = document.createElement('script');
      p5lib.src = 'https://cdn.jsdelivr.net/npm/p5@2.0.0/lib/p5.js';
      p5lib.async = false;
      document.head.appendChild(p5lib);
      const p5sound = document.createElement('script');
      p5sound.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.8.0/addons/p5.sound.min.js';
      p5sound.async = false;
      document.head.appendChild(p5sound);
    }

    // load sketch.js from badapple folder
    const script = document.createElement('script');
    script.src = 'badapple/sketch.js';
    script.id = 'badAppleScript';
    script.type = 'text/javascript';
    document.body.appendChild(script);

    // insert container into page (below main start screen)
    const main = document.getElementById('startScreen') || document.body;
    main.insertAdjacentElement('afterend', container);
  } catch (err) {
    alert('Errore caricamento Bad Apple: ' + err.message);
    container.remove();
  }
}

document.getElementById('badAppleBtn')?.addEventListener('click', () => {
  loadBadAppleIframeWidget();
});

// iframe-based Bad Apple loader
async function loadBadAppleIframeWidget() {
  if (document.getElementById('badAppleContainer')) return;

  const colorBar = document.getElementById("commanderColorsBar");
  colorBar.style.display = "block";

  // Nascondi i colori e copia lista per Bad Apple, ma mostra torna indietro
  const colorButtons = colorBar.querySelectorAll(".color-btn[data-color]");
  const copyListBtn = document.getElementById("copyListBtn");
  colorButtons.forEach(btn => btn.style.display = "none");
  if (copyListBtn) copyListBtn.style.display = "none";

  const container = document.createElement('div');
  container.id = 'badAppleContainer';
  container.style.padding = '12px';
  container.style.maxWidth = '960px';
  container.style.margin = '12px auto';
  container.style.background = '#111';
  container.style.border = '1px solid #222';
  container.style.borderRadius = '8px';
  container.style.color = '#eee';

  const iframe = document.createElement('iframe');
  iframe.id = 'badAppleIframe';
  iframe.src = 'badapple/index.html';
  iframe.style.width = '100%';
  iframe.style.height = '640px';
  iframe.style.border = '0';
  iframe.style.background = 'transparent';
  iframe.style.display = 'block';
  container.appendChild(iframe);

  const main = document.getElementById('startScreen') || document.body;
  main.insertAdjacentElement('afterend', container);
}

// COLOR BUTTONS
document.querySelectorAll(".color-btn[data-color]").forEach(btn => {
  btn.addEventListener("click", () => {
    toggleColor(btn.dataset.color, btn);
  });
});

// HOME
document.getElementById("goHomeBtn")
  ?.addEventListener("click", goHome);

// COPY
document.getElementById("copyBtn")
  ?.addEventListener("click", copyList);

// COPY DORKS
document.getElementById("copyDorksBtn")
  ?.addEventListener("click", () => {
    const text = [...selectedDorks].sort().map(c => `1 ${c}`).join("\n");
    navigator.clipboard.writeText(text);
    alert("Lista copiata!");
  });

// COPY LISTA UNIFICATO
document.getElementById("copyListBtn")
  ?.addEventListener("click", copyActiveList);

// COPY LANDS
document.getElementById("copyLandsBtn")
  ?.addEventListener("click", copyLandsList);

// =====================
// ROCKS
// =====================
function toggleFamily(fam, btn) {
  if (activeFamilies.has(fam)) {
    activeFamilies.delete(fam);
    btn.classList.remove("active");
    families[fam].forEach(c => selected.delete(c.name));
  } else {
    activeFamilies.add(fam);
    btn.classList.add("active");
    families[fam]
      .filter(c => legalByColor(c))
      .forEach(c => selected.add(c.name));
  }
  updateList();
}

function toggleDorkFamily(fam, btn) {
  if (activeDorkFamilies.has(fam)) {
    activeDorkFamilies.delete(fam);
    btn.classList.remove("active");
    dorkFamilies[fam].forEach(c => selectedDorks.delete(c.name));
  } else {
    activeDorkFamilies.add(fam);
    btn.classList.add("active");
    dorkFamilies[fam]
      .filter(c => legalByColor(c))
      .forEach(c => selectedDorks.add(c.name));
  }
  updateDorksList();
}

function toggleLandFamily(fam, btn) {
  if (activeLandFamilies.has(fam)) {
    activeLandFamilies.delete(fam);
    btn.classList.remove("active");
    landFamilies[fam].forEach(c => selectedLands.delete(c.name));
  } else {
    activeLandFamilies.add(fam);
    btn.classList.add("active");
    landFamilies[fam]
      .filter(c => legalByColor(c))
      .forEach(c => selectedLands.add(c.name));
  }
  updateLandsList();
}

function updateList() {
  renderCardList([...selected].sort(), decklist);
}

function updateDorksList() {
  renderCardList([...selectedDorks].sort(), dorksDecklist);
}

function updateLandsList() {
  renderCardList([...selectedLands].sort(), landsDecklist);
}

// Renderizza lista di carte come elementi HTML con popup
function renderCardList(cardNames, container) {
  container.innerHTML = "";
  const isTouchDevice = () => {
    return (('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      (navigator.msMaxTouchPoints > 0));
  };

  const isTouch = isTouchDevice();

  cardNames.forEach(cardName => {
    const item = document.createElement("div");
    item.className = "card-item";
    item.textContent = `${cardName}`;

    if (isTouch) {
      // Mobile: click per toggle
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        if (currentPopup && currentPopup.classList.contains("active")) {
          hideCardPopup();
        } else {
          showCardPopup(cardName, e);
        }
      });
    } else {
      // Desktop: hover
      item.addEventListener("mouseenter", (e) => showCardPopup(cardName, e));
      item.addEventListener("mouseleave", () => hideCardPopup());
    }

    container.appendChild(item);
  });
}

// Popup card image on hover
let currentPopup = null;

async function showCardPopup(cardName, event) {
  // Recupera l'immagine da cache o Scryfall
  let imageUrl = imageCache[cardName];
  if (!imageUrl) {
    imageUrl = await fetchImg(cardName);
  }

  if (!imageUrl) {
    console.warn(`No image URL found for ${cardName}`);
    return;
  }

  console.log(`Showing popup for ${cardName} with image: ${imageUrl}`);

  // Crea o aggiorna il popup
  if (!currentPopup) {
    currentPopup = document.createElement("div");
    currentPopup.className = "card-popup";
    document.body.appendChild(currentPopup);
    console.log("Created new popup element");
  }

  currentPopup.innerHTML = `<img src="${imageUrl}" alt="${cardName}">`;
  currentPopup.classList.add("active");

  console.log(`Popup shown (centered on screen)`);
}

function hideCardPopup() {
  if (currentPopup) {
    currentPopup.classList.remove("active");
  }
}

// Chiudi popup quando clicchi fuori dalla lista (su qualunque altro punto)
document.addEventListener("click", (e) => {
  if (!e.target.closest(".card-item") && currentPopup && currentPopup.classList.contains("active")) {
    hideCardPopup();
  }
});

// =====================
// COLOR TOGGLE
// =====================
function toggleColor(color, btn) {
  commanderColors.has(color)
    ? commanderColors.delete(color)
    : commanderColors.add(color);

  btn.classList.toggle("active");

  // reset rocks
  selected.clear();
  activeFamilies.forEach(f =>
    families[f]
      .filter(c => legalByColor(c))
      .forEach(c => selected.add(c.name))
  );

  // reset dorks
  selectedDorks.clear();
  activeDorkFamilies.forEach(f =>
    dorkFamilies[f]
      .filter(c => legalByColor(c))
      .forEach(c => selectedDorks.add(c.name))
  );

  // reset lands
  selectedLands.clear();
  activeLandFamilies.forEach(f =>
    landFamilies[f]
      .filter(c => legalByColor(c))
      .forEach(c => selectedLands.add(c.name))
  );

  updateList();
  updateDorksList();
  updateLandsList();
}

// =====================
// NAVIGAZIONE
// =====================
function selectMode(mode, btn) {
  hideCardPopup();

  const colorBar = document.getElementById("commanderColorsBar");
  colorBar.style.display = "block";

  // Nascondi i colori e copia lista per calculator, ma mostra torna indietro
  const colorButtons = colorBar.querySelectorAll(".color-btn[data-color]");
  const copyListBtn = document.getElementById("copyListBtn");
  const colori = document.getElementById("titlecolori");

  if (mode === "calculator") {
    colorButtons.forEach(btn => btn.style.display = "none");
    if (copyListBtn) copyListBtn.style.display = "none";
    colori.style.display = "none";
  } else {
    colorButtons.forEach(btn => btn.style.display = "");
    if (copyListBtn) copyListBtn.style.display = "";
    colori.style.display = "";
  }

  const line = document.getElementById("modeLine");
  line.classList.remove("active");
  void line.offsetWidth;
  line.classList.add("active");

  btn.style.transform = "scale(0.95)";
  setTimeout(() => btn.style.transform = "", 150);

  setTimeout(() => {
    document.getElementById("startScreen").style.display = "none";
    document.getElementById("rocksScreen").style.display =
      mode === "rocks" ? "block" : "none";
    document.getElementById("dorksScreen").style.display =
      mode === "dorks" ? "block" : "none";
    document.getElementById("landsScreen").style.display =
      mode === "lands" ? "block" : "none";
    document.getElementById("calculatorScreen").style.display =
      mode === "calculator" ? "block" : "none";
    // ascii screen removed
  }, 300);
}

function goHome() {
  hideCardPopup();
  document.getElementById("rocksScreen").style.display = "none";
  document.getElementById("dorksScreen").style.display = "none";
  document.getElementById("landsScreen").style.display = "none";
  document.getElementById("calculatorScreen").style.display = "none";
  // ascii screen removed
  document.getElementById("startScreen").style.display = "block";
  document.getElementById("commanderColorsBar").style.display = "none";
  document.getElementById("modeLine")?.classList.remove("active");
  // Rimuovi il widget Bad Apple quando si torna indietro
  const badAppleContainer = document.getElementById("badAppleContainer");
  if (badAppleContainer) badAppleContainer.remove();
}
function Auto() {
  window.location.replace("https://dungeonmaster.altervista.org/AutoLand/AutoLand.html");
}


function copyList() {
  const text = [...selected].sort().map(c => `1 ${c}`).join("\n");
  navigator.clipboard.writeText(text);
  alert("Lista copiata!");
}

function copyActiveList() {
  let textToCopy = "";

  if (document.getElementById("rocksScreen").style.display !== "none") {
    textToCopy = [...selected].sort().map(c => `1 ${c}`).join("\n");
  } else if (document.getElementById("dorksScreen").style.display !== "none") {
    // Per dorks, raggruppa per famiglia
    const grouped = {};
    activeDorkFamilies.forEach(fam => {
      grouped[fam] = dorkFamilies[fam]
        .filter(c => legalByColor(c))
        .map(c => c.name)
        .sort();
    });
    textToCopy = Object.keys(grouped)
      .sort()
      .map(fam => {
        const translatedFam = translations[currentLang].dorkFamilies[fam] || deriveLabelFromKey(fam);
        return `${translatedFam}:\n${grouped[fam].map(c => `1 ${c}`).join("\n")}`;
      })
      .join("\n\n");
  } else if (document.getElementById("landsScreen").style.display !== "none") {
    textToCopy = [...selectedLands].sort().map(c => `1 ${c}`).join("\n");
  }

  if (textToCopy) {
    navigator.clipboard.writeText(textToCopy);
    alert("Lista copiata!");
  }
}

function copyLandsList() {
  const text = [...selectedLands].sort().map(c => `1 ${c}`).join("\n");
  navigator.clipboard.writeText(text);
  alert("Lista copiata!");
}

// =====================
// RENDER ROCKS
// =====================
// familyMeta è opzionale: se una famiglia presente in Families.json non ha
// una entry qui, l'etichetta viene derivata automaticamente dal nome chiave.
const familyMeta = {
  commander: { label: "Commander" },
  signet: { label: "Signet" },
  talisman: { label: "Talisman" },
  medallion: { label: "Medallion" },
  diamond: { label: "Diamond" },
  ramos: { label: "Ramos" },
  add2: { label: "3 mana add 2" },
  fast: { label: "Fast Mana" },
  big: { label: "Big Mana" }
};

function getFamilyLabel(fam) {
  return (familyMeta[fam] && familyMeta[fam].label) || deriveLabelFromKey(fam);
}

function renderFamilies() {
  const grid = document.getElementById("familyGrid");
  grid.innerHTML = "";

  Object.keys(families).forEach(fam => {
    const label = getFamilyLabel(fam);
    const btn = document.createElement("div");
    btn.className = "family-btn";
    btn.dataset.family = fam;

    btn.addEventListener("click", () => toggleFamily(fam, btn));

    btn.innerHTML = `
      <div class="tooltip">${label}</div>
      <img class="main" id="img-${fam}">
      <div class="family-title">${label}</div>
    `;

    grid.appendChild(btn);
  });
}

// =====================
// PRESELECT ROCKS
// =====================
function initPreselectedFamilies() {
  preselectedFamilies.forEach(fam => {
    const btn = document.querySelector(
      `.family-btn[data-family="${fam}"]`
    );
    if (!btn) return;

    activeFamilies.add(fam);
    btn.classList.add("active");

    families[fam]
      .filter(c => legalByColor(c))
      .forEach(c => selected.add(c.name));
  });

  updateList();
}

// =====================
// PRESELECT LANDS
// =====================
function initPreselectedLands() {
  preselectedLands.forEach(fam => {
    const btn = document.querySelector(
      `.family-btn[data-family="${fam}"]`
    );
    if (!btn) return;

    activeLandFamilies.add(fam);
    btn.classList.add("active");

    landFamilies[fam]
      .filter(c => legalByColor(c))
      .forEach(c => selectedLands.add(c.name));
  });

  updateLandsList();
}

// =====================
// RENDER DORKS
// =====================
function renderDorksFamilies() {
  const grid = document.getElementById("dorksFamilyGrid");
  if (!grid) return;

  grid.innerHTML = "";

  Object.keys(dorkFamilies).forEach(fam => {
    const btn = document.createElement("div");
    btn.className = "family-btn";
    btn.dataset.family = fam;

    btn.addEventListener("click", () =>
      toggleDorkFamily(fam, btn)
    );

    const translatedFam = translations[currentLang].dorkFamilies[fam] || deriveLabelFromKey(fam);

    btn.innerHTML = `
      <div class="tooltip">${translatedFam}</div>
      <img class="main" id="dork-img-${fam}">
      <div class="preview p1"><img id="dork-prev-${fam}-1"></div>
      <div class="preview p2"><img id="dork-prev-${fam}-2"></div>
      <div class="preview p3"><img id="dork-prev-${fam}-3"></div>
      <div class="family-title">${translatedFam}</div>
    `;

    grid.appendChild(btn);
  });

  initDorkImages();
}

// =====================
// RENDER LANDS
// =====================
// landsMeta ora è opzionale: se una famiglia presente in Landa.json non ha
// una entry qui, l'etichetta viene derivata automaticamente dal nome chiave
// (es. "SnowDual" -> "Snow Dual").
const landsMeta = {
  Commander: { label: "Commander" },
  BondLand: { label: "Bond Land" },
  Bounce: { label: "Bounce" },
  Dual: { label: "Dual" },
  FastLand: { label: "Fast Land" },
  Fetch: { label: "Fetch" },
  Filter: { label: "Filter" },
  FilterDual: { label: "Filter Dual" },
  Gates: { label: "Gates" },
  Horizon: { label: "Horizon" },
  Octolands: { label: "Octolands" },
  PainLand: { label: "Pain Land" },
  Pathway: { label: "Pathway" },
  ScryLand: { label: "Scry Land" },
  Shock: { label: "Shock" },
  SlowLand: { label: "Slow Land" },
  SnowDual: { label: "Snow Dual" },
  Surveil: { label: "Surveil" },
  Thriving: { label: "Thriving" },
  Triome: { label: "Triome" },
  Triland: { label: "Triland" },
  VergeLand: { label: "Verge Land" },
  Vivid: { label: "Vivid" }
};

// Deriva un'etichetta leggibile da una chiave PascalCase/camelCase o con
// underscore, es. "SnowDual" -> "Snow Dual", "CostoUno_Temporaneo" -> "Costo Uno Temporaneo".
function deriveLabelFromKey(key) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

function getLandFamilyLabel(fam) {
  return (landsMeta[fam] && landsMeta[fam].label) || deriveLabelFromKey(fam);
}

function renderLandsFamilies() {
  const grid = document.getElementById("landsFamilyGrid");
  if (!grid) return;

  grid.innerHTML = "";

  Object.keys(landFamilies).forEach(fam => {
    const label = getLandFamilyLabel(fam);
    const btn = document.createElement("div");
    btn.className = "family-btn";
    btn.dataset.family = fam;

    btn.addEventListener("click", () =>
      toggleLandFamily(fam, btn)
    );

    btn.innerHTML = `
      <div class="tooltip">${label}</div>
      <img class="main" id="land-img-${fam}">
      <div class="family-title">${label}</div>
    `;

    grid.appendChild(btn);
  });

  initLandImages();
}


// =====================
// IMMAGINI (ROCKS)
// =====================
const imageCache = {};

async function fetchImg(name) {
  if (imageCache[name]) return imageCache[name];
  const res = await fetch(
    `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`
  );
  const data = await res.json();
  // Gestisce sia carte normali che double-faced
  let imageUrl;
  if (data.image_uris) {
    imageUrl = data.image_uris.normal;
  } else if (data.card_faces && data.card_faces[0] && data.card_faces[0].image_uris) {
    imageUrl = data.card_faces[0].image_uris.normal;
  } else {
    console.warn(`No image found for card: ${name}`);
    return null;
  }
  imageCache[name] = imageUrl;
  return imageCache[name];
}

const familyImages = {
  signet: "Azorius Signet",
  talisman: "Talisman of Dominance",
  fast: "Sol Ring",
  big: "Gilded Lotus",
  medallion: "Pearl Medallion",
  diamond: "Sky Diamond",
  ramos: "Tooth of Ramos",
  commander: "Mind Stone",
  add2: "Basalt Monolith"
};

async function initImages() {
  for (const fam of Object.keys(families)) {
    const cardName =
      familyImages[fam] ||
      (families[fam] && families[fam][0] && families[fam][0].name);
    if (!cardName) continue;

    const img = await fetchImg(cardName);
    const el = document.getElementById(`img-${fam}`);
    if (el) el.src = img;
  }
}
async function initDorkImages() {
  for (const fam of Object.keys(dorkFamilies)) {
    const main = document.getElementById(`dork-img-${fam}`);
    if (!main) continue;

    const cardName =
      dorkFamilyImages[fam] ||
      (dorkFamilies[fam] && dorkFamilies[fam][0] && dorkFamilies[fam][0].name);
    if (!cardName) continue;

    main.src = await fetchImg(cardName);

    const previews = dorkPreviewImages[fam];
    if (!previews) continue;

    for (let i = 0; i < previews.length; i++) {
      const img = document.getElementById(`dork-prev-${fam}-${i + 1}`);
      if (img) img.src = await fetchImg(previews[i]);
    }
  }
}

// =====================
// DORKS IMMAGINI
// =====================
const dorkFamilyImages = {
  CostoUno: "Llanowar Elves",
  CostoUno_Temporaneo: "Gilded Goose",
  CostoDue_QualsiasiMana: "Ornithopter of Paradise",
  CostoDue_ManaSpecifico: "Copper Myr",
  CostoTre_DueMana: "Sage of the Maze"
};

const dorkPreviewImages = {
  CostoUno: ["Birds of Paradise", "Elvish Mystic", "Fyndhorn Elves"],
  CostoUno_Temporaneo: ["Gilded Goose", "Ragavan, Nimble Pilferer", "Blood Pet"],
  CostoDue_QualsiasiMana: ["Bloom Tender", "Faeburrow Elder", "Nightshade Dryad"],
  CostoDue_ManaSpecifico: ["Gold Myr", "Elfhame Druid", "Devoted Druid"],
  CostoTre_DueMana: ["Palladium Myr", "Greenweaver Druid", "Gyre Engineer"]
};

// =====================
// LANDS IMMAGINI
// =====================
// landFamilyImages è opzionale: se una famiglia non ha una entry qui,
// viene usata automaticamente la prima carta di quella famiglia in Landa.json
// come immagine di copertina.
const landFamilyImages = {
  Commander: "Command Tower",
  BondLand: "Sea of Clouds",
  Bounce: "Azorius Chancery",
  Dual: "Tundra",
  FastLand: "Seachrome Coast",
  Fetch: "Flooded Strand",
  Filter: "Darkwater Catacombs",
  FilterDual: "Mystic Gate",
  Gates: "Azorius Guildgate",
  Horizon: "Fiery Islet",
  Octolands: "Turbulent Fen",
  PainLand: "Adarkar Wastes",
  Pathway: "Barkchannel Pathway",
  ScryLand: "Temple of Abandon",
  Shock: "Hallowed Fountain",
  SlowLand: "Deserted Beach",
  SnowDual: "Alpine Meadow",
  Surveil: "Meticulous Archive",
  Thriving: "Thriving Bluff",
  Triome: "Savai Triome",
  Triland: "Seaside Citadel",
  VergeLand: "Floodfarm Verge",
  Vivid: "Vivid Grove"
};

async function initLandImages() {
  for (const fam of Object.keys(landFamilies)) {
    const cardName =
      landFamilyImages[fam] ||
      (landFamilies[fam] && landFamilies[fam][0] && landFamilies[fam][0].name);
    if (!cardName) continue;

    const img = await fetchImg(cardName);
    const el = document.getElementById(`land-img-${fam}`);
    if (el) el.src = img;
  }
}

// =====================
// CALCOLATORE IPERGEOMETRICO - FUNZIONI AGGIORNATE CON MULLIGAN MULTIPLI
// =====================

// Funzione per aggiornare automaticamente l'info box - VERSIONE CORRETTA
function updateCardsDrawnInfo() {
  let maxTurn = 0;

  // Trova il turno massimo tra tutte le famiglie
  for (let i = 1; i <= 3; i++) {
    const turnInput = document.getElementById(`familyMaxTurn${i}`);
    if (turnInput && turnInput.value) {
      const turn = parseInt(turnInput.value);
      if (turn > maxTurn) maxTurn = turn;
    }
  }

  const initialCards = 7;
  const cardsPerTurn = 1;
  const totalCards = initialCards + (maxTurn * cardsPerTurn);

  // CORREZIONE: Verifica se gli elementi esistono prima di impostare textContent
  const initialCardsElement = document.getElementById("initialCards");
  const cardsPerTurnElement = document.getElementById("cardsPerTurn");
  const maxTurnElement = document.getElementById("maxTurn");
  const totalCardsDrawnElement = document.getElementById("totalCardsDrawn");

  if (initialCardsElement) initialCardsElement.textContent = initialCards;
  if (cardsPerTurnElement) cardsPerTurnElement.textContent = cardsPerTurn;
  if (maxTurnElement) maxTurnElement.textContent = maxTurn;
  if (totalCardsDrawnElement) totalCardsDrawnElement.textContent = totalCards;

  return totalCards;
}
// Aggiungi event listener per aggiornare automaticamente quando cambiano i valori
for (let i = 1; i <= 3; i++) {
  const turnInput = document.getElementById(`familyMaxTurn${i}`);
  if (turnInput) {
    turnInput.addEventListener("input", updateCardsDrawnInfo);
  }
}

// Inizializza l'info box all'avvio
setTimeout(updateCardsDrawnInfo, 100);
document.getElementById('showSimulationsCheckbox')?.addEventListener('change', (e) => {
  showSimulationsOnCalculate = e.target.checked;

  // Se la checkbox viene deselezionata, nascondi immediatamente le simulazioni visibili
  if (!e.target.checked) {
    const simulationContainer = document.getElementById('simulationsContainerCalculate');
    if (simulationContainer) {
      simulationContainer.remove();
    }
  }
});


// Funzione per verificare se una mano soddisfa le condizioni per il mulligan
function checkMulliganConditions(deck, families) {
  const initialCounts = new Array(families.length).fill(0);

  for (let i = 0; i < 7; i++) {
    if (deck[i] >= 0) initialCounts[deck[i]]++;
  }

  // Verifica se QUALSIASI famiglia non soddisfa il suo minimo per il mulligan
  for (let i = 0; i < families.length; i++) {
    if (families[i].mulliganThreshold > 0 && initialCounts[i] < families[i].mulliganThreshold) {
      return false; // Mano non accettabile, serve mulligan
    }
  }

  return true; // Mano accettabile
}

// Versione con mulligan multipli - MODIFICATA PER SUPPORTARE LA GENERAZIONE DI DATI
function simulateWithMultipleMulligans(deckSize, families, maxMulligans, debug = false, saveData = showSimulationsOnCalculate) {
  const simulations = 100000;
  let successes = 0;
  let totalMulligansUsed = 0;
  let handsThatUsedMulligan = 0;

  let mulliganCount = 0;
  let simulationData = saveData ? [] : null;

  // Per debug - raccogliamo 10 esempi di fallimento
  let debugFailedSamples = [];
  const maxDebugSamples = 10;

  for (let sim = 0; sim < simulations; sim++) {
    // 1. Prepara il mazzo base
    let baseDeck = [];

    // Aggiungi carte per ogni famiglia
    families.forEach((f, idx) => {
      for (let i = 0; i < f.count; i++) {
        baseDeck.push(idx);
      }
    });

    // Aggiungi carte neutre
    const totalTargetCards = baseDeck.length;
    for (let i = 0; i < deckSize - totalTargetCards; i++) {
      baseDeck.push(-1);
    }

    // 2. Processo di mulligan
    let currentDeck = [...baseDeck];
    let mulligansUsed = 0;
    let handAccepted = false;
    let needsMulligan = false;

    // Rimescola il mazzo iniziale
    for (let i = currentDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [currentDeck[i], currentDeck[j]] = [currentDeck[j], currentDeck[i]];
    }

    // Controlla se la mano iniziale è accettabile
    handAccepted = checkMulliganConditions(currentDeck, families);

    // Se non è accettabile e abbiamo mulligan disponibili, procedi con i mulligan
    if (!handAccepted && maxMulligans > 0) {
      needsMulligan = true;

      for (let m = 0; m < maxMulligans; m++) {

        // Rimescola il mazzo
        currentDeck = [...baseDeck];
        for (let i = currentDeck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [currentDeck[i], currentDeck[j]] = [currentDeck[j], currentDeck[i]];
        }

        // Verifica la nuova mano
        handAccepted = checkMulliganConditions(currentDeck, families);
        mulligansUsed = m + 1;

        if (handAccepted) {
          break; // Mano accettabile, fermati
        }

        // Se abbiamo raggiunto l'ultimo mulligan e la mano non è ancora accettabile
        // dobbiamo tenere l'ultima mano comunque
        if (m === maxMulligans - 1) {
          // Ultimo mulligan, teniamo la mano anche se non è perfetta
          handAccepted = true; // Forziamo l'accettazione
        }
      }
    }

    // Aggiorna le statistiche
    if (needsMulligan) {
      handsThatUsedMulligan++;
      totalMulligansUsed += mulligansUsed;
      mulliganCount++;
    }

    // 3. Calcola il numero massimo di carte da guardare
    const maxTurn = Math.max(...families.map(f => f.maxTurn));
    const cardsToCheck = 7 + maxTurn;

    // 4. Conta le carte trovate per ogni famiglia, rispettando i turni massimi
    const foundCards = new Array(families.length).fill(0);

    for (let cardPos = 0; cardPos < cardsToCheck; cardPos++) {
      const familyIdx = currentDeck[cardPos];
      if (familyIdx >= 0) {
        // In che turno è stata pescata questa carta?
        const turn = cardPos < 7 ? 0 : cardPos - 6;

        // Se il turno è <= al massimo consentito per questa famiglia, conta la carta
        if (turn <= families[familyIdx].maxTurn) {
          foundCards[familyIdx]++;
        }
      }
    }

    // 5. Verifica se tutte le condizioni sono soddisfatte
    let allConditionsMet = true;
    let failingFamily = -1;
    for (let i = 0; i < families.length; i++) {
      if (foundCards[i] < families[i].minSuccess) {
        allConditionsMet = false;
        failingFamily = i;
        break;
      }
    }

    // Salva i dati della simulazione se richiesto
    if (saveData && sim < 100) {
      const simulation = {
        id: sim + 1,
        success: allConditionsMet,
        needsMulligan: needsMulligan,
        mulligansUsed: mulligansUsed,
        foundCards: [...foundCards],
        deckPreview: currentDeck.slice(0, cardsToCheck).map(c => {
          if (c === -1) return 'X';
          const familyName = families[c].name;
          return familyName.substring(0, 3).toUpperCase();
        }),
        // MODIFICA QUESTA PARTE per salvare TUTTE le carte con i turni
        cardTurns: currentDeck.slice(0, cardsToCheck).map((c, index) => {
          if (c === -1) return 'X';
          const turn = index < 7 ? 0 : index - 6;
          const familyName = families[c].name.substring(0, 3).toUpperCase();
          return `${familyName}(T${turn})`;
        })
      };
      simulationData.push(simulation);
    }

    // DEBUG: raccogli esempi di fallimento (allConditionsMet = false)
    if (debug && !allConditionsMet && debugFailedSamples.length < maxDebugSamples) {
      debugFailedSamples.push({
        simulation: sim + 1,
        needsMulligan: needsMulligan,
        mulligansUsed: mulligansUsed,
        foundCards: [...foundCards],
        requiredCards: families.map(f => f.minSuccess),
        failingFamily: families[failingFamily]?.name || 'Unknown',
        deckPreview: currentDeck.slice(0, cardsToCheck).map(c => {
          if (c === -1) return 'X';
          const familyName = families[c].name;
          return familyName.substring(0, 3).toUpperCase();
        }),
        cardTurns: currentDeck.slice(0, cardsToCheck).map((c, index) => {
          if (c === -1) return 'X';
          const turn = index < 7 ? 0 : index - 6;
          const familyName = families[c].name.substring(0, 3).toUpperCase();
          return `${familyName}(T${turn})`;
        })
      });
    }

    if (allConditionsMet) {
      successes++;
    }
  }

  // Log di debug
  if (debug && debugFailedSamples.length > 0) {
    console.log(`=== DEBUG: ${debugFailedSamples.length} esempi di allConditionsMet = false ===`);
    debugFailedSamples.forEach((sample, index) => {
      console.log(`\nEsempio ${index + 1}:`);
      console.log(`Simulazione #${sample.simulation}`);
      console.log(`Mulligan necessario: ${sample.needsMulligan ? 'SÌ' : 'NO'}`);
      console.log(`Carte trovate: ${sample.foundCards.map((count, i) =>
        `${families[i].name}: ${count}`).join(', ')}`);
      console.log(`Carte richieste: ${sample.requiredCards.map((req, i) =>
        `${families[i].name}: ${req}`).join(', ')}`);
      console.log(`Famiglia che fallisce: ${sample.failingFamily}`);
      console.log(`Prime ${7 + Math.max(...families.map(f => f.maxTurn))} carte:`);
      console.log(`  Posizione: ${sample.deckPreview.join(' ')}`);
      console.log(`  Turni:     ${sample.cardTurns.join(' ')}`);

      // Analisi dettagliata delle carte per famiglia
      console.log(`Analisi per famiglia:`);
      families.forEach((family, idx) => {
        const found = sample.foundCards[idx];
        const required = family.minSuccess;
        const maxTurn = family.maxTurn;
        console.log(`  ${family.name}: ${found}/${required} carte (entro T${maxTurn}) - ${found >= required ? '✅ OK' : '❌ Mancano ' + (required - found)}`);
      });
    });

    console.log(`\n=== STATISTICHE ===`);
    console.log(`Successi: ${successes}/${simulations} (${((successes / simulations) * 100).toFixed(2)}%)`);
    console.log(`Tasso Mulligan: ${(mulliganCount / simulations * 100).toFixed(2)}% (${mulliganCount}/${simulations})`);
  }

  return {
    probability: successes / simulations,
    mulliganApplied: handsThatUsedMulligan > 0,
    mulliganRate: handsThatUsedMulligan / simulations,
    avgMulligansPerHand: handsThatUsedMulligan > 0 ? totalMulligansUsed / handsThatUsedMulligan : 0,
    successes: successes,
    simulations: simulations,
    totalMulligansUsed: totalMulligansUsed,
    handsThatUsedMulligan: handsThatUsedMulligan,
    simulationData: simulationData
  };
}

// Funzione per generare e scaricare il JSON con 100 simulazioni
function generateAndDownloadSimulations() {
  const deckSize = parseInt(document.getElementById("deckSize").value);
  const maxMulligans = parseInt(document.getElementById("maxMulligans").value);

  // Leggi le 3 famiglie con i turni massimi
  const families = [];
  for (let i = 1; i <= 3; i++) {
    const name = document.getElementById(`familyName${i}`).value.trim();
    const count = parseInt(document.getElementById(`familyCount${i}`).value);
    const minSuccess = parseInt(document.getElementById(`familyMinSuccess${i}`).value);
    const mulliganThreshold = document.getElementById(`familyMinMulligan${i}`).value
      ? parseInt(document.getElementById(`familyMinMulligan${i}`).value)
      : 0;
    const maxTurn = document.getElementById(`familyMaxTurn${i}`).value
      ? parseInt(document.getElementById(`familyMaxTurn${i}`).value)
      : 0;

    // Aggiungi solo se ha un nome e un count valido
    if (name && count > 0 && minSuccess > 0) {
      families.push({
        name,
        count,
        minSuccess,
        mulliganThreshold,
        maxTurn
      });
    }
  }

  // Validazione
  if (!deckSize || families.length === 0) {
    alert("Per favore, riempire i campi obbligatori e almeno una famiglia prima di generare le simulazioni");
    return;
  }

  // Esegui la simulazione con l'opzione di salvataggio dati
  const result = simulateWithMultipleMulligans(deckSize, families, maxMulligans, false, true);

  if (!result.simulationData || result.simulationData.length === 0) {
    alert("Errore nella generazione dei dati delle simulazioni");
    return;
  }

  // Crea l'oggetto JSON completo
  const simulationExport = {
    metadata: {
      deckSize: deckSize,
      maxMulligans: maxMulligans,
      families: families,
      generatedAt: new Date().toISOString(),
      totalSimulations: result.simulations,
      successProbability: result.probability,
      mulliganRate: result.mulliganRate
    },
    simulations: result.simulationData
  };

  // Converti in JSON formattato
  const jsonData = JSON.stringify(simulationExport, null, 2);

  // Crea e scarica il file
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `simulazioni_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  alert(`File JSON con ${result.simulationData.length} simulazioni scaricato!`);
}

// Funzione per caricare e visualizzare un file JSON di simulazioni
function loadSimulationsFromFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = JSON.parse(e.target.result);
        displaySimulations(data);
      } catch (error) {
        alert('Errore nella lettura del file JSON: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  input.click();
}

// Funzione per visualizzare le simulazioni caricate
function displaySimulations(data) {
  // Crea un contenitore per visualizzare i risultati
  const container = document.createElement('div');
  container.id = 'simulationsContainer';
  container.style.cssText = `
    margin-top: 30px;
    padding: 20px;
    background: #1a1a2e;
    border: 1px solid #444;
    border-radius: 8px;
    max-height: 500px;
    overflow-y: auto;
  `;

  // Rimuovi il contenitore precedente se esiste
  const existingContainer = document.getElementById('simulationsContainer');
  if (existingContainer) {
    existingContainer.remove();
  }

  // Aggiungi il contenitore dopo i risultati del calcolatore
  const resultsSection = document.getElementById('calculatorResults');
  resultsSection.insertAdjacentElement('afterend', container);

  // Crea l'HTML per visualizzare i dati
  let html = `<h3>Simulazioni Caricate (${data.simulations.length})</h3>`;

  // Informazioni sui metadati
  html += `<div style="margin-bottom: 20px; padding: 10px; background: #0f0f0f; border-radius: 6px;">
    <strong>Metadati:</strong><br>
    Dimensione Mazzo: ${data.metadata.deckSize}<br>
    Mulligan: ${data.metadata.maxMulligans}<br>
    Probabilità di Successo: ${(data.metadata.successProbability * 100).toFixed(2)}%<br>
    Tasso Mulligan: ${(data.metadata.mulliganRate * 100).toFixed(2)}%<br>
    Generato il: ${new Date(data.metadata.generatedAt).toLocaleString()}
  </div>`;

  // Tabella delle simulazioni
  html += `<table style="width:100%; border-collapse:collapse; font-size:12px;">
    <thead>
      <tr style="background:#222; text-align:left;">
        <th style="padding:8px; border:1px solid #444;">ID</th>
        <th style="padding:8px; border:1px solid #444;">Successo</th>
        <th style="padding:8px; border:1px solid #444;">Mulligan</th>
        <th style="padding:8px; border:1px solid #444;">Carte Trovate</th>
        <th style="padding:8px; border:1px solid #444;">Prime Carte</th>
      </tr>
    </thead>
    <tbody>`;

  data.simulations.forEach(sim => {
    const successIcon = sim.success ? '✅' : '❌';
    const mulliganText = sim.needsMulligan ? `SÌ (${sim.mulligansUsed})` : 'NO';

    // Crea una stringa per le carte trovate
    const foundCardsText = data.metadata.families.map((fam, idx) =>
      `${fam.name}: ${sim.foundCards[idx]}`
    ).join(', ');

    html += `<tr style="border-bottom:1px solid #333;">
      <td style="padding:8px; border:1px solid #444;">${sim.id}</td>
      <td style="padding:8px; border:1px solid #444; text-align:center;">${successIcon}</td>
      <td style="padding:8px; border:1px solid #444;">${mulliganText}</td>
      <td style="padding:8px; border:1px solid #444; font-size:11px;">${foundCardsText}</td>
      <td style="padding:8px; border:1px solid #444; font-size:11px; font-family:monospace;">${sim.deckPreview.slice(0, 10).join(' ')}...</td>
    </tr>`;
  });

  html += `</tbody></table>`;

  // Statistiche riepilogative
  const successCount = data.simulations.filter(s => s.success).length;
  const mulliganCount = data.simulations.filter(s => s.needsMulligan).length;
  const avgMulligans = data.simulations.reduce((sum, s) => sum + s.mulligansUsed, 0) / data.simulations.length;

  html += `<div style="margin-top:20px; padding:10px; background:#0f0f0f; border-radius:6px;">
    <strong>Riepilogo delle ${data.simulations.length} simulazioni:</strong><br>
    Successi: ${successCount} (${(successCount / data.simulations.length * 100).toFixed(1)}%)<br>
    Mani con Mulligan: ${mulliganCount} (${(mulliganCount / data.simulations.length * 100).toFixed(1)}%)<br>
  </div>`;

  container.innerHTML = html;
}

function displaySimulationsOnCalculate(result, families) {
  // Rimuovi il contenitore precedente se esiste
  const existingContainer = document.getElementById('simulationsContainerCalculate');
  if (existingContainer) {
    existingContainer.remove();
  }

  // Calcola il numero massimo di turni per determinare quante carte mostrare
  const maxTurn = Math.max(...families.map(f => f.maxTurn));
  const totalCardsToShow = 7 + maxTurn;

  // Crea un contenitore per visualizzare i risultati
  const container = document.createElement('div');
  container.id = 'simulationsContainerCalculate';
  container.style.cssText = `
    margin-top: 30px;
    padding: 20px;
    background: #1a1a2e;
    border: 1px solid #444;
    border-radius: 8px;
    max-height: 500px;
    overflow-y: auto;
    font-size: 13px;
  `;

  // Aggiungi il contenitore dopo i risultati del calcolatore
  const resultsSection = document.getElementById('calculatorResults');
  resultsSection.insertAdjacentElement('afterend', container);

  // Calcola le statistiche per il riepilogo
  const successCount = result.simulationData.filter(s => s.success).length;
  const mulliganCount = result.simulationData.filter(s => s.needsMulligan).length;
  const avgMulligans = result.simulationData.reduce((sum, s) => sum + s.mulligansUsed, 0) / result.simulationData.length;

  // Crea l'HTML per visualizzare i dati
  let html = `<h3 style="margin-top: 0; margin-bottom: 15px;">${translations[currentLang].simulationsTitle}</h3>`;

  // RIEPILOGO SOPRA (spostato qui sopra)
  html += `<div style="margin-bottom: 20px; padding: 15px; background: #0f0f0f; border-radius: 6px; border-left: 4px solid #4aa3ff;">
    <strong style="color: #4aa3ff; display: block; margin-bottom: 10px;">${translations[currentLang].summaryShown.replace('{count}', result.simulationData.length)}</strong>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-top: 10px;">
      <div style="background: #1a1a1a; padding: 10px; border-radius: 4px;">
        <div style="font-size: 11px; color: #aaa;">${translations[currentLang].successes}</div>
        <div style="font-size: 18px; color: ${successCount > 0 ? '#5ccc7a' : '#ff6b4a'}; font-weight: bold;">
          ${successCount} <span style="font-size: 12px;">(${(successCount / result.simulationData.length * 100).toFixed(1)}%)</span>
        </div>
      </div>
      <div style="background: #1a1a1a; padding: 10px; border-radius: 4px;">
        <div style="font-size: 11px; color: #aaa;">${translations[currentLang].handsWithMulligan}</div>
        <div style="font-size: 18px; color: ${mulliganCount > 0 ? '#f8f6d8' : '#4aa3ff'}; font-weight: bold;">
          ${mulliganCount} <span style="font-size: 12px;">(${(mulliganCount / result.simulationData.length * 100).toFixed(1)}%)</span>
        </div>
      </div>
      
    </div>
  </div>`;

  // Pulsante per mostrare/nascondere la tabella completa
  html += `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
    <button id="toggleSimulations" style="padding: 8px 15px; background: #4aa3ff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
      <span id="toggleIcon">▼</span> ${translations[currentLang].hideDetails} (${result.simulationData.length} simulazioni)
    </button>
    <div style="font-size: 12px; color: #aaa;">
      ${translations[currentLang].cardsShown}: ${totalCardsToShow} (${translations[currentLang].initialHandPlusTurns.replace('{turns}', maxTurn)})
    </div>
  </div>`;

  // Tabella delle simulazioni
  html += `<div id="simulationsTable" style="overflow-x: auto;">`;
  html += `<table style="width:100%; border-collapse:collapse; font-size:12px; margin-top: 10px;">
    <thead>
      <tr style="background:#222; text-align:left; position: sticky; top: 0; z-index: 10;">
        <th style="padding:8px; border:1px solid #444; min-width: 50px;">ID</th>
        <th style="padding:8px; border:1px solid #444; min-width: 60px;">${translations[currentLang].successHeader}</th>
        <th style="padding:8px; border:1px solid #444; min-width: 80px;">${translations[currentLang].mulliganHeader}</th>
        <th style="padding:8px; border:1px solid #444; min-width: 120px;">${translations[currentLang].cardsFound}</th>
        <th style="padding:8px; border:1px solid #444; min-width: 300px;">${translations[currentLang].allDrawnCards} (${totalCardsToShow})</th>
      </tr>
    </thead>
    <tbody>`;

  result.simulationData.forEach(sim => {
    const successIcon = sim.success ? '✅' : '❌';
    const successColor = sim.success ? '#5ccc7a' : '#ff6b4a';
    const mulliganText = sim.needsMulligan ? `<span style="color: #f8f6d8">SÌ (${sim.mulligansUsed})</span>` : '<span style="color: #4aa3ff">NO</span>';

    // Crea una stringa per le carte trovate con colori
    const foundCardsText = families.map((fam, idx) => {
      const found = sim.foundCards[idx];
      const required = fam.minSuccess;
      const color = found >= required ? '#5ccc7a' : '#ff6b4a';
      return `<span style="color: ${color}">${fam.name.substring(0, 3)}:${found}/${required}</span>`;
    }).join(' ');

    // Mostra TUTTE le carte pescate con indicazione dei turni
    const cardTurnsHTML = sim.cardTurns.map((card, index) => {
      // Determina il colore in base al tipo di carta
      let color = '#aaa'; // Default per carte neutre (X)
      let displayCard = card;

      if (card !== 'X') {
        // Carta di una famiglia
        const match = card.match(/(\w+)\(T(\d+)\)/);
        if (match) {
          const familyCode = match[1];
          const turn = parseInt(match[2]);

          // Trova l'indice della famiglia per il colore
          const familyIndex = families.findIndex(f =>
            f.name.substring(0, 3).toUpperCase() === familyCode
          );

          if (familyIndex >= 0) {
            const family = families[familyIndex];
            const isSuccess = sim.foundCards[familyIndex] >= family.minSuccess;
            color = isSuccess ? '#5ccc7a' : '#ff6b4a';

            // Evidenzia le carte che contano per il successo (entro il turno massimo)
            if (turn <= family.maxTurn) {
              displayCard = `<strong>${card}</strong>`;
            }
          }
        }
      }

      // Evidenzia la separazione tra mano iniziale e turni successivi
      if (index === 6) {
        return `<span style="color: ${color}">${displayCard}</span> <span style="color: #4aa3ff; margin: 0 2px;">|</span>`;
      }

      return `<span style="color: ${color}">${displayCard}</span>`;
    }).join(' ');

    // Aggiungi spaziatura ogni 7 carte per maggiore leggibilità
    const formattedCardTurns = cardTurnsHTML;

    html += `<tr style="border-bottom:1px solid #333; ${!sim.success ? 'background: rgba(255, 107, 74, 0.05);' : ''}">
      <td style="padding:6px; border:1px solid #444; text-align:center; font-weight: bold;">${sim.id}</td>
      <td style="padding:6px; border:1px solid #444; text-align:center; color: ${successColor}; font-weight: bold;">${successIcon}</td>
      <td style="padding:6px; border:1px solid #444; text-align:center;">${mulliganText}</td>
      <td style="padding:6px; border:1px solid #444; font-family:monospace; font-size:11px;">${foundCardsText}</td>
      <td style="padding:6px; border:1px solid #444; font-family:monospace; font-size:11px; line-height: 1.4;">
        <div style="display: flex; flex-wrap: wrap; gap: 2px;">
          ${formattedCardTurns}
        </div>
      </td>
    </tr>`;
  });

  html += `</tbody></table></div>`;

  // Legenda delle carte
  html += `<div style="margin-top: 15px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 4px; font-size: 11px;">
    <strong style="color: #aaa;">Legenda:</strong>
    <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 5px;">
      <div><span style="color: #5ccc7a">■</span> Famiglia con successo</div>
      <div><span style="color: #ff6b4a">■</span> Famiglia senza successo</div>
      <div><span style="color: #4aa3ff">|</span> Separatore mano/turni</div>
      <div><span style="color: #aaa">X</span> Carta neutra</div>
      <div><strong>Testo in grassetto</strong> = Carta pescata entro il turno massimo</div>
    </div>
  </div>`;

  container.innerHTML = html;

  // Aggiungi funzionalità toggle per mostrare/nascondere la tabella
  const toggleBtn = container.querySelector('#toggleSimulations');
  const toggleIcon = container.querySelector('#toggleIcon');
  const tableDiv = container.querySelector('#simulationsTable');
  let isVisible = true;

  toggleBtn.addEventListener('click', () => {
    if (isVisible) {
      tableDiv.style.display = 'none';
      toggleBtn.innerHTML = '<span id="toggleIcon">▶</span> Mostra Dettagli';
      toggleBtn.style.background = '#5ccc7a';
    } else {
      tableDiv.style.display = 'block';
      toggleBtn.innerHTML = '<span id="toggleIcon">▼</span> Nascondi Dettagli';
      toggleBtn.style.background = '#4aa3ff';
    }
    isVisible = !isVisible;
  });
}
// Funzione di calcolo aggiornata
function calculateHypergeometric() {
  const deckSize = parseInt(document.getElementById("deckSize").value);
  const maxMulligans = parseInt(document.getElementById("maxMulligans").value);

  // Leggi le 3 famiglie con i turni massimi
  const families = [];
  for (let i = 1; i <= 3; i++) {
    const name = document.getElementById(`familyName${i}`).value.trim();
    const count = parseInt(document.getElementById(`familyCount${i}`).value);
    const minSuccess = parseInt(document.getElementById(`familyMinSuccess${i}`).value);
    const mulliganThreshold = document.getElementById(`familyMinMulligan${i}`).value
      ? parseInt(document.getElementById(`familyMinMulligan${i}`).value)
      : 0;
    const maxTurn = document.getElementById(`familyMaxTurn${i}`).value
      ? parseInt(document.getElementById(`familyMaxTurn${i}`).value)
      : 0;

    // Aggiungi solo se ha un nome e un count valido
    if (name && count > 0 && minSuccess > 0) {
      families.push({
        name,
        count,
        minSuccess,
        mulliganThreshold,
        maxTurn
      });
    }
  }


  // Validazione
  if (!deckSize || families.length === 0) {
    alert("Per favore, riempire i campi obbligatori e almeno una famiglia");
    return;
  }

  if (maxMulligans < 0 || maxMulligans > 5) {
    alert("Il numero di mulligan deve essere tra 0 e 5");
    return;
  }

  const totalTargetCards = families.reduce((sum, f) => sum + f.count, 0);
  if (totalTargetCards > deckSize) {
    alert("Il totale delle carte interessate non può superare la dimensione del mazzo");
    return;
  }

  // Calcola il turno massimo tra tutte le famiglie
  const maxTurn = Math.max(...families.map(f => f.maxTurn));
  const totalCardsToConsider = 7 + maxTurn;

  if (totalCardsToConsider > deckSize) {
    alert("Il numero di carte da considerare non può superare la dimensione del mazzo");
    return;
  }

  // Esegui la simulazione con mulligan multipli CON salvataggio dati per mostrare le simulazioni
  const result = simulateWithMultipleMulligans(deckSize, families, maxMulligans, false, showSimulationsOnCalculate);

  // Salva il riepilogo per il copy-to-clipboard al click sulla percentuale
  lastCalculationSummary = {
    probability: result.probability,
    families: families.map(f => ({
      name: f.name,
      count: f.count,
      minSuccess: f.minSuccess,
      mulliganThreshold: f.mulliganThreshold,
      maxTurn: f.maxTurn
    }))
  };

  // Mostra i risultati
  document.getElementById("probSuccess").textContent = (result.probability * 100).toFixed(2) + "%";
  //document.getElementById("mulliganRate").textContent = (result.mulliganRate * 100).toFixed(2) + "%";

  // Mostra il messaggio di mulligan se applicato
  /*const mulliganInfo = document.getElementById("mulliganInfo");
  const mulliganDetails = document.getElementById("mulliganDetails");
  
  if (result.mulliganApplied) {
    mulliganInfo.style.display = "block";
    let detailsText = "";
    
    if (maxMulligans === 0) {
      detailsText = "Nessun mulligan permesso.";
    } else if (maxMulligans === 1) {
      detailsText = `È stato applicato un mulligan gratuito a ${(result.mulliganRate * 100).toFixed(1)}% delle mani.`;
    } else {
      detailsText = `Mulligan utilizzati: ${result.handsThatUsedMulligan.toLocaleString()} mani (${(result.mulliganRate * 100).toFixed(1)}%). Media di ${result.avgMulligansPerHand.toFixed(2)} mulligan per mano.`;
    }
    
    mulliganDetails.textContent = detailsText;
  } else {
    mulliganInfo.style.display = "none";
  }
*/
  // Mostra dettagli
  const detailedResults = document.getElementById("detailedResults");
  let detailsHTML = `<strong>Dettagli:</strong><br>`;
  detailsHTML += `Mazzo: ${deckSize} carte | Mulligan permessi: ${maxMulligans}<br>`;
  detailsHTML += `Carte considerate: ${totalCardsToConsider} (fino al turno ${maxTurn})<br><br>`;
  detailsHTML += `<strong>Condizioni AND:</strong><br>`;
  families.forEach(f => {
    detailsHTML += `• ${f.name}: almeno ${f.minSuccess} carte entro turno ${f.maxTurn} (${f.count} nel mazzo)`;
    if (f.mulliganThreshold > 0) {
      detailsHTML += ` | Mulligan se < ${f.mulliganThreshold}`;
    }
    detailsHTML += `<br>`;
  });
  /*
  detailsHTML += `<br><strong>Statistiche Mulligan:</strong><br>`;
  detailsHTML += `• Mani con mulligan: ${(result.mulliganRate * 100).toFixed(2)}% (${result.handsThatUsedMulligan.toLocaleString()}/${result.simulations.toLocaleString()})<br>`;
  if (result.mulliganApplied) {
    detailsHTML += `• Media mulligan per mano: ${result.avgMulligansPerHand.toFixed(2)}<br>`;
    detailsHTML += `• Totale mulligan usati: ${result.totalMulligansUsed.toLocaleString()}`;
  }
  */
  detailedResults.innerHTML = detailsHTML;

  // MOSTRA O NASCONDI LE SIMULAZIONI in base alla checkbox
  const simulationContainer = document.getElementById('simulationsContainerCalculate');

  // Nascondi il container se esiste già
  if (simulationContainer) {
    simulationContainer.remove();
  }

  // Mostra le simulazioni solo se la checkbox è selezionata
  if (showSimulationsOnCalculate && result.simulationData && result.simulationData.length > 0) {
    displaySimulationsOnCalculate(result, families);
  }


  document.getElementById("calculatorResults").style.display = "block";
}
// =====================
// BEST COMPOSITION FUNCTIONS - MODIFICATO
// =====================




function generateCompositionsWithFixedTotal(families, targetTotal) {
  const combinations = [];

  // Se abbiamo solo 1 famiglia attiva, non possiamo ridistribuire
  const activeFamilies = families.filter(f => f.minSuccess > 0);
  if (activeFamilies.length < 2) {
    console.log("Need at least 2 active families to redistribute cards");
    return combinations;
  }

  // Per ogni famiglia attiva, determina il range di variazione
  // Invece di ±3 carte, permettiamo variazioni fino a quando le altre famiglie restano non negative
  const familiesWithIndices = families.map((f, idx) => ({
    ...f,
    index: idx
  }));

  const activeIndices = familiesWithIndices
    .filter(f => f.minSuccess > 0)
    .map(f => f.index);

  console.log(`Active families indices: ${activeIndices}`);

  // Genera tutte le possibili combinazioni che sommano a targetTotal
  // Per ogni famiglia attiva, permette valori da minSuccess a targetTotal
  // Ma assicurandosi che le altre famiglie attive abbiano almeno minSuccess

  // Funzione ricorsiva per generare combinazioni
  function generateRecursive(currentIndices, currentCounts, remainingCards) {
    if (currentIndices.length === 0) {
      // Tutte le famiglie assegnate, verifica che la somma sia targetTotal
      const total = currentCounts.reduce((sum, count) => sum + count, 0);

      if (total === targetTotal) {
        // Completa l'array counts per tutte le famiglie
        const fullCounts = families.map((f, idx) => {
          const activeIdx = families.findIndex(fam => fam.name === families[idx].name);
          return currentCounts[activeIdx] || 0;
        });

        // Verifica che ogni famiglia attiva abbia almeno minSuccess
        const allValid = families.every((f, idx) => {
          if (f.minSuccess > 0) {
            return fullCounts[idx] >= f.minSuccess;
          }
          return true;
        });

        if (allValid) {
          combinations.push({
            counts: fullCounts,
            total: total,
            description: families.map((f, idx) =>
              `${f.name}: ${fullCounts[idx]}`
            ).join(', ')
          });
        }
      }
      return;
    }

    const currentIdx = currentIndices[0];
    const remainingIndices = currentIndices.slice(1);
    const family = families[currentIdx];

    // Calcola il minimo per questa famiglia
    const minForFamily = family.minSuccess > 0 ? family.minSuccess : 0;

    // Calcola il massimo per questa famiglia
    // Deve lasciare abbastanza carte per le famiglie rimanenti
    const minForRemaining = remainingIndices.reduce((sum, idx) => {
      const f = families[idx];
      return sum + (f.minSuccess > 0 ? f.minSuccess : 0);
    }, 0);

    const maxForFamily = remainingCards - minForRemaining;

    // Prova tutti i possibili valori per questa famiglia
    for (let count = minForFamily; count <= maxForFamily; count++) {
      const newRemaining = remainingCards - count;

      // Verifica che ci siano abbastanza carte rimanenti
      if (newRemaining >= 0) {
        const newCounts = [...currentCounts];
        newCounts[currentIdx] = count;
        generateRecursive(remainingIndices, newCounts, newRemaining);
      }
    }
  }

  // Inizia con tutte le famiglie
  const allIndices = families.map((f, idx) => idx);
  generateRecursive(allIndices, [], targetTotal);

  // Filtra le combinazioni interessanti: quelle che ridistribuiscono le carte
  const interestingCombinations = combinations.filter(combo => {
    // Non includere la combinazione corrente
    const isCurrent = families.every((f, idx) => f.count === combo.counts[idx]);
    if (isCurrent) return true; // Mantieni la corrente per confronto

    // Includi solo variazioni significative (almeno 1 carta spostata)
    let totalChange = 0;
    families.forEach((f, idx) => {
      totalChange += Math.abs(f.count - combo.counts[idx]);
    });

    return totalChange >= 2; // Almeno 1 carta spostata in una direzione
  });

  // Ordina per differenza dalla combinazione corrente
  interestingCombinations.sort((a, b) => {
    // Calcola la distanza dalla combinazione corrente
    const distanceA = families.reduce((sum, f, idx) =>
      sum + Math.abs(f.count - a.counts[idx]), 0);
    const distanceB = families.reduce((sum, f, idx) =>
      sum + Math.abs(f.count - b.counts[idx]), 0);

    return distanceA - distanceB; // Prima le più simili
  });

  // Limita a un numero ragionevole di combinazioni
  const limitedCombinations = interestingCombinations.slice(0, 20);

  console.log(`Generated ${limitedCombinations.length} interesting combinations out of ${combinations.length} total`);

  return limitedCombinations;
}

// Versione alternativa più semplice se la precedente è troppo complessa:
function generateCompositionsWithFixedTotalSimple(families, targetTotal) {
  const combinations = [];

  // Trova le famiglie attive (con minSuccess > 0)
  const activeFamilies = families.filter(f => f.minSuccess > 0);

  if (activeFamilies.length < 2) {
    // Non possiamo ridistribuire con meno di 2 famiglie
    return [{
      counts: families.map(f => f.count),
      total: targetTotal,
      description: families.map(f => `${f.name}: ${f.count}`).join(', ')
    }];
  }

  // Per l'esempio specifico: se abbiamo 2 famiglie attive (es. "Land" e "Ramp")
  if (activeFamilies.length === 2) {
    const [fam1, fam2] = activeFamilies;
    const fam1Index = families.findIndex(f => f.name === fam1.name);
    const fam2Index = families.findIndex(f => f.name === fam2.name);

    const currentCount1 = fam1.count;
    const currentCount2 = fam2.count;

    // Genera variazioni di ±3 carte per la prima famiglia
    for (let delta = -3; delta <= 3; delta++) {
      if (delta === 0) continue; // Salta la combinazione corrente

      const newCount1 = currentCount1 + delta;
      const newCount2 = currentCount2 - delta; // L'opposto per mantenere il totale

      // Verifica che entrambe siano positive e >= minSuccess
      if (newCount1 >= fam1.minSuccess && newCount2 >= fam2.minSuccess) {
        const counts = families.map((f, idx) => {
          if (idx === fam1Index) return newCount1;
          if (idx === fam2Index) return newCount2;
          return f.count; // Mantieni le altre famiglie come sono
        });

        combinations.push({
          counts: counts,
          total: targetTotal,
          description: families.map((f, idx) => `${f.name}: ${counts[idx]}`).join(', ')
        });
      }
    }
  } else if (activeFamilies.length === 3) {
    // Per 3 famiglie attive
    const activeIndices = activeFamilies.map(f =>
      families.findIndex(fam => fam.name === f.name)
    );

    const currentCounts = activeFamilies.map(f => f.count);

    // Genera variazioni semplici: sposta 1-3 carte tra le famiglie
    for (let donorIdx = 0; donorIdx < activeFamilies.length; donorIdx++) {
      for (let receiverIdx = 0; receiverIdx < activeFamilies.length; receiverIdx++) {
        if (donorIdx === receiverIdx) continue;

        for (let cardsToMove = 1; cardsToMove <= 3; cardsToMove++) {
          const newCounts = [...currentCounts];
          newCounts[donorIdx] -= cardsToMove;
          newCounts[receiverIdx] += cardsToMove;

          // Verifica che tutte le famiglie siano valide
          const allValid = newCounts.every((count, idx) =>
            count >= activeFamilies[idx].minSuccess
          );

          if (allValid) {
            // Costruisci l'array completo per tutte le famiglie
            const fullCounts = families.map((f, idx) => {
              const activeIdx = activeIndices.indexOf(idx);
              return activeIdx >= 0 ? newCounts[activeIdx] : f.count;
            });

            combinations.push({
              counts: fullCounts,
              total: targetTotal,
              description: families.map((f, idx) => `${f.name}: ${fullCounts[idx]}`).join(', ')
            });
          }
        }
      }
    }
  }

  // Aggiungi sempre la combinazione corrente
  combinations.unshift({
    counts: families.map(f => f.count),
    total: targetTotal,
    description: families.map(f => `${f.name}: ${f.count}`).join(', ')
  });

  // Rimuovi duplicati
  const uniqueCombinations = [];
  const seen = new Set();

  for (const combo of combinations) {
    const key = combo.counts.join('-');
    if (!seen.has(key)) {
      seen.add(key);
      uniqueCombinations.push(combo);
    }
  }

  console.log(`Generated ${uniqueCombinations.length} unique combinations`);
  return uniqueCombinations;
}

function analyzeBestCompositions(deckSize, families, maxMulligans, originalTotalCards) {
  // Prepara i dati per la simulazione
  const activeFamilies = families.filter(f => f.count > 0);

  if (activeFamilies.length === 0) {
    hideLoadingMessage();
    alert("No families with card counts to analyze");
    return;
  }

  // Genera combinazioni - USA LA VERSIONE SEMPLICE
  const combinations = generateCompositionsWithFixedTotalSimple(families, originalTotalCards);

  if (combinations.length === 0) {
    hideLoadingMessage();
    alert(`No valid combinations found that maintain the total of ${originalTotalCards} cards`);
    return;
  }

  // Testa ogni combinazione
  const results = [];
  const numSimulations = 10000; // Ridotto per performance

  // Per ogni combinazione (massimo 15 per performance)
  const maxCombinations = Math.min(combinations.length, 15);

  for (let i = 0; i < maxCombinations; i++) {
    const combo = combinations[i];

    // Aggiorna i conteggi delle famiglie
    const testFamilies = families.map((f, idx) => ({
      ...f,
      count: combo.counts[idx] || 0
    }));

    // Esegui simulazione
    const result = simulateWithMultipleMulligans(
      deckSize,
      testFamilies.filter(f => f.count > 0),
      maxMulligans,
      false,
      false
    );

    results.push({
      combination: combo,
      probability: result.probability * 100,
      mulliganRate: result.mulliganRate * 100,
      successCount: result.successes
    });

    // Aggiorna progresso
    updateProgress(i + 1, maxCombinations);
  }

  // Ordina risultati per probabilità decrescente
  results.sort((a, b) => b.probability - a.probability);

  // Mostra risultati
  hideLoadingMessage();
  displayBestCompositionResults(results, families, originalTotalCards);
}

function displayBestCompositionResults(results, families, originalTotalCards) {
  // Rimuovi risultati precedenti
  const existing = document.getElementById('bestCompositionResults');
  if (existing) existing.remove();

  // Crea container per risultati
  const container = document.createElement('div');
  container.id = 'bestCompositionResults';
  container.style.cssText = `
    margin-top: 20px;
    padding: 25px;
    background: linear-gradient(135deg, #1a0b2e, #2d1b45);
    border: 3px solid #8a2be2;
    border-radius: 12px;
    color: white;
    box-shadow: 0 0 25px rgba(138, 43, 226, 0.3);
    font-family: Arial, sans-serif;
  `;


  // Tabella risultati
  if (results.length > 0) {
    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    `;

    // Intestazione
    const tableHTML = `
      <thead>
        <tr style="background: rgba(138, 43, 226, 0.3);">
          <th style="padding: 15px; text-align: left; border-bottom: 3px solid #8a2be2; width: 80px; font-size: 20px; font-weight: bold;">Rank</th>
          <th style="padding: 15px; text-align: left; border-bottom: 3px solid #8a2be2; font-size: 20px; font-weight: bold;">Composition</th>
          <th style="padding: 15px; text-align: left; border-bottom: 3px solid #8a2be2; width: 120px; font-size: 20px; font-weight: bold;">Success</th>
          <th style="padding: 15px; text-align: left; border-bottom: 3px solid #8a2be2; width: 120px; font-size: 20px; font-weight: bold;">Actions</th>
        </tr>
      </thead>
      <tbody>
    `;

    table.innerHTML = tableHTML;

    // Calcola la percentuale corrente per confronto
    const currentCombo = families.map(f => f.count);
    let currentSuccessRate = 0;

    // Trova il risultato corrente nella lista
    const currentResult = results.find(result =>
      result.combination.counts.every((count, idx) => count === currentCombo[idx])
    );

    if (currentResult) {
      currentSuccessRate = currentResult.probability;
    }

    // Righe dei risultati
    results.forEach((result, index) => {
      const isCurrent = families.every((f, idx) =>
        f.count === (result.combination.counts[idx] || 0)
      );

      // Calcola differenza rispetto al setup corrente
      const delta = result.probability - currentSuccessRate;
      const deltaFormatted = delta >= 0 ? `+${delta.toFixed(1)}%` : `${delta.toFixed(1)}%`;
      const deltaColor = delta > 0 ? '#90ee90' : delta < 0 ? '#ff6b4a' : '#aaa';

      // Crea una descrizione compatta con font 20px
      const compactDescription = families.map((f, idx) => {
        const count = result.combination.counts[idx] || 0;
        const change = count - f.count;
        let changeSymbol = '';
        if (change > 0) changeSymbol = `<span style="color: #90ee90; font-size: 18px; margin-left: 5px;">↑${change}</span>`;
        else if (change < 0) changeSymbol = `<span style="color: #ff6b4a; font-size: 18px; margin-left: 5px;">↓${Math.abs(change)}</span>`;

        return `<div style="margin: 8px 0;">
          <span style="color: #${getSuccessColorForFamily(result.probability)}; font-size: 20px; display: inline-block; min-width: 100px;">${f.name}:</span>
          <strong style="margin: 0 10px; font-size: 22px; font-weight: bold;">${count}</strong>
          ${changeSymbol}
        </div>`;
      }).join('');

      let row = document.createElement('tr');
      row.style.cssText = `
        border-bottom: 2px solid rgba(255, 255, 255, 0.08);
        ${isCurrent ? 'background: rgba(0, 255, 0, 0.08) !important;' : ''}
        ${index < 3 && !isCurrent ? 'background: rgba(255, 215, 0, 0.08) !important;' : ''}
      `;

      row.innerHTML = `
        <td style="padding: 15px; font-weight: bold; color: ${index < 3 ? '#ffd700' : '#aaa'}; vertical-align: middle; font-size: 20px; line-height: 1.4;">
          <div style="font-size: 22px; margin-bottom: 5px;">#${index + 1}</div>
          ${isCurrent ? '<div style="font-size: 16px; color: #90ee90; font-weight: normal;">(current)</div>' : ''}
        </td>
        <td style="padding: 15px; vertical-align: middle; font-size: 20px;">
          ${compactDescription}
        </td>
        <td style="padding: 15px; vertical-align: middle; font-size: 20px;">
          <div style="color: #${getSuccessColor(result.probability)}; font-weight: bold; font-size: 24px; margin-bottom: 5px;">
            ${result.probability.toFixed(1)}%
          </div>
          <div style="font-size: 18px; color: ${deltaColor}; font-weight: bold;">
            ${deltaFormatted}
          </div>
        </td>
        <td style="padding: 15px; vertical-align: middle; font-size: 20px;">
          <button class="apply-composition" 
                  data-index="${index}"
                  style="padding: 12px 20px; background: #8a2be2; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 18px; font-weight: bold; width: 100%; transition: all 0.3s;"
                  onmouseover="this.style.background='#9a3bf2'; this.style.transform='scale(1.05)'"
                  onmouseout="this.style.background='#8a2be2'; this.style.transform='scale(1)'">
            ${translations[currentLang].apply}
          </button>
          ${isCurrent ? '<div style="font-size: 16px; color: #aaa; text-align: center; margin-top: 8px; font-weight: normal;">current setup</div>' : ''}
        </td>
      `;

      table.querySelector('tbody').appendChild(row);
    });

    container.appendChild(table);

    // Legenda compatta
    const legend = document.createElement('div');
    legend.style.cssText = `
      margin-top: 15px;
      padding: 12px;
      background: rgba(0,0,0,0.25);
      border-radius: 6px;
      font-size: 16px;
      line-height: 1.4;
    `;
    legend.innerHTML = `
      <strong style="color: #aaa; font-size: 18px; display: block; margin-bottom: 8px;">Legend:</strong>
      <div style="display: flex; flex-wrap: wrap; gap: 15px;">
        <div><span style="color: #90ee90; font-size: 18px;">↑</span><span style="margin-left: 5px; font-size: 16px;">increase</span></div>
        <div><span style="color: #ff6b4a; font-size: 18px;">↓</span><span style="margin-left: 5px; font-size: 16px;">decrease</span></div>
        <div><span style="color: #ffd700; font-size: 18px;">★</span><span style="margin-left: 5px; font-size: 16px;">top 3</span></div>
        <div><span style="color: #90ee90; font-size: 18px;">■</span><span style="margin-left: 5px; font-size: 16px;">current</span></div>
      </div>
    `;
    container.appendChild(legend);

    // Pulsante chiusura
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕ Close Analysis';
    closeBtn.style.cssText = `
      margin-top: 20px;
      padding: 10px 20px;
      background: #444;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 18px;
      font-weight: bold;
      float: right;
      transition: all 0.3s;
    `;
    closeBtn.onmouseover = () => {
      closeBtn.style.background = '#555';
      closeBtn.style.transform = 'scale(1.05)';
    };
    closeBtn.onmouseout = () => {
      closeBtn.style.background = '#444';
      closeBtn.style.transform = 'scale(1)';
    };
    closeBtn.onclick = () => container.remove();
    container.appendChild(closeBtn);

    // Aggiungi listener per pulsanti "Apply"
    setTimeout(() => {
      document.querySelectorAll('.apply-composition').forEach(btn => {
        btn.addEventListener('click', function () {
          const index = parseInt(this.dataset.index);
          applyComposition(results[index].combination, families);
        });
      });
    }, 100);

  } else {
    const noResults = document.createElement('p');
    noResults.textContent = 'No alternative compositions found.';
    noResults.style.cssText = `
      color: #aaa;
      text-align: center;
      padding: 30px;
      font-size: 20px;
    `;
    container.appendChild(noResults);
  }

  // TROVA IL CONTAINER DEL CALCOLATORE
  const calculatorContainer = document.querySelector('.calculator-container');

  if (calculatorContainer) {
    // Cerca una posizione adatta dentro calculator-container
    const calculatorInputs = calculatorContainer.querySelector('.calculator-inputs');
    const calculatorControls = calculatorContainer.querySelector('.calculator-controls');
    const calculatorResults = calculatorContainer.querySelector('#calculatorResults');

    if (calculatorResults && calculatorResults.style.display !== 'none') {
      // Caso 1: calculatorResults è visibile, inserisci dopo
      calculatorResults.insertAdjacentElement('afterend', container);
    } else if (calculatorInputs) {
      // Caso 2: Inserisci dopo gli input
      calculatorInputs.insertAdjacentElement('afterend', container);
    } else if (calculatorControls) {
      // Caso 3: Inserisci dopo i controlli
      calculatorControls.insertAdjacentElement('afterend', container);
    } else {
      // Caso 4: Trova l'ultimo elemento prima del pulsante Best Composition
      const bestCompositionBtn = calculatorContainer.querySelector('#bestCompositionBtn');
      const calculateBtn = calculatorContainer.querySelector('#calculateBtn');

      if (bestCompositionBtn) {
        // Inserisci dopo il pulsante Best Composition
        bestCompositionBtn.insertAdjacentElement('afterend', container);
      } else if (calculateBtn) {
        // Inserisci dopo il pulsante Calculate
        calculateBtn.insertAdjacentElement('afterend', container);
      } else {
        // Caso 5: Inserisci alla fine del calculator-container
        calculatorContainer.appendChild(container);
      }
    }

    // Scorri fino ai risultati
    setTimeout(() => {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  } else {
    // Fallback: inserisci nel body
    document.body.appendChild(container);
  }
}

// Funzione helper per il colore delle famiglie
function getSuccessColorForFamily(percent) {
  if (percent >= 80) return '5ccc7a'; // Verde
  if (percent >= 60) return '90ee90'; // Verde chiaro
  if (percent >= 40) return 'f8f6d8'; // Giallo chiaro
  if (percent >= 20) return 'ffa500'; // Arancione
  return 'ff6b4a'; // Rosso
}

// Funzione helper per il colore del success rate
function getSuccessColor(percent) {
  if (percent >= 80) return '90ee90'; // Verde chiaro
  if (percent >= 60) return '5ccc7a'; // Verde
  if (percent >= 40) return 'f8f6d8'; // Giallo chiaro
  if (percent >= 20) return 'ffa500'; // Arancione
  return 'ff6b4a'; // Rosso
}

// Modifica applyComposition per fare lo scroll ai risultati
function applyComposition(composition, originalFamilies) {
  // Applica i nuovi conteggi ai campi
  originalFamilies.forEach((family, idx) => {
    const countInput = document.getElementById(`familyCount${idx + 1}`);
    if (countInput && composition.counts[idx] !== undefined) {
      countInput.value = composition.counts[idx];
    }
  });

  // Assicura che la struttura del calculator container sia corretta
  ensureCalculatorContainerStructure();

  // Calcola automaticamente
  setTimeout(() => {
    calculateHypergeometric();

    // Chiudi i risultati di Best Composition
    const resultsDiv = document.getElementById('bestCompositionResults');
    if (resultsDiv) resultsDiv.remove();

    // Scroll fino ai risultati del calcolo
    const calculatorResults = document.getElementById('calculatorResults');
    if (calculatorResults) {
      calculatorResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);

  alert('Composition applied! Recalculating...');
}
// Aggiungi anche questa funzione per garantire che ci sia spazio per i risultati
function ensureCalculatorContainerStructure() {
  const calculatorContainer = document.querySelector('.calculator-container');
  if (!calculatorContainer) return;

  // Verifica se c'è un contenitore per i risultati
  let resultsArea = calculatorContainer.querySelector('.calculator-results-area');
  if (!resultsArea) {
    // Crea un'area dedicata per i risultati
    resultsArea = document.createElement('div');
    resultsArea.className = 'calculator-results-area';
    resultsArea.style.cssText = `
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #333;
    `;

    // Trova dove inserirlo (dopo tutti i controlli/input)
    const lastInputElement = calculatorContainer.querySelector('.calculator-controls:last-child') ||
      calculatorContainer.querySelector('.calculator-inputs:last-child') ||
      calculatorContainer.querySelector('#calculateBtn');

    if (lastInputElement) {
      lastInputElement.insertAdjacentElement('afterend', resultsArea);
    } else {
      calculatorContainer.appendChild(resultsArea);
    }
  }

  return resultsArea;
}

// Modifica showBestComposition per usare la nuova struttura
async function showBestComposition() {
  const deckSize = parseInt(document.getElementById("deckSize").value);
  const maxMulligans = parseInt(document.getElementById("maxMulligans").value);

  // Leggi le famiglie
  const families = [];
  let totalActiveCards = 0;
  for (let i = 1; i <= 3; i++) {
    const name = document.getElementById(`familyName${i}`).value.trim();
    const count = parseInt(document.getElementById(`familyCount${i}`).value);
    const minSuccess = parseInt(document.getElementById(`familyMinSuccess${i}`).value);
    const mulliganThreshold = document.getElementById(`familyMinMulligan${i}`).value
      ? parseInt(document.getElementById(`familyMinMulligan${i}`).value)
      : 0;
    const maxTurn = document.getElementById(`familyMaxTurn${i}`).value
      ? parseInt(document.getElementById(`familyMaxTurn${i}`).value)
      : 0;

    if (name && minSuccess > 0) {
      const cardCount = count || 0;
      families.push({
        name,
        count: cardCount,
        minSuccess,
        mulliganThreshold,
        maxTurn
      });
      totalActiveCards += cardCount;
    }
  }

  // Validazione
  if (!deckSize || families.length === 0) {
    alert("Riempi i campi obbligatori e inserisci almeno una famiglia");
    return;
  }

  if (families.length > 4) {
    alert("Best Composition works with up to 4 families maximum");
    return;
  }

  // Assicura che la struttura del calculator container sia corretta
  ensureCalculatorContainerStructure();

  // Mostra messaggio di attesa
  showLoadingMessage("Analizzando la composizione migliore... Questo potrebbe richiedere un momento.");

  // Esegui l'analisi in background
  setTimeout(() => {
    analyzeBestCompositions(deckSize, families, maxMulligans, totalActiveCards);
  }, 100);
}

function renderDistributionBars(counts, families) {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return '';

  let html = '<div style="display: flex; height: 20px; width: 100px; border: 1px solid #444;">';

  counts.forEach((count, index) => {
    if (count > 0) {
      const width = (count / total) * 100;
      const colors = ['#ff6b4a', '#4aa3ff', '#5ccc7a', '#f8f6d8'];
      const color = colors[index % colors.length];

      html += `<div style="
        width: ${width}%;
        background: ${color};
        height: 100%;
        position: relative;
        border-right: 1px solid #444;
      " title="${families[index].name}: ${count} cards">
        <span style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 10px;
          color: #000;
          font-weight: bold;
        ">${count}</span>
      </div>`;
    }
  });

  html += '</div>';
  return html;
}





function showLoadingMessage(message) {
  // Rimuovi eventuali messaggi precedenti
  hideLoadingMessage();

  // Crea il contenitore del messaggio
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loadingMessage';
  loadingDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 30px;
    border-radius: 10px;
    z-index: 1000;
    text-align: center;
    border: 2px solid #8a2be2;
    min-width: 300px;
  `;

  // Aggiungi icona di caricamento
  loadingDiv.innerHTML = `
    <div style="margin-bottom: 15px;">
      <div style="
        width: 50px;
        height: 50px;
        border: 5px solid #8a2be2;
        border-top: 5px solid transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 15px;
      "></div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </div>
    <div style="font-size: 16px; margin-bottom: 10px;">${message}</div>
    <div id="loadingProgress" style="font-size: 12px; color: #aaa;">Inizio Analisi...</div>
  `;

  document.body.appendChild(loadingDiv);
}

function hideLoadingMessage() {
  const loadingDiv = document.getElementById('loadingMessage');
  if (loadingDiv) {
    loadingDiv.remove();
  }
}

function updateProgress(current, total) {
  const progressDiv = document.getElementById('loadingProgress');
  if (progressDiv) {
    const percent = Math.round((current / total) * 100);
    progressDiv.textContent = `Progress: ${current}/${total} combinations (${percent}%)`;
  }
}


// Aggiungi event listener per il pulsante
document.getElementById("bestCompositionBtn")?.addEventListener("click", showBestComposition);
// Event listener per il pulsante calcola
document.getElementById("calculateBtn")?.addEventListener("click", calculateHypergeometric);

// =====================
// COPY SUCCESS SUMMARY (click sulla % di successo)
// =====================
function buildSuccessSummaryText() {
  if (!lastCalculationSummary) return null;
  const { probability, families } = lastCalculationSummary;
  const percentText = (probability * 100).toFixed(2) + "%";
  const parts = families.map(f => `${f.minSuccess}x ${f.name} (until Turn ${f.maxTurn})`);
  return `${percentText} to find: ${parts.join(", ")}`;
}

// Costruisce una versione sintetica per il titolo della pagina,
// es. "53% 3land - 2ramp - 1big"
function buildSyntheticTitle() {
  if (!lastCalculationSummary) return null;
  const { probability, families } = lastCalculationSummary;
  const percentInt = Math.round(probability * 100);
  const NBSP = "\u00A0"; // spazio non-breaking: non viene collassato dal browser nel titolo tab

  // Variante alternativa: nome completo del gruppo invece della sola iniziale
  // (es. "Land39/2 Ramp12/1 Big34/3")
  // const parts = families.map(f => `${f.name}${f.count}/${f.minSuccess}`);

  // Se sono attivi solo 2 gruppi (su 3 possibili) c'è più spazio nel titolo:
  // aggiungiamo anche gli altri 2 campi (mulliganThreshold e maxTurn), sempre separati da "/"
  const showExtraFields = families.length === 2;

  const parts = families.map(f => {
    const initial = (f.name || "").trim().charAt(0).toUpperCase();
    let part = `${initial}${f.count}/${f.minSuccess}`;
    if (showExtraFields) {
      part += `/${f.mulliganThreshold}/${f.maxTurn}`;
    }
    return part;
  });

  return `${percentInt}%${NBSP.repeat(3)}${parts.join(NBSP.repeat(4))}`;
}

function updatePageTitle() {
  const titleText = buildSyntheticTitle();
  if (titleText) document.title = titleText;
}

function showCopyFeedback(el) {
  if (!el) return;
  const original = el.textContent;
  el.textContent = "Copied! ✅";
  clearTimeout(el._copyFeedbackTimeout);
  el._copyFeedbackTimeout = setTimeout(() => {
    el.textContent = original;
  }, 1200);
}

function copySuccessSummary() {
  const probSuccessEl = document.getElementById("probSuccess");
  const text = buildSuccessSummaryText();
  if (!text) return;

  // Aggiorna il titolo della pagina con la versione sintetica
  updatePageTitle();

  const doFeedback = () => showCopyFeedback(probSuccessEl);

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(doFeedback).catch(err => {
      console.error("Clipboard copy failed:", err);
    });
  } else {
    // Fallback per browser/contesti senza Clipboard API (es. file:// senza permessi)
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand("copy");
      doFeedback();
    } catch (err) {
      console.error("Clipboard fallback copy failed:", err);
    }
    document.body.removeChild(textarea);
  }
}

(function initCopySuccessSummary() {
  const probSuccessEl = document.getElementById("probSuccess");
  if (!probSuccessEl) return;
  probSuccessEl.style.cursor = "pointer";
  probSuccessEl.title = "Click to copy summary";
  probSuccessEl.addEventListener("click", copySuccessSummary);
})();

// Aggiungi event listener per i nuovi pulsanti
document.getElementById("saveSimulationsBtn")?.addEventListener("click", generateAndDownloadSimulations);
document.getElementById("loadSimulationsBtn")?.addEventListener("click", loadSimulationsFromFile);

// =====================
// TRADUZIONI
// =====================
const translations = {
  it: {
    mainTitle: "Commander Mana Builder",
    choose: "Scegli cosa vuoi costruire",
    manaRocks: "Mana Rocks",
    manaDorks: "Mana Dorks",
    lands: "Terre",
    simulator: "Simulatore",
    badApple: "Apri Bad Apple",
    commanderColors: "Colori Commander",
    back: "⬅ Torna indietro",
    copyList: "📋 Copia lista",
    rocksFamilies: "Famiglie di Mana Rocks",
    rocksList: "Lista Mana Rocks",
    dorksFamilies: "Famiglie di Mana Dorks",
    dorksList: "Lista Mana Dorks",
    landsTitle: "Lands – Commander Builder",
    landsFamilies: "Famiglie di Lands",
    landsList: "Lista Lands",
    deckSize: "Dimensione Mazzo (carte totali):",
    mulligans: "Numero di Mulligan:",
    groupName: "Nome gruppo:",
    cardsInDeck: "Carte nel Mazzo:",
    minCards: "Minimo di carte da trovare:",
    mulliganIfLess: "Almeno x altrimenti mulligan:",
    byTurn: "Entro turno:",
    calculate: "Calcola",
    showSimulations: "Mostra simulazioni",
    bestComposition: "Miglior composizione",
    results: "Risultati",
    successProb: "Probabilità di Successo",
    mulliganApplied: "🔄 Mulligan Applicato",
    dorkFamilies: {
      CostoUno: "Costo 1",
      CostoUno_Temporaneo: "Costo 1 Temporaneo",
      CostoDue_QualsiasiMana: "Costo 2 Qualsiasi Mana",
      CostoDue_ManaSpecifico: "Costo 2 Mana Specifico",
      CostoTre_DueMana: "Costo 3 Due Mana"
    },
    simulationsTitle: "Ultime 100 Simulazioni delle 100.000 fatte",
    summaryShown: "Riepilogo delle {count} simulazioni mostrate:",
    successes: "Successi",
    handsWithMulligan: "Mani con Mulligan",
    averageMulligans: "Media Mulligan usati",
    simulation: "Simulazione",
    initialHand: "Mano iniziale",
    mulliganAppliedSim: "Mulligan applicato",
    success: "Successo",
    failure: "Fallimento",
    apply: "Applica",
    hideDetails: "Nascondi Dettagli",
    showDetails: "Mostra Dettagli",
    cardsShown: "Carte mostrate",
    initialHandPlusTurns: "mano iniziale + {turns} turni",
    successHeader: "Successo",
    mulliganHeader: "Mulligan",
    cardsFound: "Carte Trovate",
    allDrawnCards: "Tutte le Carte Pescate",
    placeholderDeckSize: "es. 100",
    placeholderLands: "es. Lande",
    placeholderExample: "es. ",
    placeholderRamp: "es. Rampini",
    placeholderCreature: "es. Creatura",
    placeholderInstant: "es. Istantaneo",
    placeholderArtifact: "es. Artefatto",
    placeholderTurn: "es. 4 (0=mano iniziale)"
  },
  en: {
    mainTitle: "Commander Mana Builder",
    choose: "Choose what you want to build",
    manaRocks: "Mana Rocks",
    manaDorks: "Mana Dorks",
    lands: "Lands",
    simulator: "Simulator",
    badApple: "Bad Apple",
    commanderColors: "Commander Colors",
    back: "⬅ Go back",
    copyList: "📋 Copy list",
    rocksFamilies: "Mana Rocks Families",
    rocksList: "Mana Rocks List",
    dorksFamilies: "Mana Dorks Families",
    dorksList: "Mana Dorks List",
    landsTitle: "Lands – Commander Builder",
    landsFamilies: "Lands Families",
    landsList: "Lands List",
    deckSize: "Deck Size (total cards):",
    mulligans: "Number of Mulligans:",
    groupName: "Group name:",
    cardsInDeck: "Cards in Deck:",
    minCards: "Minimum cards to find:",
    mulliganIfLess: "At least x otherwise mulligan:",
    byTurn: "By turn:",
    calculate: "Calculate",
    showSimulations: "Show simulations",
    bestComposition: "Best composition",
    results: "Results",
    successProb: "Success Probability",
    mulliganApplied: "🔄 Mulligan Applied",
    dorkFamilies: {
      CostoUno: "Cost 1",
      CostoUno_Temporaneo: "Cost 1 Temporary",
      CostoDue_QualsiasiMana: "Cost 2 Any Mana",
      CostoDue_ManaSpecifico: "Cost 2 Specific Mana",
      CostoTre_DueMana: "Cost 3 Two Mana"
    },
    simulationsTitle: "Last 100 Simulations out of 100,000 done",
    summaryShown: "Summary of the {count} simulations shown:",
    successes: "Successes",
    handsWithMulligan: "Hands with Mulligan",
    averageMulligans: "Average Mulligans used",
    simulation: "Simulation",
    initialHand: "Initial hand",
    mulliganAppliedSim: "Mulligan applied",
    success: "Success",
    failure: "Failure",
    apply: "Apply",
    hideDetails: "Hide Details",
    showDetails: "Show Details",
    cardsShown: "Cards shown",
    initialHandPlusTurns: "initial hand + {turns} turns",
    successHeader: "Success",
    mulliganHeader: "Mulligan",
    cardsFound: "Cards Found",
    allDrawnCards: "All Drawn Cards",
    placeholderDeckSize: "e.g. 100",
    placeholderLands: "e.g. Lands",
    placeholderExample: "e.g. ",
    placeholderRamp: "e.g. Ramp",
    placeholderCreature: "e.g. Creature",
    placeholderInstant: "e.g. Instant",
    placeholderArtifact: "e.g. Artifact",
    placeholderTurn: "e.g. 4 (0=initial hand)"
  }
};

let currentLang = 'en';

// =====================
// CAMBIO LINGUA
// =====================
function changeLanguage(lang) {
  currentLang = lang;
  // Schermata iniziale
  const startH1 = document.querySelector('#startScreen h1');
  if (startH1) startH1.textContent = translations[lang].mainTitle;
  const startP = document.querySelector('#startScreen p');
  if (startP) startP.textContent = translations[lang].choose;
  const rocksBtn = document.querySelector('[data-mode="rocks"]');
  if (rocksBtn) rocksBtn.textContent = translations[lang].manaRocks;
  const dorksBtn = document.querySelector('[data-mode="dorks"]');
  if (dorksBtn) dorksBtn.textContent = translations[lang].manaDorks;
  const landsBtn = document.querySelector('[data-mode="lands"]');
  if (landsBtn) landsBtn.textContent = translations[lang].lands;
  const calcBtn = document.querySelector('#calculatorBtn');
  if (calcBtn) calcBtn.textContent = translations[lang].simulator;
  const badAppleBtn = document.querySelector('#badAppleBtn');
  if (badAppleBtn) badAppleBtn.textContent = translations[lang].badApple;

  // Commander Colors
  const titleColori = document.querySelector('#titlecolori');
  if (titleColori) titleColori.textContent = translations[lang].commanderColors;
  const goHomeBtn = document.querySelector('#goHomeBtn');
  if (goHomeBtn) goHomeBtn.textContent = translations[lang].back;
  const copyListBtn = document.querySelector('#copyListBtn');
  if (copyListBtn) copyListBtn.textContent = translations[lang].copyList;

  // Rocks Screen
  const rocksH1 = document.querySelector('#rocksScreen h1');
  if (rocksH1) rocksH1.textContent = translations[lang].manaRocks + " – Commander Builder";
  const rocksStrong = document.querySelector('#rocksScreen strong');
  if (rocksStrong) rocksStrong.textContent = translations[lang].rocksFamilies;
  const rocksH3 = document.querySelector('#rocksScreen h3');
  if (rocksH3) rocksH3.textContent = translations[lang].rocksList;
  const copyBtn = document.querySelector('#copyBtn');
  if (copyBtn) copyBtn.textContent = translations[lang].copyList;

  // Dorks Screen
  const dorksStrong = document.querySelector('#dorksScreen strong');
  if (dorksStrong) dorksStrong.textContent = translations[lang].dorksFamilies;
  const dorksH3 = document.querySelector('#dorksScreen h3');
  if (dorksH3) dorksH3.textContent = translations[lang].dorksList;
  const copyDorksBtn = document.querySelector('#copyDorksBtn');
  if (copyDorksBtn) copyDorksBtn.textContent = translations[lang].copyList;

  // Lands Screen
  const landsH1 = document.querySelector('#landsScreen h1');
  if (landsH1) landsH1.textContent = translations[lang].landsTitle;
  const landsStrong = document.querySelector('#landsScreen strong');
  if (landsStrong) landsStrong.textContent = translations[lang].landsFamilies;
  const landsH3 = document.querySelector('#landsScreen h3');
  if (landsH3) landsH3.textContent = translations[lang].landsList;
  const copyLandsBtn = document.querySelector('#copyLandsBtn');
  if (copyLandsBtn) copyLandsBtn.textContent = translations[lang].copyList;

  // Calculator Screen
  document.querySelectorAll('label[for="deckSize"]').forEach(label => {
    if (label) label.textContent = translations[lang].deckSize;
  });
  document.querySelectorAll('label[for="maxMulligans"]').forEach(label => {
    if (label) label.textContent = translations[lang].mulligans;
  });
  document.querySelectorAll('label[for^="familyName"]').forEach(label => {
    if (label) label.textContent = translations[lang].groupName;
  });
  document.querySelectorAll('label[for^="familyCount"]').forEach(label => {
    if (label) label.textContent = translations[lang].cardsInDeck;
  });
  document.querySelectorAll('label[for^="familyMinSuccess"]').forEach(label => {
    if (label) label.textContent = translations[lang].minCards;
  });
  document.querySelectorAll('label[for^="familyMinMulligan"]').forEach(label => {
    if (label) label.textContent = translations[lang].mulliganIfLess;
  });
  document.querySelectorAll('label[for^="familyMaxTurn"]').forEach(label => {
    if (label) label.textContent = translations[lang].byTurn;
  });
  const calculateBtn = document.querySelector('#calculateBtn');
  if (calculateBtn) calculateBtn.textContent = translations[lang].calculate;
  const showSimLabel = document.querySelector('#showSimulationsLabel');
  if (showSimLabel) showSimLabel.textContent = translations[lang].showSimulations;
  const bestCompBtn = document.querySelector('#bestCompositionBtn');
  if (bestCompBtn) bestCompBtn.textContent = translations[lang].bestComposition;
  const calcResultsH2 = document.querySelector('#calculatorResults h2');
  if (calcResultsH2) calcResultsH2.textContent = translations[lang].results;
  const resultLabel = document.querySelector('.result-label');
  if (resultLabel) resultLabel.textContent = translations[lang].successProb;
  const mulliganStrong = document.querySelector('#mulliganInfo strong');
  if (mulliganStrong) mulliganStrong.textContent = translations[lang].mulliganApplied;

  // Placeholder degli input
  const deckSizeInput = document.querySelector('#deckSize');
  if (deckSizeInput) deckSizeInput.placeholder = translations[lang].placeholderDeckSize;
  const familyName1Input = document.querySelector('#familyName1');
  if (familyName1Input) familyName1Input.placeholder = translations[lang].placeholderLands;

  // Altri placeholder
  document.querySelectorAll('input[placeholder]').forEach(input => {
    if (input.placeholder.startsWith('es. ')) {
      const rest = input.placeholder.slice(4);
      if (isNaN(rest)) {
        // Testo specifico
        if (rest === 'Rampini') input.placeholder = translations[lang].placeholderRamp;
        else if (rest === 'Creatura') input.placeholder = translations[lang].placeholderCreature;
        else if (rest === 'Istantaneo') input.placeholder = translations[lang].placeholderInstant;
        else if (rest === 'Artefatto') input.placeholder = translations[lang].placeholderArtifact;
      } else {
        // Numero
        input.placeholder = translations[lang].placeholderExample + rest;
      }
    }
  });

  // Placeholder per turni
  document.querySelectorAll('input[id^="familyMaxTurn"]').forEach(input => {
    input.placeholder = translations[lang].placeholderTurn;
  });

  // Rirender famiglie dorks per aggiornare i titoli
  renderDorksFamilies();
}


// Event listeners per i pulsanti lingua
document.getElementById('langIt').addEventListener('click', () => changeLanguage('it'));
document.getElementById('langEn').addEventListener('click', () => changeLanguage('en'));

// Inizializza lingua inglese dopo il caricamento del DOM
document.addEventListener('DOMContentLoaded', () => {
  changeLanguage('en');
});