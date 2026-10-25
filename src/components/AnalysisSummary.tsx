import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import type { AttachedAnalysis } from '@/services/community';

function fmt(n: number): string {
  try {
    return n.toLocaleString('ko-KR');
  } catch {
    return String(n);
  }
}

/** 후보지 분석 요약(지역·업종·주요 수치). 팀 후보지, 공유 화면에서 같이 써요 */
export function AnalysisSummary({ analysis }: { analysis: AttachedAnalysis }) {
  const a = analysis;
  const stats: { label: string; value: string }[] = [];

  if (a.rank != null) {
    stats.push({ label: '순위', value: `${a.rank}${a.totalCount ? `/${a.totalCount}` : ''}위` });
  }
  if (a.suitabilityScore != null) {
    stats.push({ label: '적합도', value: `${a.suitabilityScore}점` });
  }
  if (a.floatingPopulation != null) {
    stats.push({ label: '유동인구', value: fmt(a.floatingPopulation) });
  }
  if (a.storeCount != null) {
    stats.push({ label: '점포 수', value: `${fmt(a.storeCount)}곳` });
  }
  if (a.competitionDensity != null) {
    stats.push({ label: '경쟁밀도', value: String(a.competitionDensity) });
  }
  if (a.averageSalesPerStore != null) {
    stats.push({ label: '점포당 매출', value: fmt(a.averageSalesPerStore) });
  }

  return (
    <View>
      <Text style={styles.title}>
        {a.areaName || '지역'} · {a.businessName}
      </Text>
      {stats.length > 0 ? (
        <View style={styles.row}>
          {stats.map(s => (
            <View key={s.label} style={styles.stat}>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  stat: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statLabel: { fontSize: 11, color: COLORS.textSecondary },
  statValue: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginTop: 1 },
});