import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpApi from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(HttpApi) // Load translations from external files
  .use(LanguageDetector) // Detects language
  .use(initReactI18next) // Initializes i18next with React
  .init({
    supportedLngs: ["en", "ar"], // Define supported languages
    fallbackLng: "en", // Fallback language
    debug: true, // Enable debugging
    detection: {
      order: ["localStorage", "cookie", "navigator", "htmlTag"], // Language detection order
      caches: ["localStorage", "cookie"], // Save language preference
    },
    backend: {
      loadPath: "/locales/{{lng}}.json", // Translation files location
    },
    interpolation: {
      escapeValue: false, // Not needed for React
    },
  });

export default i18n;