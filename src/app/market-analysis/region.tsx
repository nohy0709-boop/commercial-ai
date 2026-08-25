import { COLORS } from '@/constants/colors';
import { sejongAreas } from '@/constants/sejongAreas';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  const {businesses} = useLocalSearchParams<{businesses: string}>();
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  const toggleArea = (name: string) => {
    setSelectedAreas(prev =>
      prev.includes(name)
        ? prev.filter(a => a !== name)
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
        <Text style={styles.header}>지역 선택</Text>

        <Text style={styles.subHeader}>
          분석하고 싶은 세종시 지역을 선택해주세요
        </Text>

        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>
            여러 개 선택 가능
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>세종시 지역</Text>
          <Text style={styles.sectionDescription}>
            비교할 지역을 하나 이상 선택해주세요
          </Text>
        </View>

        <Text style={styles.selectedCount}>
          {selectedAreas.length}개 선택
        </Text>
      </View>

      <FlatList
        data={sejongAreas}
        keyExtractor={item => item.code}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({item}) => {
          const selected = selectedAreas.includes(item.name);

          return (
            <TouchableOpacity
              style={[
                styles.item,
                selected && styles.itemSelected,
              ]}
              activeOpacity={0.7}
              onPress={() => toggleArea(item.name)}
            >
              <View style={styles.itemLeft}>
                <View
                  style={[
                    styles.locationIcon,
                    selected && styles.locationIconSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.locationIconText,
                      selected && styles.locationIconTextSelected,
                    ]}
                  >
                    ●
                  </Text>
                </View>

                <Text
                  style={[
                    styles.itemText,
                    selected && styles.itemTextSelected,
                  ]}
                >
                  {item.name}
                </Text>
              </View>

              <View
                style={[
                  styles.checkCircle,
                  selected && styles.checkCircleSelected,
                ]}
              >
                {selected && (
                  <Text style={styles.checkMark}>✓</Text>
                )}
              </View>
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.background,
  },

  headerBackground: {
    marginHorizontal: -20,
    paddingTop: 36,
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

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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

  listContent: {
    paddingBottom: 8,
  },

  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: '#E8EEDC',

    borderRadius: 18,

    paddingVertical: 16,
    paddingHorizontal: 16,

    marginBottom: 12,

    backgroundColor: '#FFFFFF',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },

  itemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F5FBDD',
  },

  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  locationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 12,

    backgroundColor: COLORS.lightGray,
  },

  locationIconSelected: {
    backgroundColor: COLORS.lime,
  },

  locationIconText: {
    fontSize: 10,
    color: '#9CA3AF',
  },

  locationIconTextSelected: {
    color: COLORS.primaryDark,
  },

  itemText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },

  itemTextSelected: {
    color: COLORS.primaryDark,
  },

  checkCircle: {
    width: 25,
    height: 25,
    borderRadius: 13,

    justifyContent: 'center',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: '#D1D5DB',

    backgroundColor: '#FFFFFF',
  },

  checkCircleSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },

  checkMark: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  selectionSummary: {
    padding: 15,
    marginTop: 6,
    marginBottom: 12,

    borderRadius: 16,

    backgroundColor: '#EFFBFE',
  },

  selectionSummaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },

  selectionSummaryValue: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    color: COLORS.primaryDark,
  },

  analyzeButton: {
    marginTop: 4,

    paddingVertical: 17,

    borderRadius: 16,

    alignItems: 'center',

    backgroundColor: COLORS.primary,
  },

  analyzeButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },

  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  analyzeButtonTextDisabled: {
    color: '#9CA3AF',
  },
});