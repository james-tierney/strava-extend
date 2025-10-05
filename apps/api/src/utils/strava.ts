// apps/api/src/utils/strava.ts
import axios from "axios";

export type StravaActivity = {
  id: number;
  type: string;
  distance: number;           // meters
  moving_time: number;        // seconds
  start_date: string;
  start_date_local: string;
  total_elevation_gain: number;
};

export function km(n: number) { return n / 1000; }

export function startOfISOWeek(d: Date) {
  const dd = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = dd.getUTCDay() || 7;
  if (day !== 1) dd.setUTCDate(dd.getUTCDate() - (day - 1));
  dd.setUTCHours(0,0,0,0);
  return dd;
}

export async function fetchActivities(accessToken: string, daysBack = 120): Promise<StravaActivity[]> {
  const after = Math.floor((Date.now() - daysBack*24*3600*1000) / 1000);
  const res = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { per_page: 200, after }
  });
  return res.data;
}

export async function exchangeCodeForTokens(code: string) {
  const r = await axios.post('https://www.strava.com/oauth/token', {
    client_id: process.env.STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    code,
    grant_type: 'authorization_code'
  });
  return r.data as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    athlete: { id: number };
  };
}

export async function refreshAccessToken(refresh_token: string) {
  const rr = await axios.post('https://www.strava.com/oauth/token', {
    client_id: process.env.STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token
  });
  return rr.data as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}
