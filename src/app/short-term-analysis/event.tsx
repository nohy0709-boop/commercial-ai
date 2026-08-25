import type { EventName, OperatingField } from '@/data/mockShortTermData';
import { ALL_EVENTS } from '@/data/mockShortTermData';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function EventSelectionScreen() {
  const router = useRouter();
  const {field} = useLocalSearchParams<{field: OperatingField}>();
  const [selectedEvents, setSelectedEvents] = useState<EventName[]>([]);

  const toggleEvent = (eventName: EventName) => {
    setSelectedEvents(prev =>
      prev.includes(eventName)
        ? prev.filter(e => e !== eventName)
        : [...prev, eventName],
    );
  };

  const handleAnalyze = () => {
    if (selectedEvents.length === 0) {
      return;
    }
    router.push({
      pathname: '/short-term-analysis/field-result',
      params: {field, events: selectedEvents.join(',')},
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {`'${field}' 분야로 분석할 행사를 선택해주세요 (여러 개 가능)`}
      </Text>

      <FlatList
        data={ALL_EVENTS}
        keyExtractor={item => item}
        renderItem={({item}) => {
          const selected = selectedEvents.includes(item);
          return (
            <TouchableOpacity
              style={[styles.item, selected && styles.itemSelected]}
              activeOpacity={0.7}
              onPress={() => toggleEvent(item)}>
              <Text style={[styles.itemText, selected && styles.itemTextSelected]}>
                {item}
              </Text>
              {selected && <Text style={styles.checkMark}>✓</Text>}
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity
        style={[
          styles.analyzeButton,
          selectedEvents.length === 0 && styles.analyzeButtonDisabled,
        ]}
        activeOpacity={0.7}
        disabled={selectedEvents.length === 0}
        onPress={handleAnalyze}>
        <Text style={styles.analyzeButtonText}>
          {`선택한 ${selectedEvents.length}개 행사 분석하기`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 20, backgroundColor: '#FFFFFF'},
  header: {fontSize: 18, fontWeight: '700', marginTop: 12, marginBottom: 20},
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
  },
  itemSelected: {
    borderColor: '#1D4ED8',
    backgroundColor: '#EAF2FF',
  },
  itemText: {fontSize: 16, fontWeight: '600', color: '#1A1A1A'},
  itemTextSelected: {color: '#1D4ED8'},
  checkMark: {fontSize: 16, fontWeight: '700', color: '#1D4ED8'},
  analyzeButton: {
    marginTop: 8,
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