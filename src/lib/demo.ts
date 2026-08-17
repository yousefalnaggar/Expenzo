// The demo account (advertised on the login page, per CLAUDE.md's "Try the
// demo" button) shares one set of credentials across every visitor — without
// this, one visitor could rename/delete the account or its categories out
// from under everyone else trying the demo. Checked server-side in every
// mutating Server Action, not just hidden in the UI (CLAUDE.md Security Rule
// #2 pattern: UI-only checks aren't a real gate).
export const DEMO_USER_EMAIL = "demo@expenzo.app";

export function isDemoEmail(email: string): boolean {
  return email === DEMO_USER_EMAIL;
}

export const DEMO_LOCK_ERROR = "This is a demo account and can't be changed.";
