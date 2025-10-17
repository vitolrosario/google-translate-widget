import languages from './languages.js';

let currentLanguage = null;
let defaultLanguage = 'en';
let userOnLanguageChange = null;
let availableLanguages = [];

export const TranslatorWidgetLayout = {
    SIMPLE: 'simple',
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

//   const hiddenElementId = element + '_hidden';
  
//   if (!document.getElementById(hiddenElementId)) {
//     const hiddenDiv = document.createElement('div');
//     hiddenDiv.id = hiddenElementId;
//     hiddenDiv.style.display = 'none';
//     document.body.appendChild(hiddenDiv);
//   }

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
  select.className = 'translator-widget-simple';
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
      return;
    }
  }
}

function observeLanguageChanges() {
  const checkForSelect = () => {
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.addEventListener('change', (event) => {
        const newLanguage = event.target.value;
        currentLanguage = newLanguage || defaultLanguage;
        
        updateSimpleLayout();
        
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
        case TranslatorWidgetLayout.CUSTOM:
            setupCustomLayout();
            break;
    }
}
