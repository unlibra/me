import type { ImageMetadata } from "astro";
import miraImg from "@/assets/works/mira.webp";
import botsuImg from "@/assets/works/botsu.webp";
import fostyNaturalImg from "@/assets/works/fosty-natural.webp";
import fostyDarkImg from "@/assets/works/fosty-dark.webp";
import dummyImg from "@/assets/works/dummy.svg";
import npmImg from "@/assets/npm.svg";
import pypiImg from "@/assets/pypi.svg";
import { site, type SitePath } from "@/config/site";
import { toolIcons, toolPath } from "@/config/tools";
import type messages from "@/messages/ja";

/** Work categories in display order. */
export const categories = ["keyboard", "software", "web", "vrchat"] as const;
export type Category = (typeof categories)[number];

/** Subcategories of VRChat works, in display order. */
export const vrchatSubcategories = ["avatar", "asset", "unity-tool"] as const;
export type VrchatSubcategory = (typeof vrchatSubcategories)[number];

/** Documentation pages live on docs.unlibra.com (design doc 3.6). */
export type DocsUrl = `https://docs.unlibra.com/${string}`;

/** Every work has a title and description in the messages. */
export type WorkId = keyof (typeof messages)["works"];

interface WorkBase {
  id: WorkId;
  year: string;
  image: ImageMetadata;
  /** Where the work is published or sold: a site path or an external URL. */
  link?: SitePath | `https://${string}`;
  docs?: DocsUrl;
}

/** Only VRChat works have a subcategory, and they always have one. */
export type Work =
  | (WorkBase & {
      category: Exclude<Category, "vrchat">;
      subcategory?: never;
    })
  | (WorkBase & {
      category: "vrchat";
      subcategory: VrchatSubcategory;
    });

/** Works in display order within each category. */
export const works: Work[] = [
  {
    id: "fosty-natural",
    category: "keyboard",
    year: "2025",
    image: fostyNaturalImg,
  },
  {
    id: "fosty-dark",
    category: "keyboard",
    year: "2025",
    image: fostyDarkImg,
  },
  {
    id: "botsu",
    category: "keyboard",
    year: "2024",
    image: botsuImg,
  },
  {
    id: "mira-zero",
    category: "keyboard",
    year: "2023",
    image: miraImg,
  },
  {
    id: "i18n-tiny-astro",
    category: "software",
    year: "2025",
    image: npmImg,
    link: "https://www.npmjs.com/package/@i18n-tiny/astro",
    docs: "https://docs.unlibra.com/i18n-tiny/astro/introduction",
  },
  {
    id: "i18n-tiny-next",
    category: "software",
    year: "2025",
    image: npmImg,
    link: "https://www.npmjs.com/package/@i18n-tiny/next",
    docs: "https://docs.unlibra.com/i18n-tiny/next/introduction",
  },
  {
    id: "tkinter-unblur",
    category: "software",
    year: "2020",
    image: pypiImg,
    link: "https://pypi.org/project/tkinter-unblur",
    docs: "https://docs.unlibra.com/tkinter-unblur/",
  },
  {
    id: "tw-palette-generator",
    category: "web",
    year: "2025",
    image: toolIcons["tw-palette-generator"],
    link: toolPath("tw-palette-generator", "ja"),
  },
  {
    id: "favicon-generator",
    category: "web",
    year: "2025",
    image: toolIcons["favicon-generator"],
    link: toolPath("favicon-generator", "ja"),
  },
  {
    id: "svg-optimizer",
    category: "web",
    year: "2025",
    image: toolIcons["svg-optimizer"],
    link: toolPath("svg-optimizer", "ja"),
  },
  {
    id: "password-generator",
    category: "web",
    year: "2025",
    image: toolIcons["password-generator"],
    link: toolPath("password-generator", "ja"),
  },
  // Dummy items until the real BOOTH items are ready (design doc 3.6).
  {
    id: "dummy-avatar",
    category: "vrchat",
    subcategory: "avatar",
    year: "2026",
    image: dummyImg,
    link: site.links.booth,
  },
  {
    id: "dummy-asset",
    category: "vrchat",
    subcategory: "asset",
    year: "2026",
    image: dummyImg,
    link: site.links.booth,
  },
  {
    id: "dummy-unity-tool",
    category: "vrchat",
    subcategory: "unity-tool",
    year: "2026",
    image: dummyImg,
    link: site.links.booth,
  },
];
