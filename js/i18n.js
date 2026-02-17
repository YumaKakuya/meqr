(() => {
  "use strict";

  const LANG_KEY = "meqr_lang";
  const DEFAULT_LANG = "ja";
  const SUPPORTED = ["ja", "en"];

  let currentSetting = "auto"; // "auto" | "ja" | "en"
  let currentLang = DEFAULT_LANG;
  let messages = {};

  function detectBrowserLang() {
    const nav = navigator.language || navigator.userLanguage || "";
    if (nav.toLowerCase().startsWith("ja")) return "ja";
    return "en";
  }

  function resolveLang(setting) {
    if (setting === "ja" || setting === "en") return setting;
    return detectBrowserLang();
  }

  function getByPath(obj, path) {
    return path.split(".").reduce((acc, key) => (acc && acc[key] != null ? acc[key] : null), obj);
  }

  function applyTranslations() {
    if (!messages || !Object.keys(messages).length) return;

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const val = getByPath(messages, key);
      if (typeof val === "string") {
        el.textContent = val;
      }
    });
  }

  async function loadLang(lang) {
    const safeLang = SUPPORTED.includes(lang) ? lang : DEFAULT_LANG;
    try {
      const res = await fetch(`./lang/${safeLang}.json`);
      if (!res.ok) throw new Error("failed to load lang file");
      messages = await res.json();
      currentLang = safeLang;
      applyTranslations();
    } catch (e) {
      console.warn("MeQR i18n: failed to load language:", e);
    }
  }

  async function setLanguage(setting) {
    currentSetting = setting;
    localStorage.setItem(LANG_KEY, setting);
    const lang = resolveLang(setting);
    await loadLang(lang);
  }

  async function initI18n() {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "ja" || saved === "en" || saved === "auto") {
      currentSetting = saved;
    } else {
      currentSetting = "auto";
    }
    const lang = resolveLang(currentSetting);
    await loadLang(lang);
  }

  function syncLanguageControls() {
    const setting = currentSetting;
    const auto = document.getElementById("meqr-lang-auto");
    const ja = document.getElementById("meqr-lang-ja");
    const en = document.getElementById("meqr-lang-en");

    if (!auto || !ja || !en) return;

    auto.checked = setting === "auto";
    ja.checked = setting === "ja";
    en.checked = setting === "en";
  }

  function attachLanguageControlHandlers() {
    const container = document.getElementById("meqr-lang-options");
    if (!container) return;
    container.addEventListener("change", async (e) => {
      const target = e.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (target.name !== "meqr-lang") return;
      const value = target.value;
      if (value === "auto" || value === "ja" || value === "en") {
        await setLanguage(value);
      }
    });
    syncLanguageControls();
  }

  window.MeQRI18n = {
    initI18n,
    setLanguage,
    applyTranslations,
    syncLanguageControls,
    attachLanguageControlHandlers
  };
})();

