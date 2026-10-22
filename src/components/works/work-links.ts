// The links of a work: its documentation, and where it is published or sold.
// The card and the details (dialog) show the same links, with the same
// labels, in the same order.
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

/**
 * The main link's label: the same on the card and in the details, so that
 * the same link has the same name (ui-revise3, the parent's decision).
 */
const labels = {
  tool: t.useTool,
  npm: t.npm,
  pypi: t.pypi,
  booth: t.viewOnBooth,
} as const satisfies Record<LinkKind, string>;

const mainLink = (work: Work): WorkLink[] =>
  work.link
    ? [
        {
          label: labels[kindOf(work, work.link)],
          href: work.link,
          external: work.link.startsWith("https://"),
        },
      ]
    : [];

const docsLink = (work: Work): WorkLink[] =>
  work.docs
    ? [{ label: messages.links.docs, href: work.docs, external: true }]
    : [];

/**
 * A work's links, on its card (as actions that go to the place directly,
 * ui-revise3 3) and in its details: the documentation, then the main link.
 * Works without links (DIY Keyboards) have none and show "詳しく見る" only.
 */
export const linksOf = (work: Work): WorkLink[] => [
  ...docsLink(work),
  ...mainLink(work),
];
