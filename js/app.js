import './crowdIntelligence.js';
import './simulation.js';
import './parking.js';
import DOMPurify from 'dompurify';

// ==========================================
// API KEY CONFIGURATION
// ==========================================
// Replace these placeholder strings with your actual API keys.
// Since there is no backend server, these must be defined here for the frontend to use.
// API keys are now securely loaded via Vite environment variables
const GOOGLE_TRANSLATE_API_KEY =
  import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY || 'YOUR_GOOGLE_TRANSLATE_API_KEY';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || 'YOUR_GROQ_API_KEY';

// ==========================================
// GLOBAL i18n SYSTEM
// ==========================================
window.uiLang = 'en';
const uiDict = {
  title: {
    en: 'FANSPHERE',
    es: 'ESTADIO FANSPHERE',
    fr: 'STADE FANSPHERE',
    de: 'FANSPHERE STADION',
    it: 'STADIO FANSPHERE',
    pt: 'ESTÁDIO FANSPHERE',
  },
  scaleBadge: {
    en: '100% SCALE',
    es: 'ESCALA 100%',
    fr: 'ÉCHELLE 100%',
    de: '100% MASSSTAB',
    it: 'SCALA 100%',
    pt: 'ESCALA 100%',
  },
  coords: {
    en: 'COORDINATES: 40.8136° N, 74.0745° W',
    es: 'COORDENADAS: 40.8136° N, 74.0745° W',
    fr: 'COORDONNÉES: 40.8136° N, 74.0745° W',
    de: 'KOORDINATEN: 40.8136° N, 74.0745° W',
    it: 'COORDINATE: 40.8136° N, 74.0745° W',
    pt: 'COORDENADAS: 40.8136° N, 74.0745° W',
  },
  capacity: {
    en: 'CAPACITY: 82,500',
    es: 'CAPACIDAD: 82,500',
    fr: 'CAPACITÉ: 82 500',
    de: 'KAPAZITÄT: 82.500',
    it: 'CAPACITÀ: 82.500',
    pt: 'CAPACIDADE: 82.500',
  },
  levels: {
    en: 'LEVELS: 100, 200, 300, SUITES',
    es: 'NIVELES: 100, 200, 300, SUITES',
    fr: 'NIVEAUX: 100, 200, 300, SUITES',
    de: 'EBENEN: 100, 200, 300, SUITES',
    it: 'LIVELLI: 100, 200, 300, SUITES',
    pt: 'NÍVEIS: 100, 200, 300, SUITES',
  },
  navTitle: {
    en: 'Smart Routing',
    es: 'Rutas Inteligentes',
    fr: 'Itinéraire Intelligent',
    de: 'Intelligentes Routing',
    it: 'Percorsi Intelligenti',
    pt: 'Rotas Inteligentes',
  },
  navStart: {
    en: 'Start Location',
    es: 'Ubicación Inicial',
    fr: 'Point de Départ',
    de: 'Startort',
    it: 'Punto di Partenza',
    pt: 'Ponto de Partida',
  },
  navEnd: {
    en: 'Destination',
    es: 'Destino',
    fr: 'Destination',
    de: 'Zielort',
    it: 'Destinazione',
    pt: 'Destino',
  },
  navBtn: {
    en: 'Calculate Route',
    es: 'Calcular Ruta',
    fr: "Calculer l'Itinéraire",
    de: 'Route Berechnen',
    it: 'Calcola Percorso',
    pt: 'Calcular Rota',
  },
  navStatus: {
    en: 'Calculating path...',
    es: 'Calculando ruta...',
    fr: "Calcul de l'itinéraire...",
    de: 'Berechne Route...',
    it: 'Calcolo percorso...',
    pt: 'Calculando rota...',
  },
  navSteps: {
    en: 'Turn-by-Turn Directions',
    es: 'Instrucciones Paso a Paso',
    fr: 'Instructions Étape par Étape',
    de: 'Schritt-für-Schritt-Anleitung',
    it: 'Indicazioni Passo-Passo',
    pt: 'Instruções Passo a Passo',
  },
  fieldDirection: {
    en: 'Field Direction',
    es: 'Dirección al Campo',
    fr: 'Direction du Terrain',
    de: 'Feldrichtung',
    it: 'Direzione del Campo',
    pt: 'Direção do Campo',
  },
  chatTitle: {
    en: 'Stadium AI',
    es: 'Estadio IA',
    fr: 'Stade IA',
    de: 'Stadion KI',
    it: 'Stadio IA',
    pt: 'Estádio IA',
  },
  chatSubtitle: {
    en: 'Digital Concierge',
    es: 'Conserje Digital',
    fr: 'Concierge Numérique',
    de: 'Digitaler Concierge',
    it: 'Concierge Digitale',
    pt: 'Concierge Digital',
  },
  chatPlaceholder: {
    en: 'Ask about routes, seats, or amenities...',
    es: 'Pregunta sobre rutas, asientos o comodidades...',
    fr: 'Posez des questions sur les sièges, le plan, etc.',
    de: 'Fragen Sie nach Routen, Sitzen oder Annehmlichkeiten...',
    it: 'Chiedi su percorsi, posti o servizi...',
    pt: 'Pergunte sobre rotas, assentos ou comodidades...',
  },
  stepStartAt: {
    en: 'Start at',
    es: 'Comienza en',
    fr: 'Commencez à',
    de: 'Starten bei',
    it: 'Inizia a',
    pt: 'Comece em',
  },
  stepEnterGate: {
    en: 'Enter the stadium towards',
    es: 'Entra al estadio hacia',
    fr: 'Entrez dans le stade vers',
    de: 'Betreten Sie das Stadion in Richtung',
    it: 'Entra nello stadio verso',
    pt: 'Entre no estádio em direção a',
  },
  stepExitGate: {
    en: 'Exit the stadium towards',
    es: 'Sal del estadio hacia',
    fr: 'Sortez du stade vers',
    de: 'Verlassen Sie das Stadion in Richtung',
    it: 'Esci dallo stadio verso',
    pt: 'Saia do estádio em direção a',
  },
  stepStairs: {
    en: 'Take the stairs/escalator to',
    es: 'Toma las escaleras hacia',
    fr: 'Prenez les escaliers vers',
    de: 'Nehmen Sie die Treppe zu',
    it: 'Prendi le scale verso',
    pt: 'Pegue as escadas para',
  },
  stepWalkPast: {
    en: 'Walk past',
    es: 'Camina por',
    fr: 'Marchez au-delà de',
    de: 'Gehen Sie vorbei an',
    it: 'Cammina oltre',
    pt: 'Caminhe por',
  },
  stepWalkPastSections: {
    en: 'Sections',
    es: 'Secciones',
    fr: 'Sections',
    de: 'Abschnitten',
    it: 'Sezioni',
    pt: 'Seções',
  },
  stepWalkPastSuites: {
    en: 'Suites',
    es: 'Suites',
    fr: 'Suites',
    de: 'Suiten',
    it: 'Suite',
    pt: 'Suítes',
  },
  stepToReach: {
    en: 'to reach',
    es: 'para llegar a',
    fr: 'pour atteindre',
    de: 'um zu erreichen:',
    it: 'per raggiungere',
    pt: 'para chegar a',
  },
  stepWalkTo: {
    en: 'Walk to',
    es: 'Camina hacia',
    fr: 'Marchez vers',
    de: 'Gehen Sie zu',
    it: 'Cammina verso',
    pt: 'Caminhe para',
  },
  stepArrive: {
    en: 'Arrive at',
    es: 'Llega a',
    fr: 'Arrivez à',
    de: 'Ankunft bei',
    it: 'Arriva a',
    pt: 'Chegue a',
  },
  welcomeMessage: {
    en: 'Welcome to FANSPHERE! I am your AI concierge. Ask me about finding the shortest Route, or exploring VIP Suites.',
  },
};

