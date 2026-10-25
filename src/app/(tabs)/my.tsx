import { COLORS } from '@/constants/colors';
import { useResponsive } from '@/hooks/useResponsive';

import {
  AnalysisHistoryItem,

  deleteAnalysis,

  getAnalysisHistory,
} from '@/services/analysisHistory';

import {
  deleteChecklist,
  getChecklistProgress,
  getChecklists,
  SavedChecklist,
  toggleChecklistItem,
} from '@/services/checklistStorage';

import { getCurrentUser, signOut } from '@/services/auth';

import {
  getStartupNeeds,
  getStartupNeedsProgress,
  StartupNeeds,
} from '@/services/startupNeeds';

import { confirmDialog } from '@/utils/dialog';

import { useFocusEffect, useRouter } from 'expo-router';

import { useCallback, useMemo, useState } from 'react';

import {
  ActivityIndicator,

  ScrollView,

  StyleSheet,

  Text,

  TouchableOpacity,

  View,
} from 'react-native';

type ChecklistCategory =
  | '입지·상권'
  | '인허가·행정'
  | '시설·설비'
  | '운영·자금'
  | '기타';

const CHECKLIST_CATEGORY_ORDER: ChecklistCategory[] = [
  '입지·상권',
  '인허가·행정',
  '시설·설비',
  '운영·자금',
  '기타',
];

function getChecklistCategory(text: string): ChecklistCategory {
  const normalized = text.replace(/\s+/g, ' ').trim();

  if (
    /(고객층|유동인구|상권|경쟁|입지|매장 형태|매장형태|점포|주변 경쟁|소비층)/.test(
      normalized,
    )
  ) {
    return '입지·상권';
  }

  if (
    /(건축물대장|보건증|위생교육|영업신고|사업자등록|허가|신고|행정|세무|관할)/.test(
      normalized,
    )
  ) {
    return '인허가·행정';
  }

  if (
    /(설비|전기|배관|상하수도|정화조|주방|장비|머신|그라인더|제빙기|블렌더|쇼케이스|소방|완비증명|인테리어)/.test(
      normalized,
    )
  ) {
    return '시설·설비';
  }

  if (
    /(자금|보증금|권리금|운영 여유 자금|운영자금|공급처|원두|우유|시럽|포장재|메뉴|가격|결제|POS|포스|카드 단말기|브랜딩|디저트)/.test(
      normalized,
    )
  ) {
    return '운영·자금';
  }

  return '기타';
}

function splitChecklistText(text: string) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const colonIndex = normalized.indexOf(':');

  if (colonIndex > 0) {
    const title = normalized.slice(0, colonIndex).trim();
    const description = normalized.slice(colonIndex + 1).trim();

    return {
      title,
      description,
    };
  }

  const dashMatch = normalized.match(/^(.{3,28}?)\s+-\s+(.+)$/);

  if (dashMatch) {
    return {
      title: dashMatch[1].trim(),
      description: dashMatch[2].trim(),
    };
  }

  return {
    title: normalized,
    description: '',
  };
}

type PlaceGroup = {
  place: string;
  items: SavedChecklist['items'];
};

function getChecklistPlace(text: string) {
  const normalized = text.replace(/\s+/g, ' ').trim();

  if (/(세무서|홈택스|사업자등록)/.test(normalized)) {
    return '세무서 · 홈택스';
  }

  if (
    /(구청|보건소|영업신고|위생과|건축물대장|건축과)/.test(
      normalized,
    )
  ) {
    return '관할 구청 · 보건소';
  }

  if (
    /(위생교육|한국휴게음식업중앙회|온라인 교육)/.test(
      normalized,
    )
  ) {
    return '온라인 교육기관';
  }

  if (/(보건증|건강진단결과서|병원|의료기관)/.test(normalized)) {
    return '보건소 · 지정 의료기관';
  }

  if (
    /(전기|배관|상하수도|정화조|주방|소방|설비|인테리어|현장)/.test(
      normalized,
    )
  ) {
    return '매장 현장';
  }

  if (
    /(공급처|원두|우유|시럽|포장재|장비|머신|그라인더|제빙기|블렌더|쇼케이스|POS|포스|카드 단말기)/.test(
      normalized,
    )
  ) {
    return '업체 · 공급처';
  }

  return '직접 확인';
}

