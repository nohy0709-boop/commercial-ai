import { COLORS } from '@/constants/colors';
import type { EventName } from '@/data/mockShortTermData';
import {
  ALL_FIELDS,
  getRankedShortTermResults,
} from '@/data/mockShortTermData';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function EventRecommendResultScreen() {
  const router = useRouter();

  const {events} = useLocalSearchParams<{
    events: string;
  }>();

  const selectedEvents =
    events.split(',') as EventName[];

  const combos = selectedEvents.flatMap(eventName =>
    ALL_FIELDS.map(field => ({
      field,
      eventName,
    })),
  );

  const results =
    getRankedShortTermResults(combos);

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
        <Text style={styles.appBarTitle}>운영 분야 추천 순위</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.headerSection}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>단기 상권 분석 결과</Text>
        </View>

        <Text style={styles.description}>
          선택한 행사와 잘 어울리는 운영 분야를
          적합도 순으로 비교했어요.
        </Text>
      </View>

      {results.map((item, index) => {
        const isFirst = index === 0;

        return (
          <View
            key={`${item.eventName}-${item.field}`}
            style={[
              styles.card,
              isFirst && styles.firstCard,
            ]}
          >
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.rankBadge,
                  isFirst &&
                    styles.rankBadgeFirst,
                ]}
              >
                <Text
                  style={[
                    styles.rank,
                    isFirst &&
                      styles.rankFirst,
                  ]}
                >
                  {index + 1}위
                </Text>
              </View>

              <View style={styles.nameBox}>
                <Text style={styles.eventName}>
                  {item.eventName}
                </Text>

                <View style={styles.fieldBadge}>
                  <Text style={styles.fieldBadgeText}>
                    {item.field}
                  </Text>
                </View>

                {isFirst && (
                  <Text style={styles.bestText}>
                    가장 높은 적합도
                  </Text>
                )}
              </View>

              <View style={styles.scoreBox}>
                <Text style={styles.scoreLabel}>
                  적합도
                </Text>

                <Text style={styles.score}>
                  {item.suitabilityScore}
                  <Text style={styles.scoreUnit}>
                    점
                  </Text>
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>
                  행사 지역
                </Text>

                <Text style={styles.infoValue}>
                  {item.eventRegion}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>
                  행사 기간
                </Text>

                <Text style={styles.infoValue}>
                  {item.eventPeriod}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>
                  예상 유동인구
                </Text>

                <Text style={styles.infoValue}>
                  {item.expectedFootfall}
                </Text>
              </View>
            </View>

            <View style={styles.reasonBox}>
              <Text style={styles.reasonTitle}>
                추천 이유
              </Text>

              <Text style={styles.reason}>
                {item.recommendationReasons[0]}
              </Text>
            </View>
          </View>
        );
      })}
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

  scroll: { flex: 1 },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  headerSection: {
    marginBottom: 22,
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
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
  },

  card: {
    padding: 18,
    marginBottom: 14,

    borderWidth: 1,
    borderColor: COLORS.border,

    borderRadius: 20,

    backgroundColor: COLORS.surface,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 6,

    elevation: 2,
  },

  firstCard: {
    borderColor: COLORS.warning,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  rankBadge: {
    paddingVertical: 5,
    paddingHorizontal: 9,

    borderRadius: 12,

    backgroundColor: COLORS.lightGray,
  },

  rankBadgeFirst: {
    backgroundColor: COLORS.warning,
  },

  rank: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },

  rankFirst: {
    color: '#FFFFFF',
  },

  nameBox: {
    flex: 1,
  },

  eventName: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },

  fieldBadge: {
    alignSelf: 'flex-start',

    marginTop: 6,

    paddingVertical: 4,
    paddingHorizontal: 9,

    borderRadius: 12,

    backgroundColor: COLORS.warningLight,
  },

  fieldBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.warning,
  },

  bestText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.warning,
    marginTop: 5,
  },

  scoreBox: {
    minWidth: 84,

    paddingVertical: 9,
    paddingHorizontal: 11,

    alignItems: 'center',

    borderRadius: 15,

    backgroundColor: COLORS.warningLight,

    borderWidth: 1,
    borderColor: '#FDE9C8',
  },

  scoreLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },

  score: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.warning,
  },

  scoreUnit: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },

  infoRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },

  infoItem: {
    flex: 1,

    padding: 11,

    borderRadius: 13,

    backgroundColor: COLORS.background,

    borderWidth: 1,
    borderColor: COLORS.border,
  },

  infoLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },

  infoValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },

  reasonBox: {
    marginTop: 14,

    padding: 14,

    borderRadius: 15,

    backgroundColor: COLORS.lightGray,
  },

  reasonTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 5,
  },

  reason: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },
});