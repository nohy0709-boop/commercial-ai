import { supabase } from '@/lib/supabase';

/**
 * 상권 변화 추이 데이터
 *
 * - 지금은 USE_SAMPLE_DATA = true 라서 "샘플 데이터"가 나옵니다. (화면 확인용)
 * - 실제 데이터를 Supabase 테이블(store_trend_monthly)에 넣은 뒤
 *   USE_SAMPLE_DATA 를 false 로 바꾸면 실제 데이터로 바뀝니다.
 */
export const USE_SAMPLE_DATA = true;

// 샘플 데이터 기간 (실제 데이터 연결 후에는 사용되지 않음)
const SAMPLE_START = '2023-01';
const SAMPLE_END = '2025-12';

export type Granularity = 'month' | 'quarter' | 'year';

/** DB/샘플의 원본 한 줄 (한 시점의 스냅샷 집계) */
export type MonthlyRow = {
  /** 'YYYY-MM' */
  month: string;
  /** 해당 시점의 점포 수 */
  storeCount: number;
  /** 직전 데이터 시점 이후 새로 생긴 점포 수 (추정) */
  openCount: number;
  /** 직전 데이터 시점 이후 사라진 점포 수 (추정) */
  closeCount: number;
  /** 직전 데이터와의 간격(개월). 월별 데이터면 1, 분기별 데이터면 3 */
  intervalMonths: number;
};

export type TrendPoint = {
  key: string;
  label: string;
  storeCount: number;
  openCount: number;
  closeCount: number;
  /** 개업률(%) = 신규 ÷ 기초 점포 수 */
  openRate: number;
  /** 폐업률(%) = 사라진 수 ÷ 기초 점포 수 */
  closeRate: number;
  /** 순증감 = 개업 - 폐업 */
  netChange: number;
};

/* ---------- 월 계산 도우미 ---------- */

function toIndex(month: string): number {
  const [y, m] = month.split('-').map(Number);
  return y * 12 + (m - 1);
}

function fromIndex(index: number): string {
  const y = Math.floor(index / 12);
  const m = (index % 12) + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
}

export function addMonths(month: string, diff: number): string {
  return fromIndex(toIndex(month) + diff);
}

export function monthText(month: string): string {
  const [y, m] = month.split('-');
  return `${y}년 ${Number(m)}월`;
}

/* ---------- 샘플 데이터 ---------- */

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeSampleRows(areaName: string, businessName: string): MonthlyRow[] {
  const rand = seededRandom(hashString(`${areaName}|${businessName}`));

  let count = 60 + Math.floor(rand() * 140);
  const drift = (rand() - 0.45) * 0.012;

  const rows: MonthlyRow[] = [];
  const total = toIndex(SAMPLE_END) - toIndex(SAMPLE_START);

  for (let i = 0; i <= total; i += 1) {
    const openRate = Math.max(0.005, 0.02 + rand() * 0.025 + drift);
    const closeRate = Math.max(0.005, 0.02 + rand() * 0.025 - drift);

    const open = Math.round(count * openRate);
    const close = Math.round(count * closeRate);

    count = Math.max(1, count + open - close);

    rows.push({
      month: fromIndex(toIndex(SAMPLE_START) + i),
      storeCount: count,
      openCount: open,
      closeCount: close,
      intervalMonths: 1,
    });
  }

  return rows;
}

/* ---------- 데이터 가져오기 ---------- */

export type TrendSource = {
  rows: MonthlyRow[];
  isSample: boolean;
};

export async function fetchMonthlyRows(
  areaName: string,
  businessName: string,
): Promise<TrendSource> {
  if (USE_SAMPLE_DATA) {
    return { rows: makeSampleRows(areaName, businessName), isSample: true };
  }

  const { data, error } = await supabase
    .from('store_trend_monthly')
    .select('month, store_count, open_count, close_count, interval_months')
    .eq('area_name', areaName)
    .eq('business_name', businessName)
    .order('month', { ascending: true });

  if (error) {
    throw error;
  }

  const rows: MonthlyRow[] = (data ?? []).map((r: any) => ({
    month: String(r.month),
    storeCount: Number(r.store_count ?? 0),
    openCount: Number(r.open_count ?? 0),
    closeCount: Number(r.close_count ?? 0),
    intervalMonths: Number(r.interval_months ?? 1) || 1,
  }));

  return { rows, isSample: false };
}

/* ---------- 집계 ---------- */

/** 데이터가 가장 촘촘한 간격(개월). 1이면 월별, 3이면 분기별 데이터 */
export function getCadence(rows: MonthlyRow[]): number {
  if (rows.length === 0) {
    return 1;
  }
  return Math.max(1, Math.min(...rows.map(r => r.intervalMonths)));
}

export function getMonthRange(rows: MonthlyRow[]): {
  minMonth: string;
  maxMonth: string;
} | null {
  if (rows.length === 0) {
    return null;
  }
  const months = rows.map(r => r.month).sort();
  return { minMonth: months[0], maxMonth: months[months.length - 1] };
}

function keyOf(month: string, granularity: Granularity): string {
  const [y, m] = month.split('-').map(Number);
  if (granularity === 'month') {
    return month;
  }
  if (granularity === 'quarter') {
    return `${y}-Q${Math.ceil(m / 3)}`;
  }
  return String(y);
}

function labelOf(key: string, granularity: Granularity): string {
  if (granularity === 'month') {
    const [y, m] = key.split('-');
    return `${y.slice(2)}.${m}`;
  }
  if (granularity === 'quarter') {
    const [y, q] = key.split('-Q');
    return `${y.slice(2)}.${q}Q`;
  }
  return key;
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

/**
 * 원본 데이터를 월/분기/연 단위로 묶어서 반환합니다.
 *  - 점포 수: 그 기간 마지막 시점의 점포 수
 *  - 개업/폐업 수: 기간 안의 합계
 *  - 개업률/폐업률: 기간 합계 ÷ 기간 시작 시점(기초) 점포 수 × 100
 */
export function aggregateTrend(
  rows: MonthlyRow[],
  granularity: Granularity,
  fromMonth: string,
  toMonth: string,
): TrendPoint[] {
  const sorted = [...rows].sort((a, b) => a.month.localeCompare(b.month));

  const groups = new Map<string, { rows: MonthlyRow[]; base: number }>();

  sorted.forEach((row, index) => {
    if (row.month < fromMonth || row.month > toMonth) {
      return;
    }

    const key = keyOf(row.month, granularity);
    let group = groups.get(key);

    if (!group) {
      const prev = index > 0 ? sorted[index - 1] : null;
      const base = prev
        ? prev.storeCount
        : Math.max(0, row.storeCount - row.openCount + row.closeCount);

      group = { rows: [], base };
      groups.set(key, group);
    }

    group.rows.push(row);
  });

  const points: TrendPoint[] = [];

  groups.forEach((group, key) => {
    const open = group.rows.reduce((sum, r) => sum + r.openCount, 0);
    const close = group.rows.reduce((sum, r) => sum + r.closeCount, 0);
    const last = group.rows[group.rows.length - 1];

    points.push({
      key,
      label: labelOf(key, granularity),
      storeCount: last.storeCount,
      openCount: open,
      closeCount: close,
      openRate: group.base > 0 ? round1((open / group.base) * 100) : 0,
      closeRate: group.base > 0 ? round1((close / group.base) * 100) : 0,
      netChange: open - close,
    });
  });

  return points;
}