import { COLORS } from '@/constants/colors';
import type { Industry, Region } from '@/data/mockMarketAnalysisData';
import { getMarketAnalysisResult } from '@/data/mockMarketAnalysisData';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function AnalysisResultScreen() {
  const {industry, region} = useLocalSearchParams<{
    industry: Industry;
    region: Region;
  }>();

  // 실제 API 연동 시에는 이 한 줄만 fetch 호출로 교체하면 됩니다.
  const result = getMarketAnalysisResult(industry, region);

  const rows: {
    label: string;
    value: string;
  }[] = [
    {
      label: '유동인구',
      value: result.floatingPopulation,
    },
    {
      label: '경쟁업체 수',
      value: `${result.competitorCount}개`,
    },
    {
      label: '추정매출',
      value: result.estimatedRevenue,
    },
    {
      label: '주요 연령층',
      value: result.mainAgeGroup,
    },
    {
      label: '경쟁도',
      value: result.competitionLevel,
    },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerSection}>
        <Text style={styles.smallTitle}>
          적합성 분석 결과
        </Text>

        <Text style={styles.title}>
          {`${region} · ${industry} 분석 결과`}
        </Text>

        <Text style={styles.description}>
          선택한 지역과 업종의 데이터를 바탕으로
          적합도를 분석했어요.
        </Text>
      </View>

      <View style={styles.scoreBox}>
        <Text style={styles.scoreLabel}>
          적합도 점수
        </Text>

        <Text style={styles.scoreValue}>
          {result.suitabilityScore}
          <Text style={styles.scoreUnit}>점</Text>
        </Text>
      </View>

      <View style={styles.table}>
        {rows.map((row, index) => (
          <View
            key={row.label}
            style={[
              styles.row,
              index === rows.length - 1 &&
                styles.lastRow,
            ]}
          >
            <Text style={styles.rowLabel}>
              {row.label}
            </Text>

            <Text style={styles.rowValue}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.reasonBox}>
        <View style={styles.reasonHeader}>
          <View style={styles.reasonAccent} />

          <Text style={styles.reasonTitle}>
            추천 이유
          </Text>
        </View>

        {result.recommendationReasons.map(
          (reason, index) => (
            <View
              key={index}
              style={styles.reasonItemRow}
            >
              <View style={styles.reasonBullet} />

              <Text style={styles.reasonItem}>
                {reason}
              </Text>
            </View>
          ),
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: COLORS.background,
  },

  headerSection: {
    marginTop: 10,
    marginBottom: 20,
  },

  smallTitle: {
    fontSize: 12,
    fontWeight: '800',

    color: COLORS.primary,

    marginBottom: 6,
  },

  title: {
    fontSize: 24,
    fontWeight: '900',

    color: COLORS.text,

    marginBottom: 8,
  },

  description: {
    fontSize: 13,
    lineHeight: 20,

    color: COLORS.textSecondary,
  },

  scoreBox: {
    alignItems: 'center',
    justifyContent: 'center',

    paddingVertical: 26,

    marginBottom: 20,

    borderRadius: 18,

    backgroundColor: '#F1FFF5',

    borderWidth: 1,
    borderColor: '#D8F5E2',
  },

  scoreLabel: {
    fontSize: 12,
    fontWeight: '700',

    color: COLORS.textSecondary,

    marginBottom: 7,
  },

  scoreValue: {
    fontSize: 36,
    fontWeight: '900',

    color: COLORS.primary,
  },

  scoreUnit: {
    fontSize: 17,
    fontWeight: '800',

    color: COLORS.primary,
  },

  table: {
    borderWidth: 1,
    borderColor: COLORS.border,

    borderRadius: 16,

    overflow: 'hidden',

    marginBottom: 20,

    backgroundColor: COLORS.surface,
  },

  row: {
    flexDirection: 'row',

    justifyContent: 'space-between',
    alignItems: 'center',

    paddingVertical: 15,
    paddingHorizontal: 16,

    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  lastRow: {
    borderBottomWidth: 0,
  },

  rowLabel: {
    fontSize: 14,

    color: COLORS.textSecondary,
  },

  rowValue: {
    fontSize: 14,
    fontWeight: '800',

    color: COLORS.text,
  },

  reasonBox: {
    padding: 18,

    borderRadius: 16,

    backgroundColor: COLORS.surface,

    borderWidth: 1,
    borderColor: COLORS.border,
  },

  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 14,
  },

  reasonAccent: {
    width: 4,
    height: 20,

    borderRadius: 4,

    backgroundColor: COLORS.primary,

    marginRight: 9,
  },

  reasonTitle: {
    fontSize: 16,
    fontWeight: '900',

    color: COLORS.text,
  },

  reasonItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    marginBottom: 9,
  },

  reasonBullet: {
    width: 6,
    height: 6,

    borderRadius: 3,

    backgroundColor: COLORS.primary,

    marginTop: 7,
    marginRight: 9,
  },

  reasonItem: {
    flex: 1,

    fontSize: 13,
    lineHeight: 20,

    color: COLORS.text,
  },
});