const supportedLangs = [
  { code: 'en', name: 'English' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'sq', name: 'Albanian' },
  { code: 'am', name: 'Amharic' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hy', name: 'Armenian' },
  { code: 'az', name: 'Azerbaijani' },
  { code: 'eu', name: 'Basque' },
  { code: 'be', name: 'Belarusian' },
  { code: 'bn', name: 'Bengali' },
  { code: 'bs', name: 'Bosnian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'ca', name: 'Catalan' },
  { code: 'ceb', name: 'Cebuano' },
  { code: 'ny', name: 'Chichewa' },
  { code: 'zh', name: 'Chinese' },
  { code: 'co', name: 'Corsican' },
  { code: 'hr', name: 'Croatian' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'eo', name: 'Esperanto' },
  { code: 'et', name: 'Estonian' },
  { code: 'tl', name: 'Filipino' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'fy', name: 'Frisian' },
  { code: 'gl', name: 'Galician' },
  { code: 'ka', name: 'Georgian' },
  { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'ht', name: 'Haitian Creole' },
  { code: 'ha', name: 'Hausa' },
  { code: 'haw', name: 'Hawaiian' },
  { code: 'iw', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hmn', name: 'Hmong' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'is', name: 'Icelandic' },
  { code: 'ig', name: 'Igbo' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ga', name: 'Irish' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'jw', name: 'Javanese' },
  { code: 'kn', name: 'Kannada' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'km', name: 'Khmer' },
  { code: 'rw', name: 'Kinyarwanda' },
  { code: 'ko', name: 'Korean' },
  { code: 'ku', name: 'Kurdish' },
  { code: 'ky', name: 'Kyrgyz' },
  { code: 'lo', name: 'Lao' },
  { code: 'la', name: 'Latin' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'lb', name: 'Luxembourgish' },
  { code: 'mk', name: 'Macedonian' },
  { code: 'mg', name: 'Malagasy' },
  { code: 'ms', name: 'Malay' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mt', name: 'Maltese' },
  { code: 'mi', name: 'Maori' },
  { code: 'mr', name: 'Marathi' },
  { code: 'mn', name: 'Mongolian' },
  { code: 'my', name: 'Myanmar (Burmese)' },
  { code: 'ne', name: 'Nepali' },
  { code: 'no', name: 'Norwegian' },
  { code: 'or', name: 'Odia (Oriya)' },
  { code: 'ps', name: 'Pashto' },
  { code: 'fa', name: 'Persian' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' },
  { code: 'sm', name: 'Samoan' },
  { code: 'gd', name: 'Scots Gaelic' },
  { code: 'sr', name: 'Serbian' },
  { code: 'st', name: 'Sesotho' },
  { code: 'sn', name: 'Shona' },
  { code: 'sd', name: 'Sindhi' },
  { code: 'si', name: 'Sinhala' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'so', name: 'Somali' },
  { code: 'es', name: 'Spanish' },
  { code: 'su', name: 'Sundanese' },
  { code: 'sw', name: 'Swahili' },
  { code: 'sv', name: 'Swedish' },
  { code: 'tg', name: 'Tajik' },
  { code: 'ta', name: 'Tamil' },
  { code: 'tt', name: 'Tatar' },
  { code: 'te', name: 'Telugu' },
  { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' },
  { code: 'tk', name: 'Turkmen' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'ur', name: 'Urdu' },
];

window.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('ui-lang-select');
  const splashSelect = document.getElementById('splash-lang-select');

  if (select && splashSelect) {
    supportedLangs.forEach((l) => {
      let nativeName = l.name;
      try {
        const displayNames = new Intl.DisplayNames([l.code], { type: 'language' });
        const nativeRaw = displayNames.of(l.code);
        if (nativeRaw) {
          nativeName = nativeRaw.charAt(0).toUpperCase() + nativeRaw.slice(1);
        }
      } catch(e) { /* ignore */ }

      const displayText =
        l.name.toLowerCase() === nativeName.toLowerCase() ? l.name : `${l.name} (${nativeName})`;

      // Populate main UI dropdown
      const opt = document.createElement('option');
      opt.value = l.name;
      opt.textContent = displayText;
      select.appendChild(opt);

      // Populate splash select
      const sOpt = document.createElement('option');
      sOpt.value = l.name;
      sOpt.textContent = displayText;
      splashSelect.appendChild(sOpt);
    });
    select.value = 'English';
    splashSelect.value = 'English';
  }

  window.APP_ROLE = 'fan'; // Default

  const enterApp = (role) => {
    window.APP_ROLE = role;
    const uiSelect = document.getElementById('ui-lang-select');
    const lang = uiSelect ? uiSelect.value : window.uiLang || 'English';

    if (lang !== 'English') {
      setUiLanguage(lang);
    }

    const switchBtn = document.getElementById('btn-switch-role');
    if (switchBtn) {
      switchBtn.classList.remove('hidden');
      switchBtn.textContent = role === 'fan' ? 'Switch to Mgmt Mode' : 'Switch to Fan Mode';
      switchBtn.onclick = () => enterApp(role === 'fan' ? 'management' : 'fan');
    }

    if (role === 'fan') {
      // Hide Mgmt
      document.getElementById('btn-crowd-intel').style.display = 'none';
      document.getElementById('btn-data-config').style.display = 'none';
      document.getElementById('sim-debug-panel').classList.add('hidden');

      // Show Fan
      document.getElementById('btn-emergency').style.display = '';
      document.getElementById('btn-parking').style.display = '';
      document.getElementById('btn-nav').style.display = '';
      document.getElementById('btn-food').style.display = '';
      document.getElementById('btn-chat').style.display = '';
    } else if (role === 'management') {
      // Hide Fan
      document.getElementById('btn-emergency').style.display = 'none';
      document.getElementById('btn-parking').style.display = 'none';
      document.getElementById('btn-nav').style.display = 'none';
      document.getElementById('btn-food').style.display = 'none';
      document.getElementById('btn-chat').style.display = 'none';
      document.getElementById('nav-panel').classList.add('hidden');
      document.getElementById('food-panel').classList.add('translate-x-full');
      document.getElementById('chat-panel').classList.add('translate-x-full');
      document.getElementById('parking-panel').classList.add('hidden');

      // Show Mgmt
      document.getElementById('btn-crowd-intel').style.display = '';
      document.getElementById('btn-data-config').style.display = '';
    }

    requestRender();

    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => splash.remove(), 500);
    }
  };

  const btnFan = document.getElementById('btn-enter-fan');
  if (btnFan) {
    btnFan.addEventListener('mouseover', () => (btnFan.style.backgroundColor = '#0284c7'));
    btnFan.addEventListener('mouseout', () => (btnFan.style.backgroundColor = '#38bdf8'));
    btnFan.addEventListener('click', () => enterApp('fan'));
  }

  const btnMgmt = document.getElementById('btn-enter-mgmt');
  if (btnMgmt) {
    btnMgmt.addEventListener('mouseover', () => (btnMgmt.style.backgroundColor = '#059669'));
    btnMgmt.addEventListener('mouseout', () => (btnMgmt.style.backgroundColor = '#10b981'));
    btnMgmt.addEventListener('click', () => enterApp('management'));
  }

  const btnEmergency = document.getElementById('btn-emergency');
  const emergencyModal = document.getElementById('emergency-modal');
  const locSelect = document.getElementById('emergency-location');

  if (btnEmergency && emergencyModal) {
    btnEmergency.addEventListener('click', () => {
      if (locSelect.options.length === 0 && typeof stadiumGraph !== 'undefined') {
        const nodes = Object.values(stadiumGraph.nodes).sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        nodes.forEach((n) => locSelect.add(new Option(n.name, n.id)));
      }
      emergencyModal.classList.remove('hidden');
    });

    document.getElementById('btn-emergency-cancel').addEventListener('click', () => {
      emergencyModal.classList.add('hidden');
    });

    document.getElementById('btn-emergency-submit').addEventListener('click', async () => {
      const locationId = locSelect.value;
      const locationName = locSelect.options[locSelect.selectedIndex].text;
      const emergencyType = document.getElementById('emergency-type').value;
      const details = document.getElementById('emergency-details').value;

      const submitBtn = document.getElementById('btn-emergency-submit');
      submitBtn.innerHTML = DOMPurify.sanitize('<span class="animate-pulse">Analyzing...</span>');
      submitBtn.disabled = true;

      try {
        const promptStr = `A stadium emergency has been reported. Location: ${locationName}. Type: ${emergencyType}. Details: ${details || 'None provided.'}. Provide a JSON response evaluating this incident. Respond ONLY with valid JSON in this exact format, with no markdown code blocks or extra text: {"severity": "CRITICAL EMERGENCY" or "HIGH ALERT" or "WARNING", "recommendedAction": "Actionable instruction for venue staff", "aiExplanation": "Brief 1-2 sentence assessment of the situation."}`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: promptStr }],
            response_format: { type: 'json_object' },
          }),
        });

        const data = await response.json();
        const aiResult = JSON.parse(data.choices[0].message.content);

        window.activeEmergencies = window.activeEmergencies || [];
        window.activeEmergencies.push({
          id: 'em-' + Date.now(),
          location: locationName,
          description: `${emergencyType}${details ? ' - ' + details : ''}`,
          status: 'active',
          severity: aiResult.severity || 'CRITICAL EMERGENCY',
          recommendedAction: aiResult.recommendedAction || 'Deploy venue staff immediately.',
          aiExplanation: aiResult.aiExplanation || 'Emergency reported by user.',
        });
      } catch (e) {
        console.error(e);
        window.activeEmergencies = window.activeEmergencies || [];
        window.activeEmergencies.push({
          id: 'em-' + Date.now(),
          location: locationName,
          description: `${emergencyType}${details ? ' - ' + details : ''}`,
          status: 'active',
          severity: 'CRITICAL EMERGENCY',
          recommendedAction: 'Deploy venue staff immediately.',
          aiExplanation: 'Emergency reported by user.',
        });
      }

      emergencyModal.classList.add('hidden');
      submitBtn.innerHTML = DOMPurify.sanitize('Submit');
      submitBtn.disabled = false;

      const switchBtn = document.getElementById('btn-switch-role');
      if (switchBtn && !switchBtn.querySelector('.emergency-dot')) {
        const dot = document.createElement('span');
        dot.className =
          'emergency-dot w-3 h-3 rounded-full bg-red-500 animate-pulse absolute -top-1 -right-1 border-2 border-slate-900';
        switchBtn.appendChild(dot);
      }

      const intelBtn = document.getElementById('btn-crowd-intel');
      if (intelBtn && !intelBtn.querySelector('.emergency-dot')) {
        const dot = document.createElement('span');
        dot.className =
          'emergency-dot w-3 h-3 rounded-full bg-red-500 animate-pulse absolute -top-1 -right-1 border-2 border-slate-900';
        intelBtn.style.position = 'relative';
        intelBtn.appendChild(dot);
      }

      if (window.stadiumSim && window.stadiumSim.intelligenceEngine) {
        const intelOutput = window.stadiumSim.intelligenceEngine.process(window.stadiumSim);
        window.dispatchEvent(new CustomEvent('crowdIntelligenceUpdated', { detail: intelOutput }));
      }
    });
  }
});

async function setUiLanguage(lang) {
  window.uiLang = lang;

  const getEnglish = (el, attr, prop) => {
    const key = el.getAttribute(attr);
    if (uiDict[key] && uiDict[key].en) return uiDict[key].en;
    const cached = el.getAttribute(attr + '-en');
    if (cached) return cached;
    const val = prop === 'innerHTML' ? el.innerHTML.trim() : el[prop].trim();
    if (val) el.setAttribute(attr + '-en', val);
    return val;
  };

  if (lang === 'English') {
    document.querySelectorAll('[data-i18n], [data-i18n-dyn]').forEach((el) => {
      const attr = el.hasAttribute('data-i18n') ? 'data-i18n' : 'data-i18n-dyn';
      const txt = getEnglish(el, attr, 'innerHTML');
      if (txt) el.innerHTML = DOMPurify.sanitize(txt);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const txt = getEnglish(el, 'data-i18n-placeholder', 'placeholder');
      if (txt) el.placeholder = txt;
    });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const txt = getEnglish(el, 'data-i18n-title', 'title');
      if (txt) el.title = txt;
    });
    return;
  }

  const elementsToTranslate = [];
  const stringsToTranslate = [];

  document.querySelectorAll('[data-i18n], [data-i18n-dyn]').forEach((el) => {
    const attr = el.hasAttribute('data-i18n') ? 'data-i18n' : 'data-i18n-dyn';
    const txt = getEnglish(el, attr, 'innerHTML');
    if (txt) {
      elementsToTranslate.push({ el, type: 'text' });
      stringsToTranslate.push(txt);
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const txt = getEnglish(el, 'data-i18n-placeholder', 'placeholder');
    if (txt) {
      elementsToTranslate.push({ el, type: 'placeholder' });
      stringsToTranslate.push(txt);
    }
  });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const txt = getEnglish(el, 'data-i18n-title', 'title');
    if (txt) {
      elementsToTranslate.push({ el, type: 'title' });
      stringsToTranslate.push(txt);
    }
  });

  try {
    const systemPrompt = `Translate the following JSON array of English strings into ${lang}. You must output a valid JSON object with a single key "translations" containing the array of translated strings in the exact same order. Preserve all HTML tags (like <b>).`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(stringsToTranslate) },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const translatedObj = JSON.parse(data.choices[0].message.content);
    const translatedArray = translatedObj.translations;

    if (translatedArray && translatedArray.length === elementsToTranslate.length) {
      translatedArray.forEach((t, i) => {
        const item = elementsToTranslate[i];
        if (item) {
          if (item.type === 'text') item.el.innerHTML = DOMPurify.sanitize(t);
          else if (item.type === 'placeholder') item.el.placeholder = t;
          else if (item.type === 'title') item.el.title = t;
        }
      });
    }
  } catch (err) {
    console.error('Translation error:', err);
    alert('Failed to translate UI. Please check your network or API quota.');
    document.getElementById('ui-lang-select').value = 'English';
  }
}

