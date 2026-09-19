import { COLORS } from '@/constants/colors';
import type { EventName, OperatingField } from '@/data/mockShortTermData';
import { getShortTermResult } from '@/data/mockShortTermData';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ShortTermSuitabilityResultScreen() {
  const router = useRouter();

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
    <View style={styles.screen}>
      <View style={styles.appBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.appBarTitle}>{`${eventName} · ${field}`}</Text>
          <Text style={styles.appBarSubtitle}>단기 상권 적합성 분석</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.headerSection}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>단기 상권 분석</Text>
        </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },

  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginLeft: -6,
  },
  backButtonText: { fontSize: 26, color: COLORS.text, marginTop: -2 },
  appBarTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  appBarSubtitle: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },

  scroll: { flex: 1 },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  headerSection: {
    marginBottom: 20,
  },

  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.warningLight,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 11,
    marginBottom: 12,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: COLORS.warning },

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

    backgroundColor: COLORS.warningLight,

    borderWidth: 1,
    borderColor: '#FDE9C8',
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

    color: COLORS.warning,
  },

  scoreUnit: {
    fontSize: 17,
    fontWeight: '800',

    color: COLORS.warning,
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

    backgroundColor: COLORS.warning,

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

    backgroundColor: COLORS.warning,

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