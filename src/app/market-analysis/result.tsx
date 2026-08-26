import { sejongAreas } from '@/constants/sejongAreas';
import type { AIExplanation } from '@/services/aiExplanation';
import { generateAIExplanation } from '@/services/aiExplanation';
import type { ScoredCommercialAnalysisResult } from '@/services/commercialAnalysis';
import {
  analyzeCommercialArea,
  calculateSuitabilityScores,
} from '@/services/commercialAnalysis';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type RankedResult = ScoredCommercialAnalysisResult & {rank: number};

const delay = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

// AI 응답 안의 **단어** 표시를, 실제로 굵고 파란 글씨로 렌더링합니다.
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

// 점수가 같으면 같은 순위를 부여합니다 (예: 1위, 1위, 3위 — 근거 없이 임의로 순서를 나누지 않기 위함).
function assignRanksWithTies(
  sortedResults: ScoredCommercialAnalysisResult[],
): RankedResult[] {
  const ranked: RankedResult[] = [];
  sortedResults.forEach((item, index) => {
    const rank =
      index > 0 &&
      sortedResults[index - 1].suitabilityScore === item.suitabilityScore
        ? ranked[index - 1].rank
        : index + 1;
    ranked.push({...item, rank});
  });
  return ranked;
}

// 같은 순위를 가진 항목이 2개 이상이면 "공동 N위"로 표시합니다.
function getRankLabel(item: RankedResult, allResults: RankedResult[]) {
  const tiedCount = allResults.filter(r => r.rank === item.rank).length;
  return tiedCount > 1 ? `공동 ${item.rank}위` : `${item.rank}위`;
}

