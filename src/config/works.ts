import type { ImageMetadata } from "astro";
import miraImg from "@/assets/works/mira.webp";
import botsuImg from "@/assets/works/botsu.webp";
import fostyNaturalImg from "@/assets/works/fosty-natural.webp";
import fostyDarkImg from "@/assets/works/fosty-dark.webp";
import dummyImg from "@/assets/works/dummy.svg";
// Images that show material by other creators (LICENSE, section 3).
import mururuBlinkLipsyncImg from "@/assets/works/third-party/mururu-blink-lipsync.webp";
import npmImg from "@/assets/npm.svg";
import pypiImg from "@/assets/pypi.svg";
import { site, type SitePath } from "@/config/site";
import { toolIcons, toolPath } from "@/config/tools";
import type messages from "@/messages/ja";

/** Work categories in display order. */
export const categories = ["keyboards", "libraries", "apps", "vr-3d"] as const;
export type Category = (typeof categories)[number];

/** Subcategories of VR & 3D works, in display order. */
export const vr3dSubcategories = ["avatar", "asset", "unity-tool"] as const;
export type Vr3dSubcategory = (typeof vr3dSubcategories)[number];

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
  /** Shown as a large, full-width card in its category. */
  featured?: true;
  /**
   * Where a photo is cropped to the frame: "top" keeps its top in view (for
   * a credit there). Without it, the photo is cropped around its center.
   */
  imagePosition?: "top";
}

/** Only VR & 3D works have a subcategory, and they always have one. */
export type Work =
  | (WorkBase & {
      category: Exclude<Category, "vr-3d">;
      subcategory?: never;
    })
  | (WorkBase & {
      category: "vr-3d";
      subcategory: Vr3dSubcategory;
    });

/** Works in display order within each category. */
export const works: Work[] = [
  {
    id: "fosty-natural",
    category: "keyboards",
    year: "2025",
    image: fostyNaturalImg,
    featured: true,
  },
  {
    id: "fosty-dark",
    category: "keyboards",
    year: "2025",
    image: fostyDarkImg,
  },
  {
    id: "botsu",
    category: "keyboards",
    year: "2024",
    image: botsuImg,
  },
  {
    id: "mira-zero",
    category: "keyboards",
    year: "2023",
    image: miraImg,
  },
  {
    id: "i18n-tiny-astro",
    category: "libraries",
    year: "2025",
    image: npmImg,
    link: "https://www.npmjs.com/package/@i18n-tiny/astro",
    docs: "https://docs.unlibra.com/i18n-tiny/astro/introduction",
  },
  {
    id: "i18n-tiny-next",
    category: "libraries",
    year: "2025",
    image: npmImg,
    link: "https://www.npmjs.com/package/@i18n-tiny/next",
    docs: "https://docs.unlibra.com/i18n-tiny/next/introduction",
  },
  {
    id: "tkinter-unblur",
    category: "libraries",
    year: "2020",
    image: pypiImg,
    link: "https://pypi.org/project/tkinter-unblur",
    docs: "https://docs.unlibra.com/tkinter-unblur/",
  },
  {
    id: "tw-palette-generator",
    category: "apps",
    year: "2025",
    image: toolIcons["tw-palette-generator"],
    link: toolPath("tw-palette-generator", "ja"),
  },
  {
    id: "favicon-generator",
    category: "apps",
    year: "2025",
    image: toolIcons["favicon-generator"],
    link: toolPath("favicon-generator", "ja"),
  },
  {
    id: "svg-optimizer",
    category: "apps",
    year: "2025",
    image: toolIcons["svg-optimizer"],
    link: toolPath("svg-optimizer", "ja"),
  },
  {
    id: "password-generator",
    category: "apps",
    year: "2025",
    image: toolIcons["password-generator"],
    link: toolPath("password-generator", "ja"),
  },
  {
    id: "mururu-blink-lipsync",
    category: "vr-3d",
    subcategory: "unity-tool",
    // Provisional (being confirmed with the owner).
    year: "2026",
    image: mururuBlinkLipsyncImg,
    // The image's credit is in its top right corner: keep the top in view.
    imagePosition: "top",
    link: "https://unlibra-twin.booth.pm/items/9009879",
  },
  // Dummy items until the real BOOTH items are ready (design doc 3.6).
  {
    id: "dummy-avatar",
    category: "vr-3d",
    subcategory: "avatar",
    year: "2026",
    image: dummyImg,
    link: site.links.booth,
  },
  {
    id: "dummy-asset",
    category: "vr-3d",
    subcategory: "asset",
    year: "2026",
    image: dummyImg,
    link: site.links.booth,
  },
  {
    id: "dummy-unity-tool",
    category: "vr-3d",
    subcategory: "unity-tool",
    year: "2026",
    image: dummyImg,
    link: site.links.booth,
  },
];

/** Link to a category's section on the top page, e.g. "/#apps". */
export const categoryHref = (category: Category): `/#${Category}` =>
  `/#${category}`;
