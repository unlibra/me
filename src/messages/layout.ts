// Texts of the header and footer shared by all pages.
import type { Locale } from "@/config/locales";
import type { Category } from "@/config/works";
import type { SameStructure } from "@/messages/types";

const ja = {
  header: {
    /**
     * Work categories, linking to their sections on the top page. The
     * Japanese names are also the section headings of the top page.
     */
    categories: {
      keyboard: "自作キーボード",
      software: "ソフトウェア",
      web: "WEBツール",
      vrchat: "VRChat",
    } satisfies Record<Category, string>,
    /** First item of the web tools menu: the web tools section. */
    allWebTools: "WEBツールの一覧",
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
      "unlibra の制作物をまとめたサイトです。自作キーボード、ソフトウェア、WEBツール、VRChat のアイテムを掲載しています。",
    github: "GitHub",
    links: "Links",
    docs: "ドキュメント",
    shop: "BOOTH ショップ",
    support: "Support",
    donate: "寄付・支援",
    privacyPolicy: "プライバシーポリシー",
  },
} as const;

export type LayoutMessages = SameStructure<typeof ja>;

const en: LayoutMessages = {
  header: {
    categories: {
      keyboard: "Keyboards",
      software: "Software",
      web: "Web Tools",
      vrchat: "VRChat",
    } satisfies Record<Category, string>,
    allWebTools: "All web tools",
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
    description:
      "A collection of works by unlibra: custom keyboards, software, web tools, and VRChat items.",
    github: "GitHub",
    links: "Links",
    docs: "Documentation",
    shop: "BOOTH Shop",
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
