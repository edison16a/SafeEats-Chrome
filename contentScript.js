// ----------------------
// SafeEats – Content Script
// ----------------------

// Simple config of allergens and substitution rules.
// All logic is static and local – no external APIs.

const SAFE_EATS_SUBSTITUTIONS = {
  dairy: [
    {
      id: 'milk',
      match: /\b(whole|skim|2%|1%|cow's|cow’s)?\s*(milk)\b/i,
      replacement: 'unsweetened oat milk',
      ratio: 1,
      note: 'Use equal amount of oat milk.'
    },
    {
      id: 'butter',
      match: /\bbutter\b/i,
      replacement: 'neutral vegetable oil',
      ratio: 0.75,
      note: 'Use ~3/4 as much oil as butter.'
    },
    {
      id: 'cream',
      match: /\b(heavy|whipping)?\s*cream\b/i,
      replacement: 'full-fat coconut milk',
      ratio: 1,
      note: 'Use equal amount of coconut milk (flavor will differ).'
    },
    {
      id: 'cheese',
      match: /\b(cheddar|mozzarella|parmesan|cheese)\b/i,
      replacement: 'dairy-free cheese shreds',
      ratio: 1,
      note: 'Use a similar volume of dairy-free cheese.'
    },
    {
      id: 'yogurt',
      match: /\byogurt\b/i,
      replacement: 'plant-based yogurt',
      ratio: 1,
      note: 'Use equal amount of plant-based yogurt.'
    }
  ],
  eggs: [
    {
      id: 'egg',
      match: /\begg(s)?\b/i,
      replacement: 'ground flax + water “egg”',
      ratio: 1,
      note: 'Per egg: 1 tbsp ground flax + 3 tbsp water.'
    }
  ],
  gluten: [
    {
      id: 'all-purpose-flour',
      match: /\b(all[-\s]?purpose|plain|wheat)\s+flour\b/i,
      replacement: 'gluten-free all-purpose flour blend',
      ratio: 1,
      note: 'Use 1:1 gluten-free flour blend.'
    },
    {
      id: 'breadcrumbs',
      match: /\b(bread\s*crumbs|breadcrumbs)\b/i,
      replacement: 'gluten-free bread crumbs or crushed GF crackers',
      ratio: 1,
      note: 'Use a similar volume of gluten-free crumbs.'
    },
    {
      id: 'pasta',
      match: /\bpasta\b/i,
      replacement: 'gluten-free pasta',
      ratio: 1,
      note: 'Use equal cooked weight of gluten-free pasta.'
    }
  ],
  nuts: [
    {
      id: 'almonds',
      match: /\balmond(s)?\b/i,
      replacement: 'toasted pumpkin seeds (pepitas)',
      ratio: 1,
      note: 'Use a similar volume of pumpkin seeds.'
    },
    {
      id: 'walnuts',
      match: /\bwalnut(s)?\b/i,
      replacement: 'sunflower seeds',
      ratio: 1,
      note: 'Use equal volume of sunflower seeds.'
    },
    {
      id: 'nut-butter',
      match: /\b(almond|cashew|hazelnut)\s+butter\b/i,
      replacement: 'sunflower seed butter',
      ratio: 1,
      note: 'Use equal amount of sunflower seed butter.'
    }
  ],
  peanuts: [
    {
      id: 'peanut-butter',
      match: /\bpeanut\s+butter\b/i,
      replacement: 'sunflower seed butter',
      ratio: 1,
      note: 'Use equal amount of sunflower seed butter.'
    },
    {
      id: 'peanuts',
      match: /\bpeanut(s)?\b/i,
      replacement: 'roasted chickpeas or seeds',
      ratio: 1,
      note: 'Use similar volume of roasted chickpeas or seeds.'
    }
  ],
  soy: [
    {
      id: 'soy-milk',
      match: /\bsoy\s+milk\b/i,
      replacement: 'oat milk',
      ratio: 1,
      note: 'Use equal amount of oat milk.'
    },
    {
      id: 'soy-sauce',
      match: /\bsoy\s+sauce\b/i,
      replacement: 'coconut aminos (or tamari if gluten-free only)',
      ratio: 1,
      note: 'Use equal amount of coconut aminos.'
    },
    {
      id: 'tofu',
      match: /\btofu\b/i,
      replacement: 'chickpeas or white beans',
      ratio: 1,
      note: 'Use a similar cooked weight of beans.'
    }
  ],
  shellfish: [
    {
      id: 'shrimp',
      match: /\bshrimp\b/i,
      replacement: 'firm tofu cubes',
      ratio: 1,
      note: 'Use similar cooked weight of tofu.'
    },
    {
      id: 'crab',
      match: /\bcrab\b/i,
      replacement: 'hearts of palm',
      ratio: 1,
      note: 'Use similar volume of chopped hearts of palm.'
    }
  ],
  fish: [
    {
      id: 'fish',
      match: /\b(salmon|cod|tuna|white\s+fish|fish)\b/i,
      replacement: 'marinated chickpeas or tofu',
      ratio: 1,
      note: 'Use similar volume of plant-based protein.'
    }
  ],
  sesame: [
    {
      id: 'tahini',
      match: /\btahini\b/i,
      replacement: 'sunflower seed butter',
      ratio: 1,
      note: 'Use equal amount of sunflower seed butter.'
    },
    {
      id: 'sesame-seeds',
      match: /\bsesame\s+seed(s)?\b/i,
      replacement: 'hemp seeds or finely chopped pumpkin seeds',
      ratio: 1,
      note: 'Use similar volume of seeds.'
    }
  ]
};

const SAFE_EATS_UNITS = [
  'teaspoon', 'teaspoons', 'tsp', 'tablespoon', 'tablespoons', 'tbsp',
  'cup', 'cups', 'ml', 'milliliter', 'milliliters', 'l', 'liter', 'liters',
  'g', 'gram', 'grams', 'kg', 'kilogram', 'kilograms',
  'oz', 'ounce', 'ounces', 'lb', 'pound', 'pounds',
  'clove', 'cloves', 'slice', 'slices', 'can', 'cans',
  'stick', 'sticks', 'package', 'packages', 'pinch', 'pinches'
];

// Map common unicode fractions to decimal
const SAFE_EATS_UNICODE_FRACTIONS = {
  '¼': 0.25,
  '½': 0.5,
  '¾': 0.75,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875
};

let safeEatsState = {
  initialized: false,
  isRecipe: false,
  unsafeCount: 0,
  convertedCount: 0
};

function safeEatsNormalizeWhitespace(str) {
  return str.replace(/\s+/g, ' ').trim();
}

function safeEatsToFloat(qStr) {
  if (!qStr) return null;
  qStr = qStr.trim();

  // Replace unicode fractions
  Object.entries(SAFE_EATS_UNICODE_FRACTIONS).forEach(([k, v]) => {
    if (qStr.includes(k)) {
      qStr = qStr.replace(k, ` ${v}`);
    }
  });

  // e.g. "1 1/2"
  const mixedMatch = qStr.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseFloat(mixedMatch[1]);
    const num = parseFloat(mixedMatch[2]);
    const den = parseFloat(mixedMatch[3]) || 1;
    return whole + num / den;
  }

  const fracMatch = qStr.match(/^(\d+)\/(\d+)$/);
  if (fracMatch) {
    const num = parseFloat(fracMatch[1]);
    const den = parseFloat(fracMatch[2]) || 1;
    return num / den;
  }

  // Range like "1-2" or "1 – 2" → use the first
  const rangeMatch = qStr.match(/^(\d+(\.\d+)?)\s*[-–]\s*\d+(\.\d+)?$/);
  if (rangeMatch) {
    return parseFloat(rangeMatch[1]);
  }

  const num = parseFloat(qStr);
  return Number.isNaN(num) ? null : num;
}

