/**
 * Site sections that can be switched off without removing their content.
 *
 * SHOW_EXPERIENCE: the "Professional journey" timeline (the Experience section).
 * While it is false, the section, its navigation item and its data request are left out of the public
 * site. The entries themselves stay stored and stay editable in the Studio. To show the section again,
 * set this to true and set PUBLISHED to true in api/experiences.js. Nothing has to be re-entered.
 */
export const SHOW_EXPERIENCE: boolean = false;

/** Scene numbers (SC.02, SC.03 ...) stay consecutive while the Experience scene (SC.09) is hidden. */
export const scene = (n: number) => (SHOW_EXPERIENCE || n < 9 ? n : n - 1);

/**
 * SHOW_PROJECT_PAGES: the long project pages (overview, idea, details, responsibilities, outputs).
 * While it is false every picture, in the film archive and in the specialties, opens in the same viewer:
 * the picture, its title and its category. The written content stays stored with each archive entry
 * and shows again if this is set to true.
 */
export const SHOW_PROJECT_PAGES: boolean = false;