async function translateDynamicNodes(container) {
  if (window.uiLang === 'English' || !window.uiLang) return;

  const elementsToTranslate = [];
  const stringsToTranslate = [];

  container.querySelectorAll('[data-i18n-dyn]').forEach((el) => {
    let text = el.getAttribute('data-i18n-en');
    if (!text) {
      text = el.innerHTML.trim();
      el.setAttribute('data-i18n-en', text);
    }
    if (text) {
      elementsToTranslate.push(el);
      stringsToTranslate.push(text);
    }
  });

  if (stringsToTranslate.length === 0) return;

  try {
    const systemPrompt = `Translate the following JSON array of English strings into ${window.uiLang}. You must output a valid JSON object with a single key "translations" containing the array of translated strings in the exact same order. Preserve all HTML tags (like <b>).`;
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(stringsToTranslate) },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    const translatedArray = JSON.parse(data.choices[0].message.content).translations;

    if (translatedArray && translatedArray.length === elementsToTranslate.length) {
      translatedArray.forEach((t, i) => {
        elementsToTranslate[i].innerHTML = DOMPurify.sanitize(t);
      });
    }
  } catch (e) {
    console.error('Dynamic Translation Error:', e);
  }
}

// Initialize icons
lucide.createIcons();

// ==========================================
// PROCEDURAL INTERACTIVE WEDGES
// ==========================================
const wedgesGroup = document.getElementById('interactive-wedges');
const centerX = 600;
const centerY = 500;

// Superellipse geometry for a soft chamfered rectangle (stadium shape)
function getStadiumRadius(angle, rx, ry) {
  const absCos = Math.max(Math.abs(Math.cos(angle)), 0.0001);
  const absSin = Math.max(Math.abs(Math.sin(angle)), 0.0001);

  // n = 2.8 gives a smooth rounded rectangle with chamfered-like corners
  const n = 2.8;
  const rSuper = Math.pow(Math.pow(absCos / rx, n) + Math.pow(absSin / ry, n), -1 / n);
  return rSuper;
}

function drawChamferedPath(ctx, cx, cy, inRx, inRy, outRx, outRy, startA, endA) {
  const steps = Math.max(10, Math.ceil(Math.abs(endA - startA) * 20)); // Approx 20 steps per radian
  ctx.beginPath();

  // Inner arc
  for (let i = 0; i <= steps; i++) {
    const a = startA + (endA - startA) * (i / steps);
    const r = getStadiumRadius(a, inRx, inRy);
    if (i === 0) ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    else ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }

  // Outer arc (backwards)
  for (let i = steps; i >= 0; i--) {
    const a = startA + (endA - startA) * (i / steps);
    const r = getStadiumRadius(a, outRx, outRy);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }

  ctx.closePath();
}

function drawFullChamferedRing(ctx, cx, cy, rx, ry) {
  const steps = 100;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    const r = getStadiumRadius(a, rx, ry);
    if (i === 0) ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    else ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
}

// FANSPHERE accurately features 50 sections per level (e.g., 101-150)
const numSections = 50;
const angleStep = (2 * Math.PI) / numSections;

// Graph engine variables
const stadiumGraph = { nodes: {}, edges: [] };

const levels = [
  { name: '100', inRx: 220, inRy: 155, outRx: 280, outRy: 205, fill: 'rgba(2, 6, 23, 0.8)' },
  {
    name: 'Suite 3',
    type: 'suite',
    inRx: 282,
    inRy: 207,
    outRx: 310,
    outRy: 225,
    fill: 'rgba(56, 189, 248, 0.15)',
  },
  { name: '200', inRx: 312, inRy: 227, outRx: 380, outRy: 280, fill: 'rgba(2, 6, 23, 0.8)' },
  {
    name: 'Suite 5',
    type: 'suite',
    inRx: 382,
    inRy: 282,
    outRx: 410,
    outRy: 300,
    fill: 'rgba(56, 189, 248, 0.15)',
  },
  {
    name: 'Suite 6',
    type: 'suite',
    inRx: 412,
    inRy: 302,
    outRx: 440,
    outRy: 320,
    fill: 'rgba(56, 189, 248, 0.15)',
  },
  { name: '300', inRx: 442, inRy: 322, outRx: 520, outRy: 380, fill: 'rgba(2, 6, 23, 0.8)' },
];

// Initialize nodes without DOM elements
for (let l = 0; l < levels.length; l++) {
  const lvl = levels[l];
  const midRx = lvl.inRx + (lvl.outRx - lvl.inRx) / 2;
  const midRy = lvl.inRy + (lvl.outRy - lvl.inRy) / 2;

  for (let i = 0; i < numSections; i++) {
    const angle = i * angleStep - Math.PI / 2;
    let normAngle = angle;
    while (normAngle < 0) normAngle += 2 * Math.PI;

    const isSideline = (normAngle > 0.5 && normAngle < 2.6) || (normAngle > 3.6 && normAngle < 5.7);
    if (lvl.type === 'suite' && !isSideline) continue;

    const sectionId =
      lvl.type === 'suite'
        ? `${lvl.name.replace('Suite ', 'S')}-${String(i + 1).padStart(2, '0')}`
        : `${lvl.name.charAt(0)}${String(i + 1).padStart(2, '0')}`;

    const secId = `sec-${sectionId}`;

    const midR = getStadiumRadius(angle, midRx, midRy);
    const cx = centerX + Math.cos(angle) * midR;
    const cy = centerY + Math.sin(angle) * midR;

    const concourseRx = lvl.outRx + 1;
    const concourseRy = lvl.outRy + 1;
    const concourseR = getStadiumRadius(angle, concourseRx, concourseRy);
    const concourseX = centerX + Math.cos(angle) * concourseR;
    const concourseY = centerY + Math.sin(angle) * concourseR;

    stadiumGraph.nodes[secId] = {
      id: secId,
      name: `${lvl.type === 'suite' ? 'Suite' : 'Section'} ${sectionId}`,
      x: cx,
      y: cy,
      rx: midRx,
      ry: midRy,
      angle: angle,
      inRx: lvl.inRx,
      inRy: lvl.inRy,
      outRx: lvl.outRx,
      outRy: lvl.outRy,
      concourseX,
      concourseY,
      concourseRx,
      concourseRy,
      level: lvl.name,
      index: i,
    };
  }
}

/* Seat drill-down removed for performance */

// Add Gates to Graph manually (Anchored mathematically to the chamfered border)
const gates = [
  { id: 'gate-amex', name: 'AMEX Gate', angle: -Math.PI / 2 },
  { id: 'gate-hcl', name: 'HCLTech Gate', angle: -0.69 },
  { id: 'gate-verizon', name: 'Verizon Gate', angle: 0.69 },
  { id: 'gate-fansphere', name: 'FANSPHERE Gate', angle: Math.PI / 2 },
  { id: 'gate-moodys', name: "Moody's Gate", angle: Math.PI - 0.69 },
].map((g) => {
  const r = getStadiumRadius(g.angle, 540, 400); // 540x400 is the outer boundary
  return { ...g, x: 600 + Math.cos(g.angle) * r, y: 500 + Math.sin(g.angle) * r };
});
gates.forEach(
  (g) =>
    (stadiumGraph.nodes[g.id] = {
      id: g.id,
      name: g.name,
      x: g.x,
      y: g.y,
      concourseX: g.x,
      concourseY: g.y,
      level: 'gate',
    })
);

// BUILD GRAPH EDGES
function connectEdges(idA, idB, requiresStairs = false) {
  const nA = stadiumGraph.nodes[idA];
  const nB = stadiumGraph.nodes[idB];
  if (nA && nB) {
    const dx = nA.concourseX - nB.concourseX;
    const dy = nA.concourseY - nB.concourseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    stadiumGraph.edges.push({ a: idA, b: idB, dist: dist, requiresStairs });
    stadiumGraph.edges.push({ a: idB, b: idA, dist: dist, requiresStairs });
  }
}

for (let i = 0; i < numSections; i++) {
  const nextI = (i + 1) % numSections;
  const getSecId = (lvlName, idx) =>
    `sec-${lvlName.includes('Suite') ? lvlName.replace('Suite ', 'S') + '-' + String(idx + 1).padStart(2, '0') : lvlName.charAt(0) + String(idx + 1).padStart(2, '0')}`;

  // Horizontal connections
  levels.forEach((lvl, levelIdx) => {
    const idA = getSecId(lvl.name, i);
    const idB = getSecId(lvl.name, nextI);
    connectEdges(idA, idB, false);
  });

  // Vertical connections (Stairs vs Elevators)
  const isStairs = i % 8 !== 0;

  connectEdges(getSecId('100', i), getSecId('200', i), isStairs);
  connectEdges(getSecId('200', i), getSecId('300', i), isStairs);
  // Connect suites if they exist
  connectEdges(getSecId('100', i), getSecId('Suite 3', i), isStairs);
  connectEdges(getSecId('Suite 3', i), getSecId('200', i), isStairs);
  connectEdges(getSecId('200', i), getSecId('Suite 5', i), isStairs);
  connectEdges(getSecId('Suite 5', i), getSecId('Suite 6', i), isStairs);
  connectEdges(getSecId('Suite 6', i), getSecId('300', i), isStairs);
}

// Connect Gates to their absolutely nearest 300-level (outermost) sections mathematically
gates.forEach((g) => {
  let minDist = Infinity;
  let closestSec = null;

  for (let i = 0; i < numSections; i++) {
    const s300 = stadiumGraph.nodes[`sec-3${String(i + 1).padStart(2, '0')}`];
    // Use concourseX/Y for distance to accurately reflect walking paths
    const dist = Math.sqrt(Math.pow(s300.concourseX - g.x, 2) + Math.pow(s300.concourseY - g.y, 2));
    if (dist < minDist) {
      minDist = dist;
      closestSec = s300;
    }
  }

  if (closestSec) {
    connectEdges(g.id, closestSec.id);
  }
});
/* Seat drill-down removed for performance */

// Initialize and Populate Stadium Simulation
if (window.StadiumSimulation) {
  window.stadiumSim = new window.StadiumSimulation(12345);

  // Auto-populate from stadiumGraph
  Object.values(stadiumGraph.nodes).forEach((node) => {
    if (node.level === 'gate') {
      window.stadiumSim.addEntryGate(node.id, node.name, 1000); // generic capacity
      window.stadiumSim.addExitGate(node.id + '-exit', node.name + ' Exit', 1000);
    } else if (node.level && node.level.includes('Suite')) {
      window.stadiumSim.addSuite(node.id, node.name, 30);
    } else {
      window.stadiumSim.addSection(node.id, node.name, 500);
    }
  });

  window.stadiumSim.setPhase('pre_match');
  console.log('Stadium Simulation Initialized (Paused).');
}

// Generate Hash Marks on Football Field (batch innerHTML instead of 200 createElementNS calls)
const hashGroup = document.getElementById('hash-marks');
const hashSvg = '';
// ==========================================
// CANVAS RENDER ENGINE & ZOOM/PAN
// ==========================================
const canvas = document.getElementById('blueprint-canvas');
let ctx = null;
let canvasView = { x: 0, y: 0, scale: 1, baseW: 1200, baseH: 1000 };
let activeRoute = null;

// Resize observer
const mapContainer = document.getElementById('map-container');
const resizeCanvas = () => {
  if (!canvas) return;
  const rect = mapContainer.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  if (!ctx) ctx = canvas.getContext('2d', { alpha: false });
  requestRender();
};
window.addEventListener('resize', resizeCanvas);
setTimeout(resizeCanvas, 0);

