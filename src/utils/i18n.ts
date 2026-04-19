export type TranslationId = 'web' | 'kjv' | 'es' | 'it' | 'pl' | 'pt' | 'zh';

export const ALL_PSALMS_PATH: Record<TranslationId, string> = {
  web: '/psalms', kjv: '/psalms',
  es: '/psalms/es', it: '/psalms/it', pl: '/psalms/pl', pt: '/psalms/pt', zh: '/psalms/zh',
};

export const LANG_CODE: Record<TranslationId, string> = {
  web: 'en', kjv: 'en', es: 'es', it: 'it', pl: 'pl', pt: 'pt', zh: 'zh-Hans',
};

export const UI: Record<TranslationId, {
  siteTitle: string;
  allPsalms: string;
  psalm: string;
  translation: string;
}> = {
  web: { siteTitle: 'Psalm of the Day',  allPsalms: 'All Psalms',       psalm: 'Psalm',  translation: 'Translation' },
  kjv: { siteTitle: 'Psalm of the Day',  allPsalms: 'All Psalms',       psalm: 'Psalm',  translation: 'Translation' },
  es:  { siteTitle: 'Salmo del Día',     allPsalms: 'Todos los Salmos', psalm: 'Salmo',  translation: 'Traducción'  },
  it:  { siteTitle: 'Salmo del Giorno',  allPsalms: 'Tutti i Salmi',    psalm: 'Salmo',  translation: 'Traduzione'  },
  pl:  { siteTitle: 'Psalm Dnia',        allPsalms: 'Wszystkie Psalmy', psalm: 'Psalm',  translation: 'Tłumaczenie' },
  pt:  { siteTitle: 'Salmo do Dia',      allPsalms: 'Todos os Salmos',  psalm: 'Salmo',  translation: 'Tradução'    },
  zh:  { siteTitle: '今日诗篇',           allPsalms: '所有诗篇',          psalm: '诗篇',   translation: '翻译'         },
};