export default function MyScreen() {
  const { frameMaxWidth, horizontalPadding } = useResponsive();
  const router = useRouter();

  const [histories, setHistories] = useState<AnalysisHistoryItem[]>([]);
  const [checklists, setChecklists] = useState<SavedChecklist[]>([]);
  const [checklistViewMode, setChecklistViewMode] =
    useState<'category' | 'place'>('category');
  const [expandedChecklistIds, setExpandedChecklistIds] =
    useState<Record<string, boolean>>({});

  const [startupNeed, setStartupNeed] = useState<StartupNeeds | null>(null);

  const [nickname, setNickname] = useState('');

  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(true);

  const [loggedOut, setLoggedOut] = useState(false);

  const loadData = useCallback(async () => {

    try {

      setLoading(true);

      const user = await getCurrentUser();

      /**

       * 로그인 안 되어 있으면 이 화면 안에서 안내만 보여줌

       * (탭 바가 유지되어 다른 탭으로 이동 가능)

       */

      if (!user) {

        setLoggedOut(true);

        return;

      }

      setLoggedOut(false);

      setEmail(user.email ?? '');

      setNickname(user.user_metadata?.nickname ?? '사용자');

      const [historyData, needsData, checklistData] = await Promise.all([
        getAnalysisHistory(),
        getStartupNeeds(),
        getChecklists(),
      ]);

      setHistories(historyData);
      setStartupNeed(needsData);
      setChecklists(checklistData);

    } catch (error) {

      console.error('MY 데이터 조회 실패:', error);

    } finally {

      setLoading(false);

    }

  }, [router]);

  useFocusEffect(

    useCallback(() => {

      loadData();

    }, [loadData]),

  );

  const favoriteHistories = useMemo(

    () => histories.filter(item => item.isFavorite === true),

    [histories],

  );

  const recentHistories = useMemo(

    () =>

      [...histories]

        .sort(

          (a, b) =>

            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),

        )

        .slice(0, 3),

    [histories],

  );

  const recentChecklists = useMemo(
    () =>
      [...checklists]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .slice(0, 3),
    [checklists],
  );

  const needsProgress = useMemo(
    () => getStartupNeedsProgress(startupNeed),
    [startupNeed],
  );

  const getGroupedChecklistItems = useCallback(
    (checklist: SavedChecklist) => {
      const grouped = CHECKLIST_CATEGORY_ORDER.map(category => ({
        category,
        items: checklist.items.filter(
          item => getChecklistCategory(item.text) === category,
        ),
      })).filter(group => group.items.length > 0);

      return grouped;
    },
    [],
  );

  const getPlaceGroupedChecklistItems = useCallback(
    (checklist: SavedChecklist): PlaceGroup[] => {
      const map = new Map<string, SavedChecklist['items']>();

      checklist.items.forEach(item => {
        const place = getChecklistPlace(item.text);
        const current = map.get(place) ?? [];

        map.set(place, [...current, item]);
      });

      const preferredOrder = [
        '관할 구청 · 보건소',
        '세무서 · 홈택스',
        '보건소 · 지정 의료기관',
        '온라인 교육기관',
        '매장 현장',
        '업체 · 공급처',
        '직접 확인',
      ];

      return preferredOrder
        .map(place => ({
          place,
          items: map.get(place) ?? [],
        }))
        .filter(group => group.items.length > 0);
    },
    [],
  );

  const formatDate = (dateString: string) => {

    const date = new Date(dateString);

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, '0');

    const day = String(date.getDate()).padStart(2, '0');

    return `${year}.${month}.${day}`;

  };

  const getTypeLabel = (type: AnalysisHistoryItem['type']) => {

    switch (type) {

      case 'comparison':

        return '비교 분석';

      case 'location':

        return '입지 추천';

      case 'owned':

        return '보유 입지 분석';

      default:

        return '분석';

    }

  };

  const toggleChecklistExpanded = (checklistId: string) => {
    setExpandedChecklistIds(prev => ({
      ...prev,
      [checklistId]: !prev[checklistId],
    }));
  };

  const handleToggleChecklistItem = async (
    checklistId: string,
    itemId: string,
  ) => {
    try {
      const updated = await toggleChecklistItem(checklistId, itemId);

      if (!updated) {
        return;
      }

      setChecklists(prev =>
        prev.map(item => (item.id === updated.id ? updated : item)),
      );
    } catch (error) {
      console.error('체크리스트 상태 변경 실패:', error);
    }
  };

  const handleDeleteChecklist = async (checklistId: string) => {
    const ok = await confirmDialog(
      'AI 체크리스트 삭제',
      '이 체크리스트를 삭제할까요?',
      '삭제',
      true,
    );

    if (!ok) {
      return;
    }

    try {
      await deleteChecklist(checklistId);
      setChecklists(prev => prev.filter(item => item.id !== checklistId));
    } catch (error) {
      console.error('체크리스트 삭제 실패:', error);
    }
  };

  const handleChecklistChat = (checklist: SavedChecklist) => {
    router.push({
      pathname: '/chat',
      params: {
        returnTo: '/my',
        businessName: checklist.businessName ?? '',
        areaName: checklist.areaName ?? '',
      },
    });
  };

  const handleLogout = async () => {

    const ok = await confirmDialog('로그아웃', '로그아웃할까요?', '로그아웃');

    if (!ok) {

      return;

    }

    try {

      await signOut();

      setHistories([]);

      setStartupNeed(null);

      setNickname('');

      setEmail('');

      setLoggedOut(true);

    } catch (error) {

      console.error('로그아웃 실패:', error);

    }

  };

  const handleDelete = async (id: string) => {

    const ok = await confirmDialog(

      '분석 기록 삭제',

      '이 분석 결과를 삭제할까요?',

      '삭제',

      true,

    );

    if (!ok) {

      return;

    }

    await deleteAnalysis(id);

    setHistories(prev => prev.filter(item => item.id !== id));

  };

  const handleView = (history: AnalysisHistoryItem) => {

    const data = history.resultData;

    if (!data) {

      return;

    }

    router.push({

      pathname: '/market-analysis/region-result-detail',

      params: {

        businessName: data.businessName ?? history.businessName,

        areaName: data.areaName ?? history.regions[0] ?? '',

        rank: String(data.rank ?? 1),

        totalCount: String(data.totalCount ?? 1),

        suitabilityScore: String(data.suitabilityScore ?? 0),

        floatingPopulation: String(data.floatingPopulation ?? 0),

        livingPopulation: String(data.livingPopulation ?? 0),

        storeCount: String(data.storeCount ?? 0),

        competitionDensity: String(data.competitionDensity ?? 0),

        salesAmount: String(data.salesAmount ?? 0),

        averageSalesPerStore: String(data.averageSalesPerStore ?? 0),

        busStopCount: String(data.busStopCount ?? 0),

        livingPopulationChangeRate: String(data.livingPopulationChangeRate ?? 0),

        floatingPopulationChangeRate: String(

          data.floatingPopulationChangeRate ?? 0,

        ),

        analysisType: data.analysisType ?? 'area',

        dongName: data.dongName ?? data.areaName ?? '',

        latitude: data.latitude != null ? String(data.latitude) : '',

        longitude: data.longitude != null ? String(data.longitude) : '',

        radius: data.radius != null ? String(data.radius) : '',

      },

    });

  };

  if (loading) {

    return (

      <View style={styles.fullLoading}>

        <ActivityIndicator size="large" color={COLORS.primary} />

      </View>

    );

  }

  if (loggedOut) {

    return (

      <View style={styles.loggedOutBox}>

        <Text style={styles.loggedOutIcon}>🔒</Text>

        <Text style={styles.loggedOutTitle}>로그인이 필요해요</Text>

        <Text style={styles.loggedOutDescription}>

          로그인하면 분석 기록과 찜한 분석,{'\n'}나의 창업 니즈를 볼 수 있어요.

        </Text>

        <TouchableOpacity

          style={styles.loggedOutPrimary}

          onPress={() => router.push('/auth/login')}

        >

          <Text style={styles.loggedOutPrimaryText}>로그인하러 가기</Text>

        </TouchableOpacity>

        <TouchableOpacity

          style={styles.loggedOutSecondary}

          onPress={() => router.push('/auth/signup')}

        >

          <Text style={styles.loggedOutSecondaryText}>회원가입</Text>

        </TouchableOpacity>

      </View>

    );

  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.container,
        {
          width: '100%',
          maxWidth: frameMaxWidth,
          alignSelf: 'center',
          paddingHorizontal: horizontalPadding,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >

      <View style={styles.profileHeader}>

        <View style={styles.profileInfo}>

          <Text style={styles.title}>MY</Text>

          <Text style={styles.nickname}>{nickname}님</Text>

          <Text style={styles.email}>{email}</Text>

        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>

          <Text style={styles.logoutText}>로그아웃</Text>

        </TouchableOpacity>

      </View>

      {startupNeed ? (

        <View style={styles.needCard}>

          <View style={styles.sectionHeader}>

            <View>

              <Text style={styles.sectionEyebrow}>MY STARTUP</Text>

              <Text style={styles.sectionTitle}>나의 창업 니즈</Text>

            </View>

            <TouchableOpacity

              style={styles.editButton}

              onPress={() => router.push('/auth/needs-setup')}

            >

              <Text style={styles.editButtonText}>다시 보기 · 수정</Text>

            </TouchableOpacity>

          </View>

          {/* 진행 상태 표시 */}
          <View style={styles.needProgressRow}>
            <View style={styles.needProgressTrack}>
              <View
                style={[
                  styles.needProgressFill,
                  { width: `${needsProgress.percent}%` },
                ]}
              />
            </View>
            <Text style={styles.needProgressText}>
              {needsProgress.completed}/{needsProgress.total}개 항목 작성 (
              {needsProgress.percent}%)
            </Text>
          </View>

          {!!startupNeed.updatedAt && (
            <Text style={styles.needUpdatedAt}>
              마지막 수정 {formatDate(startupNeed.updatedAt)}
            </Text>
          )}

          <View style={styles.needMainRow}>

            <View style={styles.needMainItem}>

              <Text style={styles.needLabel}>준비 단계</Text>

              <Text style={styles.needValue}>
                {startupNeed.startupStage || '미설정'}
              </Text>

            </View>

            <View style={styles.needMainItem}>

              <Text style={styles.needLabel}>예산</Text>

              <Text style={styles.needValue}>
                {startupNeed.budget || '미설정'}
              </Text>

            </View>

          </View>

          <View style={styles.needBlock}>

            <Text style={styles.needLabel}>관심 업종</Text>

            <View style={styles.chipRow}>

              {startupNeed.businessTypes.length > 0 ? (
                startupNeed.businessTypes.map(business => (
                  <View key={business} style={styles.grayChip}>
                    <Text style={styles.grayChipText}>{business}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.needText}>미설정</Text>
              )}

            </View>

          </View>

          <View style={styles.needBlock}>

            <Text style={styles.needLabel}>선호 지역</Text>

            <View style={styles.chipRow}>

              {startupNeed.preferredAreas.map(area => (

                <View key={area} style={styles.grayChip}>

                  <Text style={styles.grayChipText}>{area}</Text>

                </View>

              ))}

            </View>

          </View>

          <View style={styles.needBlock}>

            <Text style={styles.needLabel}>창업 형태</Text>

            <Text style={styles.needText}>
              {startupNeed.startupType || '미설정'}
            </Text>

          </View>

          <View style={styles.needBlock}>

            <Text style={styles.needLabel}>보유 장소</Text>

            <Text style={styles.needText}>
              {startupNeed.hasLocation
                ? startupNeed.locationAddress || '있음 (주소 미입력)'
                : '없음 · 입지부터 탐색 중'}
            </Text>

          </View>

          <View style={styles.needBlock}>

            <Text style={styles.needLabel}>중요하게 보는 기준</Text>

            {startupNeed.priorities.map((priority, index) => (

              <View key={priority} style={styles.priorityRow}>

                <View style={styles.priorityNumber}>

                  <Text style={styles.priorityNumberText}>{index + 1}</Text>

                </View>

                <Text style={styles.priorityText}>{priority}</Text>

              </View>

            ))}

          </View>

          <View style={styles.needBlock}>

            <Text style={styles.needLabel}>주요 고객층</Text>

            <Text style={styles.needText}>{startupNeed.targetCustomer}</Text>

          </View>

          <TouchableOpacity
            style={styles.needCtaButton}
            onPress={() => router.push('/market-analysis/industry')}
          >
            <Text style={styles.needCtaButtonText}>
              이 조건으로 분석 시작하기
            </Text>
            <Text style={styles.needCtaArrow}>›</Text>
          </TouchableOpacity>

        </View>

      ) : (

        <TouchableOpacity

          style={styles.emptyNeedsCard}

          onPress={() => router.push('/auth/needs-setup')}

        >

          <Text style={styles.emptyNeedsTitle}>창업 니즈를 설정해주세요</Text>

          <Text style={styles.emptyNeedsDescription}>

            희망 업종과 지역을 설정하면 맞춤 분석에 활용할 수 있어요.

          </Text>

        </TouchableOpacity>

      )}

      <View style={styles.summaryCard}>

        <TouchableOpacity
          style={styles.summaryItem}
          activeOpacity={0.75}
          onPress={() =>
            (router as any).push({
              pathname: '/my/analysis-history',
              params: { filter: 'all' },
            })
          }
        >
          <Text style={styles.summaryNumber}>{histories.length}</Text>
          <Text style={styles.summaryLabel}>전체 분석</Text>
        </TouchableOpacity>

        <View style={styles.summaryDivider} />

        <TouchableOpacity
          style={styles.summaryItem}
          activeOpacity={0.75}
          onPress={() => router.push('/my/favorites')}
        >
          <Text style={styles.summaryNumber}>{favoriteHistories.length}</Text>
          <Text style={styles.summaryLabel}>찜한 분석</Text>
        </TouchableOpacity>

        <View style={styles.summaryDivider} />

        <TouchableOpacity
          style={styles.summaryItem}
          activeOpacity={0.75}
          onPress={() =>
            (router as any).push({
              pathname: '/my/analysis-history',
              params: { filter: 'comparison' },
            })
          }
        >
          <Text style={styles.summaryNumber}>
            {histories.filter(item => item.type === 'comparison').length}
          </Text>
          <Text style={styles.summaryLabel}>비교 분석</Text>
        </TouchableOpacity>

      </View>

      <TouchableOpacity

        style={styles.favoriteCard}

        onPress={() => router.push('/my/favorites')}

      >

        <View style={styles.favoriteIconBox}>

          <Text style={styles.favoriteIcon}>♥</Text>

        </View>

        <View style={styles.favoriteBody}>

          <Text style={styles.favoriteTitle}>찜한 분석</Text>

          <Text style={styles.favoriteDescription}>

            마음에 든 분석 결과를 따로 모아볼 수 있어요.

          </Text>

        </View>

        <Text style={styles.favoriteCount}>{favoriteHistories.length}</Text>

        <Text style={styles.arrow}>›</Text>

      </TouchableOpacity>

      <View style={styles.aiSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>AI ASSISTANT</Text>
            <Text style={styles.sectionTitle}>AI 체크리스트</Text>
          </View>

        </View>

        {recentChecklists.length === 0 ? (
          <View style={styles.aiEmptyCard}>
            <Text style={styles.aiEmptyIcon}>✓</Text>
            <Text style={styles.aiEmptyTitle}>저장된 AI 체크리스트가 없어요</Text>
            <Text style={styles.aiEmptyDescription}>
              챗봇에서 체크리스트를 만들면 MY에서 이어서 관리할 수 있어요.
            </Text>

            <TouchableOpacity
              style={styles.aiEmptyButton}
              onPress={() =>
                router.push({
                  pathname: '/chat',
                  params: { returnTo: '/my' },
                })
              }
            >
              <Text style={styles.aiEmptyButtonText}>AI 체크리스트 만들기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recentChecklists.map(checklist => {
            const progress = getChecklistProgress(checklist);

            return (
              <View key={checklist.id} style={styles.checklistCard}>
                <View style={styles.checklistTopRow}>
                  <View style={styles.checklistTitleArea}>
                    <Text style={styles.checklistBadge}>AI CHECKLIST</Text>
                    <Text style={styles.checklistTitle}>{checklist.title}</Text>

                    {(checklist.businessName || checklist.areaName) && (
                      <Text style={styles.checklistContext}>
                        {[checklist.businessName, checklist.areaName]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    )}
                  </View>

                  <View style={styles.checklistTopActions}>
                    {progress.percent === 100 && (
                      <View style={styles.checklistCompleteBadge}>
                        <Text style={styles.checklistCompleteBadgeText}>
                          완료
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.checklistExpandButton}
                      activeOpacity={0.75}
                      onPress={() => toggleChecklistExpanded(checklist.id)}
                    >
                      <Text style={styles.checklistExpandButtonText}>
                        {expandedChecklistIds[checklist.id]
                          ? '접기'
                          : '펼치기'}
                      </Text>
                      <Text style={styles.checklistExpandArrow}>
                        {expandedChecklistIds[checklist.id] ? '⌃' : '⌄'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.checklistDeleteButton}
                      onPress={() => handleDeleteChecklist(checklist.id)}
                    >
                      <Text style={styles.checklistDeleteText}>삭제</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.progressHeader}>
                  <Text style={styles.progressText}>
                    {progress.completed}/{progress.total} 완료
                  </Text>
                  <Text style={styles.progressPercent}>{progress.percent}%</Text>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progress.percent}%` },
                    ]}
                  />
                </View>

                {!expandedChecklistIds[checklist.id] && (
                  <TouchableOpacity
                    style={styles.checklistCollapsedSummary}
                    activeOpacity={0.75}
                    onPress={() => toggleChecklistExpanded(checklist.id)}
                  >
                    <View>
                      <Text style={styles.checklistCollapsedTitle}>
                        체크리스트 항목 보기
                      </Text>
                      <Text style={styles.checklistCollapsedDescription}>
                        단계별·장소별로 확인하고 바로 체크할 수 있어요
                      </Text>
                    </View>

                    <Text style={styles.checklistCollapsedArrow}>›</Text>
                  </TouchableOpacity>
                )}

                {expandedChecklistIds[checklist.id] && (
                  <>
                    <View style={styles.checklistViewToggle}>
                      <TouchableOpacity
                        style={[
                          styles.checklistViewToggleButton,
                          checklistViewMode === 'category' &&
                          styles.checklistViewToggleButtonActive,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => setChecklistViewMode('category')}
                      >
                        <Text
                          style={[
                            styles.checklistViewToggleText,
                            checklistViewMode === 'category' &&
                            styles.checklistViewToggleTextActive,
                          ]}
                        >
                          단계별 보기
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.checklistViewToggleButton,
                          checklistViewMode === 'place' &&
                          styles.checklistViewToggleButtonActive,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => setChecklistViewMode('place')}
                      >
                        <Text
                          style={[
                            styles.checklistViewToggleText,
                            checklistViewMode === 'place' &&
                            styles.checklistViewToggleTextActive,
                          ]}
                        >
                          장소별 보기
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {checklistViewMode === 'category' ? (
                      <View style={styles.checklistGroups}>
                        {getGroupedChecklistItems(checklist).map(group => {
                          const completedCount = group.items.filter(
                            item => item.checked,
                          ).length;

                          return (
                            <View key={group.category} style={styles.checklistGroup}>
                              <View style={styles.checklistGroupHeader}>
                                <Text style={styles.checklistGroupTitle}>
                                  {group.category}
                                </Text>
                                <Text style={styles.checklistGroupCount}>
                                  {completedCount}/{group.items.length}
                                </Text>
                              </View>

                              <View style={styles.checklistItems}>
                                {group.items.map(item => {
                                  const parsed = splitChecklistText(item.text);

                                  return (
                                    <TouchableOpacity
                                      key={item.id}
                                      style={[
                                        styles.checklistItem,
                                        item.parentId && styles.checklistChildItem,
                                      ]}
                                      activeOpacity={0.7}
                                      onPress={() =>
                                        handleToggleChecklistItem(
                                          checklist.id,
                                          item.id,
                                        )
                                      }
                                    >
                                      <View
                                        style={[
                                          styles.checkBox,
                                          item.checked && styles.checkBoxChecked,
                                        ]}
                                      >
                                        {item.checked && (
                                          <Text style={styles.checkMark}>✓</Text>
                                        )}
                                      </View>

                                      <View style={styles.checklistItemContent}>
                                        <Text
                                          style={[
                                            styles.checklistItemTitle,
                                            item.checked &&
                                            styles.checklistItemTextChecked,
                                          ]}
                                        >
                                          {parsed.title}
                                        </Text>

                                        {!!parsed.description && (
                                          <Text
                                            style={[
                                              styles.checklistItemDescription,
                                              item.checked &&
                                              styles.checklistItemDescriptionChecked,
                                            ]}
                                          >
                                            {parsed.description}
                                          </Text>
                                        )}
                                      </View>
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    ) : (
                      <View style={styles.checklistGroups}>
                        {getPlaceGroupedChecklistItems(checklist).map(group => {
                          const completedCount = group.items.filter(
                            item => item.checked,
                          ).length;

                          return (
                            <View key={group.place} style={styles.checklistGroup}>
                              <View style={styles.checklistGroupHeader}>
                                <Text style={styles.checklistGroupTitle}>
                                  {group.place}
                                </Text>
                                <Text style={styles.checklistGroupCount}>
                                  {completedCount}/{group.items.length}
                                </Text>
                              </View>

                              <View style={styles.checklistItems}>
                                {group.items.map(item => {
                                  const parsed = splitChecklistText(item.text);

                                  return (
                                    <TouchableOpacity
                                      key={`${group.place}-${item.id}`}
                                      style={styles.checklistItem}
                                      activeOpacity={0.7}
                                      onPress={() =>
                                        handleToggleChecklistItem(
                                          checklist.id,
                                          item.id,
                                        )
                                      }
                                    >
                                      <View
                                        style={[
                                          styles.checkBox,
                                          item.checked && styles.checkBoxChecked,
                                        ]}
                                      >
                                        {item.checked && (
                                          <Text style={styles.checkMark}>✓</Text>
                                        )}
                                      </View>

                                      <View style={styles.checklistItemContent}>
                                        <Text
                                          style={[
                                            styles.checklistItemTitle,
                                            item.checked &&
                                            styles.checklistItemTextChecked,
                                          ]}
                                        >
                                          {parsed.title}
                                        </Text>

                                        {!!parsed.description && (
                                          <Text
                                            style={[
                                              styles.checklistItemDescription,
                                              item.checked &&
                                              styles.checklistItemDescriptionChecked,
                                            ]}
                                          >
                                            {parsed.description}
                                          </Text>
                                        )}
                                      </View>
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.continueChatButton}
                      onPress={() => handleChecklistChat(checklist)}
                    >
                      <Text style={styles.continueChatButtonText}>
                        이 체크리스트로 AI에게 이어서 질문하기
                      </Text>
                      <Text style={styles.continueChatArrow}>›</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            );
          })
        )}
      </View>

      <View style={styles.sectionHeader}>

        <Text style={styles.sectionTitle}>최근 분석</Text>

        <Text style={styles.historyCount}>{histories.length}개</Text>

      </View>

      {recentHistories.length === 0 ? (

        <View style={styles.emptyBox}>

          <Text style={styles.emptyIcon}>📊</Text>

          <Text style={styles.emptyTitle}>아직 분석 기록이 없어요</Text>

          <Text style={styles.emptyDescription}>

            분석 결과를 저장하면 여기에 표시됩니다.

          </Text>

        </View>

      ) : (

        recentHistories.map(history => (

          <View key={history.id} style={styles.historyCard}>

            <View style={styles.cardHeader}>

              <View style={[styles.typeBadge, { backgroundColor: '#FFF5C2' }]}>
                <Text style={styles.typeBadgeText}>
                  {getTypeLabel(history.type)}
                </Text>
              </View>

              <Text style={styles.date}>{formatDate(history.createdAt)}</Text>

            </View>

            <Text style={styles.businessName}>{history.businessName}</Text>

            <View style={styles.regionRow}>

              {history.regions.map(region => (

                <View key={region} style={styles.regionChip}>

                  <Text style={styles.regionText}>{region}</Text>

                </View>

              ))}

            </View>

            <View style={styles.cardFooter}>

              <TouchableOpacity

                style={styles.deleteButton}

                onPress={() => handleDelete(history.id)}

              >

                <Text style={styles.deleteText}>삭제</Text>

              </TouchableOpacity>

              <TouchableOpacity

                style={[styles.viewButton, { backgroundColor: '#202544' }]}

                onPress={() => handleView(history)}

              >

                <Text style={[styles.viewButtonText, { color: '#FFFFFF' }]}>다시 보기 →</Text>

              </TouchableOpacity>

            </View>

          </View>

        ))

      )}

    </ScrollView>

  );

}

const styles = StyleSheet.create({

  fullLoading: {

    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: COLORS.background,

  },

  loggedOutBox: {

    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    padding: 32,

    backgroundColor: COLORS.background,

  },

  loggedOutIcon: {

    fontSize: 40,

    marginBottom: 12,

  },

  loggedOutTitle: {

    fontSize: 20,

    fontWeight: '900',

    color: COLORS.text,

  },

  loggedOutDescription: {

    marginTop: 8,

    marginBottom: 24,

    fontSize: 13,

    lineHeight: 20,

    textAlign: 'center',

    color: COLORS.textSecondary,

  },

  loggedOutPrimary: {

    width: '100%',

    maxWidth: 320,

    paddingVertical: 14,

    borderRadius: 14,

    alignItems: 'center',

    backgroundColor: COLORS.primary,

  },

  loggedOutPrimaryText: {

    fontSize: 15,

    fontWeight: '800',

    color: '#FFFFFF',

  },

  loggedOutSecondary: {

    marginTop: 10,

    paddingVertical: 12,

  },

  loggedOutSecondaryText: {

    fontSize: 13,

    fontWeight: '700',

    color: COLORS.textSecondary,

  },

  screen: {

    flex: 1,

    backgroundColor: COLORS.background,

  },

  container: {

    width: '100%',

    maxWidth: 900,

    alignSelf: 'center',

    padding: 20,

    paddingBottom: 60,

  },

  profileHeader: {

    marginTop: 10,

    marginBottom: 24,

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'flex-start',

  },

  profileInfo: {

    flex: 1,

  },

  title: {

    fontSize: 30,

    fontWeight: '900',

    color: COLORS.text,

  },

  nickname: {

    marginTop: 8,

    fontSize: 16,

    fontWeight: '900',

    color: COLORS.text,

  },

  email: {

    marginTop: 3,

    fontSize: 11,

    color: COLORS.textSecondary,

  },

  logoutButton: {

    paddingVertical: 8,

    paddingHorizontal: 13,

    borderRadius: 999,

    borderWidth: 1,

    borderColor: COLORS.border,

    backgroundColor: '#FFFFFF',

  },

  logoutText: {

    fontSize: 11,

    fontWeight: '800',

    color: COLORS.textSecondary,

  },

  sectionHeader: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginBottom: 14,

  },

  sectionEyebrow: {

    fontSize: 10,

    fontWeight: '800',

    color: COLORS.primary,

    marginBottom: 4,

  },

  sectionTitle: {

    fontSize: 18,

    fontWeight: '900',

    color: COLORS.text,

  },


  needCard: {
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F0DEA0',
    backgroundColor: '#FFF4C2',
    marginBottom: 18,
  },


  editButton: {

    paddingVertical: 7,

    paddingHorizontal: 13,

    borderRadius: 999,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: COLORS.border,

  },

  editButtonText: {

    fontSize: 11,

    fontWeight: '800',

    color: COLORS.primary,

  },

  needProgressRow: {
    marginTop: 14,
  },

  needProgressTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: '#F0E2A8',
    overflow: 'hidden',
  },

  needProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },

  needProgressText: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },

  needUpdatedAt: {
    marginTop: 4,
    fontSize: 10,
    color: COLORS.textSecondary,
  },

  needMainRow: {

    flexDirection: 'row',

    gap: 10,

    marginTop: 14,

  },

  needMainItem: {

    flex: 1,

    padding: 14,

    borderRadius: 14,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#E7EFE9',

  },

  needLabel: {

    fontSize: 11,

    fontWeight: '700',

    color: COLORS.textSecondary,

    marginBottom: 7,

  },

  needValue: {

    fontSize: 15,

    fontWeight: '900',

    color: COLORS.text,

  },

  needBlock: {

    marginTop: 18,

  },

  needText: {

    fontSize: 14,

    fontWeight: '800',

    color: COLORS.text,

  },

  chipRow: {

    flexDirection: 'row',

    flexWrap: 'wrap',

    gap: 7,

  },

  grayChip: {

    paddingVertical: 6,

    paddingHorizontal: 10,

    borderRadius: 999,

    backgroundColor: '#EEF1EF',

  },

  grayChipText: {

    fontSize: 11,

    fontWeight: '700',

    color: COLORS.textSecondary,

  },

  priorityRow: {

    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 7,

  },

  priorityNumber: {

    width: 24,

    height: 24,

    borderRadius: 12,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: COLORS.primary,

    marginRight: 9,

  },

  priorityNumberText: {

    color: '#FFFFFF',

    fontSize: 11,

    fontWeight: '900',

  },

  priorityText: {

    fontSize: 13,

    fontWeight: '800',

    color: COLORS.text,

  },

  needCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    marginTop: 20,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#1D2545',
  },

  needCtaButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  needCtaArrow: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  emptyNeedsCard: {

    padding: 22,

    borderRadius: 20,

    borderWidth: 1,

    borderColor: '#DCEFE0',

    backgroundColor: '#F7FCF8',

    marginBottom: 18,

  },

  emptyNeedsTitle: {

    fontSize: 16,

    fontWeight: '900',

    color: COLORS.text,

  },

  emptyNeedsDescription: {

    marginTop: 5,

    fontSize: 12,

    color: COLORS.textSecondary,

  },


  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0DEA0',
    backgroundColor: '#FFF4C2',
    marginBottom: 18,
  },


  summaryItem: {

    flex: 1,

    alignItems: 'center',

  },

  summaryNumber: {

    fontSize: 24,

    fontWeight: '900',

    color: COLORS.primary,

  },

  summaryLabel: {

    marginTop: 5,

    fontSize: 11,

    color: COLORS.textSecondary,

  },

  summaryDivider: {

    width: 1,

    height: 36,

    backgroundColor: '#DCEFE0',

  },

  favoriteCard: {

    flexDirection: 'row',

    alignItems: 'center',

    padding: 17,

    borderRadius: 18,

    borderWidth: 1,

    borderColor: COLORS.border,

    backgroundColor: COLORS.surface,

    marginBottom: 28,

  },

  favoriteIconBox: {

    width: 42,

    height: 42,

    borderRadius: 14,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#FFF1F3',

    marginRight: 13,

  },

  favoriteIcon: {

    color: '#E54861',

    fontSize: 20,

  },

  favoriteBody: {

    flex: 1,

  },

  favoriteTitle: {

    fontSize: 15,

    fontWeight: '900',

    color: COLORS.text,

  },

  favoriteDescription: {

    marginTop: 3,

    fontSize: 11,

    color: COLORS.textSecondary,

  },

  favoriteCount: {

    fontSize: 16,

    fontWeight: '900',

    color: COLORS.primary,

  },

  arrow: {

    marginLeft: 8,

    fontSize: 24,

    color: COLORS.textSecondary,

  },

  aiSection: {
    marginBottom: 28,
  },


  aiEmptyCard: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0DEA0',
    backgroundColor: '#FFF4C2',
  },


  aiEmptyIcon: {
    width: 42,
    height: 42,
    lineHeight: 42,
    borderRadius: 21,
    overflow: 'hidden',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    backgroundColor: COLORS.primary,
  },

  aiEmptyTitle: {
    marginTop: 13,
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
  },

  aiEmptyDescription: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    color: COLORS.textSecondary,
  },


  aiEmptyButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#1D2545',
  },

  aiEmptyButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },


  checklistCard: {
    padding: 18,
    marginBottom: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCEFE0',
    backgroundColor: '#F7FCF8',
  },

  checklistTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  checklistTopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  checklistCompleteBadge: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: '#E9F8EC',
  },

  checklistCompleteBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.primary,
  },

  checklistExpandButton: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#DCEFE0',
    backgroundColor: '#FFFFFF',
  },

  checklistExpandButtonText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },

  checklistExpandArrow: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primary,
  },

  checklistTitleArea: {
    flex: 1,
  },

  checklistBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.primary,
    backgroundColor: '#E9F8EC',
  },

  checklistTitle: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
    color: COLORS.text,
  },

  checklistContext: {
    marginTop: 4,
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  checklistDeleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 9,
  },

  checklistDeleteText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A2A7A3',
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },

  progressText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },

  progressPercent: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primary,
  },

  progressTrack: {
    height: 7,
    marginTop: 7,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: '#E9EEEA',
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },

  checklistCollapsedSummary: {
    minHeight: 58,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E1EAE3',
    backgroundColor: '#FFFFFF',
  },

  checklistCollapsedTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.text,
  },

  checklistCollapsedDescription: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.textSecondary,
  },

  checklistCollapsedArrow: {
    marginLeft: 12,
    fontSize: 24,
    color: COLORS.primary,
  },

  checklistViewToggle: {
    flexDirection: 'row',
    marginTop: 16,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCEFE0',
    backgroundColor: '#F4F8F5',
  },

  checklistViewToggleButton: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },

  checklistViewToggleButtonActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDE4D2',
  },

  checklistViewToggleText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },

  checklistViewToggleTextActive: {
    color: COLORS.primary,
  },

  checklistGroups: {
    marginTop: 16,
    gap: 14,
  },

  checklistGroup: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4EEE6',
    backgroundColor: '#FFFFFF',
  },

  checklistGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  checklistGroupTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.text,
  },

  checklistGroupCount: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },

  checklistItems: {
    gap: 8,
  },

  checklistItem: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 11,
    borderRadius: 12,
    backgroundColor: '#F8FAF8',
  },

  checklistChildItem: {
    marginLeft: 18,
    backgroundColor: '#FBFCFB',
  },

  checkBox: {
    width: 20,
    height: 20,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#BCC8BF',
    backgroundColor: '#FFFFFF',
  },

  checkBoxChecked: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },

  checkMark: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  checklistItemContent: {
    flex: 1,
  },

  checklistItemTitle: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '900',
    color: COLORS.text,
  },

  checklistItemDescription: {
    marginTop: 3,
    fontSize: 10.5,
    lineHeight: 16,
    color: COLORS.textSecondary,
  },

  checklistItemTextChecked: {
    color: '#9AA29C',
    textDecorationLine: 'line-through',
  },

  checklistItemDescriptionChecked: {
    color: '#B3B9B5',
    textDecorationLine: 'line-through',
  },

  continueChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    marginTop: 16,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.neonLime,
  },

  continueChatButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#111111',
  },

  continueChatArrow: {
    fontSize: 22,
    color: '#111111',
  },

  historyCount: {

    fontSize: 12,

    fontWeight: '800',

    color: COLORS.primary,

  },

  emptyBox: {

    minHeight: 230,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 20,

    borderWidth: 1,

    borderColor: COLORS.border,

    backgroundColor: COLORS.surface,

  },

  emptyIcon: {

    fontSize: 36,

  },

  emptyTitle: {

    marginTop: 12,

    fontSize: 16,

    fontWeight: '900',

    color: COLORS.text,

  },

  emptyDescription: {

    marginTop: 6,

    fontSize: 12,

    color: COLORS.textSecondary,

  },

  historyCard: {

    padding: 18,

    marginBottom: 14,

    borderRadius: 18,

    borderWidth: 1,

    borderColor: COLORS.border,

    backgroundColor: COLORS.surface,

  },

  cardHeader: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

  },

  typeBadge: {

    paddingVertical: 6,

    paddingHorizontal: 10,

    borderRadius: 999,

    backgroundColor: '#E9F8EC',

  },

  typeBadgeText: {

    fontSize: 11,

    fontWeight: '800',

    color: COLORS.primary,

  },

  date: {

    fontSize: 11,

    color: COLORS.textSecondary,

  },

  businessName: {

    marginTop: 15,

    fontSize: 20,

    fontWeight: '900',

    color: COLORS.text,

  },

  regionRow: {

    flexDirection: 'row',

    flexWrap: 'wrap',

    gap: 7,

    marginTop: 13,

  },

  regionChip: {

    paddingVertical: 6,

    paddingHorizontal: 10,

    borderRadius: 999,

    backgroundColor: '#F4F5F4',

  },

  regionText: {

    fontSize: 11,

    color: COLORS.textSecondary,

  },

  cardFooter: {

    flexDirection: 'row',

    gap: 9,

    marginTop: 18,

  },

  deleteButton: {

    minWidth: 70,

    minHeight: 43,

    borderRadius: 12,

    borderWidth: 1,

    borderColor: COLORS.border,

    alignItems: 'center',

    justifyContent: 'center',

  },

  deleteText: {

    fontSize: 12,

    color: COLORS.textSecondary,

  },

  viewButton: {

    flex: 1,

    minHeight: 43,

    borderRadius: 12,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: COLORS.neonLime,

  },

  viewButtonText: {

    fontSize: 13,

    fontWeight: '900',

    color: '#111111',

  },

});