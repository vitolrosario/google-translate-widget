import languages from './languages.js';

let currentLanguage = null;
let defaultLanguage = 'en';
let userOnLanguageChange = null;
let availableLanguages = [];

export const TranslatorWidgetLayout = {
    SIMPLE: 'simple',
    RADIO: 'radio',
    CUSTOM: 'custom',
};

export function translatorWidget(config = {}) {
  const {
    element = 'google_translate',
    includedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt'],
    defaultLanguage: configDefaultLanguage = 'en',
    onLanguageChange = null,
    layout = TranslatorWidgetLayout.SIMPLE,
    width = 'auto',
    height = 'auto'
  } = config;

  defaultLanguage = configDefaultLanguage;
  currentLanguage = defaultLanguage;
  userOnLanguageChange = onLanguageChange;
  availableLanguages = languages.filter(lang => includedLanguages.includes(lang.code));

  const scriptId = 'google-translate-script';
  if (!document.getElementById(scriptId)) {
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = '//translate.google.com/translate_a/element.js?cb=initGoogleTranslateElement';
    document.head.appendChild(script);
  }

  window.initGoogleTranslateElement = function () {
    new window.google.translate.TranslateElement({
      pageLanguage: defaultLanguage,
      includedLanguages: includedLanguages.join(','),
      layout: 'dropdown'
    }, element);

    hideGoogleElements(element);

    setTimeout(() => {
      observeLanguageChanges();

      renderLayouts(layout, element, width, height);

    }, 1000);
  };


  const translator = {
    translateTo,
    goBackToOriginal,
    getCurrentLanguage: () => currentLanguage,
    getAvailableLanguages: () => availableLanguages,
    onChange: (event) => {
      const langCode = event.target ? event.target.value : event;
      window.translator.translateTo(langCode);
    }
  }

  window.translator = translator;

  return translator
}

function renderSimpleLayout(elementId, width, height) {
  const container = document.getElementById(elementId);
  if (!container) return;

  const select = document.createElement('select');
  select.className = 'translator-widget-simple notranslate';
  select.id = 'translator-widget-simple';
  select.style.cssText = `
    padding: 8px 12px;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    width: ${width};
    height: ${height};
  `;

  availableLanguages.forEach(lang => {
    const option = document.createElement('option');
    option.value = lang.code;
    option.textContent = lang.name;
    option.selected = lang.code === currentLanguage;
    select.appendChild(option);
  });

  select.addEventListener('change', (e) => {
    window.translator.translateTo(e.target.value);
  });

container.parentNode.insertBefore(select, container.nextSibling);
}

