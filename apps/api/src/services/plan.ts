// ESM only: no file-extension imports here since this file is stand-alone
export type Workout = {
  date: string;
  type: 'easy'|'tempo'|'interval'|'hills'|'long'|'rest'|'cross';
  desc: string;
};
export type WeekPlan = {
  week_index: number;
  target_km: number;
  cutback: boolean;
  workouts: Workout[];
};

function addDays(d: Date, days: number) { const x = new Date(d); x.setDate(x.getDate()+days); return x; }
function startOfISOWeek(d: Date) {
  const dd = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = dd.getUTCDay() || 7; if (day !== 1) dd.setUTCDate(dd.getUTCDate() - (day - 1));
  dd.setUTCHours(0,0,0,0); return dd;
}

export function generateBaselinePlan(
  startMonday: Date,
  weeks: number,
  baseKm: number,
  maxKm: number,
  longRunDay: 'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun',
  daysPerWeek: number
): WeekPlan[] {
  const out: WeekPlan[] = [];
  const daysMap = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const lrIdx = Math.max(0, daysMap.indexOf(longRunDay));
  let target = Math.min(Math.round(baseKm * 1.05), maxKm || Math.round(baseKm * 1.3));

  for (let w=0; w<weeks; w++) {
    const isCutback = (w+1) % 4 === 0 && w < weeks-2;
    if (w >= weeks-2) {
      target = Math.max(30, Math.round(target * (w===weeks-2 ? 0.75 : 0.55))); // 2-week taper
    } else if (isCutback) {
      target = Math.round(target * 0.85);
    } else {
      target = Math.min(Math.round(target * 1.08), maxKm || 9999);
    }

    const weekStart = addDays(startMonday, w*7);
    const workouts: Workout[] = [];

    const longKm = Math.round(target * 0.38);
    const easyRuns = Math.max(0, daysPerWeek - 3); // long + 2 quality
    const remainingKm = Math.max(0, target - longKm);
    const easyKmEach = Math.max(5, Math.min(12, Math.round(remainingKm / (easyRuns + 2))));

    // Tue tempo
    workouts.push({ date: addDays(weekStart, 2).toISOString().slice(0,10), type:'tempo', desc:`${easyKmEach}–${easyKmEach+2} km with 3×10 min @ LT, 3 min easy` });
    // Thu quality 2
    const q2 = (w % 2 === 0) ? 'hills' : 'interval';
    workouts.push({
      date: addDays(weekStart, 4).toISOString().slice(0,10),
      type: q2,
      desc: q2==='hills' ? '10×60s hill @ hard effort, jog down' : '6×800m @ 5K effort, 2–3 min easy'
    });
    // Long run chosen day
    workouts.push({ date: addDays(weekStart, lrIdx).toISOString().slice(0,10), type:'long', desc:`${longKm} km comfortable` });

    // Fill remaining days with easy
    for (let i=0;i<7;i++){
      const date = addDays(weekStart, i).toISOString().slice(0,10);
      if (workouts.some(wk => wk.date === date)) continue;
      if (workouts.length >= daysPerWeek) continue;
      workouts.push({ date, type:'easy', desc:`${easyKmEach} km easy (Z2)` });
    }

    workouts.sort((a,b)=>a.date<b.date?-1:1);
    out.push({ week_index: w+1, target_km: target, cutback: isCutback, workouts });
  }
  return out;
}

export function weeksUntil(dateISO: string, from: Date) {
  const ms = new Date(dateISO).getTime() - from.getTime();
  return Math.max(6, Math.min(20, Math.ceil(ms / (7*24*3600*1000))));
}

export function nextMonday(d = new Date()) {
  const dd = startOfISOWeek(new Date(d));
  dd.setDate(dd.getDate()+7); // start next week
  return dd;
}
