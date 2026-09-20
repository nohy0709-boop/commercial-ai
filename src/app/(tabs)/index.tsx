import { COLORS } from '@/constants/colors';
import { Link } from 'expo-router';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Feature = {
  href: string;
  icon: string;
  title: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    href: '/market-analysis/industry',
    icon: '🧭',
    title: '업종으로 입지 찾기',
    description:
      '창업할 업종을 먼저 정했다면, 어떤 지역이 적합한지 비교해드려요.',
  },
  {
    href: '/market-analysis/location-recommend',
    icon: '🏢',
    title: '내 위치에 맞는 업종 찾기',
    description:
      '이미 고려 중인 위치가 있다면, 그곳에 어울리는 업종을 분석해드려요.',
  },
  {
    href: '/market-analysis/suitability',
    icon: '📊',
    title: '업종·지역 비교 분석',
    description:
      '업종과 여러 후보 지역을 함께 선택해 어디가 더 적합한지 비교해요.',
  },
];

export default function HomeScreen() {
  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >
      {/* 상단 앱바 */}
      <View style={styles.appBar}>
        <View style={styles.logoRow}>
          <Image
            source={require('../../../assets/images/location-question-icon.png')}
            style={styles.logoImage}
            resizeMode="cover"
          />

          <Text style={styles.logoText}>
            어디 차리지
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeIcon}>
              ✨
            </Text>

            <Text style={styles.heroBadgeText}>
              공공데이터 기반 AI 상권 분석
            </Text>
          </View>

          <Text style={styles.heroTitle}>
            내 가게, 어디에{'\n'}차리면 좋을까?
          </Text>

          <Text style={styles.heroSubtitle}>
            데이터와 AI로 후보 상권을 비교해보세요.{'\n'}
            창업 성공을 보장하지는 않지만, 더 나은 선택을 도와드릴게요.
          </Text>
        </View>

        {/* 핵심 분석 기능 */}
        <Text style={styles.sectionLabel}>
          핵심 분석 기능
        </Text>

        <View style={styles.featureList}>
          {FEATURES.map((feature, index) => (
            <Link
              key={feature.href}
              href={feature.href as any}
              asChild
            >
              <TouchableOpacity
                style={styles.featureCard}
                activeOpacity={0.85}
              >
                <View style={styles.featureIconBox}>
                  <Text style={styles.featureIcon}>
                    {feature.icon}
                  </Text>
                </View>

                <View style={styles.featureTopRow}>
                  <Text style={styles.featureTitle}>
                    {feature.title}
                  </Text>

                  <Text style={styles.featureIndex}>
                    {index + 1}
                  </Text>
                </View>

                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>

                <View style={styles.featureCta}>
                  <Text style={styles.featureCtaText}>
                    시작하기
                  </Text>

                  <Text style={styles.featureCtaArrow}>
                    →
                  </Text>
                </View>
              </TouchableOpacity>
            </Link>
          ))}
        </View>

        {/* 단기 상권 분석 */}
        <View style={styles.shortTermCard}>
          <View style={styles.shortTermIconBox}>
            <Text style={styles.shortTermIcon}>
              📅
            </Text>
          </View>

          <View style={styles.shortTermTextBox}>
            <View style={styles.shortTermTitleRow}>
              <Text style={styles.shortTermTitle}>
                단기 상권 분석
              </Text>

              <View style={styles.shortTermTag}>
                <Text style={styles.shortTermTagText}>
                  행사·팝업
                </Text>
              </View>
            </View>

            <Text style={styles.shortTermDescription}>
              단기 운영 예정인 팝업스토어나 행사 기간 상권을 빠르게
              확인해요.
            </Text>
          </View>

          <Link
            href="/short-term-analysis"
            asChild
          >
            <TouchableOpacity
              style={styles.shortTermButton}
              activeOpacity={0.8}
            >
              <Text style={styles.shortTermButtonText}>
                분석하기
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* 서비스 안내 */}
        <View style={styles.infoBox}>
          <View style={styles.infoTitleRow}>
            <Text style={styles.infoTitleIcon}>
              ℹ️
            </Text>

            <Text style={styles.infoTitle}>
              서비스 안내
            </Text>
          </View>

          <Text style={styles.infoText}>
            이 서비스는 공공데이터 기반의 상권 분석 도구로,{' '}
            <Text style={styles.infoTextStrong}>
              창업 성공을 보장하지 않습니다.
            </Text>{' '}
            제공되는 분석 결과는 의사결정에 참고하는 보조 자료로 활용하세요.
            분석 대상 지역은 세종시 14개 행정동 기준입니다.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  screen: {
    flex: 1,
  },

  container: {
    padding: 20,
    paddingBottom: 40,
    maxWidth:
      Platform.OS === 'web'
        ? 720
        : undefined,
    width: '100%',
    alignSelf: 'center',
  },

  appBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },

  logoText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },

  hero: {
    paddingTop: 24,
    paddingBottom: 20,
  },

  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 16,
  },

  heroBadgeIcon: {
    fontSize: 11,
  },

  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 36,
    marginBottom: 12,
  },

  heroSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
    marginTop: 8,
  },

  featureList: {
    gap: 10,
    marginBottom: 24,
  },

  featureCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 18,
  },

  featureIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  featureIcon: {
    fontSize: 20,
  },

  featureTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },

  featureTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 21,
  },

  featureIndex: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginLeft: 8,
    marginTop: 2,
  },

  featureDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },

  featureCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 14,
  },

  featureCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },

  featureCtaArrow: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },

  shortTermCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
  },

  shortTermIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  shortTermIcon: {
    fontSize: 18,
  },

  shortTermTextBox: {
    marginBottom: 14,
  },

  shortTermTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },

  shortTermTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },

  shortTermTag: {
    backgroundColor: COLORS.warningLight,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },

  shortTermTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.warning,
  },

  shortTermDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  shortTermButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },

  shortTermButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },

  infoBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 18,
  },

  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },

  infoTitleIcon: {
    fontSize: 13,
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },

  infoText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.primaryDark,
  },

  infoTextStrong: {
    fontWeight: '800',
  },
});