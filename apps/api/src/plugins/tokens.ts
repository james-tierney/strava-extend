// apps/api/src/plugins/tokens.ts
export type TokenBundle = {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch seconds
};

const TOKENS = new Map<number, TokenBundle>(); // key: athlete.id

export function setTokens(athleteId: number, t: TokenBundle) {
  TOKENS.set(athleteId, t);
}
export function getTokens(athleteId: number) {
  return TOKENS.get(athleteId);
}
