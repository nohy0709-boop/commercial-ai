import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnalysisSummary } from '@/components/AnalysisSummary';
import { COLORS } from '@/constants/colors';
import type { AttachedAnalysis } from '@/services/community';
import { getShared } from '@/services/team';

/** 링크로 공유받은 분석 결과 (로그인 없이 읽기 전용) */
export default function SharedAnalysisScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string }>();

  const [analysis, setAnalysis] = useState<AttachedAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) {
      setLoading(false);
      return;
    }
    getShared(String(code))
      .then(setAnalysis)
      .catch(() => setAnalysis(null))
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appBar}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={12}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.appBarTitle}>공유된 분석</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : !analysis ? (
        <View style={styles.center}>
          <Text style={styles.title}>링크를 열 수 없어요</Text>
          <Text style={styles.muted}>주소가 잘못됐거나 더 이상 없는 분석이에요.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.card}>
            <Text style={styles.label}>📎 공유받은 분석</Text>
            <AnalysisSummary analysis={analysis} />
          </View>

          <Text style={styles.muted}>
            공유 시점의 분석 결과예요. 이후 데이터가 바뀌면 실제와 다를 수 있어요.
          </Text>

          <Pressable style={styles.button} onPress={() => router.replace('/')}>
            <Text style={styles.buttonText}>나도 분석해보기</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  back: { fontSize: 30, color: COLORS.text, lineHeight: 30 },
  appBarTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 6 },
  title: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  body: { padding: 18, gap: 14 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    gap: 6,
  },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  muted: { fontSize: 13, lineHeight: 20, color: COLORS.textSecondary },
  button: {
    height: 50,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});