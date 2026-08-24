import type { Industry, Region } from '@/data/mockMarketAnalysisData';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const INDUSTRIES: Industry[] = ['카페', '음식점', '베이커리', '편의점'];
const REGIONS: Region[] = ['성수동', '건대입구', '왕십리'];

export default function SuitabilityScreen() {
  const router = useRouter();
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  const canAnalyze = selectedIndustry !== null && selectedRegion !== null;

  const handleAnalyze = () => {
    if (!selectedIndustry || !selectedRegion) {
      return;
    }
    router.push({
      pathname: '/market-analysis/result',
      params: {industry: selectedIndustry, region: selectedRegion},
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>업종과 지역을 선택해주세요</Text>

      <Text style={styles.sectionLabel}>업종</Text>
      <View style={styles.optionRow}>
        {INDUSTRIES.map(item => (
          <TouchableOpacity
            key={item}
            style={[
              styles.optionChip,
              selectedIndustry === item && styles.optionChipSelected,
            ]}
            activeOpacity={0.7}
            onPress={() => setSelectedIndustry(item)}>
            <Text
              style={[
                styles.optionChipText,
                selectedIndustry === item && styles.optionChipTextSelected,
              ]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>지역</Text>
      <View style={styles.optionRow}>
        {REGIONS.map(item => (
          <TouchableOpacity
            key={item}
            style={[
              styles.optionChip,
              selectedRegion === item && styles.optionChipSelected,
            ]}
            activeOpacity={0.7}
            onPress={() => setSelectedRegion(item)}>
            <Text
              style={[
                styles.optionChipText,
                selectedRegion === item && styles.optionChipTextSelected,
              ]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.analyzeButton, !canAnalyze && styles.analyzeButtonDisabled]}
        activeOpacity={0.7}
        disabled={!canAnalyze}
        onPress={handleAnalyze}>
        <Text style={styles.analyzeButtonText}>분석하기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {padding: 20, paddingBottom: 40, backgroundColor: '#FFFFFF'},
  header: {fontSize: 20, fontWeight: '700', marginTop: 12, marginBottom: 24},
  sectionLabel: {fontSize: 14, fontWeight: '700', color: '#6B6B6B', marginBottom: 10},
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  optionChip: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: '#F8F9FA',
  },
  optionChipSelected: {
    borderColor: '#1D4ED8',
    backgroundColor: '#EAF2FF',
  },
  optionChipText: {fontSize: 14, fontWeight: '600', color: '#1A1A1A'},
  optionChipTextSelected: {color: '#1D4ED8'},
  analyzeButton: {
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
  },
  analyzeButtonDisabled: {
    backgroundColor: '#C6D3EE',
  },
  analyzeButtonText: {fontSize: 16, fontWeight: '700', color: '#FFFFFF'},
});