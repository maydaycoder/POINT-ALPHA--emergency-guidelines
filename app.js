(() => {
  'use strict';

  const scenarios = Array.isArray(window.POINT_ALPHA_SCENARIOS) ? window.POINT_ALPHA_SCENARIOS : [];
  const categories = [
    { name: 'Natural Disasters', icon: '◈' }, { name: 'Medical', icon: '✚' },
    { name: 'Fire', icon: '♨' }, { name: 'Chemical', icon: '⚗' },
    { name: 'Radiation', icon: '☢' }, { name: 'Transportation', icon: '⇄' },
    { name: 'Utilities', icon: '⌁' }, { name: 'Weather', icon: '☼' },
    { name: 'Security', icon: '⬡' }, { name: 'Survival', icon: '⌖' }
  ];
  const storageKeys = { favorites: 'point-alpha-favorites-v1', recent: 'point-alpha-recent-v1', preferences: 'point-alpha-preferences-v1' };
  const elements = Object.fromEntries([
    'category-grid', 'featured-list', 'scenario-search', 'search-status', 'scenario-count',
    'favorites-list', 'favorites-count', 'recent-list', 'recent-count', 'results-section',
    'results-list', 'results-title', 'results-kicker', 'clear-filter', 'scenario-dialog',
    'dialog-content', 'dialog-close', 'dialog-back', 'toast', 'large-text-toggle',
    'contrast-toggle', 'emergency-toggle'
  ].map(id => [id, document.getElementById(id)]));
  let favorites = readArray(storageKeys.favorites);
  let recent = readArray(storageKeys.recent);
  let toastTimer;

  function readArray(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
    } catch { return []; }
  }

  function saveArray(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { showToast('This browser could not save changes on this device.'); }
  }

  function readPreferences() {
    try { return JSON.parse(localStorage.getItem(storageKeys.preferences) || '{}') || {}; }
    catch { return {}; }
  }

  function savePreferences() {
    const preferences = {
      largeText: document.body.classList.contains('large-text'),
      highContrast: document.body.classList.contains('high-contrast'),
      emergencyMode: document.body.classList.contains('emergency-mode')
    };
    try { localStorage.setItem(storageKeys.preferences, JSON.stringify(preferences)); } catch { /* Preferences remain active for this session. */ }
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  }

  function scenarioById(id) { return scenarios.find(scenario => scenario.id === id); }
  function categoryIcon(name) { return categories.find(category => category.name === name)?.icon || '◇'; }

  function renderCategories() {
    elements['category-grid'].innerHTML = categories.map(category => {
      const count = scenarios.filter(scenario => scenario.category === category.name).length;
      return `<button class="category-card" type="button" data-category="${escapeHtml(category.name)}" aria-label="Browse ${escapeHtml(category.name)}, ${count} scenarios"><span class="category-icon" aria-hidden="true">${category.icon}</span><span class="category-meta"><strong>${escapeHtml(category.name)}</strong><span>${count} topics</span></span></button>`;
    }).join('');
  }

  function scenarioCard(scenario, compact = false) {
    const saved = favorites.includes(scenario.id);
    return `<article class="scenario-card${compact ? ' compact-card' : ''}">
      <button class="scenario-open" type="button" data-open="${escapeHtml(scenario.id)}" aria-label="Open ${escapeHtml(scenario.title)}">
        <span class="scenario-icon" aria-hidden="true">${escapeHtml(scenario.icon || categoryIcon(scenario.category))}</span>
        <span class="scenario-info"><strong>${escapeHtml(scenario.title)}</strong><small>${escapeHtml(scenario.category)}</small></span>
      </button>
      <button class="favorite-button" type="button" data-favorite="${escapeHtml(scenario.id)}" aria-pressed="${saved}" aria-label="${saved ? 'Remove' : 'Add'} ${escapeHtml(scenario.title)} ${saved ? 'from' : 'to'} favorites">${saved ? '★' : '☆'}</button>
    </article>`;
  }

  function renderScenarioArea(target, list, emptyMessage) {
    if (!list.length) {
      target.innerHTML = `<p class="empty-state">${escapeHtml(emptyMessage)}</p>`;
      return;
    }
    target.innerHTML = list.map(scenario => scenarioCard(scenario, true)).join('');
  }

  function renderDashboard() {
    const featured = scenarios.slice(0, 6);
    elements['featured-list'].innerHTML = featured.map(scenario => scenarioCard(scenario)).join('') || '<p class="empty-state">No scenarios are available.</p>';
    const favoriteScenarios = favorites.map(scenarioById).filter(Boolean);
    const recentScenarios = recent.map(scenarioById).filter(Boolean);
    renderScenarioArea(elements['favorites-list'], favoriteScenarios, 'Your saved scenarios will appear here.');
    renderScenarioArea(elements['recent-list'], recentScenarios, 'Scenarios you open will appear here.');
    elements['favorites-count'].textContent = String(favoriteScenarios.length);
    elements['recent-count'].textContent = String(recentScenarios.length);
    elements['scenario-count'].textContent = `${scenarios.length} scenarios`;
  }

  function showResults(list, title, kicker) {
    elements['results-section'].hidden = false;
    elements['results-title'].textContent = title;
    elements['results-kicker'].textContent = kicker;
    elements['results-list'].innerHTML = list.length
      ? list.map(scenario => scenarioCard(scenario)).join('')
      : '<p class="empty-state">No matching scenarios. Try another search.</p>';
    elements['results-section'].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function searchScenarios(query) {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) { elements['results-section'].hidden = true; elements['search-status'].textContent = 'Browse the library by category or search by name.'; return; }
    const matches = scenarios.filter(scenario => [scenario.title, scenario.category, ...(scenario.keywords || [])]
      .some(value => String(value).toLocaleLowerCase().includes(needle)));
    elements['search-status'].textContent = `${matches.length} ${matches.length === 1 ? 'scenario' : 'scenarios'} found`;
    showResults(matches, 'Search results', 'MATCHING SCENARIOS');
  }

  function toggleFavorite(id) {
    if (!scenarioById(id)) return;
    favorites = favorites.includes(id) ? favorites.filter(item => item !== id) : [id, ...favorites];
    saveArray(storageKeys.favorites, favorites);
    renderDashboard();
    if (!elements['results-section'].hidden) {
      const query = elements['scenario-search'].value.trim();
      if (query) searchScenarios(query);
      else if (elements['results-kicker'].textContent === 'FAVORITES') renderFavoritesView();
    }
    const current = elements['dialog-content'].querySelector('[data-favorite]');
    if (current?.dataset.favorite === id) renderDialog(scenarioById(id));
    showToast(favorites.includes(id) ? 'Added to favorites' : 'Removed from favorites');
  }

  function renderFavoritesView() {
    showResults(favorites.map(scenarioById).filter(Boolean), 'Favorites', 'SAVED SCENARIOS');
  }

  const sections = [
    ['Overview', 'overview', 'text'], ['Immediate Actions', 'immediateActions', 'list'],
    ['Things To Avoid', 'thingsToAvoid', 'list'], ['Evacuation', 'evacuation', 'text'],
    ['First Aid', 'firstAid', 'text'], ['Additional Notes', 'notes', 'text']
  ];

  function renderGuidelineSection([title, key, type], scenario) {
    const value = scenario[key];
    let content = '<p class="guideline-empty">No information is available.</p>';
    if (key === 'sources' && Array.isArray(value) && value.length) content = `<ul class="source-list">${value.map(source => {
      const url = String(source.url || '');
      const safeUrl = /^https:\/\//i.test(url) ? escapeHtml(url) : '';
      const title = escapeHtml(source.title || 'Untitled source');
      const organization = escapeHtml(source.organization || 'Source organization not listed');
      const accessed = escapeHtml(source.accessed || 'Access date not listed');
      return `<li><span>${organization}: ${title} (${accessed})</span>${safeUrl ? ` <a href="${safeUrl}" target="_blank" rel="noopener noreferrer">Open source</a>` : ''}<br><small>${escapeHtml(url)}</small></li>`;
    }).join('')}</ul>`;
    else if (type === 'list' && Array.isArray(value) && value.length) content = `<ul>${value.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
    else if (type === 'text' && typeof value === 'string' && value.trim()) content = `<p>${escapeHtml(value)}</p>`;
    return `<section class="guideline-section"><h3>${title}</h3>${content}</section>`;
  }

  function renderDialog(scenario) {
    if (!scenario) return;
    const saved = favorites.includes(scenario.id);
    elements['dialog-content'].innerHTML = `
      <header class="dialog-heading"><span class="scenario-icon" aria-hidden="true">${escapeHtml(scenario.icon || categoryIcon(scenario.category))}</span><div><h2 id="dialog-title">${escapeHtml(scenario.title)}</h2><p>${escapeHtml(scenario.category)} · Emergency information</p></div><button class="favorite-button" type="button" data-favorite="${escapeHtml(scenario.id)}" aria-pressed="${saved}" aria-label="${saved ? 'Remove' : 'Add'} ${escapeHtml(scenario.title)} ${saved ? 'from' : 'to'} favorites">${saved ? '★' : '☆'}</button></header>
      <aside class="draft-notice" role="note"><strong>FOLLOW CURRENT OFFICIAL INSTRUCTIONS</strong><span>This source-linked reference does not replace instructions from local authorities, trained responders, or clinicians. Guidance and procedures vary by country; source links need an internet connection.</span></aside>
      ${sections.map(section => renderGuidelineSection(section, scenario)).join('')}`;
    elements['dialog-content'].insertAdjacentHTML('beforeend', renderGuidelineSection(['Sources', 'sources', 'list'], scenario));
  }

  function openScenario(id) {
    const scenario = scenarioById(id);
    if (!scenario) return;
    recent = [id, ...recent.filter(item => item !== id)].slice(0, 8);
    saveArray(storageKeys.recent, recent);
    renderDashboard();
    renderDialog(scenario);
    if (!elements['scenario-dialog'].open) elements['scenario-dialog'].showModal();
    elements['dialog-close'].focus();
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => elements.toast.classList.remove('visible'), 2200);
  }

  function applyPreferences() {
    const preferences = readPreferences();
    for (const [key, className, button] of [
      ['largeText', 'large-text', elements['large-text-toggle']],
      ['highContrast', 'high-contrast', elements['contrast-toggle']],
      ['emergencyMode', 'emergency-mode', elements['emergency-toggle']]
    ]) {
      document.body.classList.toggle(className, Boolean(preferences[key]));
      button.setAttribute('aria-pressed', String(Boolean(preferences[key])));
    }
  }

  function togglePreference(className, button) {
    const enabled = document.body.classList.toggle(className);
    button.setAttribute('aria-pressed', String(enabled));
    savePreferences();
    if (className === 'emergency-mode') showToast(enabled ? 'Focus mode enabled' : 'Focus mode disabled');
  }

  elements['category-grid'].addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    const category = button.dataset.category;
    showResults(scenarios.filter(scenario => scenario.category === category), category, 'CATEGORY');
  });
  document.addEventListener('click', event => {
    const favoriteButton = event.target.closest('[data-favorite]');
    if (favoriteButton) { toggleFavorite(favoriteButton.dataset.favorite); return; }
    const openButton = event.target.closest('[data-open]');
    if (openButton) openScenario(openButton.dataset.open);
  });
  elements['scenario-search'].addEventListener('input', event => searchScenarios(event.target.value));
  elements['clear-filter'].addEventListener('click', () => {
    elements['scenario-search'].value = '';
    elements['search-status'].textContent = 'Browse the library by category or search by name.';
    elements['results-section'].hidden = true;
    elements['scenario-search'].focus();
  });
  elements['dialog-close'].addEventListener('click', () => elements['scenario-dialog'].close());
  elements['dialog-back'].addEventListener('click', () => elements['scenario-dialog'].close());
  elements['scenario-dialog'].addEventListener('click', event => {
    if (event.target === elements['scenario-dialog']) elements['scenario-dialog'].close();
  });
  elements['large-text-toggle'].addEventListener('click', () => togglePreference('large-text', elements['large-text-toggle']));
  elements['contrast-toggle'].addEventListener('click', () => togglePreference('high-contrast', elements['contrast-toggle']));
  elements['emergency-toggle'].addEventListener('click', () => togglePreference('emergency-mode', elements['emergency-toggle']));
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); elements['scenario-search'].focus(); }
    if (event.key === 'Escape' && elements['scenario-dialog'].open) elements['scenario-dialog'].close();
  });

  applyPreferences();
  renderCategories();
  renderDashboard();
})();
