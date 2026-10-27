import AnalysisHeader from '@/components/analysis-header';

import MonthlyCandidateComparison from '@/components/MonthlyCandidateComparison';

import TrendSection from '@/components/TrendSection';

import { businessCategories } from '@/constants/businessTypes';

import { COLORS } from '@/constants/colors';

import { sejongAreas } from '@/constants/sejongAreas';

import type { AIExplanation } from '@/services/aiExplanation';

import { generateAIExplanation } from '@/services/aiExplanation';
import { sendChatMessage } from '@/services/chatbot';
import { parseChecklistContent, saveChecklist } from '@/services/checklistStorage';

import {
  getAnalysisHistory,

  saveAnalysis,

  toggleAnalysisFavorite,
} from '@/services/analysisHistory';
import {
  exportAnalysisReportPdf,
} from '@/services/pdfExport';

import {
  createSharedAnalysis,

  sharePublicAnalysisLink,
} from '@/services/shareAnalysis';
import type { NearbyStore } from '@/services/storeApi';
import { getStoreList } from '@/services/storeApi';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useEffect, useState } from 'react';

import {
  ActivityIndicator,

  Alert,

  Image,

  Platform,

  ScrollView,

  StyleSheet,

  Text,

  TouchableOpacity,

  View,
} from 'react-native';

/**

 * =====================================================

 * TYPES

 * =====================================================

 */

type CompareItem = {

  areaName: string;

  rank: number;

  floatingPopulationScore?: number;

  salesScore?: number;

  averageSalesScore?: number;

  competitionScore?: number;

  livingPopulationScore?: number;

  livingPopulationChangeScore?: number;

  floatingPopulationChangeScore?: number;

  accessibilityScore?: number;

  [key: string]: number | string | undefined;

};

/**

 * =====================================================

 * AI 강조 문구

 * =====================================================

 */

function renderEmphasizedText(text: string, textStyle: object) {

  const parts = text.split(/(\*\*.*?\*\*)/g);

  return (

    <Text style={textStyle}>

      {parts.map((part, index) => {

        if (part.startsWith('**') && part.endsWith('**')) {

          return (

            <Text key={index} style={styles.aiHighlight}>

              {part.slice(2, -2)}

            </Text>

          );

        }

        return part;

      })}

    </Text>

  );

}

/**

 * =====================================================

 * 증감률 표시

 * =====================================================

 */

function formatChangeRate(value: number) {

  if (Number.isNaN(value)) {

    return '데이터 없음';

  }

  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;

}

/**

 * =====================================================

 * MAIN

 * =====================================================

 */

