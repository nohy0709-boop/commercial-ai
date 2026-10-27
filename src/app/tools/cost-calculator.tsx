import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    PanResponder,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import {
    CostPlan,
    deleteCostPlan,
    getCostPlans,
    saveCostPlan,
} from '@/services/startupCostPlans';
import { getUserProfile } from '@/services/userProfile';

/**
 * 초기 창업 비용 계산기
 *
 * - 금액은 사용자가 직접 입력한다 (단위: 만원).
 * - 업종별 평균 같은 숫자는 출처를 확인하지 못했으므로 화면에 넣지 않는다.
 *   대신 항목마다 "어디서 확인하면 되는지"만 안내한다.
 * - 결과는 예측이 아니라 사용자가 입력한 값의 합계이다.
 */

const NAVY = '#1D2545';
const LIME = '#C6F432';
const GRAY = '#6B7280';
const BORDER = '#E5E7EB';

type CostItem = {
  key: string;
  label: string;
  hint: string;
};

const ONE_TIME_ITEMS: CostItem[] = [
  {
    key: 'deposit',
    label: '임대 보증금',
    hint: '계약이 끝나면 돌려받는 돈이지만, 창업 시점에는 먼저 마련해야 합니다. 후보 매물의 실제 보증금을 입력하세요.',
  },
  {
    key: 'premium',
    label: '권리금',
    hint: '기존 점포를 넘겨받을 때 드는 비용입니다. 없는 자리면 0. 매물 중개 정보나 현장에서 직접 확인하세요.',
  },
  {
    key: 'interior',
    label: '인테리어·시설 공사',
    hint: '여러 업체에서 견적을 받아 입력하는 것이 가장 정확합니다.',
  },
  {
    key: 'equipment',
    label: '장비·집기',
    hint: '주방 설비, 가구, 계산 장비 등. 필요한 목록을 먼저 적고 견적을 받아보세요.',
  },
  {
    key: 'inventory',
    label: '초기 재고·재료',
    hint: '오픈 첫 주에 필요한 재료·상품 비용입니다.',
  },
  {
    key: 'marketing',
    label: '간판·홍보·오픈 준비',
    hint: '간판, 메뉴판, 온라인 등록, 오픈 이벤트 등.',
  },
  {
    key: 'etc',
    label: '인허가·기타 초기 비용',
    hint: '영업신고, 위생교육, 보험 등. 관할 구청/주민센터에서 확인하세요.',
  },
];

const MONTHLY_ITEMS: CostItem[] = [
  {
    key: 'rent',
    label: '월세',
    hint: '후보 매물의 월세. 관리비가 따로라면 아래 항목에 입력하세요.',
  },
  {
    key: 'labor',
    label: '인건비',
    hint: '직원·아르바이트 급여. 혼자 운영하면 0이지만, 본인 생활비는 별도로 고려하세요.',
  },
  {
    key: 'utility',
    label: '관리비·공과금',
    hint: '전기·수도·가스·통신·관리비 합계.',
  },
  {
    key: 'material',
    label: '월 재료비·운영비',
    hint: '매달 반복해서 사는 재료, 소모품, 카드 수수료·배달 수수료 등.',
  },
];

const MONTH_OPTIONS = [1, 3, 6, 12];
const MAX_MONTHS = 60;
const NONE_SUFFIX = '__none';

function toNumber(text: string): number {
  const digits = text.replace(/[^0-9]/g, '');

  return digits ? Number(digits) : 0;
}

function formatManwon(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return '0원';
  }

  const eok = Math.floor(value / 10000);
  const man = value % 10000;

  if (eok > 0 && man > 0) {
    return `${eok}억 ${man.toLocaleString('ko-KR')}만원`;
  }

  if (eok > 0) {
    return `${eok}억원`;
  }

  return `${man.toLocaleString('ko-KR')}만원`;
}

/**
 * 드래그해서 값을 고르는 슬라이더 (외부 라이브러리 없이 구현).
 * 트랙을 터치하거나 끌면 값이 바뀐다.
 */
