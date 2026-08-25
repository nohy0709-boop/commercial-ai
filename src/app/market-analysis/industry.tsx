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

export default function IndustrySelectionScreen() {
  const router = useRouter();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBusinesses, setSelectedBusinesses] = useState<string[]>([]);

  const availableBusinesses = businessCategories
    .filter(category =>
      selectedCategories.includes(category.categoryName),
    )
    .flatMap(category => category.businesses);

  const toggleCategory = (categoryName: string) => {
    const category = businessCategories.find(
      item => item.categoryName === categoryName,
    );

    if (!category) {
      return;
    }

    if (selectedCategories.includes(categoryName)) {
      setSelectedCategories(prev =>
        prev.filter(name => name !== categoryName),
      );

      const businessNames = category.businesses.map(
        business => business.name,
      );

      setSelectedBusinesses(prev =>
        prev.filter(name => !businessNames.includes(name)),
      );
    } else {
      setSelectedCategories(prev => [...prev, categoryName]);
    }
  };

  const toggleBusiness = (businessName: string) => {
    setSelectedBusinesses(prev =>
      prev.includes(businessName)
        ? prev.filter(name => name !== businessName)
        : [...prev, businessName],
    );
  };

  const handleNext = () => {
    if (selectedBusinesses.length === 0) {
      return;
    }

    router.push({
      pathname: '/market-analysis/region',
      params: {
        businesses: selectedBusinesses.join(','),
      },
    });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>업종 선택</Text>

        <Text style={styles.headerSub}>
          분석하고 싶은 업종을 선택해주세요
        </Text>

        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>
            여러 개 선택 가능
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              업종 대분류
            </Text>

            <Text style={styles.sectionDescription}>
              먼저 업종의 큰 분류를 선택해주세요
            </Text>
          </View>

          <Text style={styles.selectedCount}>
            {selectedCategories.length}개 선택
          </Text>
        </View>

        <View style={styles.chipRow}>
          {businessCategories.map(category => {
            const selected = selectedCategories.includes(
              category.categoryName,
            );

            return (
              <TouchableOpacity
                key={category.categoryName}
                style={[
                  styles.chip,
                  selected && styles.chipSelected,
                ]}
                activeOpacity={0.7}
                onPress={() =>
                  toggleCategory(category.categoryName)
                }
              >
                <Text
                  style={[
                    styles.chipText,
                    selected && styles.chipTextSelected,
                  ]}
                >
                  {category.categoryName}
                  {selected ? '  ✓' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              세부 업종
            </Text>

            <Text style={styles.sectionDescription}>
              실제 분석에 사용할 업종을 선택해주세요
            </Text>
          </View>

          <Text style={styles.selectedCount}>
            {selectedBusinesses.length}개 선택
          </Text>
        </View>

        {selectedCategories.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              업종 대분류를 먼저 선택해주세요
            </Text>
          </View>
        ) : (
          <View style={styles.chipRow}>
            {availableBusinesses.map(business => {
              const selected = selectedBusinesses.includes(
                business.name,
              );

              return (
                <TouchableOpacity
                  key={business.name}
                  style={[
                    styles.businessChip,
                    selected &&
                      styles.businessChipSelected,
                  ]}
                  activeOpacity={0.7}
                  onPress={() =>
                    toggleBusiness(business.name)
                  }
                >
                  <Text
                    style={[
                      styles.businessChipText,
                      selected &&
                        styles.businessChipTextSelected,
                    ]}
                  >
                    {business.name}
                    {selected ? '  ✓' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {selectedBusinesses.length > 0 && (
        <View style={styles.selectionSummary}>
          <Text style={styles.selectionSummaryLabel}>
            선택한 업종
          </Text>

          <Text style={styles.selectionSummaryValue}>
            {selectedBusinesses.join(', ')}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.nextButton,
          selectedBusinesses.length === 0 &&
            styles.nextButtonDisabled,
        ]}
        activeOpacity={0.8}
        disabled={selectedBusinesses.length === 0}
        onPress={handleNext}
      >
        <Text
          style={[
            styles.nextButtonText,
            selectedBusinesses.length === 0 &&
              styles.nextButtonTextDisabled,
          ]}
        >
          {selectedBusinesses.length === 0
            ? '업종을 선택해주세요'
            : `선택한 ${selectedBusinesses.length}개 업종으로 다음  →`}
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

  header: {
    alignItems: 'center',
    marginBottom: 28,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },

  headerSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  headerBadge: {
    marginTop: 14,
    backgroundColor: COLORS.lime,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 18,
  },

  headerBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },

  section: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },

  sectionDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  selectedCount: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: COLORS.surface,
  },

  chipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F1FFF5',
  },

  chipText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },

  chipTextSelected: {
    fontWeight: '800',
    color: COLORS.text,
  },

  businessChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: COLORS.surface,
  },

  businessChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F1FFF5',
  },

  businessChipText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },

  businessChipTextSelected: {
    fontWeight: '800',
    color: COLORS.text,
  },

  emptyBox: {
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
  },

  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },

  selectionSummary: {
    backgroundColor: '#F7F7F7',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },

  selectionSummaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },

  selectionSummaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },

  nextButton: {
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: COLORS.neonLime,
  },

  nextButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },

  nextButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111111',
  },

  nextButtonTextDisabled: {
    color: '#9CA3AF',
  },
});