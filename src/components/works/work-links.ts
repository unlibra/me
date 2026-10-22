// Where a work's card goes: the details (DIY Keyboards), or the work's links
// (where it is published or sold, then its documentation), the first of
// which the whole card links to (ui-revise4 2, ui-revise5 10, 11).
import type { Work } from "@/config/works";
import messages from "@/messages/ja";

export interface WorkLink {
  label: string;
  href: string;
  external: boolean;
}

const t = messages.workDetails;

type LinkKind = "app" | "npm" | "pypi" | "booth";

/** What a work's main link is. Unknown kinds of links stop the build. */
const kindOf = (work: Work, href: string): LinkKind => {
  switch (work.category) {
    case "apps":
      return "app";
    case "libraries":
      if (href.startsWith("https://www.npmjs.com/")) return "npm";
      if (href.startsWith("https://pypi.org/")) return "pypi";
      break;
    case "vr-3d":
      if (/^https:\/\/[\w-]+\.booth\.pm\//.test(href)) return "booth";
      break;
    case "keyboards":
      break;
  }
  throw new Error(`${work.id}: no label for the link ${href}`);
};

/** The main link's label (the same link has the same name everywhere). */
const labels = {
  app: t.openApp,
  npm: t.npm,
  pypi: t.pypi,
  booth: t.viewOnBooth,
} as const satisfies Record<LinkKind, string>;

const linkTo = (label: string, href: string): WorkLink => ({
  label,
  href,
  external: href.startsWith("https://"),
});

/**
 * A work's links, in order: the main link (the app, the package on npm or
 * PyPI, the item on BOOTH), then the documentation (ui-revise5 10). DIY
 * Keyboards have none.
 */
export const linksOf = (work: Work): WorkLink[] => [
  ...(work.link ? [linkTo(labels[kindOf(work, work.link)], work.link)] : []),
  ...(work.docs ? [linkTo(messages.links.docs, work.docs)] : []),
];

/** What a work's card opens: its details, or a link. */
export type CardTarget =
  | { kind: "details" }
  | { kind: "link"; link: WorkLink; actions: [WorkLink, ...WorkLink[]] };

/**
 * A card without links opens the details. A card with links goes to the
 * first (the app for Apps, npm or PyPI for Libraries, the item on BOOTH for
 * VR & 3D), and shows all its links as actions, the first one first
 * (ui-revise5 9, 11).
 */
export const cardTarget = (work: Work): CardTarget => {
  const [first, ...rest] = linksOf(work);
  if (!first) return { kind: "details" };
  return { kind: "link", link: first, actions: [first, ...rest] };
};