function renderRadioLayout(elementId) {
  const container = document.getElementById(elementId);
  if (!container) return;

  const radioId = elementId + '_radio';
  if (document.getElementById(radioId)) return; // already rendered

  // ensure global styles for radio select exist
  if (!document.getElementById('translator-radio-style')) {
    const style = document.createElement('style');
    style.id = 'translator-radio-style';
    style.innerHTML = `
      .translator-radio-wrapper { position: relative; display: inline-block; }
      .translator-radio-btn { display:flex; align-items:center; gap:8px; padding:8px 12px; border:1px solid #d9e2ef; background:#fff; border-radius:8px; cursor:pointer; box-shadow:0 2px 6px rgba(17,24,39,0.06); }
      .translator-radio-btn .globe { font-size:16px }
      .translator-radio-btn:hover { background:#eef2ff; }
      .translator-radio-btn .code { font-weight:600; font-size:13px; color:#0f172a }
      .translator-radio-list { position:absolute; left:0; top:calc(100% + 8px); min-width:180px; max-width:260px; background:#fff; border-radius:12px; border:1px solid #e6eef8; box-shadow:0 12px 30px rgba(2,6,23,0.12); padding:10px; z-index:9999; display:flex; flex-direction:column; gap:8px }
      .translator-radio-item { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:10px; cursor:pointer; background:#f8fafc; border:1px solid transparent; transition:all .12s ease; font-size:14px }
      .translator-radio-item:hover { background:#f1f5f9 }
      .translator-radio-item.selected { background:#eff6ff; border-color:#bfdbfe; box-shadow:0 6px 18px rgba(99,102,241,0.08) }
      .translator-radio-radio-outer { display:inline-flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:9999px; border:1px solid #cbd5e1; background:#fff; flex-shrink:0 }
      .translator-radio-radio-inner { width:10px; height:10px; border-radius:9999px; background:#94a3b8 }
      .translator-radio-radio-outer.selected { border-color:#3b82f6 }
      .translator-radio-radio-inner.selected { background:#3b82f6 }
      .translator-radio-label { font-size:15px; font-weight:600; color:#475569; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:block }
      .translator-radio-label.selected { color:#0f172a }
    `;
    document.head.appendChild(style);
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'translator-radio-wrapper notranslate';
  wrapper.id = radioId;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'translator-radio-btn';
  btn.setAttribute('aria-haspopup', 'listbox');
  btn.innerHTML = `<img src="../assets/icons/globe.png" alt="Globe" class="globe" style="width:16px;height:16px;vertical-align:middle;" /><span class="code">${currentLanguage.toUpperCase()}</span>`;
  const list = document.createElement('div');
  list.className = 'translator-radio-list';
  list.style.display = 'none';
  list.setAttribute('role', 'listbox');

  availableLanguages.forEach(lang => {
    const btnItem = document.createElement('button');
    btnItem.type = 'button';
    btnItem.className = 'translator-radio-item' + (lang.code === currentLanguage ? ' selected' : '');
    btnItem.dataset.lang = lang.code;

    const radioOuter = document.createElement('span');
    radioOuter.className = 'translator-radio-radio-outer' + (lang.code === currentLanguage ? ' selected' : '');
    const radioInner = document.createElement('span');
    radioInner.className = 'translator-radio-radio-inner' + (lang.code === currentLanguage ? ' selected' : '');
    radioOuter.appendChild(radioInner);

    const label = document.createElement('span');
    label.className = 'translator-radio-label' + (lang.code === currentLanguage ? ' selected' : '');
    label.textContent = lang.name;

    btnItem.appendChild(radioOuter);
    btnItem.appendChild(label);

    btnItem.addEventListener('click', (e) => {
      e.stopPropagation();
      window.translator.onChange(lang.code);
      closeRadioList();
    });

    list.appendChild(btnItem);
  });

  function openRadioList() {
    list.style.display = 'block';
    document.addEventListener('click', outsideClick);
  }

  function closeRadioList() {
    list.style.display = 'none';
    document.removeEventListener('click', outsideClick);
  }

  function outsideClick(e) {
    if (!wrapper.contains(e.target)) {
      closeRadioList();
    }
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (list.style.display === 'none') openRadioList(); else closeRadioList();
  });

  wrapper.appendChild(btn);
  wrapper.appendChild(list);

  container.parentNode.insertBefore(wrapper, container.nextSibling);

  function alignListWidth() {
    try {
      const btnRect = btn.getBoundingClientRect();
      const desired = Math.max(140, Math.round(btnRect.width - 6));
      list.style.width = desired + 'px';
      list.style.minWidth = desired + 'px';
    } catch (e) {
      // ignore
    }
  }

  const _origOpen = openRadioList;
  openRadioList = function() { alignListWidth(); list.style.display = 'block'; document.addEventListener('click', outsideClick); };
  window.addEventListener('resize', alignListWidth);

  function refreshRadioSelection() {
    const codeSpan = wrapper.querySelector('.code');
    if (codeSpan) codeSpan.textContent = (currentLanguage || defaultLanguage).toUpperCase();
    wrapper.querySelectorAll('.translator-radio-item').forEach(it => {
      const lang = it.dataset.lang;
      const outer = it.querySelector('.translator-radio-radio-outer');
      const inner = it.querySelector('.translator-radio-radio-inner');
      const label = it.querySelector('.translator-radio-label');
      if (lang === currentLanguage) {
        it.classList.add('selected');
        if (outer) outer.classList.add('selected');
        if (inner) inner.classList.add('selected');
        if (label) label.classList.add('selected');
      } else {
        it.classList.remove('selected');
        if (outer) outer.classList.remove('selected');
        if (inner) inner.classList.remove('selected');
        if (label) label.classList.remove('selected');
      }
    });
  }

  refreshRadioSelection();

  wrapper._refreshRadioSelection = refreshRadioSelection;
}

