'use client';

import { useEffect, useState } from 'react';

export function useAthleteId() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    // 1) try from query string
    const fromQs = new URLSearchParams(window.location.search).get('athlete_id');
    if (fromQs) { setId(fromQs); return; }

    // 2) try cookie set by API callback
    const m = document.cookie.match(/(?:^|;\s*)athlete_id=([^;]+)/);
    setId(m ? decodeURIComponent(m[1]) : null);
  }, []);
  return id; // null until resolved
}
