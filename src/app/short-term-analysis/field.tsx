import { COLORS } from '@/constants/colors';
import type { OperatingField } from '@/data/mockShortTermData';
import { ALL_FIELDS } from '@/data/mockShortTermData';
import { useRouter } from 'expo-router';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function FieldSelectionScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <View style={styles.appBar}>
        <View style={styles.appBarTopRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>운영 분야 선택</Text>
        </View>

        <View style={styles.stepper}>
          <Text style={styles.stepActive}>1 분야 선택</Text>
          <Text style={styles.stepArrow}>›</Text>
          <Text style={styles.stepInactive}>2 행사 선택</Text>
          <Text style={styles.stepArrow}>›</Text>
          <Text style={styles.stepInactive}>3 분석 결과</Text>
        </View>
      </View>

      <View style={styles.container}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>단기 상권 분석</Text>
        </View>

        <Text style={styles.header}>
          운영하려는 분야를 선택해주세요
        </Text>
        <Text style={styles.description}>
          선택한 분야에 어울리는 행사를 이어서 추천해드려요.
        </Text>

        <FlatList
          data={ALL_FIELDS}
          keyExtractor={item => item}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({item}: {item: OperatingField}) => (
            <TouchableOpacity
              style={styles.item}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: '/short-term-analysis/event',
                  params: {field: item},
                })
              }
            >
              <View style={styles.itemTextBox}>
                <Text style={styles.itemText}>{item}</Text>
                <Text style={styles.itemDescription}>
                  이 분야로 행사 상권 분석하기
                </Text>
              </View>
              <Text style={styles.itemArrow}>›</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },

  appBar: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  appBarTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginLeft: -6,
  },
  backButtonText: { fontSize: 26, color: COLORS.text, marginTop: -2 },
  appBarTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    gap: 6,
  },
  stepActive: { fontSize: 12, fontWeight: '700', color: COLORS.warning },
  stepInactive: { fontSize: 12, color: '#9CA3AF' },
  stepArrow: { fontSize: 12, color: '#9CA3AF' },

  container: { flex: 1, padding: 20 },

  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.warningLight,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 11,
    marginBottom: 12,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: COLORS.warning },

  header: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },

  listContent: { paddingBottom: 20 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    backgroundColor: COLORS.surface,
  },
  itemTextBox: { flex: 1 },
  itemText: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  itemDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  itemArrow: { fontSize: 22, color: COLORS.textSecondary },
});