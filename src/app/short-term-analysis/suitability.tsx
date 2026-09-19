import { COLORS } from '@/constants/colors';
import type { EventName, OperatingField } from '@/data/mockShortTermData';
import { ALL_EVENTS, ALL_FIELDS } from '@/data/mockShortTermData';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ShortTermSuitabilityScreen() {
  const router = useRouter();

  const [selectedField, setSelectedField] =
    useState<OperatingField | null>(null);

  const [selectedEvent, setSelectedEvent] =
    useState<EventName | null>(null);

  const canAnalyze =
    selectedField !== null &&
    selectedEvent !== null;

  const handleAnalyze = () => {
    if (!selectedField || !selectedEvent) {
      return;
    }

    router.push({
      pathname: '/short-term-analysis/suitability-result',
      params: {
        field: selectedField,
        eventName: selectedEvent,
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
          <Text style={styles.appBarTitle}>운영 분야 + 행사 적합성</Text>
        </View>

        <View style={styles.stepper}>
          <Text style={styles.stepActive}>1 분야+행사 선택</Text>
          <Text style={styles.stepArrow}>›</Text>
          <Text style={styles.stepInactive}>2 분석 결과</Text>
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

        <Text style={styles.header}>
          운영 분야와 행사 선택
        </Text>

        <Text style={styles.description}>
          분석하고 싶은 운영 분야와 행사를 각각 하나씩 선택해주세요.
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>
            운영 분야
          </Text>

          {selectedField && (
            <Text style={styles.selectedText}>
              선택됨
            </Text>
          )}
        </View>

        <View style={styles.chipRow}>
          {ALL_FIELDS.map(item => {
            const selected =
              selectedField === item;

            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.chip,
                  selected && styles.chipSelected,
                ]}
                activeOpacity={0.7}
                onPress={() =>
                  setSelectedField(item)
                }
              >
                <Text
                  style={[
                    styles.chipText,
                    selected &&
                      styles.chipTextSelected,
                  ]}
                >
                  {item}
                  {selected ? '  ✓' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>
            행사
          </Text>

          {selectedEvent && (
            <Text style={styles.selectedText}>
              선택됨
            </Text>
          )}
        </View>

        <View style={styles.chipRow}>
          {ALL_EVENTS.map(item => {
            const selected =
              selectedEvent === item;

            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.chip,
                  selected && styles.chipSelected,
                ]}
                activeOpacity={0.7}
                onPress={() =>
                  setSelectedEvent(item)
                }
              >
                <Text
                  style={[
                    styles.chipText,
                    selected &&
                      styles.chipTextSelected,
                  ]}
                >
                  {item}
                  {selected ? '  ✓' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {selectedField && selectedEvent && (
        <View style={styles.selectionSummary}>
          <Text style={styles.selectionSummaryLabel}>
            선택한 분석 조건
          </Text>

          <Text style={styles.selectionSummaryValue}>
            {selectedField} · {selectedEvent}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.analyzeButton,
          !canAnalyze &&
            styles.analyzeButtonDisabled,
        ]}
        activeOpacity={0.8}
        disabled={!canAnalyze}
        onPress={handleAnalyze}
      >
        <Text
          style={[
            styles.analyzeButtonText,
            !canAnalyze &&
              styles.analyzeButtonTextDisabled,
          ]}
        >
          {canAnalyze
            ? '선택한 조건 분석하기 →'
            : '운영 분야와 행사를 선택해주세요'}
        </Text>
      </TouchableOpacity>
      </ScrollView>
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
  stepActive: { fontSize: 12, fontWeight: '700', color: COLORS.warning },
  stepInactive: { fontSize: 12, color: '#9CA3AF' },
  stepArrow: { fontSize: 12, color: '#9CA3AF' },

  scroll: { flex: 1 },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  headerSection: {
    marginBottom: 24,
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

  section: {
    backgroundColor: COLORS.surface,

    borderWidth: 1,
    borderColor: COLORS.border,

    borderRadius: 18,

    padding: 18,

    marginBottom: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    marginBottom: 14,
  },

  sectionLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },

  selectedText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.warning,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,

    borderRadius: 20,

    paddingVertical: 11,
    paddingHorizontal: 18,

    backgroundColor: COLORS.surface,
  },

  chipSelected: {
    borderColor: COLORS.warning,
    backgroundColor: COLORS.warningLight,
  },

  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },

  chipTextSelected: {
    fontWeight: '800',
    color: COLORS.warning,
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
    fontSize: 15,
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