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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedBusinesses, setSelectedBusinesses] = useState<string[]>([]);

  const activeCategoryData = businessCategories.find(
    category => category.categoryName === activeCategory,
  );

  const getSelectedBusinessesByCategory = (categoryName: string) => {
    const category = businessCategories.find(
      item => item.categoryName === categoryName,
    );

    if (!category) {
      return [];
    }

    const businessNames = category.businesses.map(
      business => business.name,
    );

    return selectedBusinesses.filter(name =>
      businessNames.includes(name),
    );
  };

  const getSelectedBusinessCount = (categoryName: string) => {
    return getSelectedBusinessesByCategory(categoryName).length;
  };

  const toggleCategory = (categoryName: string) => {
    const category = businessCategories.find(
      item => item.categoryName === categoryName,
    );

    if (!category) {
      return;
    }

    if (selectedCategories.includes(categoryName)) {
      const newCategories = selectedCategories.filter(
        name => name !== categoryName,
      );

      setSelectedCategories(newCategories);

      const businessNames = category.businesses.map(
        business => business.name,
      );

      setSelectedBusinesses(prev =>
        prev.filter(name => !businessNames.includes(name)),
      );

      if (activeCategory === categoryName) {
        setActiveCategory(
          newCategories.length > 0 ? newCategories[0] : null,
        );
      }

      return;
    }

    setSelectedCategories(prev => [...prev, categoryName]);
    setActiveCategory(categoryName);
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
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* HEADER */}
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

        {/* STEP 1 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleArea}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>1</Text>
              </View>

              <View style={styles.sectionTextArea}>
                <Text style={styles.sectionTitle}>
                  대분류 선택
                </Text>

                <Text style={styles.sectionDescription}>
                  분석하고 싶은 업종의 큰 분류를 선택해주세요
                </Text>
              </View>
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
                    styles.categoryChip,
                    selected && styles.categoryChipSelected,
                  ]}
                  activeOpacity={0.7}
                  onPress={() =>
                    toggleCategory(category.categoryName)
                  }
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selected &&
                        styles.categoryChipTextSelected,
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

        {/* STEP 2 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleArea}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>2</Text>
              </View>

              <View style={styles.sectionTextArea}>
                <Text style={styles.sectionTitle}>
                  세부 업종 선택
                </Text>

                <Text style={styles.sectionDescription}>
                  선택한 대분류별로 세부 업종을 선택해주세요
                </Text>
              </View>
            </View>

            <Text style={styles.selectedCount}>
              총 {selectedBusinesses.length}개
            </Text>
          </View>

          {selectedCategories.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>
                대분류를 먼저 선택해주세요
              </Text>

              <Text style={styles.emptyText}>
                위에서 분석하고 싶은 업종 대분류를 선택하면
                {'\n'}
                세부 업종을 선택할 수 있습니다.
              </Text>
            </View>
          ) : (
            <>
              {/* TAB */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabScroll}
                contentContainerStyle={styles.tabContainer}
              >
                {selectedCategories.map(categoryName => {
                  const active =
                    activeCategory === categoryName;

                  const count =
                    getSelectedBusinessCount(categoryName);

                  return (
                    <TouchableOpacity
                      key={categoryName}
                      style={[
                        styles.tab,
                        active && styles.tabActive,
                      ]}
                      activeOpacity={0.7}
                      onPress={() =>
                        setActiveCategory(categoryName)
                      }
                    >
                      <Text
                        style={[
                          styles.tabText,
                          active && styles.tabTextActive,
                        ]}
                      >
                        {categoryName}
                      </Text>

                      <View
                        style={[
                          styles.tabCountBadge,
                          active &&
                            styles.tabCountBadgeActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.tabCountText,
                            active &&
                              styles.tabCountTextActive,
                          ]}
                        >
                          {count}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* ACTIVE CATEGORY */}
              {activeCategoryData && (
                <View style={styles.businessArea}>
                  <View style={styles.businessAreaHeader}>
                    <View>
                      <Text style={styles.businessAreaTitle}>
                        {activeCategoryData.categoryName} 세부 업종
                      </Text>

                      <Text
                        style={
                          styles.businessAreaDescription
                        }
                      >
                        원하는 세부 업종을 선택해주세요
                      </Text>
                    </View>

                    <Text
                      style={styles.businessSelectedCount}
                    >
                      {getSelectedBusinessCount(
                        activeCategoryData.categoryName,
                      )}
                      개 선택
                    </Text>
                  </View>

                  <View style={styles.chipRow}>
                    {activeCategoryData.businesses.map(
                      business => {
                        const selected =
                          selectedBusinesses.includes(
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
                      },
                    )}
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        {/* SUMMARY */}
        {selectedBusinesses.length > 0 && (
          <View style={styles.summarySection}>
            <View style={styles.summaryHeader}>
              <View>
                <Text style={styles.summaryTitle}>
                  선택한 업종 요약
                </Text>

                <Text style={styles.summaryDescription}>
                  선택한 업종을 대분류별로 확인해보세요
                </Text>
              </View>

              <Text style={styles.summaryTotal}>
                총 {selectedBusinesses.length}개
              </Text>
            </View>

            <View style={styles.summaryGroups}>
              {selectedCategories.map(categoryName => {
                const businesses =
                  getSelectedBusinessesByCategory(
                    categoryName,
                  );

                if (businesses.length === 0) {
                  return null;
                }

                return (
                  <View
                    key={categoryName}
                    style={styles.summaryGroup}
                  >
                    <View
                      style={styles.summaryGroupHeader}
                    >
                      <Text
                        style={
                          styles.summaryCategoryName
                        }
                      >
                        {categoryName}
                      </Text>

                      <Text
                        style={
                          styles.summaryCategoryCount
                        }
                      >
                        {businesses.length}개
                      </Text>
                    </View>

                    <View style={styles.summaryChipRow}>
                      {businesses.map(businessName => (
                        <TouchableOpacity
                          key={businessName}
                          style={styles.summaryChip}
                          activeOpacity={0.7}
                          onPress={() =>
                            toggleBusiness(businessName)
                          }
                        >
                          <Text
                            style={
                              styles.summaryChipText
                            }
                          >
                            {businessName}
                          </Text>

                          <Text
                            style={styles.summaryRemove}
                          >
                            ×
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* NEXT */}
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 18,
    paddingBottom: 50,
  },

  content: {
    width: '100%',
    maxWidth: 900,
  },

  header: {
    alignItems: 'center',
    marginBottom: 28,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 7,
  },

  headerSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  headerBadge: {
    marginTop: 13,
    backgroundColor: '#ECFBEF',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
  },

  headerBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },

  section: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },

  sectionTitleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 16,
  },

  sectionTextArea: {
    flex: 1,
  },

  stepBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 4,
  },

  sectionDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  selectedCount: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    paddingTop: 4,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  categoryChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 17,
  },

  categoryChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0FFF4',
  },

  categoryChipText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },

  categoryChipTextSelected: {
    color: COLORS.primary,
    fontWeight: '800',
  },

  tabScroll: {
    marginHorizontal: -20,
    marginBottom: 20,
  },

  tabContainer: {
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },

  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginRight: 4,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },

  tabActive: {
    borderBottomColor: COLORS.primary,
    backgroundColor: '#F8FFF9',
  },

  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },

  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '900',
  },

  tabCountBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: '#F0F1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabCountBadgeActive: {
    backgroundColor: '#DFF5E4',
  },

  tabCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8A8F98',
  },

  tabCountTextActive: {
    color: COLORS.primary,
  },

  businessArea: {
    backgroundColor: '#FAFBFA',
    borderWidth: 1,
    borderColor: '#ECEFEC',
    borderRadius: 16,
    padding: 17,
  },

  businessAreaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  businessAreaTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 4,
  },

  businessAreaDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  businessSelectedCount: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },

  businessChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
  },

  businessChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0FFF4',
  },

  businessChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  businessChipTextSelected: {
    fontWeight: '800',
    color: COLORS.primary,
  },

  emptyBox: {
    minHeight: 130,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#F8F9F8',
    padding: 20,
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    color: COLORS.textSecondary,
  },

  summarySection: {
    backgroundColor: '#F5FCF6',
    borderWidth: 1,
    borderColor: '#DCEFE0',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },

  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 17,
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 4,
  },

  summaryDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  summaryTotal: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primary,
  },

  summaryGroups: {
    gap: 10,
  },

  summaryGroup: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EDE6',
    borderRadius: 14,
    padding: 14,
  },

  summaryGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 11,
  },

  summaryCategoryName: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.text,
  },

  summaryCategoryCount: {
    marginLeft: 7,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },

  summaryChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF9F1',
    paddingVertical: 7,
    paddingLeft: 11,
    paddingRight: 9,
    borderRadius: 999,
  },

  summaryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },

  summaryRemove: {
    marginLeft: 7,
    fontSize: 15,
    lineHeight: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },

  nextButton: {
    minHeight: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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