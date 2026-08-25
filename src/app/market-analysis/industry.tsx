import { businessCategories } from '@/constants/businessTypes';
import { COLORS } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
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
      <LinearGradient
        colors={[
          COLORS.mintBlue,
          '#E8F8D7',
          COLORS.neonLime,
        ]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.headerBackground}
      >
        <Text style={styles.header}>업종 선택</Text>

        <Text style={styles.subHeader}>
          분석하고 싶은 업종을 선택해주세요
        </Text>

        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>
            여러 개 선택 가능
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>업종 대분류</Text>
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
                  {selected ? '✓ ' : ''}
                  {category.categoryName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>세부 업종</Text>
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
            <Text style={styles.emptyIcon}>＋</Text>

            <Text style={styles.hint}>
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
                    selected && styles.businessChipSelected,
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
                    {selected ? '✓ ' : ''}
                    {business.name}
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
            : `선택한 ${selectedBusinesses.length}개 업종으로 다음 →`}
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

  headerBackground: {
    marginHorizontal: -20,
    marginTop: -20,
    paddingTop: 38,
    paddingHorizontal: 20,
    paddingBottom: 26,
    marginBottom: 24,

    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  header: {
    fontSize: 27,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 6,
  },

  subHeader: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },

  headerBadge: {
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },

  headerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },

  section: {
    borderWidth: 1,
    borderColor: '#E8EEDC',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 7,
    elevation: 2,
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
    color: COLORS.primaryDark,
    marginBottom: 4,
  },

  sectionDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  selectedCount: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: '#F3FAD9',
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 15,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  chip: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 22,
    paddingVertical: 11,
    paddingHorizontal: 18,
    backgroundColor: '#F8F9FA',
  },

  chipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F2F9DC',
  },

  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },

  chipTextSelected: {
    fontWeight: '800',
    color: COLORS.primaryDark,
  },

  businessChip: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    paddingVertical: 11,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },

  businessChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.lime,
  },

  businessChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },

  businessChipTextSelected: {
    fontWeight: '800',
    color: COLORS.primaryDark,
  },

  emptyBox: {
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#F8FAF7',
  },

  emptyIcon: {
    fontSize: 26,
    fontWeight: '300',
    color: COLORS.primary,
    marginBottom: 4,
  },

  hint: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  selectionSummary: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 18,
    backgroundColor: '#EFFBFE',
  },

  selectionSummaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 5,
  },

  selectionSummaryValue: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    color: COLORS.primaryDark,
  },

  nextButton: {
    marginTop: 4,
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },

  nextButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },

  nextButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  nextButtonTextDisabled: {
    color: '#9CA3AF',
  },
});