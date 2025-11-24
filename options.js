const ALLERGEN_DEFINITIONS = [
  {
    key: 'dairy',
    name: 'Dairy',
    description: 'Milk, butter, cream, cheese, yogurt, etc.'
  },
  {
    key: 'eggs',
    name: 'Eggs',
    description: 'Whole eggs and egg-based binders.'
  },
  {
    key: 'gluten',
    name: 'Gluten / Wheat',
    description: 'Wheat flour, bread crumbs, most pastas.'
  },
  {
    key: 'nuts',
    name: 'Tree Nuts',
    description: 'Almonds, walnuts, pecans, cashews, etc.'
  },
  {
    key: 'peanuts',
    name: 'Peanuts',
    description: 'Peanuts and peanut butter.'
  },
  {
    key: 'soy',
    name: 'Soy',
    description: 'Soy milk, tofu, soy sauce, edamame.'
  },
  {
    key: 'shellfish',
    name: 'Shellfish',
    description: 'Shrimp, crab, lobster, etc.'
  },
  {
    key: 'fish',
    name: 'Fish',
    description: 'Salmon, tuna, cod, anchovies, etc.'
  },
  {
    key: 'sesame',
    name: 'Sesame',
    description: 'Sesame seeds, tahini, sesame oil.'
  }
];

document.addEventListener('DOMContentLoaded', () => {
  const listEl = document.getElementById('allergen-list');
  const toastEl = document.getElementById('se-toast');
  const historyListEl = document.getElementById('se-history-list');

  function renderList(selected) {
    listEl.innerHTML = '';
    ALLERGEN_DEFINITIONS.forEach(def => {
      const li = document.createElement('li');
      li.className = 'se-list-item';

      const main = document.createElement('div');
      main.className = 'se-list-main';

      const title = document.createElement('div');
      title.className = 'se-list-title';
      title.textContent = def.name;

      const sub = document.createElement('div');
      sub.className = 'se-list-sub';
      sub.textContent = def.description;

      main.appendChild(title);
      main.appendChild(sub);

      const checkboxWrapper = document.createElement('label');
      checkboxWrapper.className = 'se-checkbox';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.dataset.key = def.key;
      input.checked = selected.includes(def.key);

      const slider = document.createElement('span');
      slider.className = 'se-checkbox-slider';

      checkboxWrapper.appendChild(input);
      checkboxWrapper.appendChild(slider);

      li.appendChild(main);
      li.appendChild(checkboxWrapper);
      listEl.appendChild(li);
    });
  }

  function showToast() {
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 1300);
  }

  function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function renderHistory(items) {
    if (!historyListEl) return;
    historyListEl.innerHTML = '';

    if (!items || !items.length) {
      const li = document.createElement('li');
      li.className = 'se-list-item';
      li.innerHTML = `
        <div class="se-list-main">
          <div class="se-list-title">No history yet</div>
          <div class="se-list-sub">Visit a recipe page to populate your history.</div>
        </div>
        <span class="se-badge">Waiting</span>
      `;
      historyListEl.appendChild(li);
      return;
    }

    items.forEach(entry => {
      const li = document.createElement('li');
      li.className = 'se-list-item';
      const swapCount = Array.isArray(entry.swaps) ? entry.swaps.length : 0;
      li.innerHTML = `
        <div class="se-list-main">
          <div class="se-list-title">${entry.title || 'Recipe'}</div>
          <div class="se-list-sub">${formatDate(entry.at)} · ${swapCount} swap(s)</div>
          <div class="se-badge-mini">
            <div class="se-badge-mini-dot"></div>
            <a href="${entry.url || '#'}" target="_blank" style="color:inherit; text-decoration:none;">Open recipe</a>
          </div>
        </div>
      `;
      historyListEl.appendChild(li);
    });
  }

  chrome.storage.sync.get(
    {
      allergies: []
    },
    (data) => {
      const selected = Array.isArray(data.allergies) ? data.allergies : [];
      renderList(selected);

      listEl.addEventListener('change', (evt) => {
        const target = evt.target;
        if (target && target.dataset && target.dataset.key) {
          const key = target.dataset.key;
          chrome.storage.sync.get(
            { allergies: [] },
            (current) => {
              let updated = Array.isArray(current.allergies) ? [...current.allergies] : [];
              if (target.checked) {
                if (!updated.includes(key)) {
                  updated.push(key);
                }
              } else {
                updated = updated.filter(k => k !== key);
              }
              chrome.storage.sync.set({ allergies: updated }, showToast);
            }
          );
        }
      });
    }
  );

  chrome.storage.local.get({ history: [] }, (data) => {
    const items = Array.isArray(data.history) ? data.history : [];
    renderHistory(items);
  });
});
