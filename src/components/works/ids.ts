import type { Work } from "@/config/works";

/** The id of a work's detail dialog, and of its title. */
export const dialogId = (work: Work): string => `work-${work.id}`;
export const dialogTitleId = (work: Work): string => `work-${work.id}-title`;

/** The ids of a card's button and of its "詳しく見る" label. */
export const openButtonId = (work: Work): string => `work-${work.id}-open`;
export const moreLabelId = (work: Work): string => `work-${work.id}-more`;
