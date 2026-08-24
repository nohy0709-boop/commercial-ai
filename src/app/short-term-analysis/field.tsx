import type { OperatingField } from '@/data/mockShortTermData';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const FIELDS: OperatingField[] = ['푸드트럭', '팝업스토어', '플리마켓 셀러', '버스킹/공연'];

export default function FieldSelectionScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>운영하려는 분야를 선택해주세요</Text>

      <FlatList
        data={FIELDS}
        keyExtractor={item => item}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.item}
            activeOpacity={0.7}
            onPress={() =>
              router.push({
                pathname: '/short-term-analysis/field-result',
                params: {field: item},
              })
            }>
            <Text style={styles.itemText}>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 20, backgroundColor: '#FFFFFF'},
  header: {fontSize: 20, fontWeight: '700', marginTop: 12, marginBottom: 20},
  item: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
  },
  itemText: {fontSize: 16, fontWeight: '600', color: '#1A1A1A'},
});