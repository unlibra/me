import type { ImageMetadata } from "astro";
import miraImg from "@/assets/works/mira.webp";
import botsuImg from "@/assets/works/botsu.webp"
import fostyNaturalImg from "@/assets/works/fosty-natural.webp";
import fostyDarkImg from "@/assets/works/fosty-dark.webp";
import eightPxImg from "@/assets/works/8pxapp.webp";
import iromideImg from "@/assets/works/iromide.webp";
import npmImg from "@/assets/npm.svg";
import pypiImg from "@/assets/pypi.svg";

export type Category = "web" | "software" | "keyboard";

export interface Work {
  id: string;
  category: Category;
  year: string;
  image?: ImageMetadata;
  link?: string;
}

export const works: Work[] = [
  {
    id: "liblab",
    category: "web",
    year: "2025",
    image: eightPxImg,
    link: "https://unlibra.com/lab",
  },
  {
    id: "tkinter-unblur",
    category: "software",
    year: "2020",
    image: pypiImg,
    link: "https://pypi.org/project/tkinter-unblur",
  },
  {
    id: "mira-zero",
    category: "keyboard",
    year: "2023",
    image: miraImg,
  },
  {
    id: "botsu",
    category: "keyboard",
    year: "2024",
    image: botsuImg,
  },
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
    id: "iromide",
    category: "web",
    year: "2025",
    image: iromideImg,
    link: "https://unlibra.com/lab/iromide",
  },
  {
    id: "i18n-tiny-next",
    category: "software",
    year: "2025",
    image: npmImg,
    link: "https://www.npmjs.com/package/@i18n-tiny/next",
  },
  {
    id: "i18n-tiny-astro",
    category: "software",
    year: "2025",
    image: npmImg,
    link: "https://www.npmjs.com/package/@i18n-tiny/astro",
  },
];
