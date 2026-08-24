import type { Industry } from '@/data/mockMarketAnalysisData';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const INDUSTRIES: Industry[] = ['카페', '음식점', '베이커리', '편의점'];

export default function IndustrySelectionScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>업종을 선택해주세요</Text>

      <FlatList
        data={INDUSTRIES}
        keyExtractor={item => item}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.item}
            activeOpacity={0.7}
            onPress={() =>
              router.push({
                pathname: '/market-analysis/region',
                params: {industry: item},
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