let renderRAF = null;
let dashOffset = 0;
function requestRender() {
  if (!renderRAF) {
    renderRAF = requestAnimationFrame(() => {
      renderStadium();
      renderRAF = null;
      if (
        (activeRoute && activeRoute.length > 0) ||
        (window.activeEmergencies && window.activeEmergencies.some((e) => e.status === 'active'))
      ) {
        requestRender(); // Keep looping if there's an active route or active emergency
      }
    });
  }
}

// Zoom/Pan logic
let isPanning = false;
let startPoint = { x: 0, y: 0 };
let startView = { x: 0, y: 0 };

canvas.addEventListener('mousedown', (e) => {
  isPanning = true;
  startPoint = { x: e.clientX, y: e.clientY };
  startView = { x: canvasView.x, y: canvasView.y };
  canvas.style.cursor = 'grabbing';
});

window.addEventListener('mouseup', () => {
  if (isPanning) {
    isPanning = false;
    canvas.style.cursor = 'grab';
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!isPanning) return;
  const dx = e.clientX - startPoint.x;
  const dy = e.clientY - startPoint.y;
  const effectiveScale = getEffectiveScale();
  canvasView.x = startView.x + dx / effectiveScale;
  canvasView.y = startView.y + dy / effectiveScale;
  requestRender();
});

canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const effectiveScale = getEffectiveScale();

    const worldX = mouseX / effectiveScale - canvasView.x;
    const worldY = mouseY / effectiveScale - canvasView.y;

    let newScale = canvasView.scale * zoomFactor;
    newScale = Math.max(1.0, Math.min(newScale, 5.0)); // Zoom limits
    canvasView.scale = newScale;

    const newEffectiveScale = getEffectiveScale();

    canvasView.x = mouseX / newEffectiveScale - worldX;
    canvasView.y = mouseY / newEffectiveScale - worldY;

    if (canvasView.scale <= 1.0) {
      canvasView.x = 0;
      canvasView.y = 0;
    }

    requestRender();
  },
  { passive: false }
);

document.getElementById('btn-zoom-in').addEventListener('click', () => {
  canvasView.scale = Math.min(canvasView.scale * 1.2, 5.0);
  requestRender();
});
document.getElementById('btn-zoom-out').addEventListener('click', () => {
  canvasView.scale = Math.max(canvasView.scale * 0.8, 1.0);
  if (canvasView.scale <= 1.0) {
    canvasView.x = 0;
    canvasView.y = 0;
  }
  requestRender();
});
document.getElementById('btn-reset').addEventListener('click', () => {
  canvasView = { x: 0, y: 0, scale: 1, baseW: 1200, baseH: 1000 };
  requestRender();
});

function getEffectiveScale() {
  if (!canvas) return 1;
  const rect = mapContainer.getBoundingClientRect();
  const scaleX = rect.width / canvasView.baseW;
  const scaleY = rect.height / canvasView.baseH;
  return Math.min(scaleX, scaleY) * canvasView.scale;
}

