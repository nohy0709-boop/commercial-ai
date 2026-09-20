import AnalysisHeader from '@/components/analysis-header';
import AnalysisStepper from '@/components/analysis-stepper';
import { businessCategories } from '@/constants/businessTypes';
import { COLORS } from '@/constants/colors';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function IndustrySelectionScreen() {
  const router = useRouter();
  const { businesses: initialBusinesses } = useLocalSearchParams<{ businesses?: string }>();

  const [selectedBusinesses, setSelectedBusinesses] = useState<string[]>(() =>
    initialBusinesses ? initialBusinesses.split(',').filter(Boolean) : [],
  );
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const activeCategoryData = businessCategories.find(
    category => category.categoryName === activeCategory,
  );

  const getCategorySelectedCount = (categoryName: string) => {
    const category = businessCategories.find(
      item => item.categoryName === categoryName,
    );
    if (!category) return 0;
    const names = category.businesses.map(business => business.name);
    return selectedBusinesses.filter(name => names.includes(name)).length;
  };

  const handleCategoryPress = (categoryName: string) => {
    setActiveCategory(prev => (prev === categoryName ? null : categoryName));
  };

  const toggleBusiness = (businessName: string) => {
    setSelectedBusinesses(prev =>
      prev.includes(businessName)
        ? prev.filter(name => name !== businessName)
        : [...prev, businessName],
    );
  };

  const handleNext = () => {
    if (selectedBusinesses.length === 0) return;
    router.push({
      pathname: '/market-analysis/region',
      params: { businesses: selectedBusinesses.join(',') },
    });
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />

      <AnalysisHeader
        title="업종 선택"
        onBack={() => router.replace('/market-analysis')}
      />

      <AnalysisStepper
        steps={['업종 선택', '지역 선택', '분석 결과']}
        currentStep={1}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>
          어떤 업종으로 창업을 준비 중인가요?
        </Text>
        <Text style={styles.subheading}>
          복수 선택 가능 · 대분류를 눌러 세부 업종을 확인하세요
        </Text>

        {/* 대분류 칩 */}
        <View style={styles.categoryRow}>
          {businessCategories.map(category => {
            const isActive = activeCategory === category.categoryName;
            const count = getCategorySelectedCount(category.categoryName);

            return (
              <TouchableOpacity
                key={category.categoryName}
                style={[
                  styles.categoryChip,
                  isActive && styles.categoryChipActive,
                ]}
                activeOpacity={0.8}
                onPress={() => handleCategoryPress(category.categoryName)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isActive && styles.categoryChipTextActive,
                  ]}
                >
                  {category.categoryName}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.categoryCountBadge,
                      isActive && styles.categoryCountBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryCountText,
                        isActive && styles.categoryCountTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 세부 업종 패널 */}
        {activeCategoryData && (
          <View style={styles.subPanel}>
            <Text style={styles.subPanelTitle}>
              {activeCategoryData.categoryName} 세부 업종
            </Text>
            <View style={styles.subChipRow}>
              {activeCategoryData.businesses.map(business => {
                const selected = selectedBusinesses.includes(business.name);
                return (
                  <TouchableOpacity
                    key={business.name}
                    style={[
                      styles.subChip,
                      selected && styles.subChipSelected,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => toggleBusiness(business.name)}
                  >
                    <Text
                      style={[
                        styles.subChipText,
                        selected && styles.subChipTextSelected,
                      ]}
                    >
                      {selected ? '✓ ' : ''}
                      {business.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* 선택한 업종 요약 */}
        {selectedBusinesses.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={styles.selectedLabel}>
              선택한 업종 ({selectedBusinesses.length}개)
            </Text>
            <View style={styles.selectedChipRow}>
              {selectedBusinesses.map(name => (
                <TouchableOpacity
                  key={name}
                  style={styles.selectedChip}
                  activeOpacity={0.8}
                  onPress={() => toggleBusiness(name)}
                >
                  <Text style={styles.selectedChipText}>{name}</Text>
                  <Text style={styles.selectedChipRemove}>×</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* 하단 고정 CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.ctaButton,
            selectedBusinesses.length === 0 && styles.ctaButtonDisabled,
          ]}
          activeOpacity={0.85}
          disabled={selectedBusinesses.length === 0}
          onPress={handleNext}
        >
          <Text
            style={[
              styles.ctaButtonText,
              selectedBusinesses.length === 0 && styles.ctaButtonTextDisabled,
            ]}
          >
            {selectedBusinesses.length > 0
              ? `지역 선택하기 (${selectedBusinesses.length}개 업종 선택됨)`
              : '업종을 선택해주세요'}
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
  stepActive: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  stepInactive: { fontSize: 12, color: '#9CA3AF' },
  stepArrow: { fontSize: 12, color: '#9CA3AF' },

  scroll: { flex: 1 },
  container: { padding: 20, paddingBottom: 24 },

  heading: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 18,
  },

  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  categoryCountBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCountBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  categoryCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  categoryCountTextActive: {
    color: '#FFFFFF',
  },

  subPanel: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },
  subPanelTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  subChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subChip: {
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  subChipSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  subChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  subChipTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  selectedSection: { marginBottom: 8 },
  selectedLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  selectedChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 13,
  },
  selectedChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedChipRemove: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  footer: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 16,
    paddingBottom: 20,
  },
  ctaButton: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  ctaButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ctaButtonTextDisabled: {
    color: '#9CA3AF',
  },
});