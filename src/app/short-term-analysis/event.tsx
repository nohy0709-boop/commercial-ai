import { COLORS } from '@/constants/colors';
import type { EventName, OperatingField } from '@/data/mockShortTermData';
import { ALL_EVENTS } from '@/data/mockShortTermData';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function EventSelectionScreen() {
  const router = useRouter();

  const {field} = useLocalSearchParams<{
    field: OperatingField;
  }>();

  const [selectedEvents, setSelectedEvents] =
    useState<EventName[]>([]);

  const toggleEvent = (eventName: EventName) => {
    setSelectedEvents(prev =>
      prev.includes(eventName)
        ? prev.filter(event => event !== eventName)
        : [...prev, eventName],
    );
  };

  const handleAnalyze = () => {
    if (selectedEvents.length === 0) {
      return;
    }

    router.push({
      pathname: '/short-term-analysis/field-result',
      params: {
        field,
        events: selectedEvents.join(','),
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.smallTitle}>
          단기 상권 분석
        </Text>

        <Text style={styles.header}>
          행사 선택
        </Text>

        <Text style={styles.description}>
          <Text style={styles.fieldName}>
            {field}
          </Text>
          {' 분야로 분석할 행사를 선택해주세요.'}
        </Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            여러 개 선택 가능
          </Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          분석 행사
        </Text>

        <Text style={styles.selectedCount}>
          {selectedEvents.length}개 선택
        </Text>
      </View>

      <FlatList
        data={ALL_EVENTS}
        keyExtractor={item => item}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({item}) => {
          const selected =
            selectedEvents.includes(item);

          return (
            <TouchableOpacity
              style={[
                styles.item,
                selected && styles.itemSelected,
              ]}
              activeOpacity={0.7}
              onPress={() => toggleEvent(item)}
            >
              <View style={styles.itemTextBox}>
                <Text
                  style={[
                    styles.itemText,
                    selected &&
                      styles.itemTextSelected,
                  ]}
                >
                  {item}
                </Text>

                <Text style={styles.itemDescription}>
                  행사 상권 분석 대상
                </Text>
              </View>

              <View
                style={[
                  styles.checkCircle,
                  selected &&
                    styles.checkCircleSelected,
                ]}
              >
                {selected && (
                  <Text style={styles.checkMark}>
                    ✓
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {selectedEvents.length > 0 && (
        <View style={styles.selectionSummary}>
          <Text
            style={
              styles.selectionSummaryLabel
            }
          >
            선택한 행사
          </Text>

          <Text
            style={
              styles.selectionSummaryValue
            }
          >
            {selectedEvents.join(', ')}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.analyzeButton,
          selectedEvents.length === 0 &&
            styles.analyzeButtonDisabled,
        ]}
        activeOpacity={0.8}
        disabled={
          selectedEvents.length === 0
        }
        onPress={handleAnalyze}
      >
        <Text
          style={[
            styles.analyzeButtonText,
            selectedEvents.length === 0 &&
              styles.analyzeButtonTextDisabled,
          ]}
        >
          {selectedEvents.length === 0
            ? '행사를 선택해주세요'
            : `선택한 ${selectedEvents.length}개 행사 분석하기 →`}
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

  headerSection: {
    marginTop: 10,
    marginBottom: 26,
  },

  smallTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 6,
  },

  header: {
    fontSize: 27,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
  },

  fieldName: {
    fontWeight: '900',
    color: COLORS.text,
  },

  badge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: COLORS.lime,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },

  selectedCount: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },

  listContent: {
    paddingBottom: 14,
  },

  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    paddingVertical: 16,
    paddingHorizontal: 16,

    marginBottom: 10,

    borderWidth: 1,
    borderColor: COLORS.border,

    borderRadius: 16,

    backgroundColor: COLORS.surface,
  },

  itemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F1FFF5',
  },

  itemTextBox: {
    flex: 1,
    paddingRight: 12,
  },

  itemText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },

  itemTextSelected: {
    color: COLORS.primary,
  },

  itemDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  checkCircle: {
    width: 24,
    height: 24,

    borderRadius: 12,

    borderWidth: 1.5,
    borderColor: COLORS.border,

    backgroundColor: COLORS.surface,

    alignItems: 'center',
    justifyContent: 'center',
  },

  checkCircleSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },

  checkMark: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  selectionSummary: {
    padding: 16,
    marginBottom: 16,

    borderRadius: 16,

    backgroundColor: '#F7F7F7',

    borderWidth: 1,
    borderColor: COLORS.border,
  },

  selectionSummaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },

  selectionSummaryValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
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