function MonthSlider({
  value,
  onChange,
  min = 1,
  max = 24,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const startX = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const fromX = (x: number) => {
    const w = widthRef.current;

    if (w <= 0) {
      return;
    }

    const ratio = Math.min(1, Math.max(0, x / w));

    onChangeRef.current(Math.round(min + ratio * (max - min)));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: e => {
        startX.current = e.nativeEvent.locationX;
        fromX(startX.current);
      },
      onPanResponderMove: (_e, g) => {
        fromX(startX.current + g.dx);
      },
    }),
  ).current;

  const clamped = Math.min(max, Math.max(min, value));
  const ratio = (clamped - min) / (max - min);
  const THUMB = 28;
  const left = width > 0 ? ratio * width : 0;

  return (
    <View style={sliderStyles.wrap}>
      <View
        style={sliderStyles.touch}
        onLayout={e => {
          widthRef.current = e.nativeEvent.layout.width;
          setWidth(e.nativeEvent.layout.width);
        }}
        {...pan.panHandlers}
      >
        <View style={sliderStyles.track} pointerEvents="none" />
        <View
          pointerEvents="none"
          style={[sliderStyles.fill, { width: left }]}
        />
        <View
          pointerEvents="none"
          style={[
            sliderStyles.thumb,
            { left: left - THUMB / 2, width: THUMB, height: THUMB },
          ]}
        />
      </View>
      <View style={sliderStyles.labels}>
        <Text style={sliderStyles.label}>{min}개월</Text>
        <Text style={sliderStyles.label}>{max}개월</Text>
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  wrap: { marginTop: 14, paddingHorizontal: 14 },
  touch: { height: 40, justifyContent: 'center' },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
  },
  fill: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: NAVY,
  },
  thumb: {
    position: 'absolute',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: NAVY,
  },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 11, color: GRAY },
});