export default function ResultScreen() {
  const {businessName, lclsCode, mclsCode, sclsCode, areas} =
    useLocalSearchParams<{
      businessName: string;
      lclsCode: string;
      mclsCode: string;
      sclsCode: string;
      areas: string;
    }>();

  const [results, setResults] = useState<RankedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [aiExplanations, setAiExplanations] = useState<
    Record<string, AIExplanation>
  >({});
  const [aiLoadingKeys, setAiLoadingKeys] = useState<Record<string, boolean>>(
    {},
  );
  const [aiErrorKeys, setAiErrorKeys] = useState<Record<string, string>>({});
  // 카드별로 "상세 설명" 펼침 여부를 따로 관리합니다.
  const [detailExpandedKeys, setDetailExpandedKeys] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const selectedAreaNames = areas.split(',');
    const targets = sejongAreas.filter(area =>
      selectedAreaNames.includes(area.name),
    );

    const run = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        setResults([]);

        const analysisResults = [];

        for (const area of targets) {
          try {
            const result = await analyzeCommercialArea(
              area.name,
              area.code,
              businessName,
              lclsCode,
              mclsCode || undefined,
              sclsCode || undefined,
            );
            analysisResults.push(result);
            await delay(600);
          } catch (error) {
            console.error(`${area.name} 분석 실패`, error);
            if (error instanceof Error && error.message.includes('429')) {
              await delay(2000);
            }
          }
        }

        if (analysisResults.length === 0) {
          setErrorMessage(
            '분석 결과를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.',
          );
          return;
        }

        const scoredResults = calculateSuitabilityScores(analysisResults);
        setResults(assignRanksWithTies(scoredResults));
      } catch (error) {
        console.error('상권 분석 오류:', error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : '상권 분석 중 오류가 발생했습니다.',
        );
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessName, lclsCode, mclsCode, sclsCode, areas]);

  const handleGenerateAI = async (item: RankedResult) => {
    const key = item.areaName;
    if (aiExplanations[key] || aiLoadingKeys[key]) {
      return;
    }

    setAiLoadingKeys(prev => ({...prev, [key]: true}));
    setAiErrorKeys(prev => ({...prev, [key]: ''}));

    try {
      const explanation = await generateAIExplanation({
        지역: item.areaName,
        업종: businessName,
        유동인구: item.floatingPopulation,
        생활인구: item.livingPopulation,
        점포수: item.storeCount,
        경쟁밀도: item.competitionDensity,
        전체카드소비: item.salesAmount,
        점포당카드소비: item.averageSalesPerStore,
        버스정류장수: item.busStopCount,
        적합도점수: item.suitabilityScore,
        순위: item.rank,
      });
      setAiExplanations(prev => ({...prev, [key]: explanation}));
    } catch (error) {
      console.error('AI 설명 생성 오류:', error);
      setAiErrorKeys(prev => ({
        ...prev,
        [key]:
          error instanceof Error
            ? error.message
            : 'AI 설명을 가져오지 못했습니다.',
      }));
    } finally {
      setAiLoadingKeys(prev => ({...prev, [key]: false}));
    }
  };

  const toggleDetail = (key: string) => {
    setDetailExpandedKeys(prev => ({...prev, [key]: !prev[key]}));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{`'${businessName}' 지역별 적합도 순위`}</Text>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>상권 데이터를 분석하는 중...</Text>
        </View>
      )}

      {!loading && errorMessage !== '' && (
        <Text style={styles.error}>{errorMessage}</Text>
      )}

      {!loading &&
        errorMessage === '' &&
        results.map(item => {
          const key = item.areaName;
          const explanation = aiExplanations[key];
          const aiLoading = aiLoadingKeys[key];
          const aiError = aiErrorKeys[key];
          const detailExpanded = detailExpandedKeys[key];

          return (
            <View key={key} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.rank}>{getRankLabel(item, results)}</Text>
                <Text style={styles.name}>{item.areaName}</Text>
                <Text style={styles.score}>{`${item.suitabilityScore}점`}</Text>
              </View>
              <Text style={styles.metaLine}>
                {`유동인구 ${item.floatingPopulation.toLocaleString()}명 · ${businessName} ${item.storeCount}개`}
              </Text>
              <Text style={styles.metaLine}>
                {`경쟁밀도 ${item.competitionDensity.toFixed(2)} · 점포당 카드소비 ${Math.round(
                  item.averageSalesPerStore,
                ).toLocaleString()}원`}
              </Text>

              {!explanation && (
                <TouchableOpacity
                  style={styles.aiButton}
                  activeOpacity={0.7}
                  disabled={aiLoading}
                  onPress={() => handleGenerateAI(item)}>
                  {aiLoading ? (
                    <ActivityIndicator size="small" color="#1D4ED8" />
                  ) : (
                    <Text style={styles.aiButtonText}>AI 설명 보기</Text>
                  )}
                </TouchableOpacity>
              )}

              {aiError && !aiLoading && (
                <Text style={styles.aiError}>{aiError}</Text>
              )}

              {explanation && (
                <View style={styles.aiBox}>
                  <Text style={styles.aiLabel}>추천 이유</Text>
                  {renderEmphasizedText(
                    explanation.recommendationReason,
                    styles.aiText,
                  )}

                  <TouchableOpacity
                    style={styles.detailToggleButton}
                    activeOpacity={0.7}
                    onPress={() => toggleDetail(key)}>
                    <Text style={styles.detailToggleText}>
                      {detailExpanded ? '상세 설명 접기 ▲' : '상세 설명 보기 ▼'}
                    </Text>
                  </TouchableOpacity>

                  {detailExpanded && (
                    <View style={styles.detailSection}>
                      <Text style={styles.aiLabel}>주요 특징</Text>
                      {renderEmphasizedText(
                        explanation.keyFeatures,
                        styles.aiText,
                      )}

                      <Text style={styles.aiLabel}>장점</Text>
                      {explanation.advantages.map((advantage, index) => (
                        <Text key={index} style={styles.aiListItem}>
                          {`· ${advantage}`}
                        </Text>
                      ))}

                      <Text style={styles.aiLabel}>위험요소</Text>
                      {explanation.risks.map((risk, index) => (
                        <Text key={index} style={styles.aiListItem}>
                          {`· ${risk}`}
                        </Text>
                      ))}

                      <Text style={styles.aiLabel}>고려사항</Text>
                      <Text style={styles.aiText}>
                        {explanation.considerations}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {padding: 20, paddingBottom: 40, backgroundColor: '#FFFFFF'},
  title: {fontSize: 20, fontWeight: '700', marginTop: 12, marginBottom: 20},
  loadingBox: {marginTop: 30, alignItems: 'center', gap: 10},
  loadingText: {fontSize: 14, color: '#6B6B6B'},
  error: {color: '#D14343', fontSize: 14, marginTop: 12},
  card: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rank: {fontSize: 14, fontWeight: '700', color: '#1D4ED8', marginRight: 8},
  name: {fontSize: 16, fontWeight: '700', color: '#1A1A1A', flex: 1},
  score: {fontSize: 14, fontWeight: '700', color: '#1D4ED8'},
  metaLine: {fontSize: 12, color: '#8A8A8A', marginBottom: 2},
  aiButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1D4ED8',
    alignItems: 'center',
  },
  aiButtonText: {fontSize: 13, fontWeight: '700', color: '#1D4ED8'},
  aiError: {fontSize: 12, color: '#D14343', marginTop: 10},
  aiBox: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  aiLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B6B6B',
    marginTop: 10,
    marginBottom: 4,
  },
  aiText: {fontSize: 13, color: '#3A3A3A', lineHeight: 19},
  aiHighlight: {fontWeight: '700', color: '#1D4ED8'},
  aiListItem: {fontSize: 13, color: '#3A3A3A', lineHeight: 19, marginLeft: 4},
  detailToggleButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  detailToggleText: {fontSize: 12, fontWeight: '600', color: '#6B6B6B'},
  detailSection: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
});