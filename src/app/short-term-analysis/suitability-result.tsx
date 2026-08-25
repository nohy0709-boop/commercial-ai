import { COLORS } from '@/constants/colors';
import type { EventName, OperatingField } from '@/data/mockShortTermData';
import { getShortTermResult } from '@/data/mockShortTermData';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function ShortTermSuitabilityResultScreen() {
  const {field, eventName} = useLocalSearchParams<{
    field: OperatingField;
    eventName: EventName;
  }>();

  const result =
    getShortTermResult(field, eventName);

  const rows: {
    label: string;
    value: string;
  }[] = [
    {
      label: '예상 유동인구',
      value: result.expectedFootfall,
    },
    {
      label: '예상 경쟁 부스 수',
      value: `${result.competitorBoothCount}개`,
    },
    {
      label: '예상 수익',
      value: result.estimatedRevenue,
    },
    {
      label: '주요 방문객 연령층',
      value: result.mainVisitorAgeGroup,
    },
    {
      label: '경쟁도',
      value: result.competitionLevel,
    },
    {
      label: '행사 지역',
      value: result.eventRegion,
    },
    {
      label: '운영 기간',
      value: result.eventPeriod,
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
          단기 상권 적합성 분석
        </Text>

        <Text style={styles.title}>
          {`${eventName} · ${field}`}
        </Text>

        <Text style={styles.description}>
          선택한 행사와 운영 분야의 적합도를 분석했어요.
        </Text>
      </View>

      <View style={styles.scoreBox}>
        <Text style={styles.scoreLabel}>
          적합도 점수
        </Text>

        <Text style={styles.scoreValue}>
          {result.suitabilityScore}
          <Text style={styles.scoreUnit}>
            점
          </Text>
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
    lineHeight: 19,
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