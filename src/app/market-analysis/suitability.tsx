import { COLORS } from '@/constants/colors';
import type { Industry, Region } from '@/data/mockMarketAnalysisData';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const INDUSTRIES: Industry[] = [
  '카페',
  '음식점',
  '베이커리',
  '편의점',
];

const REGIONS: Region[] = [
  '성수동',
  '건대입구',
  '왕십리',
];

export default function SuitabilityScreen() {
  const router = useRouter();

  const [selectedIndustry, setSelectedIndustry] =
    useState<Industry | null>(null);

  const [selectedRegion, setSelectedRegion] =
    useState<Region | null>(null);

  const canAnalyze =
    selectedIndustry !== null &&
    selectedRegion !== null;

  const handleAnalyze = () => {
    if (!selectedIndustry || !selectedRegion) {
      return;
    }

    router.push({
      pathname: '/market-analysis/result',
      params: {
        industry: selectedIndustry,
        region: selectedRegion,
      },
    });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerBox}>
        <Text style={styles.header}>
          업종과 지역을 선택해주세요
        </Text>

        <Text style={styles.headerDescription}>
          분석하고 싶은 업종과 지역을 각각 하나씩 선택해주세요.
        </Text>

        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>
            1개씩 선택
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>
            업종
          </Text>

          {selectedIndustry && (
            <Text style={styles.selectedText}>
              선택됨
            </Text>
          )}
        </View>

        <View style={styles.optionRow}>
          {INDUSTRIES.map(item => {
            const selected =
              selectedIndustry === item;

            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.optionChip,
                  selected &&
                    styles.optionChipSelected,
                ]}
                activeOpacity={0.7}
                onPress={() =>
                  setSelectedIndustry(item)
                }
              >
                <Text
                  style={[
                    styles.optionChipText,
                    selected &&
                      styles.optionChipTextSelected,
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
            지역
          </Text>

          {selectedRegion && (
            <Text style={styles.selectedText}>
              선택됨
            </Text>
          )}
        </View>

        <View style={styles.optionRow}>
          {REGIONS.map(item => {
            const selected =
              selectedRegion === item;

            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.optionChip,
                  selected &&
                    styles.optionChipSelected,
                ]}
                activeOpacity={0.7}
                onPress={() =>
                  setSelectedRegion(item)
                }
              >
                <Text
                  style={[
                    styles.optionChipText,
                    selected &&
                      styles.optionChipTextSelected,
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

      {selectedIndustry && selectedRegion && (
        <View style={styles.selectionSummary}>
          <Text style={styles.selectionSummaryLabel}>
            선택한 분석 조건
          </Text>

          <Text style={styles.selectionSummaryValue}>
            {selectedIndustry} · {selectedRegion}
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
            : '업종과 지역을 선택해주세요'}
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
    backgroundColor: COLORS.background,
  },

  headerBox: {
    marginBottom: 24,
  },

  header: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 7,
  },

  headerDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },

  headerBadge: {
    alignSelf: 'flex-start',
    marginTop: 12,

    paddingVertical: 6,
    paddingHorizontal: 11,

    borderRadius: 18,

    backgroundColor: COLORS.lime,
  },

  headerBadgeText: {
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
    fontWeight: '800',

    color: COLORS.text,
  },

  selectedText: {
    fontSize: 12,
    fontWeight: '800',

    color: COLORS.primary,
  },

  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  optionChip: {
    borderWidth: 1,
    borderColor: COLORS.border,

    borderRadius: 20,

    paddingVertical: 11,
    paddingHorizontal: 18,

    backgroundColor: COLORS.surface,
  },

  optionChipSelected: {
    borderColor: COLORS.primary,

    backgroundColor: '#F1FFF5',
  },

  optionChipText: {
    fontSize: 14,
    fontWeight: '600',

    color: COLORS.text,
  },

  optionChipTextSelected: {
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
    marginTop: 4,

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

    color: COLORS.text,
  },

  analyzeButtonTextDisabled: {
    color: '#9CA3AF',
  },
});