export default function CostCalculatorScreen() {
  const router = useRouter();
  const { planId: planIdParam } = useLocalSearchParams<{ planId?: string }>();
  const appliedParamRef = useRef<string | null>(null);

  const [values, setValues] = useState<Record<string, string>>({});
  // '없음'으로 표시한 항목 (이미 갖고 있거나 해당 없는 항목)
  const [none, setNone] = useState<Record<string, boolean>>({});
  const [presetMonths, setPresetMonths] = useState(3);
  const [useCustomMonths, setUseCustomMonths] = useState(false);
  const [customMonths, setCustomMonths] = useState('');
  const [title, setTitle] = useState('');
  const [planId, setPlanId] = useState<string | null>(null);

  const [plans, setPlans] = useState<CostPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 뒤로 갈 화면이 없으면(새로고침 직후 등) MY 탭으로 이동한다.
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/my');
    }
  };

  // 내 예산 (만원 단위). 설문에서 입력한 값이 있을 때만 비교한다.
  const [budgetMax, setBudgetMax] = useState<number | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);

    try {
      const [list, profile] = await Promise.all([
        getCostPlans(),
        getUserProfile().catch(() => null),
      ]);

      setPlans(list);

      const p: any = profile;
      const max = p?.budgetMax ?? p?.budget_max ?? null;

      // 설문의 예산은 원 단위로 저장되어 있다 → 만원 단위로 변환
      setBudgetMax(typeof max === 'number' ? Math.round(max / 10000) : null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll]),
  );

  const months = useCustomMonths
    ? Math.min(MAX_MONTHS, Math.max(1, toNumber(customMonths)))
    : presetMonths;

  const amountOf = (key: string) =>
    none[key] ? 0 : toNumber(values[key] ?? '');

  const oneTimeTotal = useMemo(
    () => ONE_TIME_ITEMS.reduce((sum, item) => sum + amountOf(item.key), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values, none],
  );

  const monthlyTotal = useMemo(
    () => MONTHLY_ITEMS.reduce((sum, item) => sum + amountOf(item.key), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values, none],
  );

  const reserve = monthlyTotal * months;
  const total = oneTimeTotal + reserve;

  // 금액을 입력했거나 '없음'을 하나라도 표시했으면 저장할 내용이 있는 것으로 본다.
  const hasAnswer =
    Object.values(values).some(v => toNumber(v) > 0) ||
    Object.values(none).some(Boolean);
  const hasInput = hasAnswer;

  const budgetMessage = useMemo(() => {
    if (!hasInput || budgetMax === null) {
      return null;
    }

    const diff = budgetMax - total;

    if (diff >= 0) {
      return {
        tone: 'ok' as const,
        text: `설정한 예산 상한(${formatManwon(budgetMax)}) 안에서 ${formatManwon(diff)} 여유가 있습니다.`,
      };
    }

    return {
      tone: 'warn' as const,
      text: `설정한 예산 상한(${formatManwon(budgetMax)})보다 ${formatManwon(-diff)} 더 필요합니다. 항목별 금액을 다시 확인해 보세요.`,
    };
  }, [hasInput, budgetMax, total]);

  const setValue = (key: string, text: string) => {
    const digits = text.replace(/[^0-9]/g, '');

    setValues(prev => ({ ...prev, [key]: digits }));

    if (digits) {
      setNone(prev => ({ ...prev, [key]: false }));
    }
  };

  const toggleNone = (key: string) => {
    setNone(prev => {
      const next = !prev[key];

      if (next) {
        setValues(v => ({ ...v, [key]: '' }));
      }

      return { ...prev, [key]: next };
    });
  };

  const buildItems = (): Record<string, number> => {
    const items: Record<string, number> = {};

    [...ONE_TIME_ITEMS, ...MONTHLY_ITEMS].forEach(item => {
      items[item.key] = amountOf(item.key);

      if (none[item.key]) {
        items[item.key + NONE_SUFFIX] = 1;
      }
    });

    return items;
  };

  const handleSave = async () => {
    if (!hasInput) {
      Alert.alert('저장할 내용이 없어요', '금액을 먼저 입력해 주세요.');
      return;
    }

    setSaving(true);

    try {
      const saved = await saveCostPlan({
        id: planId,
        title: title.trim() || '내 창업 비용 계획',
        items: buildItems(),
        months,
        totalManwon: total,
      });

      setPlanId(saved.id);
      setTitle(saved.title);

      const list = await getCostPlans();
      setPlans(list);

      // 저장이 끝나면 이전 화면(MY)으로 돌아간다.
      goBack();
    } catch (error: any) {
      Alert.alert(
        '저장하지 못했어요',
        error?.message === '로그인이 필요합니다.'
          ? '로그인 후 저장할 수 있어요.'
          : '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = (plan: CostPlan) => {
    const next: Record<string, string> = {};
    const nextNone: Record<string, boolean> = {};

    Object.entries(plan.items).forEach(([key, amount]) => {
      if (key.endsWith(NONE_SUFFIX)) {
        nextNone[key.slice(0, -NONE_SUFFIX.length)] = true;
        return;
      }

      next[key] = amount ? String(amount) : '';
    });

    setValues(next);
    setNone(nextNone);

    if (MONTH_OPTIONS.includes(plan.months)) {
      setPresetMonths(plan.months);
      setUseCustomMonths(false);
      setCustomMonths('');
    } else {
      setUseCustomMonths(true);
      setCustomMonths(String(plan.months));
    }

    setTitle(plan.title);
    setPlanId(plan.id);
  };

  // MY에서 저장한 계획을 눌러 들어온 경우, 해당 계획을 바로 불러온다.
  useEffect(() => {
    if (!planIdParam || appliedParamRef.current === planIdParam) {
      return;
    }

    const target = plans.find(p => p.id === planIdParam);

    if (target) {
      appliedParamRef.current = planIdParam;
      handleLoad(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans, planIdParam]);

  const handleDelete = (plan: CostPlan) => {
    if (Platform.OS === 'web') {
      // 웹에서는 Alert 버튼이 동작하지 않으므로 브라우저 확인창을 쓴다.
      if (typeof window !== 'undefined' && window.confirm(`"${plan.title}"을(를) 삭제할까요?`)) {
        deleteCostPlan(plan.id)
          .then(async () => {
            if (plan.id === planId) setPlanId(null);
            setPlans(await getCostPlans());
          })
          .catch(() => {});
      }

      return;
    }

    Alert.alert('삭제할까요?', `"${plan.title}"을(를) 삭제합니다.`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCostPlan(plan.id);

            if (plan.id === planId) {
              setPlanId(null);
            }

            setPlans(await getCostPlans());
          } catch {
            Alert.alert('삭제하지 못했어요', '잠시 후 다시 시도해 주세요.');
          }
        },
      },
    ]);
  };

  const handleReset = () => {
    setValues({});
    setNone({});
    setPresetMonths(3);
    setUseCustomMonths(false);
    setCustomMonths('');
    setTitle('');
    setPlanId(null);
  };

  const renderField = (item: CostItem) => (
    <View key={item.key} style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.fieldLabel}>{item.label}</Text>
        <Pressable
          onPress={() => toggleNone(item.key)}
          hitSlop={8}
          style={[styles.noneChip, none[item.key] && styles.noneChipOn]}
        >
          <Text
            style={[styles.noneChipText, none[item.key] && styles.noneChipTextOn]}
          >
            {none[item.key] ? '✓ 없음' : '없음'}
          </Text>
        </Pressable>
      </View>
      <View style={[styles.inputRow, none[item.key] && styles.inputRowOff]}>
        <TextInput
          style={styles.input}
          editable={!none[item.key]}
          value={
            values[item.key]
              ? Number(values[item.key]).toLocaleString('ko-KR')
              : ''
          }
          onChangeText={text => setValue(item.key, text)}
          placeholder={none[item.key] ? '없음 (0원으로 계산)' : '0'}
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          returnKeyType="done"
        />
        <Text style={styles.unit}>만원</Text>
      </View>
      <Text style={styles.fieldHint}>{item.hint}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          hitSlop={12}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>초기 창업 비용 계산기</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. 결론 */}
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>예상 필요 자금 (입력 합계)</Text>
          <Text style={styles.resultValue}>
            {hasInput ? formatManwon(total) : '금액을 입력해 보세요'}
          </Text>

          {hasInput && (
            <View style={styles.breakdown}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>한 번에 드는 초기 비용</Text>
                <Text style={styles.breakdownValue}>
                  {formatManwon(oneTimeTotal)}
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>
                  운영 자금 (월 {formatManwon(monthlyTotal)} × {months}개월)
                </Text>
                <Text style={styles.breakdownValue}>
                  {formatManwon(reserve)}
                </Text>
              </View>
            </View>
          )}

          {budgetMessage && (
            <View
              style={[
                styles.budgetBox,
                budgetMessage.tone === 'warn' && styles.budgetBoxWarn,
              ]}
            >
              <Text style={styles.budgetText}>{budgetMessage.text}</Text>
            </View>
          )}

          {hasInput && budgetMax === null && !loading && (
            <Text style={styles.noBudget}>
              MY에서 창업 조건(예산)을 설정하면 내 예산과 바로 비교해 드려요.
            </Text>
          )}
        </View>

        {/* 2. 초기 비용 */}
        <Text style={styles.sectionTitle}>① 처음에 한 번 드는 비용</Text>
        <View style={styles.card}>{ONE_TIME_ITEMS.map(renderField)}</View>

        {/* 3. 운영 자금 */}
        <Text style={styles.sectionTitle}>② 매달 나가는 비용</Text>
        <View style={styles.card}>
          {MONTHLY_ITEMS.map(renderField)}

          <Text style={styles.fieldLabel}>몇 개월치를 미리 준비할까요?</Text>
          <Text style={styles.fieldHint}>
            오픈 초기에는 매출이 안정되기까지 시간이 걸릴 수 있어, 그동안 버틸 운영 자금을 미리 잡아둡니다.
          </Text>
          <View style={styles.monthRow}>
            {MONTH_OPTIONS.map(m => {
              const on = !useCustomMonths && presetMonths === m;

              return (
                <Pressable
                  key={m}
                  onPress={() => {
                    setUseCustomMonths(false);
                    setPresetMonths(m);
                  }}
                  style={[styles.monthChip, on && styles.monthChipOn]}
                >
                  <Text
                    style={[styles.monthChipText, on && styles.monthChipTextOn]}
                  >
                    {m}개월
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => {
                if (!useCustomMonths) {
                  setCustomMonths(String(presetMonths));
                }

                setUseCustomMonths(true);
              }}
              style={[styles.monthChip, useCustomMonths && styles.monthChipOn]}
            >
              <Text
                style={[
                  styles.monthChipText,
                  useCustomMonths && styles.monthChipTextOn,
                ]}
              >
                직접 입력
              </Text>
            </Pressable>
          </View>

          {useCustomMonths && (
            <View style={[styles.inputRow, { marginTop: 10 }]}>
              <TextInput
                style={styles.input}
                value={customMonths}
                onChangeText={t =>
                  setCustomMonths(t.replace(/[^0-9]/g, '').slice(0, 2))
                }
                placeholder="개월 수 (1~60)"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
              />
              <Text style={styles.unit}>개월</Text>
            </View>
          )}

          {useCustomMonths && (
            <>
              <MonthSlider
                value={months}
                onChange={v => setCustomMonths(String(v))}
              />
              <Text style={styles.fieldHint}>
                막대를 좌우로 끌어서 개월 수를 고르거나, 위 칸에 직접 입력하세요. (막대는 1~24개월, 입력은 최대 {MAX_MONTHS}개월)
              </Text>
            </>
          )}
        </View>

        {/* 4. 안내 */}
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>이 계산기를 볼 때 참고하세요</Text>
          <Text style={styles.noticeText}>
            · 입력한 금액을 더한 값이며, 실제 창업 비용이나 성공을 예측하지 않습니다.{'\n'}
            · 업종·평수·지역에 따라 차이가 커서 평균값은 보여드리지 않습니다. 후보 매물의 실제 조건과 업체 견적으로 채워 주세요.{'\n'}
            · 보증금은 계약 종료 시 돌려받는 돈이지만 창업 시점에는 먼저 필요합니다.
          </Text>
        </View>

        {/* 5. 저장 */}
        <Text style={styles.sectionTitle}>저장하기</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="이름 (예: 조치원 카페 계획)"
            placeholderTextColor="#9CA3AF"
            maxLength={40}
          />
          <Pressable
            style={[styles.saveButton, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={NAVY} />
            ) : (
              <Text style={styles.saveButtonText}>
                {planId ? '수정 내용 저장' : '내 계정에 저장'}
              </Text>
            )}
          </Pressable>
          <Pressable style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetText}>새로 시작하기</Text>
          </Pressable>
        </View>

        {/* 6. 저장 목록 */}
        {plans.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>저장한 계획</Text>
            <View style={styles.card}>
              {plans.map(plan => (
                <View key={plan.id} style={styles.planRow}>
                  <Pressable
                    style={{ flex: 1 }}
                    onPress={() => handleLoad(plan)}
                  >
                    <Text style={styles.planTitle}>{plan.title}</Text>
                    <Text style={styles.planMeta}>
                      {formatManwon(plan.totalManwon)} ·{' '}
                      {new Date(plan.updatedAt).toLocaleDateString('ko-KR')}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(plan)} hitSlop={8}>
                    <Text style={styles.planDelete}>삭제</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        )}

        {loading && plans.length === 0 && (
          <ActivityIndicator style={{ marginTop: 16 }} color={NAVY} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F8FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backButton: { width: 32, alignItems: 'flex-start' },
  backText: { fontSize: 30, color: NAVY, lineHeight: 32 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: NAVY },
  content: { padding: 16, paddingBottom: 48 },

  resultCard: {
    backgroundColor: NAVY,
    borderRadius: 20,
    padding: 20,
    marginBottom: 8,
  },
  resultLabel: { color: '#C7CBE0', fontSize: 13 },
  resultValue: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 6,
  },
  breakdown: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  breakdownLabel: { color: '#C7CBE0', fontSize: 13, flex: 1 },
  breakdownValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  budgetBox: {
    marginTop: 14,
    backgroundColor: 'rgba(198,244,50,0.18)',
    borderRadius: 12,
    padding: 12,
  },
  budgetBoxWarn: { backgroundColor: 'rgba(245,158,11,0.25)' },
  budgetText: { color: '#FFFFFF', fontSize: 13, lineHeight: 19 },
  noBudget: { color: '#C7CBE0', fontSize: 12, marginTop: 12, lineHeight: 18 },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: NAVY,
    marginTop: 20,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  field: { marginBottom: 18 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noneChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#FFFFFF',
  },
  noneChipOn: { backgroundColor: NAVY, borderColor: NAVY },
  noneChipText: { fontSize: 12, color: GRAY, fontWeight: '600' },
  noneChipTextOn: { color: '#FFFFFF' },
  inputRowOff: { backgroundColor: '#F1F2F4', opacity: 0.7 },
  fieldHint: { fontSize: 12, color: GRAY, marginTop: 6, lineHeight: 18 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FAFAFB',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#111827',
    textAlign: 'right',
  },
  unit: { marginLeft: 8, fontSize: 14, color: GRAY },

  monthRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  monthChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#FFFFFF',
  },
  monthChipOn: { backgroundColor: NAVY, borderColor: NAVY },
  monthChipText: { fontSize: 14, color: '#374151' },
  monthChipTextOn: { color: '#FFFFFF', fontWeight: '700' },

  notice: {
    marginTop: 20,
    backgroundColor: '#FFF8DC',
    borderRadius: 14,
    padding: 14,
  },
  noticeTitle: { fontSize: 13, fontWeight: '700', color: NAVY },
  noticeText: { fontSize: 12, color: '#4B5563', marginTop: 6, lineHeight: 19 },

  titleInput: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FAFAFB',
  },
  saveButton: {
    marginTop: 12,
    backgroundColor: LIME,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: { fontSize: 15, fontWeight: '800', color: NAVY },
  resetButton: { marginTop: 10, alignItems: 'center', paddingVertical: 6 },
  resetText: { fontSize: 13, color: GRAY },

  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  planTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  planMeta: { fontSize: 12, color: GRAY, marginTop: 2 },
  planDelete: { fontSize: 13, color: '#DC2626' },
});