import { COLORS } from '@/constants/colors';
import type { EventName, OperatingField } from '@/data/mockShortTermData';
import { ALL_EVENTS, ALL_FIELDS } from '@/data/mockShortTermData';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerSection}>
        <Text style={styles.smallTitle}>
          단기 상권 분석
        </Text>

        <Text style={styles.header}>
          운영 분야와 행사 선택
        </Text>

        <Text style={styles.description}>
          분석하고 싶은 운영 분야와 행사를 각각 하나씩 선택해주세요.
        </Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            1개씩 선택
          </Text>
        </View>
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
    marginBottom: 24,
  },

  smallTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 6,
  },

  header: {
    fontSize: 27,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
  },

  badge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: COLORS.lime,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
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
    color: COLORS.primary,
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
    borderColor: COLORS.primary,
    backgroundColor: '#F1FFF5',
  },

  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },

  chipTextSelected: {
    fontWeight: '800',
    color: COLORS.primary,
  },

  selectionSummary: {
    padding: 16,

    marginBottom: 16,

    borderRadius: 16,

    backgroundColor: '#F7F7F7',

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

    backgroundColor: COLORS.neonLime,
  },

  analyzeButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },

  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111111',
  },

  analyzeButtonTextDisabled: {
    color: '#9CA3AF',
  },
});