function safeEatsFormatQuantity(num) {
  if (num == null) return '';

  const rounded = Math.round(num * 4) / 4; // to nearest 0.25
  const whole = Math.floor(rounded);
  const frac = rounded - whole;

  const fracMap = {
    0.25: '1/4',
    0.5: '1/2',
    0.75: '3/4',
    0.33: '1/3',
    0.66: '2/3'
  };

  let fracStr = '';
  const approx = Math.round(frac * 100) / 100;
  if (approx === 0) {
    return whole.toString();
  } else if (approx === 0.25) {
    fracStr = '1/4';
  } else if (approx === 0.5) {
    fracStr = '1/2';
  } else if (approx === 0.75) {
    fracStr = '3/4';
  } else if (approx >= 0.32 && approx <= 0.35) {
    fracStr = '1/3';
  } else if (approx >= 0.65 && approx <= 0.68) {
    fracStr = '2/3';
  } else {
    // fallback decimal with max 2 decimals
    return rounded.toString().replace(/\.00$/, '');
  }

  if (whole === 0) return fracStr;
  return `${whole} ${fracStr}`;
}

// Very simple ingredient parser: quantity + unit + description + notes
function safeEatsParseIngredient(text) {
  const cleaned = text
    .replace(/^[\-\u2022•\*\+]\s*/, '') // leading bullets
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = cleaned.split(' ');
  if (!tokens.length) {
    return {
      original: text,
      quantity: null,
      unit: '',
      name: cleaned,
      note: ''
    };
  }

  // Gather quantity tokens from the start
  const quantityTokens = [];
  let idx = 0;
  while (idx < tokens.length) {
    const t = tokens[idx];
    const hasDigit = /\d/.test(t);
    const isUnicodeFraction = Object.keys(SAFE_EATS_UNICODE_FRACTIONS).some(ch => t.includes(ch));
    const looksFraction = /^\d+\/\d+$/.test(t);
    const looksRange = /^\d+(\.\d+)?\s*[-–]\s*\d+(\.\d+)?$/.test(t);

    if (hasDigit || isUnicodeFraction || looksFraction || looksRange) {
      quantityTokens.push(t);
      idx++;
    } else {
      break;
    }
  }

  let quantity = null;
  let unit = '';
  if (quantityTokens.length > 0) {
    quantity = safeEatsToFloat(quantityTokens.join(' '));

    // Next token might be the unit
    const next = tokens[idx];
    if (next && SAFE_EATS_UNITS.some(u => u.toLowerCase() === next.toLowerCase())) {
      unit = next;
      idx++;
    }
  }

  const remaining = tokens.slice(idx).join(' ').trim();
  if (!remaining) {
    return {
      original: text,
      quantity,
      unit,
      name: '',
      note: ''
    };
  }

  const parts = remaining.split(',');
  const name = parts[0].trim();
  const note = parts.slice(1).join(',').trim();

  return {
    original: text,
    quantity,
    unit,
    name,
    note
  };
}