export default function RegionResultDetailScreen() {

  const router = useRouter();

  const params = useLocalSearchParams<{

    originBusinesses?: string;

    originAreas?: string;

    originDetailedLocations?: string;

    businessName: string;

    areaName: string;

    rank: string;

    totalCount: string;

    suitabilityScore: string;

    floatingPopulation: string;

    livingPopulation: string;

    storeCount: string;

    competitionDensity: string;

    salesAmount: string;

    averageSalesPerStore: string;

    busStopCount: string;

    livingPopulationChangeRate: string;

    floatingPopulationChangeRate: string;

    compareData?: string;

    analysisType?: string;

    dongName?: string;

    latitude?: string;

    longitude?: string;

    radius?: string;

  }>();

  const {

    originBusinesses,

    originAreas,

    originDetailedLocations,

    businessName,

    areaName,

    rank,

    totalCount,

    suitabilityScore,

    floatingPopulation,

    livingPopulation,

    storeCount,

    competitionDensity,

    salesAmount,

    averageSalesPerStore,

    busStopCount,

    livingPopulationChangeRate,

    floatingPopulationChangeRate,

    compareData,

    analysisType,

    dongName,

    latitude,

    longitude,

    radius,

  } = params;

  /**

   * =====================================================

   * 위치 분석 정보

   * =====================================================

   */

  const isPointAnalysis = analysisType === 'point';

  const actualDongName = dongName || areaName;

  const backBusinesses = originBusinesses || businessName;

  const backAreas =

    originAreas !== undefined

      ? originAreas

      : isPointAnalysis

        ? ''

        : areaName;

  const backDetailedLocations =

    originDetailedLocations !== undefined

      ? originDetailedLocations

      : isPointAnalysis && latitude && longitude

        ? JSON.stringify([

            {

              label: areaName,

              dongName: actualDongName,

              coordinates: {

                lat: Number(latitude),

                lng: Number(longitude),

              },

              radius: Number(radius || 500),

            },

          ])

        : '';

  /**

   * =====================================================

   * 행정동 찾기

   * =====================================================

   */

  const area = sejongAreas.find(item => item.name === actualDongName);

  /**

   * =====================================================

   * 업종 찾기

   * =====================================================

   */

  const business = businessCategories

    .flatMap(category => category.businesses)

    .find(item => item.name === businessName);

  /**

   * =====================================================

   * 비교 데이터

   * =====================================================

   */

  let compareItems: CompareItem[] = [];

  try {

    const parsed = JSON.parse(compareData || '[]');

    if (Array.isArray(parsed)) {

      compareItems = parsed;

    }

  } catch (error) {

    console.error('비교 데이터 파싱 오류:', error);

    compareItems = [];

  }

  /**

   * =====================================================

   * AI 분석

   * =====================================================

   */

  const [explanation, setExplanation] = useState<AIExplanation | null>(null);

  const [aiLoading, setAiLoading] = useState(true);

  const [aiError, setAiError] = useState('');

  const [detailExpanded, setDetailExpanded] = useState(false);

  /**

   * =====================================================

   * 주변 실제 점포

   * =====================================================

   */

  const [nearbyStores, setNearbyStores] = useState<NearbyStore[]>([]);

  const [storesLoading, setStoresLoading] = useState(true);

  const [storesError, setStoresError] = useState('');

  /**

   * =====================================================

   * 찜

   * =====================================================

   */

  const [favorite, setFavorite] = useState(false);

  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);

  const [favoriteLoading, setFavoriteLoading] = useState(false);

  /**

   * =====================================================

   * PDF 저장 / 공유

   * =====================================================

   */

  const [pdfAction, setPdfAction] = useState<'save' | 'share' | null>(null);
  const [checklistCreating, setChecklistCreating] = useState(false);

  /**

   * =====================================================

   * AI 설명 생성

   * =====================================================

   */

  useEffect(() => {

    const run = async () => {

      try {

        setAiLoading(true);

        setAiError('');

        const result = await generateAIExplanation({

          지역: areaName,

          업종: businessName,

          유동인구: Number(floatingPopulation),

          생활인구: Number(livingPopulation),

          점포수: Number(storeCount),

          경쟁밀도: Number(competitionDensity),

          전체카드소비: Number(salesAmount),

          점포당카드소비: Number(averageSalesPerStore),

          버스정류장수: Number(busStopCount),

          적합도점수: Number(suitabilityScore),

          순위: Number(rank),

        });

        setExplanation(result);

      } catch (error) {

        console.error('AI 설명 생성 오류:', error);

        setAiError(

          error instanceof Error ? error.message : 'AI 설명을 가져오지 못했습니다.',

        );

      } finally {

        setAiLoading(false);

      }

    };

    run();

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, []);

  /**

   * =====================================================

   * 실제 점포 조회

   * =====================================================

   */

  useEffect(() => {

    if (!area || !business) {

      console.log('점포 조회 불가:', {

        actualDongName,

        businessName,

        area,

        business,

      });

      setStoresLoading(false);

      return;

    }

    const run = async () => {

      try {

        setStoresLoading(true);

        setStoresError('');

        const stores = await getStoreList(

          area.code,

          business.lclsCode,

          business.mclsCode,

          business.sclsCode,

          10,

        );

        console.log('상세화면 점포 조회 결과:', stores);

        setNearbyStores(stores);

      } catch (error) {

        console.error('주변 점포 조회 오류:', error);

        setStoresError(

          error instanceof Error

            ? error.message

            : '주변 점포 정보를 가져오지 못했습니다.',

        );

      } finally {

        setStoresLoading(false);

      }

    };

    run();

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, []);

  /**

   * =====================================================

   * 기존 저장 분석 확인

   * =====================================================

   */

  useEffect(() => {

    const checkSaved = async () => {

      try {

        const histories = await getAnalysisHistory();

        const existing = histories.find(history => {

          const data = history.resultData;

          if (history.businessName !== businessName) {

            return false;

          }

          if (!history.regions.includes(areaName)) {

            return false;

          }

          /**

           * 좌표 기반 분석

           */

          if (isPointAnalysis) {

            return (

              data?.analysisType === 'point' &&

              String(data?.latitude ?? '') === String(latitude ?? '') &&

              String(data?.longitude ?? '') === String(longitude ?? '') &&

              String(data?.radius ?? '') === String(radius ?? '')

            );

          }

          return data?.analysisType !== 'point';

        });

        if (!existing) {

          return;

        }

        setSavedAnalysisId(existing.id);

        setFavorite(existing.isFavorite ?? false);

      } catch (error) {

        console.error('저장된 분석 확인 실패:', error);

      }

    };

    checkSaved();

  }, [businessName, areaName, isPointAnalysis, latitude, longitude, radius]);

  /**

   * =====================================================

   * 찜 버튼

   * =====================================================

   */

  const handleFavorite = async () => {

    if (favoriteLoading) {

      return;

    }

    try {

      setFavoriteLoading(true);

      /**

       * 이미 저장된 분석

       */

      if (savedAnalysisId) {

        const updated = await toggleAnalysisFavorite(savedAnalysisId);

        if (updated) {

          setFavorite(updated.isFavorite ?? false);

        }

        return;

      }

      /**

       * 처음 저장

       */

      const saved = await saveAnalysis({

        type: 'comparison',

        title: `${areaName} ${businessName} 분석`,

        businessName,

        regions: [areaName],

        isFavorite: true,

        resultData: {

          businessName,

          areaName,

          rank: Number(rank),

          totalCount: Number(totalCount),

          suitabilityScore: Number(suitabilityScore),

          floatingPopulation: Number(floatingPopulation),

          livingPopulation: Number(livingPopulation),

          storeCount: Number(storeCount),

          competitionDensity: Number(competitionDensity),

          salesAmount: Number(salesAmount),

          averageSalesPerStore: Number(averageSalesPerStore),

          busStopCount: Number(busStopCount),

          livingPopulationChangeRate: Number(livingPopulationChangeRate),

          floatingPopulationChangeRate: Number(floatingPopulationChangeRate),

          analysisType: isPointAnalysis ? 'point' : 'area',

          dongName: actualDongName,

          latitude: latitude ? Number(latitude) : null,

          longitude: longitude ? Number(longitude) : null,

          radius: radius ? Number(radius) : null,

        },

      });

      setSavedAnalysisId(saved.id);

      setFavorite(true);

    } catch (error) {

      console.error('찜 저장 실패:', error);

      Alert.alert('오류', '분석 결과를 저장하지 못했습니다.');

    } finally {

      setFavoriteLoading(false);

    }

  };

  /**

   * =====================================================

   * PDF 리포트 데이터

   * =====================================================

   */

  const getPdfReportData = () => ({

    businessName,

    areaName,

    rank: Number(rank),

    totalCount: Number(totalCount),

    suitabilityScore: Number(suitabilityScore),

    floatingPopulation: Number(floatingPopulation),

    livingPopulation: Number(livingPopulation),

    storeCount: Number(storeCount),

    competitionDensity: Number(competitionDensity),

    salesAmount: Number(salesAmount),

    averageSalesPerStore: Number(averageSalesPerStore),

    busStopCount: Number(busStopCount),

    livingPopulationChangeRate: Number(livingPopulationChangeRate),

    floatingPopulationChangeRate: Number(floatingPopulationChangeRate),

    isPointAnalysis,

    actualDongName,

    radius: radius ? Number(radius) : undefined,

    latitude: latitude ? Number(latitude) : undefined,

    longitude: longitude ? Number(longitude) : undefined,

    explanation: explanation

      ? {

          recommendationReason: explanation.recommendationReason,

          advantages: explanation.advantages,

          risks: explanation.risks,

          keyFeatures: explanation.keyFeatures,

          considerations: explanation.considerations,

        }

      : undefined,

    nearbyStores: nearbyStores.slice(0, 5).map(store => ({

      name: store.name,

      address: store.address,

    })),

    compareItems: compareItems.slice(0, 8).map(item => ({

      areaName: item.areaName,

      rank: item.rank,

      floatingPopulationScore: item.floatingPopulationScore,

      livingPopulationScore: item.livingPopulationScore,

      floatingPopulationChangeScore: item.floatingPopulationChangeScore,

      livingPopulationChangeScore: item.livingPopulationChangeScore,

      salesScore: item.salesScore,

      averageSalesScore: item.averageSalesScore,

      competitionScore: item.competitionScore,

      accessibilityScore: item.accessibilityScore,

    })),

  });

  const handleSavePdf = async () => {

    if (pdfAction) return;

    try {

      setPdfAction('save');

      await exportAnalysisReportPdf(getPdfReportData());

    } catch (error) {

      console.error('PDF 저장 실패:', error);

      Alert.alert(

        'PDF 저장 실패',

        error instanceof Error ? error.message : 'PDF를 생성하지 못했습니다.',

      );

    } finally {

      setPdfAction(null);

    }

  };

  const handleSharePdf = async () => {
    if (pdfAction) return;

    try {
      setPdfAction('share');

      const { url } = await createSharedAnalysis(getPdfReportData());
      const result = await sharePublicAnalysisLink(
        url,
        `${areaName} ${businessName} 상권 분석`,
        `${areaName} ${businessName} 분석 결과를 확인해보세요.`,
      );

      if (result === 'copied') {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.alert('공유 링크가 복사되었습니다.');
        } else {
          Alert.alert('링크 복사 완료', '공유 링크가 복사되었습니다.');
        }
      }

      if (result === 'unsupported') {
        Alert.alert('공유 불가', '현재 환경에서는 공유 기능을 지원하지 않습니다.');
      }
    } catch (error) {
      console.error('[공유하기] 오류:', error);

      const message =
        error instanceof Error
          ? error.message
          : '분석 결과를 공유하지 못했습니다.';

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`공유 실패: ${message}`);
      } else {
        Alert.alert('공유 실패', message);
      }
    } finally {
      setPdfAction(null);
    }
  };

  const handleCreateChecklist =

    async () => {

      if (checklistCreating) {

        return;

      }

      try {

        setChecklistCreating(

          true,

        );

        const sourceMessageId = [

          'analysis',

          businessName,

          areaName,

          isPointAnalysis

            ? 'point'

            : 'area',

          latitude ?? '',

          longitude ?? '',

          radius ?? '',

        ].join(':');

        const prompt = `

현재 상권 분석 결과를 바탕으로 실제 창업 준비 체크리스트를 만들어줘.

반드시 아래 형식만 사용해줘.

## ${areaName} ${businessName} 창업 체크리스트

\- [ ] 입지·상권

  - 실제로 확인해야 할 구체적인 항목

  - 실제로 확인해야 할 구체적인 항목

\- [ ] 인허가·행정

  - 실제로 확인해야 할 구체적인 항목

\- [ ] 시설·설비

  - 실제로 확인해야 할 구체적인 항목

\- [ ] 운영·자금

  - 실제로 확인해야 할 구체적인 항목

조건:

1\. 현재 분석 결과의 지역과 업종에 맞게 작성해줘.

2\. 실제 창업 준비 과정에서 바로 체크할 수 있는 행동 단위로 작성해줘.

3\. 입지·상권, 인허가·행정, 시설·설비, 운영·자금을 빠뜨리지 마.

4\. 제공된 분석 데이터에서 확인할 수 없는 사실은 지어내지 마.

5\. 설명 문단은 쓰지 말고 체크리스트만 출력해줘.

        `.trim();

        const context = {

          areaName,

          businessName,

          rank: Number(rank),

          totalCount:

            Number(totalCount),

          suitabilityScore:

            Number(

              suitabilityScore,

            ),

          floatingPopulation:

            Number(

              floatingPopulation,

            ),

          livingPopulation:

            Number(

              livingPopulation,

            ),

          storeCount:

            Number(storeCount),

          competitionDensity:

            Number(

              competitionDensity,

            ),

          salesAmount:

            Number(salesAmount),

          averageSalesPerStore:

            Number(

              averageSalesPerStore,

            ),

          busStopCount:

            Number(

              busStopCount,

            ),

          livingPopulationChangeRate:

            Number(

              livingPopulationChangeRate,

            ),

          floatingPopulationChangeRate:

            Number(

              floatingPopulationChangeRate,

            ),

          analysisType:

            isPointAnalysis

              ? 'point'

              : 'area',

          dongName:

            actualDongName,

          radius:

            radius

              ? Number(radius)

              : undefined,

          aiRecommendationReason:

            explanation

              ?.recommendationReason,

          aiAdvantages:

            explanation

              ?.advantages,

          aiRisks:

            explanation

              ?.risks,

          aiKeyFeatures:

            explanation

              ?.keyFeatures,

          aiConsiderations:

            explanation

              ?.considerations,

        };

        const answer =

          await sendChatMessage(

            prompt,

            context,

            [],

          );

        const items =

          parseChecklistContent(

            answer,

          );

        if (

          items.length === 0

        ) {

          throw new Error(

            'AI 응답에서 체크리스트 항목을 찾지 못했습니다. 다시 시도해주세요.',

          );

        }

        const saved =

          await saveChecklist({

            title:

              `${areaName} ${businessName} 창업 체크리스트`,

            source:

              'analysis',

            sourceMessageId,

            businessName,

            areaName,

            items,

          });

        Alert.alert(

          '체크리스트 생성 완료',

          `총 ${saved.items.length}개의 항목을 만들었어요. MY에서 계속 관리할 수 있어요.`,

          [

            {

              text: '확인',

              style: 'cancel',

            },

            {

              text: 'MY에서 보기',

              onPress: () =>

                router.push(

                  '/my',

                ),

            },

          ],

        );

      } catch (error) {

        console.error(

          '분석 기반 체크리스트 생성 실패:',

          error,

        );

        Alert.alert(

          '체크리스트 생성 실패',

          error instanceof

            Error

            ? error.message

            : '체크리스트를 만들지 못했습니다.',

        );

      } finally {

        setChecklistCreating(

          false,

        );

      }

    };

  const handleOpenChat = () => {

    router.push({

      pathname: '/chat',

      params: {

        returnTo: '/market-analysis/region-result-detail',

        returnParams: JSON.stringify(params),

        businessName,

        areaName,

        rank,

        suitabilityScore,

        floatingPopulation,

        storeCount,

        competitionDensity,

        compareData: compareData ?? '',

        analysisType: isPointAnalysis ? 'point' : 'area',

        latitude: latitude ?? '',

        longitude: longitude ?? '',

        radius: radius ?? '',

      },

    });

  };

  const handleOpenMap = () => {

    router.push({

      pathname: '/map',

      params: {

        mode: 'analysis-result',

        returnParams: JSON.stringify(params),

        businessName,

        areaName,

        rank,

        suitabilityScore,

        floatingPopulation,

        storeCount,

        competitionDensity,

        compareData: compareData ?? '',

        analysisType: isPointAnalysis ? 'point' : 'area',

        latitude: latitude ?? '',

        longitude: longitude ?? '',

        radius: radius ?? '',

      },

    });

  };

  return (

    <View style={styles.screen}>

      <AnalysisHeader

        title="상세 분석"

        onBack={() =>

          router.replace({

            pathname: '/market-analysis/region-result',

            params: {

              businesses: backBusinesses,

              areas: backAreas,

              detailedLocations: backDetailedLocations,

            },

          })

        }

      />

      <ScrollView

        style={{ flex: 1 }}

        contentContainerStyle={styles.container}

        showsVerticalScrollIndicator={false}

      >

        {/* =================================================

          HEADER

      ================================================= */}

        <View style={styles.headerCard}>

          <View style={styles.headerTopRow}>

            <View style={styles.rankPill}>

              <Text style={styles.rankPillText}>{rank}위</Text>

            </View>

            <Text style={styles.headerSubText}>

              {`${businessName} 후보 ${totalCount}곳 중`}

            </Text>

          </View>

          {/* 지역명 + 찜 */}

          <View style={styles.titleRow}>

            <View style={styles.titleArea}>

              <Text style={styles.headerTitle}>{`${areaName} 일대`}</Text>

              {isPointAnalysis && radius && (

                <Text style={styles.pointSubtitle}>

                  {actualDongName} · 반경 {radius}m 위치 기반 분석

                </Text>

              )}

            </View>

            <TouchableOpacity

              style={[styles.favoriteButton, favorite && styles.favoriteButtonActive]}

              activeOpacity={0.8}

              disabled={favoriteLoading}

              onPress={handleFavorite}

            >

              {favoriteLoading ? (

                <ActivityIndicator

                  size="small"

                  color={favorite ? '#FFFFFF' : '#E54861'}

                />

              ) : (

                <Text

                  style={[styles.favoriteText, favorite && styles.favoriteTextActive]}

                >

                  {favorite ? '♥' : '♡'}

                </Text>

              )}

            </TouchableOpacity>

          </View>

          <Text style={styles.headerBusiness}>{businessName}</Text>

          <View style={styles.scoreRow}>

            <Text style={styles.scoreLabel}>종합 적합도</Text>

            <Text style={styles.scoreValue}>{suitabilityScore}</Text>

            <Text style={styles.scoreUnit}>/ 100</Text>

          </View>

        </View>

        {/* =================================================

          AI 챗봇 / 지도 / PDF 액션

      ================================================= */}

        <TouchableOpacity

          style={styles.chatButton}

          activeOpacity={0.8}

          onPress={handleOpenChat}

        >

          <Image

            source={require('../../../assets/images/chatbot-question-map-red.png')}

            style={styles.chatImageIcon}

            resizeMode="contain"

          />

          <View style={styles.chatButtonContent}>

            <Text style={styles.chatButtonTitle}>AI에게 물어보기</Text>

            <Text style={styles.chatButtonDescription}>

              현재 분석 결과를 바탕으로 궁금한 점을 질문해보세요

            </Text>

          </View>

          <Text style={styles.chatButtonArrow}>›</Text>

        </TouchableOpacity>

        <TouchableOpacity

        style={[

          styles.checklistCreateButton,

          checklistCreating &&

            styles.checklistCreateButtonDisabled,

        ]}

        activeOpacity={0.8}

        disabled={checklistCreating}

        onPress={handleCreateChecklist}

      >

        <View

          style={styles.checklistCreateIcon}

        >

          {checklistCreating ? (

            <ActivityIndicator

              size="small"

              color={COLORS.primary}

            />

          ) : (

            <Text

              style={

                styles.checklistCreateIconText

              }

            >

              ✓

            </Text>

          )}

        </View>

        <View

          style={

            styles.checklistCreateContent

          }

        >

          <Text

            style={

              styles.checklistCreateTitle

            }

          >

            {checklistCreating

              ? 'AI 체크리스트 만드는 중...'

              : '이 분석으로 체크리스트 만들기'}

          </Text>

          <Text

            style={

              styles.checklistCreateDescription

            }

          >

            현재 분석 결과를 바탕으로 창업 준비 항목을 만들고 MY에 저장해요

          </Text>

        </View>

        {!checklistCreating && (

          <Text

            style={

              styles.checklistCreateArrow

            }

          >

            ›

          </Text>

        )}

      </TouchableOpacity>

<TouchableOpacity

          style={styles.mapViewButton}

          activeOpacity={0.8}

          onPress={handleOpenMap}

        >

          <View style={styles.mapViewIcon}>

            <Text style={styles.mapViewIconText}>🗺️</Text>

          </View>

          <View style={styles.mapViewContent}>

            <Text style={styles.mapViewTitle}>지도에서 보기</Text>

            <Text style={styles.mapViewDescription}>

              분석 지역과 주변 상권 분포를 지도에서 확인해보세요

            </Text>

          </View>

          <Text style={styles.mapViewArrow}>›</Text>

        </TouchableOpacity>

        <View style={styles.reportActionRow}>

          <TouchableOpacity

            style={styles.reportActionButton}

            activeOpacity={0.8}

            disabled={pdfAction !== null}

            onPress={handleSavePdf}

          >

            {pdfAction === 'save' ? (

              <ActivityIndicator size="small" color={COLORS.primary} />

            ) : (

              <Text style={styles.reportActionIcon}>↓</Text>

            )}

            <View style={styles.reportActionContent}>

              <Text style={styles.reportActionTitle}>PDF로 저장</Text>

              <Text style={styles.reportActionDescription}>

                분석 결과를 보고서로 저장해요

              </Text>

            </View>

          </TouchableOpacity>

          <TouchableOpacity

            style={styles.reportActionButton}

            activeOpacity={0.8}

            disabled={pdfAction !== null}

            onPress={() => {
              console.log('[모바일 공유] 버튼 클릭됨');
              void handleSharePdf();
            }}

          >

            {pdfAction === 'share' ? (

              <ActivityIndicator size="small" color={COLORS.primary} />

            ) : (

              <Text style={styles.reportActionIcon}>↗</Text>

            )}

            <View style={styles.reportActionContent}>

              <Text style={styles.reportActionTitle}>공유하기</Text>

              <Text style={styles.reportActionDescription}>

                웹과 휴대폰에서 분석 링크를 공유해요

              </Text>

            </View>

          </TouchableOpacity>

        </View>

        {/* =================================================

          핵심 지표

      ================================================= */}

        <View style={styles.metricGrid}>

          <View style={styles.metricBox}>

            <Text style={styles.metricLabel}>

              {isPointAnalysis ? '추정 유동인구' : '유동인구'}

            </Text>

            <Text style={styles.metricValue}>

              {Number(floatingPopulation).toLocaleString()}명

            </Text>

          </View>

          <View style={styles.metricBox}>

            <Text style={styles.metricLabel}>

              {isPointAnalysis ? `반경 내 ${businessName} 수` : `${businessName} 수`}

            </Text>

            <Text style={styles.metricValue}>{storeCount}개</Text>

          </View>

          <View style={styles.metricBox}>

            <Text style={styles.metricLabel}>경쟁밀도</Text>

            <Text style={styles.metricValue}>

              {Number(competitionDensity).toFixed(3)}

            </Text>

          </View>

          <View style={styles.metricBox}>

            <Text style={styles.metricLabel}>점포당 카드소비</Text>

            <Text style={styles.metricValue}>

              {Math.round(Number(averageSalesPerStore)).toLocaleString()}원

            </Text>

          </View>

        </View>

        {/* =================================================

          상권 변화 추이 (기간 선택 + 개업·폐업률)

      ================================================= */}

        <TrendSection areaName={actualDongName} businessName={businessName} />

        {/* =================================================

          ★ 실제 월별 후보 비교

      ================================================= */}

        {compareItems.length > 0 ? (

          <View style={styles.comparisonWrapper}>

            <MonthlyCandidateComparison

              compareItems={compareItems}

              currentAreaName={actualDongName}

            />

          </View>

        ) : (

          <View style={styles.sectionBox}>

            <Text style={styles.sectionTitle}>다른 후보와 비교</Text>

            <Text style={styles.noCompareText}>

              함께 분석한 다른 후보 지역이 없어요.

            </Text>

          </View>

        )}

        {/* =================================================

          주변 실제 점포

      ================================================= */}

        <View style={styles.sectionBox}>

          <Text style={styles.sectionTitle}>주변 실제 {businessName} 매장</Text>

          <Text style={styles.sectionDescription}>

            공공데이터에 등록된 이 지역의 실제 매장 정보예요.

          </Text>

          {Platform.OS !== 'web' && nearbyStores.length > 0 && (

            <NativeStoreMap stores={nearbyStores} />

          )}

          {storesLoading && (

            <View style={styles.smallLoadingBox}>

              <ActivityIndicator size="small" color={COLORS.primary} />

              <Text style={styles.smallLoadingText}>

                주변 매장 정보를 불러오는 중...

              </Text>

            </View>

          )}

          {!storesLoading && storesError !== '' && (

            <Text style={styles.storesError}>{storesError}</Text>

          )}

          {!storesLoading && storesError === '' && nearbyStores.length === 0 && (

            <Text style={styles.storesEmpty}>등록된 매장 정보를 찾지 못했어요.</Text>

          )}

          {!storesLoading &&

            nearbyStores.map((store, index) => (

              <View key={`${store.name}-${index}`} style={styles.storeRow}>

                <Text style={styles.storeName}>{store.name}</Text>

                <Text style={styles.storeAddress}>{store.address}</Text>

              </View>

            ))}

        </View>

        {/* =================================================

          지역 환경 상세

      ================================================= */}

        <View style={styles.sectionBox}>

          <Text style={styles.sectionTitle}>지역 환경 상세</Text>

          {isPointAnalysis && (

            <Text style={styles.estimateNotice}>

              위치 기반 분석의 인구·카드소비·접근성 지표는 행정동 데이터를 반경 내

              점포 집중도에 따라 세분화한 추정값입니다.

            </Text>

          )}

          <View style={styles.detailRow}>

            <Text style={styles.detailLabel}>

              {isPointAnalysis ? '추정 생활인구' : '생활인구'}

            </Text>

            <Text style={styles.detailValue}>

              {Number(livingPopulation).toLocaleString()}명

            </Text>

          </View>

          <View style={styles.detailRow}>

            <Text style={styles.detailLabel}>생활인구 증감률</Text>

            <Text style={styles.detailValue}>

              {formatChangeRate(Number(livingPopulationChangeRate))}

            </Text>

          </View>

          <View style={styles.detailRow}>

            <Text style={styles.detailLabel}>유동인구 증감률</Text>

            <Text style={styles.detailValue}>

              {formatChangeRate(Number(floatingPopulationChangeRate))}

            </Text>

          </View>

          <View style={styles.detailRow}>

            <Text style={styles.detailLabel}>

              {isPointAnalysis ? '추정 카드소비' : '전체 카드소비'}

            </Text>

            <Text style={styles.detailValue}>

              {Number(salesAmount).toLocaleString()}원

            </Text>

          </View>

          <View style={styles.detailRow}>

            <Text style={styles.detailLabel}>점포당 카드소비</Text>

            <Text style={styles.detailValue}>

              {Math.round(Number(averageSalesPerStore)).toLocaleString()}원

            </Text>

          </View>

          <View style={[styles.detailRow, styles.detailRowLast]}>

            <Text style={styles.detailLabel}>

              {isPointAnalysis ? '추정 버스정류장' : '버스정류장'}

            </Text>

            <Text style={styles.detailValue}>{busStopCount}개</Text>

          </View>

        </View>

        {/* =================================================

          AI 분석

      ================================================= */}

        <View style={styles.sectionBox}>

          <Text style={styles.sectionTitle}>AI 분석 요약</Text>

          {aiLoading && (

            <View style={styles.smallLoadingBox}>

              <ActivityIndicator size="small" color={COLORS.primary} />

              <Text style={styles.smallLoadingText}>AI가 분석하는 중...</Text>

            </View>

          )}

          {!aiLoading && aiError !== '' && (

            <Text style={styles.storesError}>{aiError}</Text>

          )}

          {!aiLoading && explanation && (

            <>

              {renderEmphasizedText(explanation.recommendationReason, styles.aiReasonText)}

              <View style={styles.chunkList}>

                {explanation.advantages.map((advantage, index) => (

                  <View key={`adv-${index}`} style={styles.chunkRowGood}>

                    <Text style={styles.chunkIconGood}>✓</Text>

                    {renderEmphasizedText(advantage, styles.chunkTextGood)}

                  </View>

                ))}

                {explanation.risks.map((risk, index) => (

                  <View key={`risk-${index}`} style={styles.chunkRowWarn}>

                    <Text style={styles.chunkIconWarn}>!</Text>

                    {renderEmphasizedText(risk, styles.chunkTextWarn)}

                  </View>

                ))}

              </View>

              <TouchableOpacity

                style={styles.detailToggleButton}

                activeOpacity={0.7}

                onPress={() => setDetailExpanded(prev => !prev)}

              >

                <Text style={styles.detailToggleText}>

                  {detailExpanded ? 'AI 상세 분석 접기 ▲' : 'AI 상세 분석 더보기 ▼'}

                </Text>

              </TouchableOpacity>

              {detailExpanded && (

                <View style={styles.aiDetailSection}>

                  <Text style={styles.aiLabel}>주요 특징</Text>

                  {renderEmphasizedText(explanation.keyFeatures, styles.aiReasonText)}

                  <Text style={styles.aiLabel}>고려사항</Text>

                  <Text style={styles.aiReasonText}>{explanation.considerations}</Text>

                </View>

              )}

            </>

          )}

        </View>

      </ScrollView>

    </View>

  );

}

