import { COLORS } from '@/constants/colors';
import type { EventName, OperatingField } from '@/data/mockShortTermData';
import { ALL_EVENTS } from '@/data/mockShortTermData';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function EventSelectionScreen() {
  const router = useRouter();

  const {field} = useLocalSearchParams<{
    field: OperatingField;
  }>();

  const [selectedEvents, setSelectedEvents] =
    useState<EventName[]>([]);

  const toggleEvent = (eventName: EventName) => {
    setSelectedEvents(prev =>
      prev.includes(eventName)
        ? prev.filter(event => event !== eventName)
        : [...prev, eventName],
    );
  };

  const handleAnalyze = () => {
    if (selectedEvents.length === 0) {
      return;
    }

    router.push({
      pathname: '/short-term-analysis/field-result',
      params: {
        field,
        events: selectedEvents.join(','),
      },
    });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.appBar}>
        <View style={styles.appBarTopRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>행사 선택</Text>
        </View>

        <View style={styles.stepper}>
          <Text style={styles.stepDone}>✓ 1 분야 선택</Text>
          <Text style={styles.stepArrow}>›</Text>
          <Text style={styles.stepActive}>2 행사 선택</Text>
          <Text style={styles.stepArrow}>›</Text>
          <Text style={styles.stepInactive}>3 분석 결과</Text>
        </View>
      </View>

      <View style={styles.container}>
        <View style={styles.headerSection}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>단기 상권 분석</Text>
          </View>

          <Text style={styles.header}>
            행사 선택
          </Text>

          <Text style={styles.description}>
            <Text style={styles.fieldName}>
              {field}
            </Text>
            {' 분야로 분석할 행사를 선택해주세요.'}
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            분석 행사
          </Text>

          <Text style={styles.selectedCount}>
            {selectedEvents.length}개 선택
          </Text>
        </View>

        <FlatList
          data={ALL_EVENTS}
          keyExtractor={item => item}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({item}) => {
            const selected =
              selectedEvents.includes(item);

            return (
              <TouchableOpacity
                style={[
                  styles.item,
                  selected && styles.itemSelected,
                ]}
                activeOpacity={0.7}
                onPress={() => toggleEvent(item)}
              >
                <View style={styles.itemTextBox}>
                  <Text
                    style={[
                      styles.itemText,
                      selected &&
                        styles.itemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>

                  <Text style={styles.itemDescription}>
                    행사 상권 분석 대상
                  </Text>
                </View>

                <View
                  style={[
                    styles.checkCircle,
                    selected &&
                      styles.checkCircleSelected,
                  ]}
                >
                  {selected && (
                    <Text style={styles.checkMark}>
                      ✓
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {selectedEvents.length > 0 && (
          <View style={styles.selectionSummary}>
            <Text
              style={
                styles.selectionSummaryLabel
              }
            >
              선택한 행사
            </Text>

            <Text
              style={
                styles.selectionSummaryValue
              }
            >
              {selectedEvents.join(', ')}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.analyzeButton,
            selectedEvents.length === 0 &&
              styles.analyzeButtonDisabled,
          ]}
          activeOpacity={0.8}
          disabled={
            selectedEvents.length === 0
          }
          onPress={handleAnalyze}
        >
          <Text
            style={[
              styles.analyzeButtonText,
              selectedEvents.length === 0 &&
                styles.analyzeButtonTextDisabled,
            ]}
          >
            {selectedEvents.length === 0
              ? '행사를 선택해주세요'
              : `선택한 ${selectedEvents.length}개 행사 분석하기 →`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },

  appBar: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  appBarTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginLeft: -6,
  },
  backButtonText: { fontSize: 26, color: COLORS.text, marginTop: -2 },
  appBarTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    gap: 6,
  },
  stepDone: { fontSize: 12, fontWeight: '600', color: COLORS.warning },
  stepActive: { fontSize: 12, fontWeight: '700', color: COLORS.warning },
  stepInactive: { fontSize: 12, color: '#9CA3AF' },
  stepArrow: { fontSize: 12, color: '#9CA3AF' },

  container: {
    flex: 1,
    padding: 20,
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

  header: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
  },

  fieldName: {
    fontWeight: '900',
    color: COLORS.text,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },

  selectedCount: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.warning,
  },

  listContent: {
    paddingBottom: 14,
  },

  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    paddingVertical: 16,
    paddingHorizontal: 16,

    marginBottom: 10,

    borderWidth: 1,
    borderColor: COLORS.border,

    borderRadius: 16,

    backgroundColor: COLORS.surface,
  },

  itemSelected: {
    borderColor: COLORS.warning,
    backgroundColor: COLORS.warningLight,
  },

  itemTextBox: {
    flex: 1,
    paddingRight: 12,
  },

  itemText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },

  itemTextSelected: {
    color: COLORS.warning,
  },

  itemDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  checkCircle: {
    width: 24,
    height: 24,

    borderRadius: 12,

    borderWidth: 1.5,
    borderColor: COLORS.border,

    backgroundColor: COLORS.surface,

    alignItems: 'center',
    justifyContent: 'center',
  },

  checkCircleSelected: {
    borderColor: COLORS.warning,
    backgroundColor: COLORS.warning,
  },

  checkMark: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  selectionSummary: {
    padding: 16,
    marginBottom: 16,

    borderRadius: 16,

    backgroundColor: COLORS.lightGray,

    borderWidth: 1,
    borderColor: COLORS.border,
  },

  selectionSummaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },

  selectionSummaryValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    color: COLORS.text,
  },

  analyzeButton: {
    paddingVertical: 17,

    borderRadius: 16,

    alignItems: 'center',

    backgroundColor: COLORS.warning,
  },

  analyzeButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },

  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  analyzeButtonTextDisabled: {
    color: '#9CA3AF',
  },
});