// Find ingredient DOM nodes using simple heuristics
function safeEatsFindIngredientElements() {
  const selectors = [
    '[itemprop="recipeIngredient"]',
    '.ingredient',
    '.ingredients',
    '.ingredients-list li',
    '.ingredients__list li',
    '.recipe-ingredients li',
    'ul[class*="ingredient"] li',
    'ol[class*="ingredient"] li'
  ];

  const nodes = new Set();
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      const txt = safeEatsNormalizeWhitespace(el.innerText || '');
      if (!txt) return;
      if (txt.length < 3 || txt.length > 200) return;
      nodes.add(el);
    });
  });

  return Array.from(nodes);
}

function safeEatsBuildSubstitution(parsed, text, allergies) {
  const lowerText = text.toLowerCase();
  for (const allergen of allergies) {
    const rules = SAFE_EATS_SUBSTITUTIONS[allergen];
    if (!rules) continue;
    for (const rule of rules) {
      if (rule.match.test(text)) {
        let newQuantity = null;
        if (parsed.quantity != null && typeof rule.ratio === 'number') {
          newQuantity = parsed.quantity * rule.ratio;
        }
        const formattedQuantity = newQuantity != null ? safeEatsFormatQuantity(newQuantity) : null;

        // If rule suggests a custom phrasing for quantity, we rely on the note text instead
        const safeDescriptionParts = [];
        if (formattedQuantity) {
          safeDescriptionParts.push(formattedQuantity);
        } else if (parsed.quantity != null) {
          safeDescriptionParts.push(safeEatsFormatQuantity(parsed.quantity));
        }

        if (parsed.unit) safeDescriptionParts.push(parsed.unit);
        safeDescriptionParts.push(rule.replacement);

        let note = parsed.note || '';
        if (rule.note) {
          note = note ? `${note}; ${rule.note}` : rule.note;
        }

        const safeCore = safeDescriptionParts.join(' ');
        const safeText = note ? `${safeCore}, ${note}` : safeCore;

        return {
          allergen,
          ruleId: rule.id,
          replacementName: rule.replacement,
          replacementNote: rule.note,
          newQuantity,
          safeText
        };
      }
    }
  }

  return null;
}