/**

 * =====================================================

 * 네이티브 실제 점포 지도

 * =====================================================

 */

function NativeStoreMap({ stores }: { stores: NearbyStore[] }) {

  // eslint-disable-next-line @typescript-eslint/no-var-requires

  const MapView = require('react-native-maps').default;

  // eslint-disable-next-line @typescript-eslint/no-var-requires

  const { Marker } = require('react-native-maps');

  const center = stores[0];

  return (

    <MapView

      style={styles.map}

      initialRegion={{

        latitude: center.lat,

        longitude: center.lng,

        latitudeDelta: 0.02,

        longitudeDelta: 0.02,

      }}

    >

      {stores.map((store, index) => (

        <Marker

          key={index}

          coordinate={{ latitude: store.lat, longitude: store.lng }}

          title={store.name}

          description={store.address}

        />

      ))}

    </MapView>

  );

}

/**

 * =====================================================

 * STYLES

 * =====================================================

 */

const styles = StyleSheet.create({

  screen: {

    flex: 1,

    backgroundColor: COLORS.background,

  },

  container: {

    width: '100%',

    maxWidth: 1200,

    alignSelf: 'center',

    padding: 20,

    paddingBottom: 50,

  },

  /**

   * HEADER

   */

  headerCard: {

    padding: 20,

    marginBottom: 16,

    borderRadius: 20,

    backgroundColor: '#1D2545',

  },

  headerTopRow: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 10,

    marginBottom: 10,

  },

  rankPill: {

    paddingVertical: 4,

    paddingHorizontal: 10,

    borderRadius: 12,

    backgroundColor: COLORS.primary,

  },

  rankPillText: {

    fontSize: 12,

    fontWeight: '800',

    color: '#FFFFFF',

  },

  headerSubText: {

    fontSize: 12,

    color: '#9CA3AF',

  },

  titleRow: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    gap: 12,

  },

  titleArea: {

    flex: 1,

  },

  headerTitle: {

    marginBottom: 4,

    fontSize: 24,

    fontWeight: '900',

    color: '#FFFFFF',

  },

  pointSubtitle: {

    marginTop: 2,

    fontSize: 11,

    fontWeight: '700',

    color: '#A7F3D0',

  },

  favoriteButton: {

    width: 44,

    height: 44,

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 1,

    borderColor: '#E5E7EB',

    borderRadius: 22,

    backgroundColor: '#FFFFFF',

  },

  favoriteButtonActive: {

    borderColor: '#E54861',

    backgroundColor: '#E54861',

  },

  favoriteText: {

    fontSize: 27,

    lineHeight: 31,

    color: '#E54861',

  },

  favoriteTextActive: {

    color: '#FFFFFF',

  },

  headerBusiness: {

    marginTop: 6,

    marginBottom: 16,

    fontSize: 14,

    color: '#D1D5DB',

  },

  scoreRow: {

    flexDirection: 'row',

    alignItems: 'flex-end',

    gap: 6,

  },

  scoreLabel: {

    marginBottom: 4,

    fontSize: 12,

    color: '#9CA3AF',

  },

  scoreValue: {

    fontSize: 30,

    fontWeight: '900',

    color: '#FFD52A',

  },

  scoreUnit: {

    marginBottom: 4,

    fontSize: 13,

    color: '#9CA3AF',

  },

  /**

   * 핵심 지표

   */

  metricGrid: {

    flexDirection: 'row',

    flexWrap: 'wrap',

    gap: 10,

    marginBottom: 16,

  },

  metricBox: {

    flexGrow: 1,

    flexBasis: '47%',

    minWidth: 220,

    padding: 14,

    borderWidth: 1,

    borderColor: COLORS.border,

    borderRadius: 14,

    backgroundColor: COLORS.surface,

  },

  metricLabel: {

    marginBottom: 6,

    fontSize: 11,

    color: COLORS.textSecondary,

  },

  metricValue: {

    fontSize: 15,

    fontWeight: '800',

    color: COLORS.text,

  },

  /**

   * 비교 그래프

   */

  comparisonWrapper: {

    marginBottom: 16,

  },

  noCompareText: {

    marginTop: 8,

    fontSize: 12,

    color: COLORS.textSecondary,

  },

  /**

   * 공통 SECTION

   */

  sectionBox: {

    padding: 16,

    marginBottom: 16,

    borderWidth: 1,

    borderColor: COLORS.border,

    borderRadius: 18,

    backgroundColor: COLORS.surface,

  },

  sectionTitle: {

    marginBottom: 4,

    fontSize: 15,

    fontWeight: '800',

    color: COLORS.text,

  },

  sectionDescription: {

    marginBottom: 12,

    fontSize: 12,

    color: COLORS.textSecondary,

  },

  estimateNotice: {

    marginTop: 8,

    marginBottom: 14,

    padding: 10,

    borderRadius: 10,

    backgroundColor: '#F5FCF6',

    fontSize: 11,

    lineHeight: 17,

    color: COLORS.textSecondary,

  },

  /**

   * 실제 점포

   */

  map: {

    width: '100%',

    height: 200,

    marginBottom: 12,

    borderRadius: 14,

  },

  smallLoadingBox: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 8,

    paddingVertical: 10,

  },

  smallLoadingText: {

    fontSize: 12,

    color: COLORS.textSecondary,

  },

  storesError: {

    fontSize: 12,

    color: '#D14343',

  },

  storesEmpty: {

    fontSize: 12,

    color: COLORS.textSecondary,

  },

  storeRow: {

    paddingVertical: 10,

    borderTopWidth: 1,

    borderTopColor: COLORS.border,

  },

  storeName: {

    fontSize: 13,

    fontWeight: '700',

    color: COLORS.text,

  },

  storeAddress: {

    marginTop: 2,

    fontSize: 12,

    color: COLORS.textSecondary,

  },

  /**

   * 상세 지표

   */

  detailRow: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    gap: 20,

    paddingVertical: 10,

    borderBottomWidth: 1,

    borderBottomColor: COLORS.border,

  },

  detailRowLast: {

    borderBottomWidth: 0,

  },

  detailLabel: {

    fontSize: 13,

    color: COLORS.textSecondary,

  },

  detailValue: {

    flexShrink: 1,

    textAlign: 'right',

    fontSize: 13,

    fontWeight: '800',

    color: COLORS.text,

  },

  /**

   * PDF 저장 / 공유

   */

  reportActionRow: {

    width: '100%',

    flexDirection: 'row',

    gap: 10,

    marginBottom: 16,

  },

  reportActionButton: {

    flex: 1,

    minHeight: 72,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 10,

    paddingHorizontal: 14,

    paddingVertical: 12,

    borderWidth: 1,

    borderColor: '#DDE4EA',

    borderRadius: 16,

    backgroundColor: '#FFFFFF',

  },

  reportActionIcon: {

    width: 28,

    textAlign: 'center',

    fontSize: 22,

    fontWeight: '800',

    color: COLORS.primary,

  },

  reportActionContent: {

    flex: 1,

  },

  reportActionTitle: {

    marginBottom: 3,

    fontSize: 13,

    fontWeight: '800',

    color: COLORS.text,

  },

  reportActionDescription: {

    fontSize: 10,

    lineHeight: 15,

    color: COLORS.textSecondary,

  },

  /**

   * 지도에서 보기

   */

