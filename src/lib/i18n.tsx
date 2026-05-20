import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Lang = "en" | "ar";

const dict: Record<Lang, Record<string, string>> = {
  en: {
    appName: "IPTV Control",
    dashboard: "Dashboard",
    users: "Users",
    resellers: "Resellers",
    playlists: "Playlists",
    streams: "Streams",
    vod: "VOD Library",
    movies: "Movies",
    series: "Series",
    logs: "Logs",
    settings: "Settings",
    api: "API & Portal",
    signIn: "Sign in",
    signUp: "Sign up",
    signOut: "Sign out",
    email: "Email",
    password: "Password",
    create: "Create",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    search: "Search...",
    totalUsers: "Total subscribers",
    active: "Active",
    online: "Online now",
    revenue: "Revenue (credits)",
    resellerSales: "Reseller sales",
    serverStatus: "Server status",
    healthy: "Healthy",
    welcome: "Welcome back",
    adminPanel: "Admin Panel",
    language: "Language",
  },
  ar: {
    appName: "تحكم IPTV",
    dashboard: "لوحة التحكم",
    users: "المشتركون",
    resellers: "الموزعون",
    playlists: "قوائم التشغيل",
    streams: "القنوات",
    vod: "مكتبة الفيديو",
    movies: "أفلام",
    series: "مسلسلات",
    logs: "السجلات",
    settings: "الإعدادات",
    api: "API والبوابة",
    signIn: "تسجيل الدخول",
    signUp: "إنشاء حساب",
    signOut: "تسجيل الخروج",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    create: "إنشاء",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    search: "بحث...",
    totalUsers: "إجمالي المشتركين",
    active: "نشطون",
    online: "متصل الآن",
    revenue: "الإيرادات (نقاط)",
    resellerSales: "مبيعات الموزعين",
    serverStatus: "حالة السيرفر",
    healthy: "سليم",
    welcome: "مرحبًا بعودتك",
    adminPanel: "لوحة المشرف",
    language: "اللغة",
  },
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string };
const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const saved = (typeof window !== "undefined" && (localStorage.getItem("lang") as Lang)) || "en";
    setLangState(saved);
  }, []);
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    }
  }, [lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };
  const t = (k: string) => dict[lang][k] ?? k;
  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const c = useContext(I18nCtx);
  if (!c) throw new Error("useI18n must be used inside I18nProvider");
  return c;
}