// Overlay UI injection
function safeEatsInjectStyles() {
  if (document.getElementById('safeEats-style')) return;
  const style = document.createElement('style');
  style.id = 'safeEats-style';
  style.textContent = `
    #safeEats-root {
      position: fixed;
      bottom: 18px;
      right: 18px;
      z-index: 999999;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #e5e7eb;
    }
    #safeEats-root * {
      box-sizing: border-box;
    }
    .se-panel {
      width: clamp(320px, 34vw, 440px);
      max-height: 76vh;
      border-radius: 18px;
      background: radial-gradient(circle at 0 0, rgba(34,197,94,0.18), transparent 55%), #020617;
      border: 1px solid rgba(30,64,175,0.85);
      box-shadow: 0 22px 60px rgba(15,23,42,0.95);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      backdrop-filter: blur(8px);
    }
    .se-panel-header {
      padding: 12px 14px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(15,23,42,1);
      background: linear-gradient(135deg, rgba(15,23,42,1), rgba(15,23,42,0.9));
    }
    .se-panel-title-block {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .se-panel-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .se-panel-logo {
      width: 22px;
      height: 22px;
      border-radius: 999px;
      background: radial-gradient(circle at 30% 30%, #bbf7d0, #16a34a);
      position: relative;
      box-shadow: 0 0 18px rgba(22,163,74,0.9);
      flex-shrink: 0;
    }
    .se-panel-logo::after {
      content: "";
      position: absolute;
      inset: 4px;
      border-radius: inherit;
      border: 2px solid rgba(15,23,42,0.95);
    }
    .se-panel-title {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #cbd5f5;
    }
    .se-panel-subtitle {
      font-size: 11px;
      color: #9ca3af;
    }
    .se-panel-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 4px;
    }
    .se-panel-badge {
      padding: 2px 7px;
      border-radius: 999px;
      border: 1px solid rgba(148,163,184,0.6);
      background: rgba(15,23,42,0.9);
      font-size: 10px;
      color: #9ca3af;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .se-panel-dot {
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: #22c55e;
    }
    .se-panel-close {
      border: none;
      background: rgba(15,23,42,0.9);
      color: #9ca3af;
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 11px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border: 1px solid rgba(148,163,184,0.6);
      transition: background 0.15s ease-out, border-color 0.15s ease-out, color 0.15s ease-out;
    }
    .se-panel-close:hover {
      background: rgba(15,23,42,1);
      border-color: rgba(248,113,113,0.9);
      color: #fecaca;
    }
    .se-panel-body {
      padding: 12px 14px 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      font-size: 11px;
      max-height: calc(76vh - 60px);
      overflow: auto;
      background: radial-gradient(circle at 100% 0, rgba(59,130,246,0.2), transparent 55%), #020617;
    }
    .se-panel-summary {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(15,23,42,0.95);
      border: 1px solid rgba(148,163,184,0.6);
    }
    .se-panel-summary-main {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .se-panel-summary-main strong {
      font-size: 11px;
    }
    .se-panel-summary-main span {
      color: #9ca3af;
    }
    .se-panel-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 4px;
    }
    .se-panel-tag {
      padding: 2px 6px;
      border-radius: 999px;
      font-size: 10px;
      border: 1px solid rgba(148,163,184,0.6);
      color: #9ca3af;
      background: rgba(15,23,42,0.9);
    }

    .se-panel-metrics {
      display: flex;
      gap: 8px;
      flex-wrap: nowrap;
      justify-content: space-between;
      }
    .se-metric {
      min-width: 118px;
      flex: 0 0 118px;
      padding: 8px 10px;
      border-radius: 10px;
      border: 1px solid rgba(148,163,184,0.55);
      background: rgba(15,23,42,0.9);
      white-space: nowrap;
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
    .se-metric-number {
      font-size: 15px;
      font-weight: 700;
      line-height: 1.2;
      color: #f8fafc;
      white-space: nowrap;
    }
    .se-metric-label {
      font-size: 11px;
      color: #9ca3af;
      white-space: nowrap;
    }

    .se-section-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 0 2px;
    }
    .se-section-title {
      font-size: 12px;
      font-weight: 600;
      color: #e5e7eb;
    }
    .se-section-sub {
      font-size: 11px;
      color: #9ca3af;
    }

    .se-ingredient-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .se-swap-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid rgba(34,197,94,0.8);
      background: rgba(15,23,42,0.95);
      box-shadow: 0 0 0 1px rgba(34,197,94,0.18);
    }
    .se-swap-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .se-swap-label {
      font-size: 10px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #9ca3af;
    }
    .se-swap-text {
      border: 1px solid rgba(148,163,184,0.45);
      background: rgba(15,23,42,0.85);
      border-radius: 10px;
      padding: 8px 10px;
      font-size: 12px;
      line-height: 1.5;
      color: #e5e7eb;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    .se-swap-text--safe {
      border-color: rgba(34,197,94,0.7);
      background: rgba(22,163,74,0.16);
      color: #dcfce7;
    }
    .se-swap-tag {
      font-size: 10px;
      color: #bbf7d0;
      background: rgba(34,197,94,0.16);
      border: 1px solid rgba(34,197,94,0.7);
      border-radius: 999px;
      padding: 2px 8px;
      justify-self: flex-start;
      width: fit-content;
      white-space: nowrap;
    }
    .se-empty-state {
      font-size: 11px;
      color: #9ca3af;
      font-style: italic;
      padding: 6px 2px 2px;
    }

    @media (max-width: 600px) {
      #safeEats-root {
        right: 10px;
        left: 10px;
      }
      .se-panel {
        width: auto;
      }
    }
  `;
  document.head.appendChild(style);
}

