import type { ImageMetadata } from "astro";
import miraImg from "@/assets/works/mira.webp";
import botsuImg from "@/assets/works/botsu.webp";
import fostyNaturalImg from "@/assets/works/fosty-natural.webp";
import fostyDarkImg from "@/assets/works/fosty-dark.webp";
// Images that show material by other creators (LICENSE, section 3).
import mururuBlinkLipsyncImg from "@/assets/works/third-party/mururu-blink-lipsync.webp";
import npmImg from "@/assets/npm.svg";
import pypiImg from "@/assets/pypi.svg";
import type { SitePath } from "@/config/site";
import { toolIcons, toolPath } from "@/config/tools";
import type messages from "@/messages/ja";

/** Work categories in display order. */
export const categories = ["keyboards", "libraries", "apps", "vr-3d"] as const;
export type Category = (typeof categories)[number];

/** Documentation pages live on docs.unlibra.com (design doc 3.6). */
export type DocsUrl = `https://docs.unlibra.com/${string}`;

/** Every work has a title and summary in the messages. */
export type WorkId = keyof (typeof messages)["works"];

interface WorkBase {
  id: WorkId;
  image: ImageMetadata;
  /** Shown as a large, full-width card in its category. */
  featured?: true;
  /**
   * Where a photo is cropped to the frame: "top" keeps its top in view (for
   * a credit there). Without it, the photo is cropped around its center.
   */
  imagePosition?: "top";
}

/**
 * DIY Keyboards have no links: their cards open the details (ui-revise4 2).
 * The works of the other categories have a link, and their cards go there
 * directly; Libraries have their documentation too.
 */
export type Work =
  | (WorkBase & { category: "keyboards"; link?: never; docs?: never })
  | (WorkBase & {
      category: "libraries";
      /** The package on npm or PyPI. */
      link: `https://${string}`;
      docs?: DocsUrl;
    })
  | (WorkBase & {
      category: "apps";
      /** The tool's page. */
      link: SitePath;
      docs?: never;
    })
  | (WorkBase & {
      category: "vr-3d";
      /** The item on BOOTH. */
      link: `https://${string}`;
      docs?: never;
    });

/** Works in display order within each category. */
export const works: Work[] = [
  {
    id: "fosty-natural",
    category: "keyboards",
    image: fostyNaturalImg,
    featured: true,
  },
  {
    id: "fosty-dark",
    category: "keyboards",
    image: fostyDarkImg,
  },
  {
    id: "botsu",
    category: "keyboards",
    image: botsuImg,
  },
  {
    id: "mira-zero",
    category: "keyboards",
    image: miraImg,
  },
  {
    id: "i18n-tiny-astro",
    category: "libraries",
    image: npmImg,
    link: "https://www.npmjs.com/package/@i18n-tiny/astro",
    docs: "https://docs.unlibra.com/i18n-tiny/astro/introduction",
  },
  {
    id: "i18n-tiny-next",
    category: "libraries",
    image: npmImg,
    link: "https://www.npmjs.com/package/@i18n-tiny/next",
    docs: "https://docs.unlibra.com/i18n-tiny/next/introduction",
  },
  {
    id: "tkinter-unblur",
    category: "libraries",
    image: pypiImg,
    link: "https://pypi.org/project/tkinter-unblur",
    docs: "https://docs.unlibra.com/tkinter-unblur/",
  },
  {
    id: "tw-palette-generator",
    category: "apps",
    image: toolIcons["tw-palette-generator"],
    link: toolPath("tw-palette-generator", "ja"),
  },
  {
    id: "favicon-generator",
    category: "apps",
    image: toolIcons["favicon-generator"],
    link: toolPath("favicon-generator", "ja"),
  },
  {
    id: "svg-optimizer",
    category: "apps",
    image: toolIcons["svg-optimizer"],
    link: toolPath("svg-optimizer", "ja"),
  },
  {
    id: "password-generator",
    category: "apps",
    image: toolIcons["password-generator"],
    link: toolPath("password-generator", "ja"),
  },
  {
    id: "mururu-blink-lipsync",
    category: "vr-3d",
    image: mururuBlinkLipsyncImg,
    // The image's credit is in its top right corner: keep the top in view.
    imagePosition: "top",
    link: "https://unlibra-twin.booth.pm/items/9009879",
  },
];

/** Link to a category's section on the top page, e.g. "/#apps". */
export const categoryHref = (category: Category): `/#${Category}` =>
  `/#${category}`;
