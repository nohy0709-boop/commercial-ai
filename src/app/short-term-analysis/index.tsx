import { COLORS } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type MenuKey = 'fieldToEvent' | 'eventAnalysis' | 'suitability';

const MENU_ITEMS: {
  key: MenuKey;
  icon: string;
  title: string;
  description: string;
}[] = [
  {
    key: 'fieldToEvent',
    icon: '🚚',
    title: '운영 분야 기반 행사/지역 추천',
    description: '운영하려는 분야를 고르면 어울리는 행사를 추천해드려요',
  },
  {
    key: 'eventAnalysis',
    icon: '📍',
    title: '특정 행사/지역 기반 상권 분석',
    description: '행사나 지역을 고르면 주변 상권을 분석해드려요',
  },
  {
    key: 'suitability',
    icon: '📊',
    title: '운영 분야 + 행사 적합성 분석',
    description: '선택한 분야와 행사의 적합도를 분석해드려요',
  },
];

export default function ShortTermMainScreen() {
  const router = useRouter();

  const handlePress = (key: MenuKey) => {
    if (key === 'fieldToEvent') {
      router.push('/short-term-analysis/field');
      return;
    }
    if (key === 'eventAnalysis') {
      router.push('/short-term-analysis/event-recommend');
      return;
    }
    router.push('/short-term-analysis/suitability');
  };

  return (
    <View style={styles.screen}>
      <View style={styles.appBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>단기 상권 분석</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>행사 · 팝업 기간 한정 분석</Text>
        </View>

        <Text style={styles.heading}>
          짧은 기간 운영을 고려하시나요?
        </Text>
        <Text style={styles.subheading}>
          행사나 팝업스토어처럼 단기 운영에 적합한 상권을 분석해드려요.
        </Text>

        <View style={styles.menuList}>
          {MENU_ITEMS.map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => handlePress(item.key)}
            >
              <View style={styles.iconBox}>
                <Text style={styles.icon}>{item.icon}</Text>
              </View>
              <View style={styles.cardTextBox}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },

  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginLeft: -6,
  },
  backButtonText: { fontSize: 26, color: COLORS.text, marginTop: -2 },
  appBarTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },

  scroll: { flex: 1 },
  container: { padding: 20, paddingBottom: 40 },

  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.warningLight,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.warning,
  },

  heading: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },

  menuList: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  icon: { fontSize: 22 },
  cardTextBox: { flex: 1 },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 3,
  },
  cardDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  arrow: {
    fontSize: 22,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
});