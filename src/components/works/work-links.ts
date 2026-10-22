// Where a work's card goes: the details (DIY Keyboards), or the work's links
// (its documentation, and where it is published or sold), the first of
// which the whole card links to (ui-revise4 2).
import type { Work } from "@/config/works";
import messages from "@/messages/ja";

export interface WorkLink {
  label: string;
  href: string;
  external: boolean;
}

const t = messages.workDetails;

type LinkKind = "tool" | "npm" | "pypi" | "booth";

/** What a work's main link is. Unknown kinds of links stop the build. */
const kindOf = (work: Work, href: string): LinkKind => {
  switch (work.category) {
    case "apps":
      return "tool";
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
  tool: t.useTool,
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
 * A work's links, in order: the documentation, then the main link (the tool,
 * the package on npm or PyPI, the item on BOOTH). DIY Keyboards have none.
 */
export const linksOf = (work: Work): WorkLink[] => [
  ...(work.docs ? [linkTo(messages.links.docs, work.docs)] : []),
  ...(work.link ? [linkTo(labels[kindOf(work, work.link)], work.link)] : []),
];

/** What a work's card opens: its details, or a link. */
export type CardTarget =
  { kind: "details" } | { kind: "link"; link: WorkLink; actions: WorkLink[] };

/**
 * A card without links opens the details. A card with links goes to the
 * first (the documentation for Libraries, else npm or PyPI; the tool for
 * Apps; the item on BOOTH for VR & 3D), and shows the links as actions only
 * when there are two or more places to go.
 */
export const cardTarget = (work: Work): CardTarget => {
  const [first, ...rest] = linksOf(work);
  if (!first) return { kind: "details" };
  return {
    kind: "link",
    link: first,
    actions: rest.length > 0 ? [first, ...rest] : [],
  };
};
