// Helpers for the username-based login system.
// Lovable Cloud auth requires email — we synthesize internal emails from username + class scope.

export const USER_EMAIL_DOMAIN = "binary.local";

export const studentEmail = (username: string, grade: number) =>
  `s${grade}.${username.toLowerCase()}@${USER_EMAIL_DOMAIN}`;

export const teacherEmail = (username: string, min: number, max: number) =>
  `t${min}-${max}.${username.toLowerCase()}@${USER_EMAIL_DOMAIN}`;

export const adminEmail = (username: string) =>
  `admin.${username.toLowerCase()}@${USER_EMAIL_DOMAIN}`;

export const GRADES = [4, 5, 6, 7] as const;
export type Grade = (typeof GRADES)[number];