function renderStadium() {
  if (!ctx || !canvas) return;

  const dpr = window.devicePixelRatio || 1;

  ctx.save();
  ctx.scale(dpr, dpr);

  const rect = mapContainer.getBoundingClientRect();
  ctx.fillStyle = '#020617'; // Pure deep dark slate/black
  ctx.fillRect(0, 0, rect.width, rect.height);

  ctx.save();
  const effectiveScale = getEffectiveScale();
  const baseScale = Math.min(rect.width / canvasView.baseW, rect.height / canvasView.baseH);
  const defaultOffsetX = (rect.width - canvasView.baseW * baseScale) / 2;
  const defaultOffsetY = (rect.height - canvasView.baseH * baseScale) / 2;

  ctx.translate(defaultOffsetX, defaultOffsetY);
  ctx.scale(effectiveScale, effectiveScale);
  ctx.translate(canvasView.x, canvasView.y);

  // Outer Shell Boundaries
  ctx.strokeStyle = '#475569'; // Lighter contrast ring
  ctx.lineWidth = 6;
  drawFullChamferedRing(ctx, centerX, centerY, 540, 400);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#64748b'; // Thin inner ring, higher contrast
  ctx.lineWidth = 1;
  drawFullChamferedRing(ctx, centerX, centerY, 530, 390);
  ctx.stroke();

  // Field Boundary
  ctx.strokeStyle = '#38bdf8'; // Pop of neon blue for field edge
  ctx.lineWidth = 4;
  ctx.fillStyle = '#064e3b';
  drawFullChamferedRing(ctx, centerX, centerY, 215, 150);
  ctx.fill();
  ctx.stroke();

  // Football Field (rotated -90)
  ctx.save();
  ctx.translate(600, 500);
  ctx.rotate(-Math.PI / 2);
  ctx.translate(-80, -180);

  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  for (let y = 30; y <= 330; y += 30) {
    if ((y / 30) % 2 === 0) ctx.fillRect(0, y, 160, 30);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(0, 0, 160, 30);
  ctx.fillRect(0, 330, 160, 30);

  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(80, 20);
  ctx.rotate(Math.PI);
  ctx.fillText('FANSPHERE', 0, 0);
  ctx.restore();
  ctx.fillText('FANSPHERE', 80, 350);

  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1;
  for (let y = 60; y <= 300; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(160, y);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 180);
  ctx.lineTo(160, 180);
  ctx.stroke();

  ctx.font = '14px monospace';
  ctx.fillText('50', 20, 176);
  ctx.fillText('50', 140, 176);

  // Hash marks
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1;
  for (let y = 30; y <= 330; y += 3) {
    if ((y - 30) % 30 === 0) continue;
    ctx.beginPath();
    ctx.moveTo(60, y);
    ctx.lineTo(64, y);
    ctx.moveTo(96, y);
    ctx.lineTo(100, y);
    ctx.stroke();
  }
  ctx.restore();

  // Render distinct sections using polygon paths
  Object.values(stadiumGraph.nodes).forEach((node) => {
    if (node.level === 'gate') return;

    const gap = 0.012; // angular gap between sections
    const startA = node.angle - angleStep / 2 + gap;
    const endA = node.angle + angleStep / 2 - gap;

    drawChamferedPath(
      ctx,
      centerX,
      centerY,
      node.inRx,
      node.inRy,
      node.outRx,
      node.outRy,
      startA,
      endA
    );

    let density = 0;
    if (typeof window.stadiumSim !== 'undefined') {
      const simSec = window.stadiumSim.sections.get(node.id);
      const simSuite = window.stadiumSim.suites.get(node.id);
      if (simSec) density = simSec.crowdDensity / 100;
      else if (simSuite) density = simSuite.occupancyRate;
    }

    if (density > 0.05) {
      // Heatmap: Slate Blue (220) -> Green -> Yellow -> Red (0) based on density
      // We'll use a hue range of 200 down to 0
      const hue = 200 - Math.min(density, 1) * 200;
      ctx.fillStyle = `hsla(${hue}, 70%, 35%, 0.85)`;
    } else {
      ctx.fillStyle = '#1e293b'; // Default empty slate
    }

    ctx.fill();
    ctx.strokeStyle = '#475569'; // Crisper section border
    ctx.lineWidth = 1;
    ctx.stroke();

    // Text
    ctx.save();
    ctx.translate(node.x, node.y);
    ctx.rotate(node.angle + Math.PI / 2);
    ctx.fillStyle = '#f8fafc'; // Very bright white text for high contrast
    const fontSize = node.level === '100' ? 8 : node.level.includes('Suite') ? 6 : 9;
    ctx.font = `600 ${fontSize}px 'Inter', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let text = node.id.replace('sec-', '');
    if (text.startsWith('S-')) text = text.replace('S-', 'S');
    ctx.fillText(text, 0, 0);
    ctx.restore();
  });

  // Static text overlays removed

  // Gates
  gates.forEach((g) => {
    let gateDensity = 0;
    let isCongested = false;

    if (typeof window.stadiumSim !== 'undefined' && window.stadiumSim.entryGates) {
      const simGate = window.stadiumSim.entryGates.get(g.id);
      if (simGate) {
        gateDensity = simGate.density;
        isCongested = simGate.status === 'congested';
      }
    }

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(g.x, g.y, 25, 0, 2 * Math.PI);
    ctx.fill();

    // Heatmap color based on simulation density
    if (gateDensity > 0.1) {
      ctx.fillStyle = `hsla(${120 - gateDensity * 120}, 90%, 50%, ${0.2 + gateDensity * 0.4})`;
    } else {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
    }

    ctx.beginPath();
    ctx.arc(g.x, g.y, 15 + gateDensity * 5, 0, 2 * Math.PI);
    ctx.fill();

    if (isCongested) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.fillStyle = '#1e293b'; // Dark text for light background
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = g.x > 600 ? 'right' : 'left';
    const tx = g.x > 600 ? g.x - 35 : g.x + 35;
    const ty = g.y < 500 ? g.y - 15 : g.y + 25;

    if (gateDensity > 0) {
      ctx.fillStyle = `hsl(${120 - gateDensity * 120}, 90%, 60%)`;
    }
    ctx.fillText(g.name, tx, ty);
  });

  // Active Route
  if (activeRoute && activeRoute.length > 0) {
    dashOffset -= 0.8; // Animation speed
    if (dashOffset <= -14) dashOffset = 0; // 8 + 6 = 14 (dash array sum)

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = dashOffset;
    ctx.beginPath();
    const waypoints = [];
    const angleStep = (2 * Math.PI) / 50;

    let globalDir = 1;
    for (let k = 0; k < activeRoute.length - 1; k++) {
      const n1 = stadiumGraph.nodes[activeRoute[k]];
      const n2 = stadiumGraph.nodes[activeRoute[k + 1]];
      if (
        n1 &&
        n2 &&
        n1.level === n2.level &&
        n1.level !== 'gate' &&
        n1.index !== undefined &&
        n2.index !== undefined
      ) {
        let diff = n2.index - n1.index;
        if (diff > 25) diff -= 50;
        if (diff < -25) diff += 50;
        globalDir = diff < 0 ? -1 : 1;
        break;
      }
    }

    const pushCurve = (pts, a1, a2, rx, ry) => {
      let diff = a2 - a1;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      a2 = a1 + diff;

      if (Math.abs(diff) < 0.001) return;
      const steps = Math.max(3, Math.ceil(Math.abs(diff) / 0.05));
      for (let s = 1; s <= steps; s++) {
        const a = a1 + diff * (s / steps);
        const r = getStadiumRadius(a, rx, ry);
        pts.push({ x: centerX + Math.cos(a) * r, y: centerY + Math.sin(a) * r });
      }
    };

    let currentAisleA = null;

    for (let i = 0; i < activeRoute.length; i++) {
      const node = stadiumGraph.nodes[activeRoute[i]];
      if (!node) continue;

      if (node.level === 'gate') {
        waypoints.push({ x: node.x, y: node.y });
        continue;
      }

      const aisleA = node.angle + (globalDir * angleStep) / 2;
      const cRx = node.outRx + 12; // Extra clearance from section boundary
      const cRy = node.outRy + 12;
      const pSeat = { x: node.x, y: node.y };

      if (i === 0) {
        waypoints.push(pSeat);
        pushCurve(waypoints, node.angle, aisleA, node.rx, node.ry);
        const rConc = getStadiumRadius(aisleA, cRx, cRy);
        waypoints.push({
          x: centerX + Math.cos(aisleA) * rConc,
          y: centerY + Math.sin(aisleA) * rConc,
        });
        currentAisleA = aisleA;
      } else if (i === activeRoute.length - 1) {
        if (currentAisleA !== null) {
          pushCurve(waypoints, currentAisleA, aisleA, cRx, cRy);
        }
        const rConc = getStadiumRadius(aisleA, cRx, cRy);
        waypoints.push({
          x: centerX + Math.cos(aisleA) * rConc,
          y: centerY + Math.sin(aisleA) * rConc,
        });

        const rSeat = getStadiumRadius(aisleA, node.rx, node.ry);
        waypoints.push({
          x: centerX + Math.cos(aisleA) * rSeat,
          y: centerY + Math.sin(aisleA) * rSeat,
        });
        pushCurve(waypoints, aisleA, node.angle, node.rx, node.ry);
        waypoints.push(pSeat);
      } else {
        if (currentAisleA !== null) {
          pushCurve(waypoints, currentAisleA, aisleA, cRx, cRy);
        }
        const rConc = getStadiumRadius(aisleA, cRx, cRy);
        waypoints.push({
          x: centerX + Math.cos(aisleA) * rConc,
          y: centerY + Math.sin(aisleA) * rConc,
        });
        currentAisleA = aisleA;
      }
    }

    for (let j = 0; j < waypoints.length; j++) {
      if (j === 0) ctx.moveTo(waypoints[j].x, waypoints[j].y);
      else ctx.lineTo(waypoints[j].x, waypoints[j].y);
    }

    ctx.stroke();
    ctx.setLineDash([]);

    const start = stadiumGraph.nodes[activeRoute[0]];
    const end = stadiumGraph.nodes[activeRoute[activeRoute.length - 1]];
    if (start) {
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(start.x, start.y, 10, 0, 2 * Math.PI);
      ctx.fill();
    }
    if (end) {
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(end.x, end.y, 10, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  // Render Food Stalls if panel is open
  const foodPanel = document.getElementById('food-panel');
  if (foodPanel && !foodPanel.classList.contains('translate-x-full') && window.FOOD_STALLS) {
    window.FOOD_STALLS.forEach((stall) => {
      let match = true;
      if (typeof activeFoodFilters !== 'undefined' && activeFoodFilters.size > 0) {
        for (const filter of activeFoodFilters) {
          if (!stall.tags.includes(filter)) match = false;
        }
      }
      if (match) {
        const node = stadiumGraph.nodes[stall.section];
        if (node) {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(node.x, node.y, 10, 0, 2 * Math.PI);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#000';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          let icon = '🍔';
          if (stall.category.includes('Mexican')) icon = '🌮';
          else if (stall.category.includes('Italian')) icon = '🍝';
          else if (stall.category.includes('Dessert')) icon = '🍪';
          else if (
            stall.category.includes('Healthy') ||
            stall.category.includes('Salads') ||
            stall.category.includes('Vegan')
          )
            icon = '🥗';
          else if (
            stall.category.includes('Chicken') ||
            stall.category.includes('Grill') ||
            stall.category.includes('Halal') ||
            stall.category.includes('Traditional')
          )
            icon = '🍗';
          else if (stall.category.includes('Snacks')) icon = '🥨';

          ctx.fillText(icon, node.x, node.y + 1);
        }
      }
    });
  }

  // Render Active Emergency Location
  if (
    window.APP_ROLE === 'management' &&
    window.activeEmergencies &&
    window.activeEmergencies.length > 0
  ) {
    window.activeEmergencies.forEach((em) => {
      if (em.status !== 'active') return;
      const emNode = Object.values(stadiumGraph.nodes).find((n) => n.name === em.location);
      if (emNode) {
        const blinkVal = Math.abs(Math.sin(Date.now() / 600)); // Slower blink rate
        ctx.fillStyle = `rgba(239, 68, 68, ${0.4 + blinkVal * 0.4})`; // Red pulse
        ctx.beginPath();
        ctx.arc(emNode.x, emNode.y, 20 + blinkVal * 15, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = `rgba(239, 68, 68, ${0.8 + blinkVal * 0.2})`;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠️', emNode.x, emNode.y);
      }
    });
  }

  ctx.restore(); // inner
  ctx.restore(); // outer dpr
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// ==========================================
// ==========================================
// DIJKSTRA PATHFINDING & ROUTING
// ==========================================
const navPanel = document.getElementById('nav-panel');
const startSelect = document.getElementById('nav-start');
const endSelect = document.getElementById('nav-end');
// Removed routeLayer

function populateNavDropdowns() {
  if (startSelect.options.length === 0) {
    const nodes = Object.values(stadiumGraph.nodes).sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach((n) => {
      startSelect.add(new Option(n.name, n.id));
      endSelect.add(new Option(n.name, n.id));
    });
  }
}

document.getElementById('btn-nav').addEventListener('click', () => {
  navPanel.classList.toggle('hidden');
  populateNavDropdowns();
});

document.getElementById('btn-find-route').addEventListener('click', () => {
  const startId = startSelect.value;
  const endId = endSelect.value;

  if (startId === endId) return;

  const status = document.getElementById('nav-status');
  status.classList.remove('hidden');

  setTimeout(() => {
    const primaryPath = calculateRoute(startId, endId);

    let altPath = [];
    if (primaryPath.length > 2) {
      const midIdx = Math.floor(primaryPath.length / 2);
      altPath = calculateRoute(startId, endId, [
        { a: primaryPath[midIdx], b: primaryPath[midIdx + 1] },
      ]);
    }

    renderRouteUI(primaryPath, altPath);

    // Draw Path
    activeRoute = primaryPath;
    requestRender();

    status.classList.add('hidden');
  }, 50);
});

function calculateRoute(startId, endId, skipEdges = []) {
  const adj = {};
  const routeMode = document.getElementById('nav-mode')
    ? document.getElementById('nav-mode').value
    : 'balanced';

  stadiumGraph.edges.forEach((e) => {
    if (skipEdges.some((se) => (se.a === e.a && se.b === e.b) || (se.a === e.b && se.b === e.a)))
      return;
    if (routeMode === 'wheelchair' && e.requiresStairs) return;

    if (!adj[e.a]) adj[e.a] = [];

    let densityWeight = 0;
    let queueWeight = 0;

    if (window.stadiumSim) {
      const nodeB = stadiumGraph.nodes[e.b];
      if (nodeB && nodeB.level === 'gate' && window.stadiumSim.entryGates.has(e.b)) {
        queueWeight = window.stadiumSim.entryGates.get(e.b).queueLength;
      } else if (nodeB && nodeB.level !== 'gate' && window.stadiumSim.sections.has(e.b)) {
        densityWeight = window.stadiumSim.sections.get(e.b).occupancyRate * 100;
      }
    }

    let weight = e.dist;
    switch (routeMode) {
    case 'fastest':
      weight = e.dist * 0.7 + queueWeight * 0.3;
      break;
    case 'least_crowded':
      weight = e.dist * 0.2 + densityWeight * 0.8;
      break;
    case 'safest':
      weight = densityWeight > 80 ? e.dist * 100 : e.dist * 0.5 + densityWeight * 0.5;
      break;
    case 'wheelchair':
      weight = e.dist * 0.6 + densityWeight * 0.4;
      break;
    case 'balanced':
    default:
      weight = e.dist * 0.25 + densityWeight * 0.35 + queueWeight * 0.2 + densityWeight * 0.2;
    }
    adj[e.a].push({ node: e.b, weight: weight });
  });

  const dist = {};
  const prev = {};
  const q = new Set(Object.keys(stadiumGraph.nodes));

  q.forEach((n) => (dist[n] = Infinity));
  dist[startId] = 0;

  while (q.size > 0) {
    let u = null;
    for (const n of q) {
      if (!u || dist[n] < dist[u]) u = n;
    }

    if (dist[u] === Infinity || u === endId) break;
    q.delete(u);

    if (adj[u]) {
      adj[u].forEach((neighbor) => {
        if (q.has(neighbor.node)) {
          const alt = dist[u] + neighbor.weight;
          if (alt < dist[neighbor.node]) {
            dist[neighbor.node] = alt;
            prev[neighbor.node] = u;
          }
        }
      });
    }
  }

  const path = [];
  let curr = endId;
  if (prev[curr] || curr === startId) {
    while (curr) {
      path.unshift(curr);
      curr = prev[curr];
    }
  }
  return path;
}

function renderRouteUI(path, altPath) {
  const stepsContainer = document.getElementById('nav-steps-container');
  const stepsList = document.getElementById('nav-steps');
  stepsList.innerHTML = '';

  if (path.length > 0) {
    stepsContainer.classList.remove('hidden');
    const steps = [];
    const lang = 'en';

    // Travel time estimation (rough logic based on edges + queue length)
    const travelTimeMin = Math.max(1, Math.floor(path.length * 1.5));

    steps.push(`<div class="mb-3 p-2 bg-slate-800 border border-slate-700 rounded text-xs">
          <div class="text-sky-400 font-bold mb-1">Primary Route (~${travelTimeMin} min)</div>
          <div class="text-slate-300">Using selected routing mode.</div>
        </div>`);

    steps.push(
      `<li class="flex gap-2"><span>📍</span> <span data-i18n-dyn="true">${uiDict.stepStartAt[lang]} <b>${stadiumGraph.nodes[path[0]].name}</b></span></li>`
    );

    for (let i = 0; i < path.length - 1; i++) {
      const curr = stadiumGraph.nodes[path[i]];
      const next = stadiumGraph.nodes[path[i + 1]];

      if (curr.level !== next.level) {
        if (curr.level === 'gate') {
          steps.push(
            `<li class="flex gap-2"><span>🚶</span> <span data-i18n-dyn="true">${uiDict.stepEnterGate[lang]} <b>${next.name}</b></span></li>`
          );
        } else if (next.level === 'gate') {
          steps.push(
            `<li class="flex gap-2"><span>🚶</span> <span data-i18n-dyn="true">${uiDict.stepExitGate[lang]} <b>${next.name}</b></span></li>`
          );
        } else {
          steps.push(
            `<li class="flex gap-2"><span>🪜</span> <span data-i18n-dyn="true">${uiDict.stepStairs[lang]} <b>${next.name}</b></span></li>`
          );
        }
      } else {
        // Detailed section listing
        let walkEndIdx = i + 1;
        const passedSections = [];
        while (
          walkEndIdx + 1 < path.length &&
          stadiumGraph.nodes[path[walkEndIdx + 1]].level === curr.level
        ) {
          passedSections.push(
            stadiumGraph.nodes[path[walkEndIdx]].name.replace('Section ', '').replace('Suite ', '')
          );
          walkEndIdx++;
        }
        const walkEnd = stadiumGraph.nodes[path[walkEndIdx]];
        if (passedSections.length > 0) {
          const entityType = curr.level.includes('Suite')
            ? uiDict.stepWalkPastSuites[lang]
            : uiDict.stepWalkPastSections[lang];
          steps.push(
            `<li class="flex gap-2"><span>🚶</span> <span data-i18n-dyn="true">${uiDict.stepWalkPast[lang]} ${entityType} ${passedSections.join(', ')} ${uiDict.stepToReach[lang]} <b>${walkEnd.name}</b></span></li>`
          );
        } else {
          steps.push(
            `<li class="flex gap-2"><span>🚶</span> <span data-i18n-dyn="true">${uiDict.stepWalkTo[lang]} <b>${walkEnd.name}</b></span></li>`
          );
        }
        i = walkEndIdx - 1;
      }
    }

    steps.push(
      `<li class="flex gap-2 text-emerald-400"><span>🏁</span> <span data-i18n-dyn="true">${uiDict.stepArrive[lang]} <b>${stadiumGraph.nodes[path[path.length - 1]].name}</b></span></li>`
    );

    if (altPath && altPath.length > 0) {
      const altTravelTime = Math.max(1, Math.floor(altPath.length * 1.5)) + 2; // slightly longer
      steps.push(`<div class="mt-4 p-2 bg-slate-900 border border-slate-700 rounded text-xs opacity-75 hover:opacity-100 transition-opacity cursor-pointer">
             <div class="text-amber-400 font-bold mb-1">Alternative Route (~${altTravelTime} min)</div>
             <div class="text-slate-400">Avoids center bottlenecks.</div>
           </div>`);
    }

    stepsList.innerHTML = DOMPurify.sanitize(steps.join(''));
    translateDynamicNodes(stepsList);
  } else {
    stepsContainer.classList.add('hidden');
  }
}
// AI CHAT LOGIC
// ==========================================
const chatPanel = document.getElementById('chat-panel');
const chatHistory = document.getElementById('chat-history');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

document.getElementById('btn-chat').addEventListener('click', () => {
  chatPanel.classList.toggle('translate-x-full');
  if (!chatPanel.classList.contains('translate-x-full')) {
    setTimeout(() => chatInput.focus(), 300);
  }
});

// Sim Panel Toggle
document.getElementById('btn-sim').addEventListener('click', () => {
  const panel = document.getElementById('sim-debug-panel');
  panel.classList.toggle('hidden');
  requestRender(); // Ensure render loop is active to pick up colors
});

// Sim Phase Listeners
const simBtns = {
  pre_match: document.getElementById('sim-phase-pre'),
  during_match: document.getElementById('sim-phase-during'),
  post_match: document.getElementById('sim-phase-post'),
};

function updateSimPhaseUI(phase) {
  Object.values(simBtns).forEach((b) => {
    b.classList.remove('bg-amber-500/20', 'border-amber-500', 'text-amber-400');
    b.classList.add('border-slate-700');
  });
  if (simBtns[phase]) {
    simBtns[phase].classList.add('bg-amber-500/20', 'border-amber-500', 'text-amber-400');
    simBtns[phase].classList.remove('border-slate-700');
  }

  if (typeof window.stadiumSim !== 'undefined') {
    window.stadiumSim.setPhase(phase);
    requestRender();
  }
}

simBtns['pre_match'].addEventListener('click', () => updateSimPhaseUI('pre_match'));
simBtns['during_match'].addEventListener('click', () => updateSimPhaseUI('during_match'));
simBtns['post_match'].addEventListener('click', () => updateSimPhaseUI('post_match'));

const simToggleBtn = document.getElementById('sim-toggle-btn');
if (simToggleBtn) {
  simToggleBtn.addEventListener('click', () => {
    if (window.stadiumSim) {
      if (window.stadiumSim.isRunning) {
        window.stadiumSim.stop();
        simToggleBtn.textContent = 'Start Simulation';
        simToggleBtn.classList.remove(
          'bg-red-500/20',
          'hover:bg-red-500/30',
          'text-red-400',
          'border-red-500/50'
        );
        simToggleBtn.classList.add(
          'bg-amber-500/20',
          'hover:bg-amber-500/30',
          'text-amber-400',
          'border-amber-500/50'
        );
      } else {
        window.stadiumSim.start();
        simToggleBtn.textContent = 'Stop Simulation';
        simToggleBtn.classList.remove(
          'bg-amber-500/20',
          'hover:bg-amber-500/30',
          'text-amber-400',
          'border-amber-500/50'
        );
        simToggleBtn.classList.add(
          'bg-red-500/20',
          'hover:bg-red-500/30',
          'text-red-400',
          'border-red-500/50'
        );
      }
    }
  });
}

// Interval to update sim live stats panel (every 1s is enough, sim runs every 5s)
setInterval(() => {
  if (
    typeof window.stadiumSim !== 'undefined' &&
    !document.getElementById('sim-debug-panel').classList.contains('hidden')
  ) {
    const s = window.stadiumSim;

    if (!s.isRunning) {
      document.getElementById('sim-live-stats').innerHTML = DOMPurify.sanitize(`
                <div class="p-3 text-center rounded bg-sky-900/20 border border-sky-500/30 transition-opacity duration-1000">
                  <span class="text-sky-400 font-medium uppercase text-[10px] tracking-widest">PLEASE TURN ON SIMULATION TO CONNECT TO LIVE DATA TO USE OPERATIONS</span>
                </div>
              `);
      return;
    }

    let html = `<div class="text-[10px] text-slate-500 mb-1 border-b border-slate-800 pb-1">TICK: ${s.tickCount} | PHASE: ${s.phase}</div>`;
    html += '<div class="grid grid-cols-2 gap-x-2 gap-y-1 mt-2">';

    // Combine entry and exit gates, making sure we don't duplicate names if they share ids
    const gatesList = [...s.entryGates.values(), ...s.exitGates.values()];
    const uniqueGates = new Map();
    gatesList.forEach((g) => uniqueGates.set(g.name, g));

    Array.from(uniqueGates.values()).forEach((g) => {
      html += `<div>${g.name.replace('Gate', '').trim()}: <span class="${g.density > 0.7 ? 'text-red-400 font-bold' : 'text-emerald-400'}">Q:${g.queueLength}</span> <span class="text-slate-500 ml-1">F:${Math.floor(g.occupancy)}/m</span></div>`;
    });
    html += '</div>';
    document.getElementById('sim-live-stats').innerHTML = DOMPurify.sanitize(html);

    // Re-render canvas to show breathing heatmap colors
    requestRender();
  }
}, 1000);

// Default initial selection
updateSimPhaseUI('pre_match');

// SUSTAINABILITY METRICS
// ==========================================
const SUSTAINABILITY_METRICS = {
  smartBins: {
    label: 'Smart Bin Recyclables',
    baseline: 42,
    unit: '%',
    warningThreshold: 75,
    criticalThreshold: 90,
    icon: 'recycle',
  },
  solarGrid: { label: 'Solar Energy Output', baseline: 68, unit: 'kW', max: 150, icon: 'sun' },
  waterUsage: {
    label: 'Water Consumption',
    baseline: 35,
    unit: 'kL',
    max: 100,
    warningThreshold: 70,
    icon: 'droplets',
  },
  carbonOffset: {
    label: 'Carbon Offset',
    baseline: 2.4,
    unit: 'tons CO₂',
    target: 5.0,
    icon: 'leaf',
  },
};

window.renderSustainability = function () {
  const sustainEl = document.getElementById('ci-sustainability');
  if (sustainEl && typeof SUSTAINABILITY_METRICS !== 'undefined') {
    const sm = SUSTAINABILITY_METRICS;
    const fluctuatedGrid = Math.min(
      sm.solarGrid.max,
      Math.max(0, sm.solarGrid.baseline + (Math.random() * 4 - 2))
    );
    const fluctuatedWater = Math.min(
      sm.waterUsage.max,
      Math.max(0, sm.waterUsage.baseline + (Math.random() * 2 - 1))
    );

    sustainEl.innerHTML = DOMPurify.sanitize(`
          <div class="p-3 bg-slate-800/50 rounded border border-emerald-500/30 shadow-sm">
            <div class="flex justify-between items-center mb-2">
              <div class="flex items-center gap-2 text-sm text-slate-200 font-bold">
                 <i data-lucide="recycle" class="w-4 h-4 text-emerald-400"></i>
                 <span>${sm.smartBins.label}</span>
              </div>
              <div class="font-mono text-sm font-bold text-emerald-400">${sm.smartBins.baseline}${sm.smartBins.unit}</div>
            </div>
            <div class="w-full bg-slate-900 rounded-full h-2 mt-1 border border-slate-700 overflow-hidden">
              <div class="bg-emerald-500 h-2 rounded-full" style="width: ${sm.smartBins.baseline}%"></div>
            </div>
          </div>
          
          <div class="p-3 bg-slate-800/50 rounded border border-amber-500/30 shadow-sm">
            <div class="flex justify-between items-center mb-2">
              <div class="flex items-center gap-2 text-sm text-slate-200 font-bold">
                 <i data-lucide="sun" class="w-4 h-4 text-amber-400"></i>
                 <span>${sm.solarGrid.label}</span>
              </div>
              <div class="font-mono text-sm font-bold text-amber-400">${fluctuatedGrid.toFixed(1)} ${sm.solarGrid.unit}</div>
            </div>
            <div class="w-full bg-slate-900 rounded-full h-2 mt-1 border border-slate-700 overflow-hidden">
              <div class="bg-amber-500 h-2 rounded-full" style="width: ${(fluctuatedGrid / sm.solarGrid.max) * 100}%"></div>
            </div>
          </div>
          
          <div class="p-3 bg-slate-800/50 rounded border border-blue-500/30 shadow-sm">
            <div class="flex justify-between items-center mb-2">
              <div class="flex items-center gap-2 text-sm text-slate-200 font-bold">
                 <i data-lucide="droplets" class="w-4 h-4 text-blue-400"></i>
                 <span>${sm.waterUsage.label}</span>
              </div>
              <div class="font-mono text-sm font-bold text-blue-400">${fluctuatedWater.toFixed(1)} ${sm.waterUsage.unit}</div>
            </div>
            <div class="w-full bg-slate-900 rounded-full h-2 mt-1 border border-slate-700 overflow-hidden">
              <div class="bg-blue-500 h-2 rounded-full" style="width: ${(fluctuatedWater / sm.waterUsage.max) * 100}%"></div>
            </div>
          </div>
          
          <div class="p-3 bg-slate-800/50 rounded border border-green-500/30 shadow-sm">
            <div class="flex justify-between items-center mb-2">
              <div class="flex items-center gap-2 text-sm text-slate-200 font-bold">
                 <i data-lucide="leaf" class="w-4 h-4 text-green-400"></i>
                 <span>${sm.carbonOffset.label}</span>
              </div>
              <div class="font-mono text-sm font-bold text-green-400">${sm.carbonOffset.baseline.toFixed(2)} ${sm.carbonOffset.unit}</div>
            </div>
            <div class="w-full bg-slate-900 rounded-full h-2 mt-1 border border-slate-700 overflow-hidden">
              <div class="bg-green-500 h-2 rounded-full" style="width: ${(sm.carbonOffset.baseline / sm.carbonOffset.target) * 100}%"></div>
            </div>
          </div>
        `);
    if (window.lucide) window.lucide.createIcons();
  }
};

// Initial render so the panel isn't completely empty before simulation ticks
document.addEventListener('DOMContentLoaded', () => {
  window.renderSustainability();
});

// FOOD STALLS LOGIC
// ==========================================
window.FOOD_STALLS = [
  {
    id: 'fs_shahs_halal',
    name: "Shah's Halal",
    section: 'sec-126',
    category: 'Halal',
    tags: ['halal', 'dairy-free', 'nut-free'],
    waitTimeMin: 8,
    description: 'Halal Chicken, Beef, and Falafel Gyros and Platters.',
  },
  {
    id: 'fs_kosher_grill',
    name: 'Kosher Stand',
    section: 'sec-123',
    category: 'Kosher',
    tags: ['kosher', 'dairy-free', 'nut-free'],
    waitTimeMin: 5,
    description: 'Kosher Hot Dogs, Pretzels, Chicken Nuggets, and Knish.',
  },
  {
    id: 'fs_petite_greens',
    name: 'Petite Greens',
    section: 'sec-144',
    category: 'Healthy/Salads',
    tags: ['vegetarian', 'gluten-free', 'vegan'],
    waitTimeMin: 4,
    description:
      'Chop Salad, Veggie Wraps, Quinoa Bowls, and Fruit Cups. Gluten Free options available.',
  },
  {
    id: 'fs_tacos_raqueros',
    name: 'Taco’s Raqueros',
    section: 'sec-217',
    category: 'Mexican',
    tags: ['vegetarian'],
    waitTimeMin: 12,
    description: 'Tacos, Burritos (Chicken, Beef, Pork, Veggie), Rice & Beans, Loaded Nachos.',
  },
  {
    id: 'fs_pattys_burger',
    name: "Patty's Burger",
    section: 'sec-106',
    category: 'Grill',
    tags: ['gluten-free', 'nut-free'],
    waitTimeMin: 15,
    description:
      'Classic Burgers, Chicken Tender Basket, and Hot Dogs. Gluten Free Buns available upon request.',
  },
  {
    id: 'fs_boardwalk_fryer',
    name: 'Boardwalk Fryer',
    section: 'sec-135',
    category: 'Traditional',
    tags: ['nut-free'],
    waitTimeMin: 10,
    description: 'Chicken Tender Basket, Fried Clams, Thumann’s Hot Dogs, Fries, Cheese Fries.',
  },
  {
    id: 'fs_fuku_chicken',
    name: 'Fuku Chicken Sando',
    section: 'sec-330',
    category: 'Chicken',
    tags: ['nut-free'],
    waitTimeMin: 18,
    description: 'Fuku Spicy Chicken Sando, Fuku Fingers & Fries.',
  },
  {
    id: 'fs_nonna_fusco',
    name: 'Nonna Fusco’s Kitchen',
    section: 'sec-118',
    category: 'Italian',
    tags: ['nut-free'],
    waitTimeMin: 14,
    description: 'Meatball Sandwich, Chicken Cutlet Sandwich, Fresh Pasta Options, and Zeppoles.',
  },
  {
    id: 'fs_mr_tot',
    name: 'Mr. Tot',
    section: 'sec-339',
    category: 'Snacks',
    tags: ['vegetarian', 'nut-free'],
    waitTimeMin: 6,
    description: 'Loaded Tots, Burnt Ends Chili Tots. Vegetarian options available.',
  },
  {
    id: 'fs_mrs_fields',
    name: 'Mrs. Fields',
    section: 'sec-103',
    category: 'Dessert',
    tags: ['vegetarian'],
    waitTimeMin: 3,
    description: 'Freshly baked Cookies and Brownies.',
  },
  {
    id: 'fs_fresh_fruit',
    name: 'Fresh Fruit Grab & Go',
    section: 'sec-116',
    category: 'Snacks',
    tags: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'kosher', 'halal'],
    waitTimeMin: 1,
    description: 'Fresh fruit cups and light snacks.',
  },
  {
    id: 'fs_premio_sausage',
    name: 'Premio Sausage',
    section: 'sec-215',
    category: 'Grill',
    tags: ['gluten-free'],
    waitTimeMin: 9,
    description: 'Premio Sausage Sandwich. Gluten Free buns available.',
  },
];

const foodPanel = document.getElementById('food-panel');
const foodListContainer = document.getElementById('food-list');
const filterBtns = document.querySelectorAll('.food-filter-btn');
const activeFoodFilters = new Set();

document.getElementById('btn-food').addEventListener('click', () => {
  foodPanel.classList.toggle('translate-x-full');
  if (!foodPanel.classList.contains('translate-x-full')) {
    renderFoodStalls();
  }
  requestRender();
});

filterBtns.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const tag = e.target.getAttribute('data-tag');
    if (activeFoodFilters.has(tag)) {
      activeFoodFilters.delete(tag);
      e.target.classList.remove('bg-sky-500', 'text-white', 'border-sky-500');
      e.target.classList.add('bg-slate-800', 'text-slate-300', 'border-slate-700');
    } else {
      activeFoodFilters.add(tag);
      e.target.classList.add('bg-sky-500', 'text-white', 'border-sky-500');
      e.target.classList.remove('bg-slate-800', 'text-slate-300', 'border-slate-700');
    }
    renderFoodStalls();
    requestRender();
  });
});

let foodStallsRendered = false;
function renderFoodStalls() {
  if (!window.FOOD_STALLS) return; // Ensure stadiumData is loaded

  if (!foodStallsRendered) {
    foodListContainer.innerHTML = '';
    window.FOOD_STALLS.forEach((stall) => {
      const div = document.createElement('div');
      div.className = 'food-stall-item bg-slate-800/50 border border-slate-700 rounded-lg p-4';
      div.setAttribute('data-tags', stall.tags.join(','));

      const tagsHtml = stall.tags
        .map(
          (t) =>
            `<span class="text-[9px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/30" data-i18n-dyn="true">${t}</span>`
        )
        .join('');
      const sectionDisplay = stall.section.replace('sec-', '');

      div.innerHTML = DOMPurify.sanitize(`
            <div class="flex justify-between items-start mb-2">
              <div>
                <div class="font-bold text-slate-200" data-i18n-dyn="true">${stall.name}</div>
                <div class="text-[10px] text-slate-500 uppercase tracking-wider" data-i18n-dyn="true">${stall.category} • Sec ${sectionDisplay}</div>
              </div>
              <div class="text-[10px] bg-slate-900 text-amber-400 px-2 py-1 rounded font-mono" data-i18n-dyn="true">~${stall.waitTimeMin}m wait</div>
            </div>
            <p class="text-xs text-slate-400 mb-3" data-i18n-dyn="true">${stall.description}</p>
            <div class="flex flex-wrap gap-1 mb-3">
              ${tagsHtml}
            </div>
            <button class="w-full py-1.5 bg-sky-500/20 hover:bg-sky-500/40 border border-sky-500/50 text-sky-400 font-bold rounded transition-colors text-xs" onclick="navigateFromFood('${stall.section}')" data-i18n-dyn="true">
              Take Me There
            </button>
          `);
      foodListContainer.appendChild(div);
    });

    const noResults = document.createElement('div');
    noResults.id = 'food-no-results';
    noResults.className = 'text-xs text-slate-500 text-center py-4 hidden';
    noResults.setAttribute('data-i18n-dyn', 'true');
    noResults.textContent = 'No food stalls match your selected dietary restrictions.';
    foodListContainer.appendChild(noResults);

    translateDynamicNodes(foodListContainer);
    foodStallsRendered = true;
  }

  let visibleCount = 0;
  document.querySelectorAll('.food-stall-item').forEach((el) => {
    const stallTags = el.getAttribute('data-tags').split(',');
    let match = true;
    if (activeFoodFilters.size > 0) {
      for (const filter of activeFoodFilters) {
        if (!stallTags.includes(filter)) match = false;
      }
    }
    if (match) {
      el.style.display = 'block';
      visibleCount++;
    } else {
      el.style.display = 'none';
    }
  });

  const noResEl = document.getElementById('food-no-results');
  if (noResEl) noResEl.style.display = visibleCount === 0 ? 'block' : 'none';
}

window.navigateFromFood = function (sectionId) {
  // Close food panel
  foodPanel.classList.add('translate-x-full');
  // Open nav panel
  const navPanelObj = document.getElementById('nav-panel');
  navPanelObj.classList.remove('hidden');

  // Ensure nav dropdowns are populated before setting value!
  if (typeof populateNavDropdowns === 'function') {
    populateNavDropdowns();
  }

  // Set destination
  const navEnd = document.getElementById('nav-end');
  if (navEnd) {
    navEnd.value = sectionId;
    // Trigger calculation
    document.getElementById('btn-find-route').click();
  }
};

function addUserMessage(text) {
  const msg = document.createElement('div');
  msg.className =
    'self-end bg-sky-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[85%] shadow-md whitespace-pre-wrap';
  msg.textContent = text;
  chatHistory.appendChild(msg);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function addAiMessage(text, isHTML = false) {
  const msg = document.createElement('div');
  msg.className =
    'self-start bg-slate-800 text-slate-200 border border-slate-700 px-4 py-2 rounded-2xl rounded-tl-sm max-w-[85%] shadow-md leading-relaxed';
  if (isHTML) {
    msg.innerHTML = DOMPurify.sanitize(text);
    // Only re-init icons if the message actually contains lucide data-lucide attributes
    if (text.includes('data-lucide')) lucide.createIcons();
  } else msg.textContent = text;
  chatHistory.appendChild(msg);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

let typingEl = null; // Reuse typing indicator element
function showTyping() {
  removeTyping(); // Ensure clean state
  typingEl = document.createElement('div');
  typingEl.id = 'typing-indicator';
  typingEl.className =
    'self-start bg-slate-800 text-slate-400 border border-slate-700 px-4 py-3 rounded-2xl rounded-tl-sm max-w-[85%] flex gap-1.5 items-center';
  typingEl.innerHTML = DOMPurify.sanitize(
    '<div class="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div><div class="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style="animation-delay: 0.15s"></div><div class="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style="animation-delay: 0.3s"></div>'
  );
  chatHistory.appendChild(typingEl);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function removeTyping() {
  if (typingEl && typingEl.parentNode) {
    typingEl.remove();
    typingEl = null;
  }
}

const aiResponseCache = new Map([
  [
    'lost fan looking for a seat.',
    {
      message:
        "Don't worry, I can help you find your seat! If you know your section number, I can map the shortest route from your current location. If you need immediate assistance, please head to the nearest Guest Services booth at Section 124.",
      action: { type: 'route', startId: 'gate-amex', destId: 'sec-124' },
    },
  ],
  [
    'wheelchair user needing an accessible route.',
    {
      message:
        'FANSPHERE is fully ADA accessible. I have mapped a route using the concourse elevators from the Verizon Gate to the ADA seating area at Section 139. Elevators are located at all VIP entrances.',
      action: { type: 'route', startId: 'gate-verizon', destId: 'sec-139' },
    },
  ],
  [
    'spanish-speaking fan asking for halal food.',
    {
      message:
        "¡Hola! Las mejores opciones de comida Halal se encuentran en el carrito 'Halal Guys', ubicado en el nivel 100, cerca de la Sección 118. He trazado la ruta más rápida desde la puerta principal para ti.",
      action: { type: 'route', startId: 'gate-amex', destId: 'sec-118' },
    },
  ],
  [
    'medical emergency.',
    {
      message:
        "<b class='text-red-500'>If this is a life-threatening emergency, please call 911 immediately.</b><br>For stadium medical assistance, First Aid stations are located on every level. I have routed you to the nearest First Aid station at Section 103.",
      action: { type: 'route', startId: 'gate-amex', destId: 'sec-103' },
    },
  ],
  [
    'parking reroute after the match.',
    {
      message:
        "Post-match traffic is currently heavy near the HCLTech Gate. I recommend exiting through the Moody's Gate to access Parking Lots F and G for a faster departure. I've routed you there.",
      action: { type: 'route', startId: 'sec-110', destId: 'gate-moodys' },
    },
  ],
]);

async function processAiResponse(query) {
  const lang = window.uiLang || 'en';
  const normalizedQuery = query.toLowerCase().trim();

  // 1. INTENT ROUTER - CACHE LAYER
  if (aiResponseCache.has(normalizedQuery)) {
    const cached = aiResponseCache.get(normalizedQuery);
    removeTyping();
    if (cached.action && cached.action.type === 'route') {
      populateNavDropdowns();
      document.getElementById('nav-start').value = cached.action.startId;
      document.getElementById('nav-end').value = cached.action.destId;
      document.getElementById('btn-find-route').click();
    }
    addAiMessage(cached.message, true);
    return;
  }

  if (!GROQ_API_KEY || GROQ_API_KEY === 'YOUR_GROQ_API_KEY') {
    removeTyping();
    addAiMessage(
      'Please add your Groq API Key to the index.html source code to enable the AI Assistant.',
      true
    );
    return;
  }

  // 2. INTENT ROUTER - LLM FUNCTION CALLING
  const nodeContext = Object.values(stadiumGraph.nodes)
    .map((n) => `'${n.id}': ${n.name}`)
    .join(', ');
  const systemPrompt = `You are the intelligent backend of a smart stadium platform that powers the entire application, including navigation, crowd management, multilingual support, accessibility, transportation, recommendations, and the in-app AI assistant.

**CRITICAL LANGUAGE DIRECTIVE**
The user is viewing the stadium in language: ${lang}. 
YOU MUST RESPOND TO THE USER IN ${lang}. This is non-negotiable.

**Objective**
Deliver fast, context-aware, real-time responses and services while minimizing latency across all application features.

**Performance & Rules**
- Priority: Speed without sacrificing accuracy.
- Maintain a shared context across all app modules so navigation, crowd analytics, transportation, accessibility, and the AI assistant access the same state.
- Detect the user's preferred language once per session and reuse it throughout the application.
- Cache frequently accessed data such as translations, routes, venue information, amenities, event schedules, and FAQs.
- Precompute likely user actions such as nearby amenities, exits, parking, and routes based on current location.
- Execute independent tasks in parallel whenever possible, including route computation, crowd analysis, translation, and recommendation generation.
- Only process data relevant to the user's current location, destination, and request.
- Avoid recomputing routes or translations unless the user's location, destination, or surrounding conditions change.
- Use lightweight responses for routine requests and reserve advanced reasoning only for complex queries.
- Stream partial results immediately while background services continue processing.
- Reuse previous conversation and application context instead of rebuilding it for every request.
- Prioritize local or cached information before invoking external services.
- Maintain sub-second response times for common interactions whenever possible.

**Shared Context**
- Available Nodes: ${nodeContext}
- Crowd Level: Dynamic via heatmap
- User Location / Destination: Auto-detect based on query

**Instructions**
Analyze the user's intent and invoke the appropriate tool to fulfill their request based on this context. 
ALWAYS respond in the user's language (${lang}). Ensure your tool parameters are also localized to ${lang}.`;

  const tools = [
    {
      type: 'function',
      function: {
        name: 'calculate_route',
        description:
          'Calculates the optimal walking route between two stadium locations. Use this when the user needs directions.',
        parameters: {
          type: 'object',
          properties: {
            startId: {
              type: 'string',
              description:
                "The ID of the starting node (e.g. gate-amex, sec-120). If the user didn't specify a start, default to 'auto'.",
            },
            destId: { type: 'string', description: 'The ID of the destination node.' },
            naturalResponse: {
              type: 'string',
              description:
                "A conversational explanation of the route, localized in the user's language. Format with HTML. E.g. 'I have mapped the closest entrance to your seat...'",
            },
          },
          required: ['startId', 'destId', 'naturalResponse'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'answer_general',
        description:
          'Answers general queries about the stadium, capacity, heatmap, or amenities when no routing is needed.',
        parameters: {
          type: 'object',
          properties: {
            naturalResponse: {
              type: 'string',
              description:
                "The conversational response to the query, localized in the user's language. Format with HTML.",
            },
          },
          required: ['naturalResponse'],
        },
      },
    },
  ];

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        tools: tools,
        tool_choice: 'auto',
      }),
    });

    const data = await response.json();
    removeTyping();

    if (data.error) throw new Error(data.error.message);

    const toolCalls = data.choices[0].message.tool_calls;
    const call = toolCalls && toolCalls.length > 0 ? toolCalls[0].function : null;

    if (call && call.name === 'calculate_route') {
      const args = JSON.parse(call.arguments);
      let finalStartId = args.startId;

      // Auto-calculate closest gate if unspecified
      if (finalStartId === 'auto' || !stadiumGraph.nodes[finalStartId]) {
        const gates = ['gate-amex', 'gate-hcl', 'gate-verizon', 'gate-fansphere', 'gate-moodys'];
        let bestGate = 'gate-amex';
        let minAvgDist = Infinity;
        const destNode = stadiumGraph.nodes[args.destId];

        if (destNode) {
          gates.forEach((g) => {
            const gateNode = stadiumGraph.nodes[g];
            const dist = Math.hypot(gateNode.x - destNode.x, gateNode.y - destNode.y);
            if (dist < minAvgDist) {
              minAvgDist = dist;
              bestGate = g;
            }
          });
        }
        finalStartId = bestGate;
      }

      if (stadiumGraph.nodes[finalStartId] && stadiumGraph.nodes[args.destId]) {
        populateNavDropdowns();
        document.getElementById('nav-start').value = finalStartId;
        document.getElementById('nav-end').value = args.destId;
        document.getElementById('btn-find-route').click();
      }

      // Save to cache for next time
      aiResponseCache.set(normalizedQuery, {
        message: args.naturalResponse,
        action: { type: 'route', startId: finalStartId, destId: args.destId },
      });
      addAiMessage(args.naturalResponse, true);
    } else if (call && call.name === 'answer_general') {
      const args = JSON.parse(call.arguments);
      // Save to cache
      aiResponseCache.set(normalizedQuery, { message: args.naturalResponse });
      addAiMessage(args.naturalResponse, true);
    } else {
      // Groq might just return standard content if it decides not to use a tool
      const textResponse = data.choices[0].message.content;
      if (textResponse) {
        addAiMessage(textResponse, true);
      } else {
        addAiMessage("I couldn't quite understand that. Could you rephrase your request?", true);
      }
    }
  } catch (err) {
    console.error('Gemini API Error:', err);
    removeTyping();

    // 3. INTENT ROUTER - OFFLINE FALLBACK
    const q = query.toLowerCase();
    let mentionedNodes = [];
    Object.values(stadiumGraph.nodes).forEach((n) => {
      const nameLower = n.name.toLowerCase();
      const numMatch = n.level !== 'gate' ? n.name.match(/\d{2,3}/) : null;
      let idx = q.indexOf(nameLower);
      if (idx === -1 && numMatch && q.match(new RegExp(`\\b${numMatch[0]}\\b`)))
        idx = q.search(new RegExp(`\\b${numMatch[0]}\\b`));
      if (idx > -1) mentionedNodes.push({ id: n.id, idx });
    });
    mentionedNodes.sort((a, b) => a.idx - b.idx);
    mentionedNodes = mentionedNodes.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);

    if (mentionedNodes.length > 0) {
      let startId = 'gate-amex';
      let destId = mentionedNodes[0].id;
      if (mentionedNodes.length >= 2) {
        startId = mentionedNodes[0].id;
        destId = mentionedNodes[mentionedNodes.length - 1].id;
      }
      if (stadiumGraph.nodes[startId] && stadiumGraph.nodes[destId]) {
        populateNavDropdowns();
        document.getElementById('nav-start').value = startId;
        document.getElementById('nav-end').value = destId;
        document.getElementById('btn-find-route').click();
        addAiMessage(
          `(API Limit Reached - Offline Fallback Route) I have calculated the path from <b>${stadiumGraph.nodes[startId].name}</b> to <b>${stadiumGraph.nodes[destId].name}</b> for you!`,
          true
        );
        return;
      }
    }

    const dict = {
      route: {
        en: "Our <b class='text-sky-400'>Smart Routing System</b> uses Dijkstra's Algorithm.",
        es: "Nuestro <b class='text-sky-400'>Sistema de Rutas</b> usa el Algoritmo de Dijkstra.",
        fr: "Notre <b class='text-sky-400'>Système d'Itinéraire</b> utilise l'Algorithme de Dijkstra.",
      },
      seat: {
        en: "You can click on any section or VIP suite on the map to view a <b class='text-emerald-400'>drill-down</b>.",
        es: "Puedes hacer clic en cualquier sección o suite VIP para ver los <b class='text-emerald-400'>detalles</b>.",
        fr: "Vous pouvez cliquer sur n'importe quelle section ou suite VIP pour voir les <b class='text-emerald-400'>détails</b>.",
      },
      default: {
        en: "I'm experiencing high API traffic right now and hit my rate limit! However, I can still map basic routes if you name two sections, or you can ask about <b>routes</b> or <b>seats</b>.",
        es: '¡Estoy experimentando un alto tráfico de API en este momento! Sin embargo, todavía puedo mapear rutas básicas si nombras dos secciones.',
        fr: "Je rencontre actuellement un trafic élevé et j'ai atteint une limite d'API! Cependant, je peux toujours tracer des itinéraires de base.",
      },
    };

    let response = dict.default[lang] || dict.default.en;
    if (q.includes('route') || q.includes('path') || q.includes('ruta') || q.includes('chemin'))
      response = dict.route[lang] || dict.route.en;
    else if (
      q.includes('seat') ||
      q.includes('section') ||
      q.includes('asiento') ||
      q.includes('siège')
    )
      response = dict.seat[lang] || dict.seat.en;

    addAiMessage(response, true);
  }
}

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  addUserMessage(text);
  chatInput.value = '';

  setTimeout(showTyping, 300);
  processAiResponse(text);
});
