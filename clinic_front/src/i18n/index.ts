// src/i18n/index.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Importation des fichiers de langue
import fr from "./fr.json";
import en from "./en.json";

i18n
  .use(LanguageDetector) // ✅ détecte la langue du navigateur automatiquement
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    fallbackLng: "fr", // ✅ si rien trouvé, français par défaut
    detection: {
      order: ["localStorage", "navigator", "htmlTag", "path", "subdomain"],
      caches: ["localStorage"], // garde la langue choisie
    },
    interpolation: {
      escapeValue: false, // ✅ React gère déjà l’échappement
    },
  });

export default i18n;
