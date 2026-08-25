import { COLORS } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
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
    description: '원하는 업종을 고르면 어울리는 지역을 추천해드려요',
  },
  {
    key: 'locationToIndustry',
    title: '보유 장소 기반 업종 추천',
    description: '보유하신 장소에 어울리는 업종을 추천해드려요',
  },
  {
    key: 'suitability',
    title: '업종+입지 적합성 분석',
    description: '선택한 업종과 입지의 적합도를 분석해드려요',
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
      <LinearGradient
        colors={['#AEE8F7', '#E8F8D7', '#CFE801']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.headerBackground}
      >
        <Text style={styles.header}>장기 상권 분석</Text>
        <Text style={styles.subHeader}>
          원하는 분석 방법을 선택해주세요
        </Text>
      </LinearGradient>

      {MENU_ITEMS.map(item => (
        <TouchableOpacity
          key={item.key}
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => handlePress(item.key)}
        >
          <Text style={styles.cardTitle}>
            {item.title}
          </Text>

          <Text style={styles.cardDescription}>
            {item.description}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.background,
  },

  headerBackground: {
    marginHorizontal: -20,
    marginTop: -20,
    paddingTop: 36,
    paddingHorizontal: 20,
    paddingBottom: 28,
    marginBottom: 24,

    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  header: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
    color: COLORS.primaryDark,
  },

  subHeader: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  card: {
    borderWidth: 1,
    borderColor: '#E8EEDC',
    borderRadius: 18,

    padding: 18,
    marginBottom: 14,

    backgroundColor: '#FBFDF7',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,

    elevation: 2,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 7,
    color: COLORS.primaryDark,
  },

  cardDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },
});