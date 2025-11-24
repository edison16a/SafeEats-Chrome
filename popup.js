document.addEventListener('DOMContentLoaded', () => {
  const enabledToggle = document.getElementById('enabled-toggle');
  const allergenPills = document.getElementById('allergen-pills');
  const allergenCount = document.getElementById('allergen-count');
  const openSettingsBtn = document.getElementById('open-settings');
  const recipeStatusDot = document.getElementById('recipe-status-dot');
  const recipeStatusText = document.getElementById('recipe-status-text');
  const recipeStatusSub = document.getElementById('recipe-status-sub');

  const ALLERGEN_LABELS = {
    dairy: 'Dairy',
    eggs: 'Eggs',
    gluten: 'Gluten / Wheat',
    nuts: 'Tree Nuts',
    peanuts: 'Peanuts',
    soy: 'Soy',
    shellfish: 'Shellfish',
    fish: 'Fish',
    sesame: 'Sesame'
  };

  function renderAllergenPills(allergies) {
    allergenPills.innerHTML = '';
    if (!allergies || allergies.length === 0) {
      const span = document.createElement('span');
      span.className = 'se-empty';
      span.textContent = 'No allergens selected yet.';
      allergenPills.appendChild(span);
      allergenCount.textContent = '';
      return;
    }

    allergenCount.textContent = `${allergies.length} selected`;
    allergies.forEach(key => {
      const pill = document.createElement('div');
      pill.className = 'se-pill se-pill-highlight';
      pill.innerHTML = `<span class="se-pill-dot"></span>${ALLERGEN_LABELS[key] || key}`;
      allergenPills.appendChild(pill);
    });
  }

  // Load settings
  chrome.storage.sync.get(
    {
      isEnabled: true,
      allergies: []
    },
    (data) => {
      enabledToggle.checked = !!data.isEnabled;
      renderAllergenPills(data.allergies || []);
    }
  );

  // Save toggle
  enabledToggle.addEventListener('change', () => {
    chrome.storage.sync.set({ isEnabled: enabledToggle.checked });
  });

  // Open options
  openSettingsBtn.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  });

  // Ask the current tab content script if a recipe is detected
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs && tabs[0];
      if (!tab || !tab.id) {
        return;
      }
      chrome.tabs.sendMessage(
        tab.id,
        { type: 'SAFE_EATS_CHECK_RECIPE' },
        (response) => {
          if (chrome.runtime.lastError) {
            // Probably no content script loaded (e.g., chrome:// page)
            return;
          }
          if (!response || !response.ok) {
            return;
          }

          if (response.isRecipe) {
            recipeStatusDot.classList.add('se-status-dot--ok');
            recipeStatusText.innerHTML = '<strong>Recipe detected</strong>';
            const unsafeCount = response.unsafeCount || 0;
            const convertedCount = response.convertedCount || 0;
            if (unsafeCount > 0) {
              recipeStatusSub.textContent =
                `${unsafeCount} ingredient(s) substituted`;
            } else {
              recipeStatusSub.textContent =
                'No allergen matches detected in this recipe based on your profile.';
            }
          } else {
            recipeStatusDot.classList.remove('se-status-dot--ok');
            recipeStatusText.textContent = 'No obvious recipe detected';
            recipeStatusSub.textContent =
              'SafeEats looks for structured ingredient lists. Some sites may not be supported.';
          }
        }
      );
    });
  } catch (e) {
    // Ignore, best-effort only
  }
});
