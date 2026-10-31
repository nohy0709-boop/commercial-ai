import { supabase } from '@/lib/supabase';

/**
 * 파일명 기준 시점의 실제 상가 목록입니다.
 * 자료 사이의 월별 값은 생성하지 않습니다.
 */
export const USE_SAMPLE_DATA = false;

export type Granularity = 'month' | 'quarter' | 'year';

export type MonthlyRow = {
  month: string;
  storeCount: number;
  openCount: number;
  closeCount: number;
  intervalMonths: number;
  baseMonth: string | null;
  baseStoreCount: number | null;
  transferIn: number;
  transferOut: number;
};

export type TrendSource = {
  rows: MonthlyRow[];
  isSample: boolean;
  matchedBusiness: string;
};

export type TrendPoint = {
  key: string;
  label: string;
  storeCount: number;
  openCount: number;
  closeCount: number;
  openRate: number;
  closeRate: number;
  netChange: number;
  baseStoreCount: number;
  fromMonth: string;
  toMonth: string;
  transferIn: number;
  transferOut: number;
};

export type TrendSummary = {
  firstCount: number;
  lastCount: number;
  diff: number;
  totalOpen: number;
  totalClose: number;
  openRate: number | null;
  closeRate: number | null;
  netChange: number;
  reconciliationDifference: number;
  fromMonth: string;
  toMonth: string;
  coverageComplete: boolean;
  inferredBase: boolean;
  transferIn: number;
  transferOut: number;
};

/* ---------- 월 계산 도우미 ---------- */

function index(month: string): number {
  const [y, m] = month.split('-').map(Number);
  return y * 12 + m - 1;
}

export function addMonths(month: string, diff: number): string {
  const n = index(month) + diff;
  const y = Math.floor(n / 12);

  return `${y}-${String(n - y * 12 + 1).padStart(2, '0')}`;
}

export function monthText(month: string): string {
  if (!month) {
    return '';
  }

  const [y, m] = month.split('-');
  return `${y}년 ${Number(m)}월`;
}

const round1 = (n: number): number =>
  Math.round(n * 10) / 10;

const sum = (
  rows: MonthlyRow[],
  key: 'openCount' | 'closeCount' | 'transferIn' | 'transferOut',
): number => rows.reduce((n, row) => n + row[key], 0);

/* ---------- 업종명 ---------- */

/**
 * 정확히 일치하는 공식 업종명을 우선합니다.
 * 애매한 부분 문자열 매칭은 하지 않습니다.
 */
const ALIASES: Record<string, string> = {
  '전체 업종': '전체',
  양식: '서양식',
  커피: '카페',
  커피전문점: '카페',
  '커피 전문점': '카페',
  분식: '김밥/만두/분식',
  제과점: '빵/도넛',
  베이커리: '빵/도넛',
};

/* ---------- 데이터 가져오기 ---------- */

export async function fetchMonthlyRows(
  areaName: string,
  businessName: string,
): Promise<TrendSource> {
  const input = businessName.trim();

  const candidates = [
    ...new Set(
      [input, ALIASES[input]].filter(
        (s): s is string => !!s,
      ),
    ),
  ];

  for (const name of candidates) {
    const { data, error } = await supabase
      .from('store_trend_monthly')
      .select(
        'category_level, business_name, month, store_count, open_count, close_count, transfer_in, transfer_out, base_month, base_store_count, interval_months',
      )
      .eq('area_name', areaName.trim())
      .eq('business_name', name)
      .order('month', { ascending: true });

    if (error) {
      throw error;
    }

    if (!data?.length) {
      continue;
    }

    // 동일 이름이 여러 분류 단계에 있으면 가장 구체적인 분류를 사용합니다.
    const level = ['small', 'middle', 'large', 'all'].find(
      l => data.some(r => r.category_level === l),
    );

    const rows: MonthlyRow[] = data
      .filter(r => r.category_level === level)
      .map(r => ({
        month: String(r.month),
        storeCount: Number(r.store_count),
        openCount:
          r.open_count === null
            ? Number.NaN
            : Number(r.open_count),
        closeCount:
          r.close_count === null
            ? Number.NaN
            : Number(r.close_count),
        transferIn:
          r.transfer_in === null
            ? Number.NaN
            : Number(r.transfer_in),
        transferOut:
          r.transfer_out === null
            ? Number.NaN
            : Number(r.transfer_out),
        baseMonth:
          r.base_month === null
            ? null
            : String(r.base_month),
        baseStoreCount:
          r.base_store_count === null
            ? null
            : Number(r.base_store_count),
        intervalMonths: Number(r.interval_months),
      }));

    return {
      rows,
      isSample: false,
      matchedBusiness: name,
    };
  }

  return {
    rows: [],
    isSample: false,
    matchedBusiness: input,
  };
}

