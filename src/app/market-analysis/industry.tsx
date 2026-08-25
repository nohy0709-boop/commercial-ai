import { businessCategories } from '@/constants/businessTypes';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function IndustrySelectionScreen() {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBusinesses, setSelectedBusinesses] = useState<string[]>([]);

  const availableBusinesses = businessCategories
    .filter(category => selectedCategories.includes(category.categoryName))
    .flatMap(category => category.businesses);

  const toggleCategory = (categoryName: string) => {
    const category = businessCategories.find(
      item => item.categoryName === categoryName,
    );
    if (!category) {
      return;
    }

    if (selectedCategories.includes(categoryName)) {
      setSelectedCategories(prev => prev.filter(name => name !== categoryName));
      const businessNames = category.businesses.map(business => business.name);
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
      params: {businesses: selectedBusinesses.join(',')},
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>업종을 선택해주세요 (여러 개 가능)</Text>

      <Text style={styles.sectionLabel}>업종 대분류</Text>
      <View style={styles.chipRow}>
        {businessCategories.map(category => {
          const selected = selectedCategories.includes(category.categoryName);
          return (
            <TouchableOpacity
              key={category.categoryName}
              style={[styles.chip, selected && styles.chipSelected]}
              activeOpacity={0.7}
              onPress={() => toggleCategory(category.categoryName)}>
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {selected ? '✓ ' : ''}
                {category.categoryName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>세부 업종</Text>
      {selectedCategories.length === 0 ? (
        <Text style={styles.hint}>업종 대분류를 먼저 선택해주세요.</Text>
      ) : (
        <View style={styles.chipRow}>
          {availableBusinesses.map(business => {
            const selected = selectedBusinesses.includes(business.name);
            return (
              <TouchableOpacity
                key={business.name}
                style={[styles.chip, selected && styles.chipSelected]}
                activeOpacity={0.7}
                onPress={() => toggleBusiness(business.name)}>
                <Text
                  style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {selected ? '✓ ' : ''}
                  {business.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.nextButton,
          selectedBusinesses.length === 0 && styles.nextButtonDisabled,
        ]}
        activeOpacity={0.7}
        disabled={selectedBusinesses.length === 0}
        onPress={handleNext}>
        <Text style={styles.nextButtonText}>
          {`선택한 ${selectedBusinesses.length}개 업종으로 다음`}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {padding: 20, paddingBottom: 40, backgroundColor: '#FFFFFF'},
  header: {fontSize: 18, fontWeight: '700', marginTop: 12, marginBottom: 20},
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B6B6B',
    marginBottom: 10,
    marginTop: 8,
  },
  hint: {fontSize: 13, color: '#8A8A8A', marginBottom: 12},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12},
  chip: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: '#F8F9FA',
  },
  chipSelected: {borderColor: '#1D4ED8', backgroundColor: '#EAF2FF'},
  chipText: {fontSize: 14, fontWeight: '600', color: '#1A1A1A'},
  chipTextSelected: {color: '#1D4ED8'},
  nextButton: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
  },
  nextButtonDisabled: {backgroundColor: '#C6D3EE'},
  nextButtonText: {fontSize: 16, fontWeight: '700', color: '#FFFFFF'},
});