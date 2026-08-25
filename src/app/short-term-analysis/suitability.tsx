import type { EventName, OperatingField } from '@/data/mockShortTermData';
import { ALL_EVENTS, ALL_FIELDS } from '@/data/mockShortTermData';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ShortTermSuitabilityScreen() {
  const router = useRouter();
  const [selectedField, setSelectedField] = useState<OperatingField | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventName | null>(null);

  const canAnalyze = selectedField !== null && selectedEvent !== null;

  const handleAnalyze = () => {
    if (!selectedField || !selectedEvent) {
      return;
    }
    router.push({
      pathname: '/short-term-analysis/suitability-result',
      params: {field: selectedField, eventName: selectedEvent},
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>운영 분야와 행사를 선택해주세요</Text>

      <Text style={styles.sectionLabel}>운영 분야</Text>
      <View style={styles.chipRow}>
        {ALL_FIELDS.map(item => (
          <TouchableOpacity
            key={item}
            style={[styles.chip, selectedField === item && styles.chipSelected]}
            activeOpacity={0.7}
            onPress={() => setSelectedField(item)}>
            <Text
              style={[styles.chipText, selectedField === item && styles.chipTextSelected]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>행사</Text>
      <View style={styles.chipRow}>
        {ALL_EVENTS.map(item => (
          <TouchableOpacity
            key={item}
            style={[styles.chip, selectedEvent === item && styles.chipSelected]}
            activeOpacity={0.7}
            onPress={() => setSelectedEvent(item)}>
            <Text
              style={[styles.chipText, selectedEvent === item && styles.chipTextSelected]}>
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
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