/* ---------- 집계 도우미 ---------- */

export function getCadence(rows: MonthlyRow[]): number {
  return rows.reduce(
    (max, r) => Math.max(max, r.intervalMonths),
    1,
  );
}

export function getMonthRange(
  rows: MonthlyRow[],
): {
  minMonth: string;
  maxMonth: string;
} | null {
  const months = rows.map(r => r.month).sort();

  return months.length
    ? {
        minMonth: months[0],
        maxMonth: months[months.length - 1],
      }
    : null;
}

export function getSnapshotMonths(
  rows: MonthlyRow[],
): string[] {
  return [...new Set(rows.map(r => r.month))].sort();
}

/* ---------- 선택 기간 전체 요약 ---------- */

/**
 * 시작 스냅샷에서 끝 스냅샷까지 비교합니다.
 * 시작 행에 기록된 이전 기간의 변화는 합산하지 않습니다.
 */
export function summarizeTrend(
  rows: MonthlyRow[],
  from: string,
  to: string,
): TrendSummary | null {
  const sorted = [...rows].sort(
    (a, b) => a.month.localeCompare(b.month),
  );

  const first = sorted.find(r => r.month === from);
  const last = sorted.find(r => r.month === to);

  if (!first || !last || from >= to) {
    return null;
  }

  const selected = sorted.filter(
    r => r.month > from && r.month <= to,
  );

  const complete =
    selected.length > 0 &&
    selected.every(
      (r, i) =>
        r.baseMonth ===
          (i ? selected[i - 1].month : first.month) &&
        r.baseStoreCount ===
          (i
            ? selected[i - 1].storeCount
            : first.storeCount) &&
        [
          r.openCount,
          r.closeCount,
          r.transferIn,
          r.transferOut,
        ].every(Number.isFinite),
    );

  const totalOpen = sum(selected, 'openCount');
  const totalClose = sum(selected, 'closeCount');
  const transferIn = sum(selected, 'transferIn');
  const transferOut = sum(selected, 'transferOut');

  const diff = last.storeCount - first.storeCount;
  const netChange = totalOpen - totalClose;

  return {
    firstCount: first.storeCount,
    lastCount: last.storeCount,
    diff,
    totalOpen,
    totalClose,
    openRate:
      complete && first.storeCount > 0
        ? round1((totalOpen / first.storeCount) * 100)
        : null,
    closeRate:
      complete && first.storeCount > 0
        ? round1((totalClose / first.storeCount) * 100)
        : null,
    netChange,
    transferIn,
    transferOut,
    reconciliationDifference:
      diff - netChange - transferIn + transferOut,
    fromMonth: from,
    toMonth: to,
    coverageComplete: complete,
    inferredBase: false,
  };
}

/* ---------- 그래프용 집계 ---------- */

export function aggregateTrend(
  rows: MonthlyRow[],
  granularity: Granularity,
  from: string,
  to: string,
): TrendPoint[] {
  const sorted = [...rows].sort(
    (a, b) => a.month.localeCompare(b.month),
  );

  const selected = sorted.filter(
    r => r.month >= from && r.month <= to,
  );

  const groups = new Map<string, MonthlyRow[]>();

  for (const row of selected) {
    // 간격이 다른 원본을 분기로 강제 집계하지 않습니다.
    // 연도별 또는 기준 시점별로 표시합니다.
    const key =
      granularity === 'year'
        ? row.month.slice(0, 4)
        : row.month;

    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  return [...groups.entries()].map(([key, group]) => {
    const last = group[group.length - 1];
    const flows = group.filter(r => r.month > from);

    const start = flows[0]?.baseMonth ?? last.month;

    const summary = flows.length
      ? summarizeTrend(sorted, start, last.month)
      : null;

    const valid = summary?.coverageComplete;

    return {
      key,
      label:
        granularity === 'year'
          ? key
          : `${key.slice(2, 4)}.${key.slice(5)}`,
      storeCount: last.storeCount,
      openCount:
        valid ? summary.totalOpen : Number.NaN,
      closeCount:
        valid ? summary.totalClose : Number.NaN,
      openRate: summary?.openRate ?? Number.NaN,
      closeRate: summary?.closeRate ?? Number.NaN,
      netChange: summary?.netChange ?? Number.NaN,
      baseStoreCount:
        summary?.firstCount ?? last.storeCount,
      fromMonth: start,
      toMonth: last.month,
      transferIn:
        valid ? summary.transferIn : Number.NaN,
      transferOut:
        valid ? summary.transferOut : Number.NaN,
    };
  });
}