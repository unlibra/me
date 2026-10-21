// The links in a work's details: where it is published or sold, and its
// documentation.
import type { Work } from "@/config/works";
import messages from "@/messages/ja";

export interface WorkLink {
  label: string;
  href: string;
  external: boolean;
}

const t = messages.workDetails;

/** The label of a work's main link. Unknown kinds of links stop the build. */
const mainLabel = (work: Work, href: string): string => {
  switch (work.category) {
    case "apps":
      return t.openTool;
    case "libraries":
      if (href.startsWith("https://www.npmjs.com/")) return t.viewOnNpm;
      if (href.startsWith("https://pypi.org/")) return t.viewOnPypi;
      break;
    case "vr-3d":
      if (/^https:\/\/[\w-]+\.booth\.pm\//.test(href)) return t.viewOnBooth;
      break;
    case "keyboards":
      break;
  }
  throw new Error(`${work.id}: no label for the link ${href}`);
};

export const linksOf = (work: Work): WorkLink[] => [
  ...(work.link
    ? [
        {
          label: mainLabel(work, work.link),
          href: work.link,
          external: work.link.startsWith("https://"),
        },
      ]
    : []),
  ...(work.docs
    ? [{ label: messages.links.docs, href: work.docs, external: true }]
    : []),
];