function safeEatsFormatOriginalShort(parsed) {
  const parts = [];
  if (parsed.quantity != null) parts.push(safeEatsFormatQuantity(parsed.quantity));
  if (parsed.unit) parts.push(parsed.unit);
  if (parsed.name) parts.push(parsed.name);
  const combined = parts.join(' ').trim();
  return combined || safeEatsNormalizeWhitespace(parsed.original);
}

function safeEatsFormatSwapShort(parsed, substitution) {
  const qty = substitution.newQuantity != null
    ? safeEatsFormatQuantity(substitution.newQuantity)
    : (parsed.quantity != null ? safeEatsFormatQuantity(parsed.quantity) : '');
  const unit = parsed.unit || '';
  const parts = [qty, unit, substitution.replacementName].filter(Boolean);
  const combined = parts.join(' ').replace(/\s+/g, ' ').trim();
  return combined || substitution.replacementName || 'Swap';
}

function safeEatsSaveHistory(swaps) {
  if (!swaps || !swaps.length || !chrome?.storage?.local) return;
  try {
    const entry = {
      title: safeEatsNormalizeWhitespace(document.title || 'Recipe'),
      url: window.location.href,
      at: Date.now(),
      swaps: swaps.slice(0, 15).map(item => ({
        original: safeEatsFormatOriginalShort(item.parsed),
        swap: safeEatsFormatSwapShort(item.parsed, item.substitution),
        allergen: item.substitution.allergen
      }))
    };
    chrome.storage.local.get({ history: [] }, data => {
      const history = Array.isArray(data.history) ? data.history : [];
      history.unshift(entry);
      const trimmed = history.slice(0, 20);
      chrome.storage.local.set({ history: trimmed });
    });
  } catch (e) {
    // best-effort; ignore
  }
}

