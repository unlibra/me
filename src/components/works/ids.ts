import type { Work } from "@/config/works";

/** The id of a work's detail dialog, and of its title. */
export const dialogId = (work: Work): string => `work-${work.id}`;
export const dialogTitleId = (work: Work): string => `work-${work.id}-title`;
