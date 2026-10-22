// Texts of the header and footer shared by all pages.
import type { Locale } from "@/config/locales";
import type { Category } from "@/config/works";
import type { SameStructure } from "@/messages/types";

const ja = {
  header: {
    /**
     * Work categories, linking to their sections on the top page. The names
     * are in English (Title Case) in both languages, and the Japanese ones
     * are also the section headings of the top page.
     */
    categories: {
      keyboards: "DIY Keyboards",
      libraries: "Libraries",
      apps: "Apps",
      "vr-3d": "VR & 3D",
    } satisfies Record<Category, string>,
    menu: "メニュー",
    openMenu: "メニューを開く",
    closeMenu: "メニューを閉じる",
  },
  breadcrumb: {
    /** The first item: the top page. */
    home: "ホーム",
  },
  theme: {
    toggle: "テーマを切り替え",
    light: "ライト",
    dark: "ダーク",
    system: "システム",
  },
  language: {
    toggle: "言語を切り替え",
    label: "Language",
  },
  footer: {
    description:
      "個人開発のプロダクトを掲載しているサイトです。昼は本業のビルダー、夜は自作キーボード、ライブラリ、アプリ、VR & 3Dなどの個人開発をしています。",
    github: "GitHub",
    links: "Links",
    docs: "Docs",
    shop: "BOOTH",
    support: "Support",
    donate: "寄付・支援",
    privacyPolicy: "プライバシーポリシー",
  },
} as const;

export type LayoutMessages = SameStructure<typeof ja>;

const en: LayoutMessages = {
  header: {
    categories: {
      keyboards: "DIY Keyboards",
      libraries: "Libraries",
      apps: "Apps",
      "vr-3d": "VR & 3D",
    } satisfies Record<Category, string>,
    menu: "Menu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  breadcrumb: {
    // The top page is in Japanese only.
    home: "Home (Japanese)",
  },
  theme: {
    toggle: "Toggle theme",
    light: "Light",
    dark: "Dark",
    system: "System",
  },
  language: {
    toggle: "Change language",
    label: "Language",
  },
  footer: {
    // Provisional wording.
    description:
      "A site that collects my personal products. By day a builder at my job; by night I make DIY keyboards, libraries, apps, VR & 3D and more.",
    github: "GitHub",
    links: "Links",
    docs: "Docs",
    shop: "BOOTH",
    support: "Support",
    donate: "Donate & Support",
    privacyPolicy: "Privacy Policy (Japanese)",
  },
};

export const layoutMessages: Record<Locale, LayoutMessages> = { ja, en };

/** Language names, each written in its own language. */
export const localeNames = {
  ja: "日本語",
  en: "English",
} as const satisfies Record<Locale, string>;
