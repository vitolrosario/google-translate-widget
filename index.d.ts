export interface Language {
  code: string;
  name: string;
}

export interface TranslateConfig {
  element?: string;
  includedLanguages?: string[];
  defaultLanguage?: string;
  onLanguageChange?: (language: string, isDefault: boolean) => void;
  layout?: TranslatorWidgetLayout;
}

export interface TranslatorWidget {
  translateTo: (langCode: string) => void;
  goBackToOriginal: () => void;
  getCurrentLanguage: () => string;
  getAvailableLanguages: () => Language[];
  onChange: (event: Event | string) => void;
}

export enum TranslatorWidgetLayout {
  SIMPLE = 'simple',
  CUSTOM = 'custom'
}

declare global {
  interface Window {
    translator: TranslatorWidget;
  }
}

declare const languages: Language[];

declare function translatorWidget(config?: TranslateConfig): TranslatorWidget;

export { languages };
export { translatorWidget };