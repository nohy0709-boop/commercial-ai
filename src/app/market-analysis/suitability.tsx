import { businessCategories } from '@/constants/businessTypes';
import { COLORS } from '@/constants/colors';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SuitabilityScreen() {
  const router = useRouter();

  const allBusinesses = businessCategories.flatMap(
    category => category.businesses,
  );

  const [selectedBusinessName, setSelectedBusinessName] =
    useState<string | null>(null);

  const handleNext = () => {
    if (!selectedBusinessName) {
      return;
    }

    const business = allBusinesses.find(
      item => item.name === selectedBusinessName,
    );

    if (!business) {
      return;
    }

    router.push({
      pathname: '/market-analysis/suitability-region',
      params: {
        businessName: business.name,
        lclsCode: business.lclsCode,
        mclsCode: business.mclsCode ?? '',
        sclsCode: business.sclsCode ?? '',
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
          업종을 선택해주세요
        </Text>

        <Text style={styles.headerDescription}>
          입지 적합성을 분석하고 싶은 업종을 하나 선택해주세요.
        </Text>

        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>
            1개 선택
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>
            업종
          </Text>

          {selectedBusinessName && (
            <Text style={styles.selectedText}>
              선택됨
            </Text>
          )}
        </View>

        <View style={styles.optionRow}>
          {allBusinesses.map(business => {
            const selected =
              selectedBusinessName === business.name;

            return (
              <TouchableOpacity
                key={business.name}
                style={[
                  styles.optionChip,
                  selected &&
                    styles.optionChipSelected,
                ]}
                activeOpacity={0.7}
                onPress={() =>
                  setSelectedBusinessName(business.name)
                }
              >
                <Text
                  style={[
                    styles.optionChipText,
                    selected &&
                      styles.optionChipTextSelected,
                  ]}
                >
                  {business.name}
                  {selected ? '  ✓' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {selectedBusinessName && (
        <View style={styles.selectionSummary}>
          <Text style={styles.selectionSummaryLabel}>
            선택한 업종
          </Text>

          <Text style={styles.selectionSummaryValue}>
            {selectedBusinessName}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.analyzeButton,
          !selectedBusinessName &&
            styles.analyzeButtonDisabled,
        ]}
        activeOpacity={0.8}
        disabled={!selectedBusinessName}
        onPress={handleNext}
      >
        <Text
          style={[
            styles.analyzeButtonText,
            !selectedBusinessName &&
              styles.analyzeButtonTextDisabled,
          ]}
        >
          {selectedBusinessName
            ? '다음: 지역 선택 →'
            : '업종을 선택해주세요'}
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