function updateRadioLayout() {
  const wrapper = document.querySelector('.translator-radio-wrapper');
  if (wrapper && typeof wrapper._refreshRadioSelection === 'function') {
    wrapper._refreshRadioSelection();
  }
}

function setupCustomLayout() {
  // For custom layout, just ensure window.translator is available
  // Users will create their own UI and use window.translator.onChange
}

function hideGoogleElements(element) {
  const style = document.createElement('style');
  style.innerHTML = `
    .skiptranslate iframe {
      display: none !important;
    }
    
    #goog-gt-tt, .goog-te-balloon-frame {
      display: none !important;
    }
    
    .goog-text-highlight {
      background: none !important;
      box-shadow: none !important;
    }
    
    #${element} {
      display: none;
    }
    
    .goog-te-banner-frame.skiptranslate {
      display: none !important;
    }
    
    body {
      top: 0px !important;
    }
  `;
  document.head.appendChild(style);
}

function translateTo(langCode) {
    
    if (langCode === defaultLanguage) {
        goBackToOriginal();
    } else {
        translate(langCode);
    }
}

function translate(langCode) {
  const select = document.querySelector('.goog-te-combo');
  if (select) {
    currentLanguage = langCode;
    select.value = langCode;
    select.dispatchEvent(new Event('change'));
  }
}

function goBackToOriginal() {
  const iframe = document.querySelector('.skiptranslate iframe');
  if (!iframe) return;

  const innerDoc = iframe.contentDocument || iframe.contentWindow.document;
  const restoreButtons = innerDoc.getElementsByTagName("button");

  for (let i = 0; i < restoreButtons.length; i++) {
    if (restoreButtons[i].id.indexOf("restore") >= 0) {
      restoreButtons[i].click();
      const closeButton = innerDoc.getElementById(":2.close");
      if (closeButton) {
        closeButton.click();
      }
      currentLanguage = defaultLanguage;
      updateLayouts();
      if (userOnLanguageChange) {
        try { userOnLanguageChange(currentLanguage, true); } catch (e) { /* noop */ }
      }
      return;
    }
  }

  currentLanguage = defaultLanguage;
  updateLayouts();
  if (userOnLanguageChange) {
    try { userOnLanguageChange(currentLanguage, true); } catch (e) { /* noop */ }
  }
}

function observeLanguageChanges() {
  const checkForSelect = () => {
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.addEventListener('change', (event) => {
        const newLanguage = event.target.value;
        currentLanguage = newLanguage || defaultLanguage;
        
        updateLayouts();
        
        if (userOnLanguageChange) {
          userOnLanguageChange(currentLanguage, newLanguage === '');
        }
      });
    } else {
      setTimeout(checkForSelect, 500);
    }
  };
  
  checkForSelect();
}

function updateLayouts(layout) {
    updateSimpleLayout();
    updateRadioLayout();
} 
function updateSimpleLayout() {
  const simpleSelect = document.querySelector('.translator-widget-simple');
  if (simpleSelect) {
    simpleSelect.value = currentLanguage;
  }
}

function renderLayouts(layout, element, width, height) {
    switch(layout) {
        case TranslatorWidgetLayout.SIMPLE:
            renderSimpleLayout(element, width, height);
            break;
        case TranslatorWidgetLayout.RADIO:
            renderRadioLayout(element);
            break;
        case TranslatorWidgetLayout.CUSTOM:
            setupCustomLayout();
    }
}