function safeEatsRenderOverlay(ingredients, results, allergies) {
  if (!ingredients.length) return;
  safeEatsInjectStyles();

  let root = document.getElementById('safeEats-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'safeEats-root';
    document.body.appendChild(root);
  }
  root.innerHTML = '';

  const unsafeItems = results.filter(r => r.substitution);
  const unsafeCount = unsafeItems.length;
  const convertedCount = unsafeItems.length;

  const allergenList = allergies.length ? allergies.join(', ') : 'None';

  const panel = document.createElement('div');
  panel.className = 'se-panel';
  panel.innerHTML = `
    <div class="se-panel-header">
      <div class="se-panel-title-block">
        <div class="se-panel-title-row">
          <div class="se-panel-logo"></div>
          <div class="se-panel-title">SafeEats</div>
        </div>
        <div class="se-panel-subtitle">Original vs allergy-safe ingredients</div>
        <div class="se-panel-badges">
          <div class="se-panel-badge"><div class="se-panel-dot"></div> Allergy profile: ${allergenList}</div>
        </div>
      </div>
      <button class="se-panel-close" type="button">
        <span>✕</span>
        <span>Hide</span>
      </button>
    </div>
    <div class="se-panel-body">
      <div class="se-panel-summary">
        <div class="se-panel-metrics">
          <div class="se-metric">
            <div class="se-metric-number">${ingredients.length}</div>
            <div class="se-metric-label">ingredients</div>
          </div>
          <div class="se-metric">
            <div class="se-metric-number">${unsafeCount}</div>
            <div class="se-metric-label">flagged</div>
          </div>
          <div class="se-metric">
            <div class="se-metric-number">${convertedCount}</div>
            <div class="se-metric-label">substitution(s)</div>
          </div>
        </div>
      </div>

      <div class="se-section-header">

      </div>

      <div class="se-ingredient-list" id="se-ingredient-list"></div>
    </div>
  `;

  const listEl = panel.querySelector('#se-ingredient-list');

  const swaps = results.filter(r => r.substitution);
  swaps.forEach((result) => {
    const row = document.createElement('div');
    row.className = 'se-swap-row';

    const originalShort = safeEatsFormatOriginalShort(result.parsed);
    const swapShort = safeEatsFormatSwapShort(result.parsed, result.substitution);

    row.innerHTML = `
      <div class="se-swap-cell">
        <div class="se-swap-label">Original</div>
        <div class="se-swap-text">${originalShort}</div>
      </div>
      <div class="se-swap-cell">
        <div class="se-swap-label">Swap with</div>
        <div class="se-swap-text se-swap-text--safe">${swapShort}</div>
        
      </div>
    `;

    listEl.appendChild(row);
  });

  if (swaps.length) {
    safeEatsSaveHistory(swaps);
  }

  if (!unsafeCount) {
    const note = document.createElement('div');
    note.className = 'se-empty-state';
    note.textContent = 'No obvious allergen matches found in these ingredients for your current profile.';
    listEl.appendChild(note);
  }

  panel.querySelector('.se-panel-close').addEventListener('click', () => {
    root.remove();
  });

  root.appendChild(panel);

  safeEatsState.isRecipe = true;
  safeEatsState.unsafeCount = unsafeCount;
  safeEatsState.convertedCount = convertedCount;
}

// Main initialization
function safeEatsInit() {
  if (safeEatsState.initialized) return;
  safeEatsState.initialized = true;

  chrome.storage.sync.get(
    {
      isEnabled: true,
      allergies: []
    },
    (data) => {
      if (!data.isEnabled) return;

      const allergies = Array.isArray(data.allergies) ? data.allergies : [];
      const elements = safeEatsFindIngredientElements();
      if (!elements || elements.length < 3) {
        safeEatsState.isRecipe = false;
        return;
      }

      const ingredients = elements.map(el =>
        safeEatsNormalizeWhitespace(el.innerText || '')
      );

      const results = ingredients.map(text => {
        const parsed = safeEatsParseIngredient(text);
        const substitution = safeEatsBuildSubstitution(parsed, text, allergies);
        return { parsed, substitution };
      });

      safeEatsRenderOverlay(ingredients, results, allergies);
    }
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', safeEatsInit);
} else {
  safeEatsInit();
}

// Listen for popup recipe status check
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'SAFE_EATS_CHECK_RECIPE') {
    sendResponse({
      ok: true,
      isRecipe: !!safeEatsState.isRecipe,
      unsafeCount: safeEatsState.unsafeCount || 0,
      convertedCount: safeEatsState.convertedCount || 0
    });
  }
});