checklistCreateButton: {

      width: '100%',

      minHeight: 76,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 12,

      paddingHorizontal: 16,

      paddingVertical: 14,

      marginBottom: 16,

      borderWidth: 1,

      borderColor: '#BFE4C9',

      borderRadius: 16,

      backgroundColor: '#F7FCF8',

    },

    checklistCreateButtonDisabled: {

      opacity: 0.65,

    },

    checklistCreateIcon: {

      width: 42,

      height: 42,

      alignItems: 'center',

      justifyContent: 'center',

      borderRadius: 21,

      backgroundColor: '#E9F8EC',

    },

    checklistCreateIconText: {

      fontSize: 20,

      fontWeight: '900',

      color: COLORS.primary,

    },

    checklistCreateContent: {

      flex: 1,

    },

    checklistCreateTitle: {

      marginBottom: 3,

      fontSize: 14,

      fontWeight: '900',

      color: COLORS.text,

    },

    checklistCreateDescription: {

      fontSize: 11,

      lineHeight: 16,

      color: COLORS.textSecondary,

    },

    checklistCreateArrow: {

      marginLeft: 4,

      fontSize: 27,

      fontWeight: '400',

      color: COLORS.primary,

    },

      mapViewButton: {

    width: '100%',

    flexDirection: 'row',

    alignItems: 'center',

    gap: 12,

    paddingHorizontal: 16,

    paddingVertical: 14,

    marginBottom: 16,

    borderWidth: 1,

    borderColor: '#DDE4EA',

    borderRadius: 16,

    backgroundColor: '#FFFFFF',

  },

  mapViewIcon: {

    width: 42,

    height: 42,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 21,

    backgroundColor: '#F1F5F3',

  },

  mapViewIconText: {

    fontSize: 20,

  },

  mapViewContent: {

    flex: 1,

  },

  mapViewTitle: {

    marginBottom: 3,

    fontSize: 14,

    fontWeight: '800',

    color: COLORS.text,

  },

  mapViewDescription: {

    fontSize: 11,

    lineHeight: 16,

    color: COLORS.textSecondary,

  },

  mapViewArrow: {

    marginLeft: 4,

    fontSize: 27,

    fontWeight: '400',

    color: COLORS.primary,

  },

  /**

   * AI 챗봇 버튼

   */

  chatButton: {

    width: '100%',

    flexDirection: 'row',

    alignItems: 'center',

    gap: 12,

    paddingHorizontal: 16,

    paddingVertical: 14,

    marginBottom: 16,

    borderWidth: 1,

    borderColor: '#F0DEA0',

    backgroundColor: '#FFF4C2',

    borderRadius: 16,

  },

  chatImageIcon: {

    width: 48,

    height: 48,

    marginRight: 2,

  },

  chatButtonContent: {

    flex: 1,

  },

  chatButtonTitle: {

    marginBottom: 3,

    fontSize: 14,

    fontWeight: '800',

    color: COLORS.text,

  },

  chatButtonDescription: {

    fontSize: 11,

    lineHeight: 16,

    color: COLORS.textSecondary,

  },

  chatButtonArrow: {

    marginLeft: 4,

    fontSize: 27,

    fontWeight: '400',

    color: '#1D2545',

  },

  /**

   * AI

   */

  aiReasonText: {

    fontSize: 13,

    lineHeight: 20,

    color: COLORS.text,

  },

  aiHighlight: {

    fontWeight: '900',

    color: COLORS.primary,

  },

  chunkList: {

    marginTop: 12,

    gap: 8,

  },

  chunkRowGood: {

    flexDirection: 'row',

    alignItems: 'flex-start',

    gap: 8,

    padding: 10,

    borderRadius: 10,

    backgroundColor: '#FFF8D9',

  },

  chunkIconGood: {

    fontSize: 13,

    fontWeight: '900',

    color: '#1D2545',

  },

  chunkTextGood: {

    flex: 1,

    fontSize: 12,

    lineHeight: 18,

    color: '#1D2545',

  },

  chunkRowWarn: {

    flexDirection: 'row',

    alignItems: 'flex-start',

    gap: 8,

    padding: 10,

    borderRadius: 10,

    backgroundColor: '#FFF8E8',

  },

  chunkIconWarn: {

    fontSize: 13,

    fontWeight: '900',

    color: '#B45309',

  },

  chunkTextWarn: {

    flex: 1,

    fontSize: 12,

    lineHeight: 18,

    color: '#7C4A03',

  },

  detailToggleButton: {

    marginTop: 14,

    paddingVertical: 6,

    alignItems: 'center',

  },

  detailToggleText: {

    fontSize: 12,

    fontWeight: '700',

    color: COLORS.textSecondary,

  },

  aiDetailSection: {

    marginTop: 10,

    paddingTop: 10,

    borderTopWidth: 1,

    borderTopColor: COLORS.border,

  },

  aiLabel: {

    marginTop: 8,

    marginBottom: 4,

    fontSize: 12,

    fontWeight: '800',

    color: COLORS.textSecondary,

  },

});