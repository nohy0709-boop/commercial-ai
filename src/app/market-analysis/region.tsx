import { COLORS } from '@/constants/colors';
import { sejongAreas } from '@/constants/sejongAreas';
import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function RegionSelectionScreen() {
  const router = useRouter();

  const { businesses } =
    useLocalSearchParams<{
      businesses: string;
    }>();

  const [selectedAreas, setSelectedAreas] =
    useState<string[]>([]);

  const toggleArea = (name: string) => {
    setSelectedAreas(prev =>
      prev.includes(name)
        ? prev.filter(area => area !== name)
        : [...prev, name],
    );
  };

  const handleAnalyze = () => {
    if (selectedAreas.length === 0) {
      return;
    }

    router.push({
      pathname: '/market-analysis/region-result',
      params: {
        businesses,
        areas: selectedAreas.join(','),
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          지역 선택
        </Text>

        <Text style={styles.headerSub}>
          분석하고 싶은 세종시 지역을 선택해주세요
        </Text>

        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>
            여러 개 선택 가능
          </Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          지역 선택
        </Text>

        <Text style={styles.selectedCount}>
          {selectedAreas.length}개 선택됨
        </Text>
      </View>

      <FlatList
        data={sejongAreas}
        keyExtractor={item => item.code}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const selected =
            selectedAreas.includes(item.name);

          return (
            <TouchableOpacity
              style={[
                styles.regionChip,
                selected &&
                  styles.regionChipSelected,
              ]}
              activeOpacity={0.7}
              onPress={() =>
                toggleArea(item.name)
              }
            >
              <Text
                style={[
                  styles.regionText,
                  selected &&
                    styles.regionTextSelected,
                ]}
              >
                {item.name}
              </Text>

              {selected && (
                <View style={styles.checkCircle}>
                  <Text style={styles.checkMark}>
                    ✓
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {selectedAreas.length > 0 && (
        <View style={styles.selectionSummary}>
          <Text style={styles.selectionSummaryLabel}>
            선택한 지역
          </Text>

          <Text style={styles.selectionSummaryValue}>
            {selectedAreas.join(', ')}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.analyzeButton,
          selectedAreas.length === 0 &&
            styles.analyzeButtonDisabled,
        ]}
        activeOpacity={0.8}
        disabled={selectedAreas.length === 0}
        onPress={handleAnalyze}
      >
        <Text
          style={[
            styles.analyzeButtonText,
            selectedAreas.length === 0 &&
              styles.analyzeButtonTextDisabled,
          ]}
        >
          {selectedAreas.length === 0
            ? '지역을 선택해주세요'
            : `선택한 ${selectedAreas.length}개 지역 분석하기 →`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.background,
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

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },

  selectedCount: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },

  listContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 14,
  },

  regionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },

  regionChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F1FFF5',
  },

  regionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  regionTextSelected: {
    color: COLORS.primary,
    fontWeight: '800',
  },

  checkCircle: {
    width: 19,
    height: 19,
    marginLeft: 8,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkMark: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  selectionSummary: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
    backgroundColor: '#F7F7F7',
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