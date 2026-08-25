import { businessCategories } from '@/constants/businessTypes';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SuitabilityScreen() {
  const router = useRouter();
  const allBusinesses = businessCategories.flatMap(category => category.businesses);
  const [selectedBusinessName, setSelectedBusinessName] = useState<string | null>(
    null,
  );

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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>업종을 선택해주세요</Text>

      <View style={styles.chipRow}>
        {allBusinesses.map(business => (
          <TouchableOpacity
            key={business.name}
            style={[
              styles.chip,
              selectedBusinessName === business.name && styles.chipSelected,
            ]}
            activeOpacity={0.7}
            onPress={() => setSelectedBusinessName(business.name)}>
            <Text
              style={[
                styles.chipText,
                selectedBusinessName === business.name && styles.chipTextSelected,
              ]}>
              {business.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.nextButton,
          !selectedBusinessName && styles.nextButtonDisabled,
        ]}
        activeOpacity={0.7}
        disabled={!selectedBusinessName}
        onPress={handleNext}>
        <Text style={styles.nextButtonText}>다음: 지역 선택</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {padding: 20, paddingBottom: 40, backgroundColor: '#FFFFFF'},
  header: {fontSize: 20, fontWeight: '700', marginTop: 12, marginBottom: 20},
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: '#F8F9FA',
  },
  chipSelected: {
    borderColor: '#1D4ED8',
    backgroundColor: '#EAF2FF',
  },
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