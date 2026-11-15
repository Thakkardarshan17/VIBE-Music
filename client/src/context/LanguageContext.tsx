import React, { createContext, useContext, useEffect, useState } from 'react';

export type SupportedLanguage = 'en' | 'hi' | 'gu' | 'pa' | 'es';

export interface TranslationDictionary {
  [key: string]: {
    en: string;
    hi: string;
    gu: string;
    pa: string;
    es: string;
  };
}

export const translations: TranslationDictionary = {
  // Navigation
  home: {
    en: 'Home',
    hi: 'होम',
    gu: 'ઘર',
    pa: 'ਹੋਮ',
    es: 'Inicio',
  },
  explore: {
    en: 'Explore',
    hi: 'एक्सप्लोर',
    gu: 'એક્સપ્લોર',
    pa: 'ਐਕਸਪਲੋਰ',
    es: 'Explorar',
  },
  search: {
    en: 'Search',
    hi: 'खोजें',
    gu: 'શોધો',
    pa: 'ਖੋਜ',
    es: 'Buscar',
  },
  trending: {
    en: 'Trending',
    hi: 'ट्रेंडिंग',
    gu: 'ટ્રેન્ડિંગ',
    pa: 'ਟਰੈਂਡਿੰਗ',
    es: 'Tendencias',
  },
  library: {
    en: 'Library',
    hi: 'लाइब्रेरी',
    gu: 'લાઈબ્રેરી',
    pa: 'ਲਾਇਬ੍ਰੇਰੀ',
    es: 'Biblioteca',
  },
  topCharts: {
    en: 'Top Charts',
    hi: 'टॉप चार्ट्स',
    gu: 'ટોપ ચાર્ટ્સ',
    pa: 'ਟਾਪ ਚਾਰਟਸ',
    es: 'Éxitos',
  },
  playlists: {
    en: 'Playlists',
    hi: 'प्लेलिस्ट',
    gu: 'પ્લેલિસ્ટ',
    pa: 'ਪਲੇਲਿਸਟ',
    es: 'Listas',
  },
  likedSongs: {
    en: 'Liked Songs',
    hi: 'पसंदीदा गाने',
    gu: 'પસંદ કરેલા ગીતો',
    pa: 'ਪਸੰਦੀਦਾ ਗੀਤ',
    es: 'Canciones favoritas',
  },
  albums: {
    en: 'Albums',
    hi: 'एल्बम',
    gu: 'આલ્બમ',
    pa: 'ਐਲਬਮ',
    es: 'Álbumes',
  },
  artists: {
    en: 'Artists',
    hi: 'कलाकार',
    gu: 'કલાકારો',
    pa: 'ਕਲਾਕਾਰ',
    es: 'Artistas',
  },
  history: {
    en: 'History',
    hi: 'इतिहास',
    gu: 'ઇતિહાસ',
    pa: 'ਇਤਿਹਾਸ',
    es: 'Historial',
  },
  settings: {
    en: 'Settings',
    hi: 'सेटिंग्स',
    gu: 'સેટિંગ્સ',
    pa: 'ਸੈਟਿੰਗਾਂ',
    es: 'Configuración',
  },
  dashboard: {
    en: 'My Music',
    hi: 'मेरा संगीत',
    gu: 'મારું સંગીત',
    pa: 'ਮੇਰਾ ਸੰਗੀਤ',
    es: 'Mi Música',
  },
  discover: {
    en: 'Discover',
    hi: 'डिस्कवर',
    gu: 'ડિસ્કવર',
    pa: 'ਡਿਸਕਵਰ',
    es: 'Descubrir',
  },

  // Controls & Playback
  play: {
    en: 'Play',
    hi: 'चलाएं',
    gu: 'વગાડો',
    pa: 'ਚਲਾਓ',
    es: 'Reproducir',
  },
  pause: {
    en: 'Pause',
    hi: 'रोकें',
    gu: 'થોભાવો',
    pa: 'ਰੋਕੋ',
    es: 'Pausar',
  },
  fullSong: {
    en: 'Full Song',
    hi: 'पूरा गाना',
    gu: 'આખું ગીત',
    pa: 'ਪੂਰਾ ਗੀਤ',
    es: 'Canción completa',
  },
  lossless: {
    en: 'Lossless High-Fidelity',
    hi: 'दोषरहित हाई-फिडेलिटी',
    gu: 'લોસલેસ હાઈ-ફિડેલિટી',
    pa: 'ਲੌਸਲੈਸ ਹਾਈ-ਫਿਡੈਲਿਟੀ',
    es: 'Alta fidelidad',
  },

  // Settings Page
  controlCenter: {
    en: 'Control Center',
    hi: 'नियंत्रण केंद्र',
    gu: 'નિયંત્રણ કેન્દ્ર',
    pa: 'ਕੰਟਰੋਲ ਕੇਂਦਰ',
    es: 'Centro de control',
  },
  platformSettings: {
    en: 'Platform Settings',
    hi: 'प्लेटफ़ॉर्म सेटिंग्स',
    gu: 'પ્લેટફોર્મ સેટિંગ્સ',
    pa: 'ਪਲੇਟਫਾਰਮ ਸੈਟਿੰਗਾਂ',
    es: 'Ajustes de plataforma',
  },
  customizeDesc: {
    en: 'Customize playback fidelity, privacy preferences, visual themes, and language.',
    hi: 'प्लेबैक फ़िडेलिटी, गोपनीयता, विज़ुअल थीम और भाषा अनुकूलित करें।',
    gu: 'પ્લેબેક ગુણવત્તા, ગોપનીયતા, વિઝ્યુઅલ થીમ્સ અને ભાષા કસ્ટમાઇઝ કરો.',
    pa: 'ਪਲੇਬੈਕ ਗੁਣਵੱਤਾ, ਗੋਪਨੀਯਤਾ, ਥੀਮ ਅਤੇ ਭਾਸ਼ਾ ਨੂੰ ਅਨੁਕੂਲਿਤ ਕਰੋ।',
    es: 'Personaliza la fidelidad de reproducción, privacidad, temas y lenguaje.',
  },
  audioQuality: {
    en: 'Audio Quality Settings',
    hi: 'ऑडियो गुणवत्ता सेटिंग्स',
    gu: 'ઓડિયો ક્વોલિટી સેટિંગ્સ',
    pa: 'ਆਡੀਓ ਗੁਣਵੱਤਾ ਸੈਟਿੰਗਾਂ',
    es: 'Ajustes de calidad de audio',
  },
  bitrateDesc: {
    en: 'Choose the streaming bitrate according to your network bandwidth.',
    hi: 'अपने नेटवर्क बैंडविड्थ के अनुसार स्ट्रीमिंग बिटरेट चुनें।',
    gu: 'તમારા નેટવર્ક બેન્ડવિડ્થ મુજબ સ્ટ્રીમિંગ બિટરેટ પસંદ કરો.',
    pa: 'ਆਪਣੇ ਨੈੱਟਵਰਕ ਬੈਂਡਵਿਡਥ ਦੇ ਅਨੁਸਾਰ ਸਟ੍ਰੀਮਿੰਗ ਬਿੱਟਰੇਟ ਚੁਣੋ।',
    es: 'Elija la tasa de bits de transmisión según su ancho de banda.',
  },
  defaultVolume: {
    en: 'Default Player Volume',
    hi: 'डिफ़ॉल्ट प्लेयर वॉल्यूम',
    gu: 'ડિફૉલ્ટ પ્લેયર વોલ્યુમ',
    pa: 'ਡਿਫੌਲਟ ਪਲੇਅਰ ਵਾਲੀਅਮ',
    es: 'Volumen predeterminado',
  },
  liveOutput: {
    en: 'Live output level',
    hi: 'लाइव आउटपुट स्तर',
    gu: 'લાઇવ આઉટપુટ લેવલ',
    pa: 'ਲਾਈਵ ਆਉਟਪੁੱਟ ਪੱਧਰ',
    es: 'Nivel de salida en vivo',
  },
  continuousAutoplay: {
    en: 'Continuous Autoplay',
    hi: 'निरंतर ऑटोप्ले',
    gu: 'સતત ઓટોપ્લે',
    pa: 'ਨਿਰੰਤਰ ਆਟੋਪਲੇ',
    es: 'Reproducción continua',
  },
  autoplayDesc: {
    en: 'Auto-cue next track upon completion',
    hi: 'समाप्त होने पर अगला गाना स्वतः कतारबद्ध करें',
    gu: 'ગીત પૂરું થતાં આગળનું ગીત આપમેળે શરૂ કરો',
    pa: 'ਖਤਮ ਹੋਣ ਤੇ ਅਗਲਾ ਟਰੈਕ ਆਟੋ-ਕਿਊ ਕਰੋ',
    es: 'Reproduce la siguiente pista automáticamente',
  },
  languageAppearance: {
    en: 'Language & Appearance',
    hi: 'भाषा और स्वरूप',
    gu: 'ભાષા અને દેખાવ',
    pa: 'ਭਾਸ਼ਾ ਅਤੇ ਦਿੱਖ',
    es: 'Idioma y apariencia',
  },
  appLanguage: {
    en: 'App Language',
    hi: 'ऐप भाषा',
    gu: 'એપ્લિકેશન ભાષા',
    pa: 'ਐਪ ਭਾਸ਼ਾ',
    es: 'Idioma de la aplicación',
  },
  voiceRecognition: {
    en: 'Voice Search Recognition',
    hi: 'वॉइस सर्च पहचान',
    gu: 'વૉઇસ શોધ ઓળખ',
    pa: 'ਵੌਇਸ ਖੋਜ ਪਛਾਣ',
    es: 'Reconocimiento de voz',
  },
  colorTheme: {
    en: 'Color Theme',
    hi: 'रंग थीम',
    gu: 'કલર થીમ',
    pa: 'ਰੰਗ ਥੀਮ',
    es: 'Tema de color',
  },
  saveAll: {
    en: 'Save All Preferences',
    hi: 'सभी प्राथमिकताएं सहेजें',
    gu: 'બધી પસંદગીઓ સાચવો',
    pa: 'ਸਾਰੀਆਂ ਤਰਜੀਹਾਂ ਸੁਰੱਖਿਅਤ ਕਰੋ',
    es: 'Guardar preferencias',
  },
  autoSaved: {
    en: 'Auto-saved in real time',
    hi: 'रीयल-टाइम में स्वतः सहेजा गया',
    gu: 'રીઅલ-ટાઇમમાં આપમેળે સાચવ્યું',
    pa: 'ਰੀਅਲ-ਟਾਈਮ ਵਿੱਚ ਆਟੋ-ਸੇਵ ਹੋਇਆ',
    es: 'Guardado en tiempo real',
  },
  realtimeSync: {
    en: 'Real-Time Auto-Save Active',
    hi: 'रीयल-टाइम ऑटो-सेव सक्रिय',
    gu: 'રીઅલ-ટાઇમ ઓટો-સેવ સક્રિય',
    pa: 'ਰੀਅਲ-ਟਾਈਮ ਆਟੋ-ਸੇਵ ਕਿਰਿਆਸ਼ੀਲ',
    es: 'Guardado automático activo',
  },
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('vibe_language') as SupportedLanguage;
    return saved && ['en', 'hi', 'gu', 'pa', 'es'].includes(saved) ? saved : 'en';
  });

  const setLanguage = (newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    localStorage.setItem('vibe_language', newLang);
    document.documentElement.lang = newLang;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[language] || entry.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};

