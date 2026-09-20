import AnalysisHeader from '@/components/analysis-header';
import { Stack, useRouter } from 'expo-router';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type MenuKey =
  | 'industryToLocation'
  | 'locationToIndustry'
  | 'suitability';

const MENU_ITEMS: {
  key: MenuKey;
  title: string;
  description: string;
}[] = [
  {
    key: 'industryToLocation',
    title: '업종 기반 입지 추천',
    description:
      '원하는 업종을 고르면 어울리는 지역을 추천해드려요',
  },
  {
    key: 'locationToIndustry',
    title: '보유 장소 기반 업종 추천',
    description:
      '보유하신 장소에 어울리는 업종을 추천해드려요',
  },
  {
    key: 'suitability',
    title: '업종+입지 적합성 분석',
    description:
      '선택한 업종과 입지의 적합도를 분석해드려요',
  },
];

export default function MarketAnalysisMainScreen() {
  const router = useRouter();

  const handlePress = (key: MenuKey) => {
    if (key === 'industryToLocation') {
      router.push('/market-analysis/industry');
      return;
    }

    if (key === 'locationToIndustry') {
      router.push('/market-analysis/location-recommend');
      return;
    }

    router.push('/market-analysis/suitability');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.fullWidthHeader}>
        <AnalysisHeader
          title="장기 상권 분석"
          onBack={() => router.replace('/')}
        />
      </View>
      <View style={styles.headerBackground}>
        <Text style={styles.header}>장기 상권 분석</Text>

        <Text style={styles.subHeader}>
          원하는 분석 방법을 선택해주세요
        </Text>

        <View style={styles.headerAccent} />
      </View>

      {MENU_ITEMS.map(item => (
        <TouchableOpacity
          key={item.key}
          style={styles.card}
          activeOpacity={0.75}
          onPress={() => handlePress(item.key)}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardTextArea}>
              <Text style={styles.cardTitle}>
                {item.title}
              </Text>

              <Text style={styles.cardDescription}>
                {item.description}
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F7F9F7',
  },

  fullWidthHeader: {
    marginHorizontal: -20,
    marginTop: -20,
    marginBottom: 20,
  },

  headerBackground: {
    marginHorizontal: -20,
    marginTop: -20,
    paddingTop: 38,
    paddingHorizontal: 20,
    paddingBottom: 28,
    marginBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },

  header: {
    fontSize: 27,
    fontWeight: '900',
    color: '#111111',
    marginTop: 12,
    marginBottom: 6,
  },

  subHeader: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },

  headerAccent: {
    width: 42,
    height: 5,
    marginTop: 18,
    borderRadius: 10,
    backgroundColor: '#12A84F',
  },

  card: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    boxShadow: '0px 2px 6px rgba(0,0,0,0.04)',
  },

  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 18,
  },

  cardTextArea: {
    flex: 1,
    paddingRight: 12,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111111',
    marginBottom: 7,
  },

  cardDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
  },

  arrow: {
    fontSize: 28,
    fontWeight: '400',
    color: '#12A84F',
  },
});
