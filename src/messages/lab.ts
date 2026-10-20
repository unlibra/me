// Texts of the tool list pages (/lab, /en/lab).
import type { Locale } from "@/config/locales";
import type { SameStructure } from "@/messages/types";

const ja = {
  description:
    "その色も、そのアイコンも、思い通りに。Favicon生成、カラーパレット作成、SVG最適化など、Web・アプリ開発者のための無料ツールセット。アカウント登録不要、すぐに使えます。",
} as const;

export type LabMessages = SameStructure<typeof ja>;

const en: LabMessages = {
  description:
    "Craft your perfect colors and icons. A free toolkit for web and app developers, including favicon generation, color palette creation, SVG optimization, and more. No account needed, start creating instantly.",
};

export const labMessages: Record<Locale, LabMessages> = { ja, en };
