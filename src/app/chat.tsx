import { createComparisonContext, parseComparisonIds, resolveComparisonItems } from '@/services/analysisComparison';
import type {
  AnalysisHistoryItem,
} from '@/services/analysisHistory';
import {
  getAnalysisHistory,
} from '@/services/analysisHistory';
import {
  ChatContext,
  ChatHistoryItem,
  sendChatMessage,
} from '@/services/chatbot';
import {
  getChecklistBySourceMessageId,
  saveChecklist,
  updateChecklist,
} from '@/services/checklistStorage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}
type ChatParams = {
  favoriteCompareIds?: string;
  comparisonSession?: string;
  returnTo?: string;
  returnParams?: string;
  businessName?: string;
  areaName?: string;
  rank?: string;
  totalCount?: string;
  suitabilityScore?: string;
  floatingPopulation?: string;
  livingPopulation?: string;
  storeCount?: string;
  competitionDensity?: string;
  salesAmount?: string;
  averageSalesPerStore?: string;
  busStopCount?: string;
  livingPopulationChangeRate?: string;
  floatingPopulationChangeRate?: string;
  analysisType?: string;
  dongName?: string;
  latitude?: string;
  longitude?: string;
  radius?: string;
  region?: string;
  address?: string;
  [key: string]: string | string[] | undefined;
};
function getAnalysisTypeLabel(
  type: AnalysisHistoryItem['type'],
) {
  switch (type) {
    case 'comparison':
      return '업종·지역 비교';
    case 'location':
      return '입지 추천';
    case 'owned':
      return '보유 장소 업종 추천';
    default:
      return '상권 분석';
  }
}
function formatHistoryDate(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
function createHistoryContext(
  item: AnalysisHistoryItem,
): ChatContext {
  const resultData =
    item.resultData &&
      typeof item.resultData === 'object' &&
      !Array.isArray(item.resultData)
      ? item.resultData
      : {
        resultData: item.resultData,
      };
  return {
    ...resultData,
    analysisHistoryId: item.id,
    analysisType: item.type,
    analysisTitle: item.title,
    businessName: item.businessName,
    regions: item.regions,
    createdAt: item.createdAt,
  };
}
function isKeywordHighlight(text: string) {
  const clean = text
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) {
    return false;
  }
  const isShort =
    clean.length <= 18;
  const looksLikeSentence =
    /[.!?。！？]|습니다|입니다|해요|돼요|나요|까요|합니다/.test(
      clean,
    );
  return isShort && !looksLikeSentence;
}
function renderInlineMarkdown(
  text: string,
  keyPrefix: string,
) {
  const safeText = typeof text === 'string' ? text : '';
  const parts = safeText.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (
      part.startsWith('**') &&
      part.endsWith('**')
    ) {
      const clean =
        part.slice(2, -2);
      return (
        <Text
          key={key}
          style={
            isKeywordHighlight(clean)
              ? styles.markdownKeyword
              : styles.markdownStrong
          }
        >
          {clean}
        </Text>
      );
    }
    return (
      <Text key={key}>
        {part}
      </Text>
    );
  });
}
function ChecklistItem({
  text,
  checked,
  compact = false,
  onToggle,
}: {
  text: string;
  checked: boolean;
  compact?: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.checklistRow,
        compact &&
        styles.checklistRowCompact,
        checked &&
        styles.checklistRowChecked,
      ]}
      activeOpacity={0.75}
      onPress={onToggle}
    >
      <View
        style={[
          styles.checklistBox,
          compact &&
          styles.checklistBoxCompact,
          checked &&
          styles.checklistBoxChecked,
        ]}
      >
        {checked && (
          <Text
            style={styles.checklistCheck}
          >
            ✓
          </Text>
        )}
      </View>
      <Text
        style={[
          styles.checklistText,
          compact &&
          styles.checklistTextCompact,
          checked &&
          styles.checklistTextChecked,
        ]}
      >
        {renderInlineMarkdown(
          text,
          `check-${text}`,
        )}
      </Text>
    </TouchableOpacity>
  );
}
function AssistantContent({
  content,
  messageId,
  contextTitle,
  businessName,
  areaName,
}: {
  content: string;
  messageId: string;
  contextTitle?: string;
  businessName?: string;
  areaName?: string;
}) {
  const normalized = useMemo(
    () =>
      (typeof content === 'string' ? content : '')
        .replace(/\r\n/g, '\n')
        .trim(),
    [content],
  );
  const lines = useMemo(
    () => normalized.split('\n'),
    [normalized],
  );
  const checklistInfo = useMemo(() => {
    const parentChildren: Record<
      number,
      number[]
    > = {};
    const childParent: Record<
      number,
      number
    > = {};
    let currentParent:
      | number
      | null = null;
    lines.forEach(
      (rawLine, index) => {
        const line =
          rawLine.trim();
        if (!line) {
          return;
        }
        if (
          /^---+$/.test(line) ||
          /^(#{1,4})\s*/.test(
            line,
          )
        ) {
          currentParent = null;
          return;
        }
        const parentMatch =
          line.match(
            /^(?:[-*•]\s*)?\[\s*([xX]?)\s*\]\s*(.*)$/,
          );
        if (parentMatch) {
          currentParent = index;
          parentChildren[index] =
            [];
          return;
        }
        const bulletMatch =
          line.match(
            /^(?:[-*•])\s+(.*)$/,
          );
        if (
          bulletMatch &&
          currentParent !== null
        ) {
          parentChildren[
            currentParent
          ].push(index);
          childParent[index] =
            currentParent;
          return;
        }
        currentParent = null;
      },
    );
    return {
      parentChildren,
      childParent,
    };
  }, [lines]);
  const [checkedMap, setCheckedMap] =
    useState<Record<number, boolean>>(
      () => {
        const initial: Record<
          number,
          boolean
        > = {};
        lines.forEach(
          (rawLine, index) => {
            const line =
              rawLine.trim();
            const match =
              line.match(
                /^(?:[-*•]\s*)?\[\s*([xX]?)\s*\]\s*(.*)$/,
              );
            if (match) {
              initial[index] =
                match[1].toLowerCase() ===
                'x';
            }
            if (
              checklistInfo.childParent[
              index
              ] !== undefined
            ) {
              initial[index] =
                false;
            }
          },
        );
        return initial;
      },
    );
  const [savedChecklistId, setSavedChecklistId] =
    useState<string | null>(null);
  useEffect(() => {
    const syncChecklist = async () => {
      const itemIndexes = new Set<number>();
      Object.keys(checklistInfo.parentChildren).forEach(key => {
        const parentIndex = Number(key);
        itemIndexes.add(parentIndex);
        checklistInfo.parentChildren[parentIndex].forEach(
          childIndex => {
            itemIndexes.add(childIndex);
          },
        );
      });
      if (itemIndexes.size === 0) {
        return;
      }
      const parseItemText = (index: number) => {
        const line = lines[index]?.trim() ?? '';
        const checklistMatch = line.match(
          /^(?:[-*•]\s*)?\[\s*([xX]?)\s*\]\s*(.*)$/,
        );
        if (checklistMatch) {
          return checklistMatch[2]
            .replace(/\*\*/g, '')
            .trim();
        }
        const bulletMatch = line.match(
          /^(?:[-*•])\s+(.*)$/,
        );
        return (
          bulletMatch?.[1]
            ?.replace(/\*\*/g, '')
            .trim() ?? line
        );
      };
      try {
        const existing =
          await getChecklistBySourceMessageId(messageId);
        if (existing) {
          setSavedChecklistId(existing.id);
          const restored: Record<number, boolean> = {};
          existing.items.forEach(item => {
            const match = item.id.match(/^line-(\d+)$/);
            if (match) {
              restored[Number(match[1])] =
                item.checked;
            }
          });
          setCheckedMap(prev => ({
            ...prev,
            ...restored,
          }));
          return;
        }
        const sortedIndexes = Array.from(
          itemIndexes,
        ).sort((a, b) => a - b);
        const items = sortedIndexes.map(index => {
          const parentIndex =
            checklistInfo.childParent[index];
          return {
            id: `line-${index}`,
            text: parseItemText(index),
            checked:
              checkedMap[index] === true,
            parentId:
              parentIndex !== undefined
                ? `line-${parentIndex}`
                : undefined,
          };
        });
        const firstParentIndex =
          Object.keys(
            checklistInfo.parentChildren,
          )
            .map(Number)
            .sort((a, b) => a - b)[0];
        const fallbackTitle =
          firstParentIndex !== undefined
            ? `${parseItemText(firstParentIndex)} 체크리스트`
            : 'AI 체크리스트';
        const saved = await saveChecklist({
          title:
            contextTitle?.trim() ||
            fallbackTitle,
          source: 'chatbot',
          sourceMessageId: messageId,
          businessName:
            businessName?.trim() || undefined,
          areaName:
            areaName?.trim() || undefined,
          items,
        });
        setSavedChecklistId(saved.id);
      } catch (error) {
        console.error(
          '체크리스트 저장 준비 실패:',
          error,
        );
      }
    };
    syncChecklist();
    // 초기 렌더 시 한 번 저장/복원
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageId]);
  const persistCheckedMap = (
    nextMap: Record<number, boolean>,
  ) => {
    if (!savedChecklistId) {
      return;
    }
    const itemIndexes = new Set<number>();
    Object.keys(checklistInfo.parentChildren).forEach(key => {
      const parentIndex = Number(key);
      itemIndexes.add(parentIndex);
      checklistInfo.parentChildren[parentIndex].forEach(
        childIndex => {
          itemIndexes.add(childIndex);
        },
      );
    });
    const parseItemText = (index: number) => {
      const line = lines[index]?.trim() ?? '';
      const checklistMatch = line.match(
        /^(?:[-*•]\s*)?\[\s*([xX]?)\s*\]\s*(.*)$/,
      );
      if (checklistMatch) {
        return checklistMatch[2]
          .replace(/\*\*/g, '')
          .trim();
      }
      const bulletMatch = line.match(
        /^(?:[-*•])\s+(.*)$/,
      );
      return (
        bulletMatch?.[1]
          ?.replace(/\*\*/g, '')
          .trim() ?? line
      );
    };
    const items = Array.from(itemIndexes)
      .sort((a, b) => a - b)
      .map(index => {
        const parentIndex =
          checklistInfo.childParent[index];
        return {
          id: `line-${index}`,
          text: parseItemText(index),
          checked:
            nextMap[index] === true,
          parentId:
            parentIndex !== undefined
              ? `line-${parentIndex}`
              : undefined,
        };
      });
    void updateChecklist(
      savedChecklistId,
      {
        items,
      },
    );
  };
  const isParentChecked = (
    parentIndex: number,
  ) => {
    const children =
      checklistInfo.parentChildren[
      parentIndex
      ] ?? [];
    if (children.length > 0) {
      return children.every(
        childIndex =>
          checkedMap[
          childIndex
          ] === true,
      );
    }
    return (
      checkedMap[parentIndex] ===
      true
    );
  };
  const toggleParent = (
    parentIndex: number,
  ) => {
    const children =
      checklistInfo.parentChildren[
      parentIndex
      ] ?? [];
    const nextChecked =
      !isParentChecked(
        parentIndex,
      );
    setCheckedMap(prev => {
      const next = {
        ...prev,
        [parentIndex]:
          nextChecked,
      };
      children.forEach(
        childIndex => {
          next[childIndex] =
            nextChecked;
        },
      );
      persistCheckedMap(next);
      return next;
    });
  };
  const toggleChild = (
    childIndex: number,
  ) => {
    setCheckedMap(prev => {
      const next = {
        ...prev,
        [childIndex]:
          !prev[childIndex],
      };
      const parentIndex =
        checklistInfo.childParent[
        childIndex
        ];
      if (
        parentIndex !==
        undefined
      ) {
        const siblings =
          checklistInfo
            .parentChildren[
          parentIndex
          ] ?? [];
        next[parentIndex] =
          siblings.length > 0 &&
          siblings.every(
            siblingIndex =>
              next[siblingIndex] ===
              true,
          );
      }
      persistCheckedMap(next);
      return next;
    });
  };
  return (
    <View
      style={styles.markdownContainer}
    >
      {lines.map(
        (rawLine, index) => {
          const line =
            rawLine.trim();
          const key =
            `line-${index}`;
          if (!line) {
            return (
              <View
                key={key}
                style={
                  styles.markdownSpacer
                }
              />
            );
          }
          if (
            /^---+$/.test(line)
          ) {
            return (
              <View
                key={key}
                style={
                  styles.markdownDivider
                }
              />
            );
          }
          const checklistMatch =
            line.match(
              /^(?:[-*•]\s*)?\[\s*([xX]?)\s*\]\s*(.*)$/,
            );
          if (checklistMatch) {
            return (
              <ChecklistItem
                key={key}
                text={
                  checklistMatch[2]
                }
                checked={isParentChecked(
                  index,
                )}
                onToggle={() =>
                  toggleParent(index)
                }
              />
            );
          }
          const headingMatch =
            line.match(
              /^(#{1,4})\s*(.*)$/,
            );
          if (headingMatch) {
            const headingText =
              headingMatch[2]
                .replace(
                  /^\*\*/,
                  '',
                )
                .replace(
                  /\*\*$/,
                  '',
                )
                .trim();
            return (
              <Text
                key={key}
                style={
                  styles.markdownHeading
                }
              >
                {headingText}
              </Text>
            );
          }
          const bulletMatch =
            line.match(
              /^(?:[-*•])\s+(.*)$/,
            );
          if (bulletMatch) {
            const parentIndex =
              checklistInfo
                .childParent[index];
            if (
              parentIndex !==
              undefined
            ) {
              return (
                <ChecklistItem
                  key={key}
                  text={
                    bulletMatch[1]
                  }
                  compact
                  checked={
                    checkedMap[
                    index
                    ] === true
                  }
                  onToggle={() =>
                    toggleChild(
                      index,
                    )
                  }
                />
              );
            }
            return (
              <View
                key={key}
                style={
                  styles.markdownBulletRow
                }
              >
                <View
                  style={
                    styles.markdownBulletDot
                  }
                />
                <Text
                  style={
                    styles.markdownBulletText
                  }
                >
                  {renderInlineMarkdown(
                    bulletMatch[1],
                    `${key}-bullet`,
                  )}
                </Text>
              </View>
            );
          }
          const numberedMatch =
            line.match(
              /^(\d+)\.\s+(.*)$/,
            );
          if (
            numberedMatch
          ) {
            return (
              <View
                key={key}
                style={
                  styles.markdownNumberRow
                }
              >
                <View
                  style={
                    styles.markdownNumberBadge
                  }
                >
                  <Text
                    style={
                      styles.markdownNumberText
                    }
                  >
                    {
                      numberedMatch[1]
                    }
                  </Text>
                </View>
                <Text
                  style={
                    styles.markdownNumberContent
                  }
                >
                  {renderInlineMarkdown(
                    numberedMatch[2],
                    `${key}-number`,
                  )}
                </Text>
              </View>
            );
          }
          return (
            <Text
              key={key}
              style={
                styles.markdownParagraph
              }
            >
              {renderInlineMarkdown(
                line,
                `${key}-paragraph`,
              )}
            </Text>
          );
        },
      )}
    </View>
  );
}
export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams() as ChatParams;
  const scrollRef = useRef<ScrollView>(null);
  const incomingIds = typeof params.favoriteCompareIds === 'string' ? params.favoriteCompareIds : '';
  const incomingSession = typeof params.comparisonSession === 'string' ? params.comparisonSession : '';
  const requestEpoch = useRef(0);
  const requestLock = useRef(false);
  const [comparisonLoadState, setComparisonLoadState] = useState<'loading' | 'ready' | 'error' | ''>(incomingIds ? 'loading' : '');
  const [comparisonLoadError, setComparisonLoadError] = useState('');
  const initialContext = useMemo<ChatContext>(() => {
    const result: ChatContext = {};
    Object.entries(params).forEach(([key, value]) => {
      if (['returnTo', 'returnParams', 'favoriteCompareIds', 'comparisonSession'].includes(key)) {
        return;
      }
      if (typeof value === 'string' && value.trim()) {
        result[key] = value;
      }
    });
    return result;
  }, [params]);
  const [activeContext, setActiveContext] =
    useState<ChatContext>(initialContext);
  const [selectedHistory, setSelectedHistory] =
    useState<AnalysisHistoryItem | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyVisible, setHistoryVisible] =
    useState(false);
  const [historyLoading, setHistoryLoading] =
    useState(false);
  const [historyItems, setHistoryItems] =
    useState<AnalysisHistoryItem[]>([]);
  const [compareVisible, setCompareVisible] =
    useState(false);
  const [compareTarget, setCompareTarget] =
    useState<AnalysisHistoryItem | null>(null);
  const contextLabel = useMemo(() => {
    if (activeContext.comparisonMode) return activeContext.comparisonTitle || '분석 비교 상담';
    if (selectedHistory) {
      const regionText =
        selectedHistory.regions?.length > 0
          ? selectedHistory.regions.join(', ')
          : '';
      if (
        selectedHistory.businessName &&
        regionText
      ) {
        return `${regionText} · ${selectedHistory.businessName}`;
      }
      return (
        selectedHistory.title ||
        selectedHistory.businessName ||
        regionText
      );
    }
    const business =
      typeof params.businessName === 'string'
        ? params.businessName
        : '';
    const area =
      typeof params.areaName === 'string'
        ? params.areaName
        : typeof params.region === 'string'
          ? params.region
          : '';
    if (business && area) {
      return `${area} · ${business} 분석 결과`;
    }
    if (area) {
      return `${area} 분석 결과`;
    }
    if (business) {
      return `${business} 분석 결과`;
    }
    return '';
  }, [params, selectedHistory, activeContext]);
  const suggestedQuestions = useMemo(() => {
    if (activeContext.comparisonMode) return [
      '선택한 후보들의 차이를 쉽게 비교해줘',
      '각 후보의 강점과 위험 요소는 뭐예요?',
      '경쟁 부담이 적은 후보는 어디예요?',
      '예산이 적다면 무엇을 더 확인해야 하나요?',
      '추천 순위와 그 근거를 알려줘',
      '이 비교에서 부족한 정보는 뭐예요?',
    ];
    const hasAnalysisContext =
      Object.keys(activeContext).length > 0;
    if (hasAnalysisContext) {
      return [
        '이 분석 결과를 쉽게 설명해줘',
        '왜 이런 점수가 나왔나요?',
        '가장 강점인 지표는 뭐예요?',
        '가장 위험한 요소는 뭐예요?',
        '경쟁 수준은 어떤 편인가요?',
        '창업 전에 추가로 확인할 건 뭐예요?',
      ];
    }
    return [
      '유동인구가 많으면 무조건 좋은가요?',
      '경쟁이 심한 지역은 피해야 하나요?',
      '매출이 높은 지역이 무조건 좋은가요?',
      '점포 수가 많으면 불리한가요?',
      '창업할 때 가장 먼저 볼 지표는 뭐예요?',
      '상권 분석 결과는 어떻게 해석하나요?',
    ];
  }, [activeContext]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        Object.keys(initialContext).length > 0
          ? '현재 분석 결과를 바탕으로 답변해드릴게요. 궁금한 점을 물어보세요.'
          : '안녕하세요! 상권 분석 AI입니다. 추천 질문을 눌러보거나 직접 질문해보세요.',
    },
  ]);
  const chatBlocked = isLoading || comparisonLoadState === 'loading' || comparisonLoadState === 'error';
  useEffect(() => {
    if (!incomingIds) return;
    let cancelled = false;
    requestEpoch.current += 1;
    const loadEpoch = requestEpoch.current;
    requestLock.current = false;
    setIsLoading(false);
    setComparisonLoadState('loading');
    setComparisonLoadError('');
    setSelectedHistory(null);
    setCompareTarget(null);
    setActiveContext({});
    setInput('');
    setMessages([{ id: 'welcome', role: 'assistant', content: '선택한 분석의 비교 자료를 불러오고 있어요.' }]);
    (async () => {
      try {
        const ids = parseComparisonIds(incomingIds);
        const items = resolveComparisonItems(await getAnalysisHistory(), ids);
        const context = createComparisonContext(items, 'favorites');
        if (cancelled || requestEpoch.current !== loadEpoch) return;
        setActiveContext(context);
        setComparisonLoadState('ready');
        setMessages([{ id: 'welcome', role: 'assistant', content:
          `선택한 ${items.length}개 분석의 비교 자료를 불러왔어요. 후보 번호는 찜 비교 화면의 순서와 같아요. 추천 질문을 누르거나 원하는 조건을 알려주세요. 후속 질문에도 이 후보들을 기준으로 답변해드릴게요.` }]);
      } catch (error) {
        if (cancelled || requestEpoch.current !== loadEpoch) return;
        const message = error instanceof Error ? error.message : '비교 자료를 불러오지 못했어요.';
        setComparisonLoadState('error');
        setComparisonLoadError(message);
        setMessages([{ id: 'welcome', role: 'assistant', content: message }]);
      }
    })();
    return () => { cancelled = true; requestEpoch.current += 1; requestLock.current = false; };
  }, [incomingIds, incomingSession]);
  useEffect(() => () => { requestEpoch.current += 1; requestLock.current = false; }, []);

  const resetChatContext = (context: ChatContext, welcome: string) => {
    requestEpoch.current += 1;
    requestLock.current = false;
    setIsLoading(false);
    setComparisonLoadState('');
    setComparisonLoadError('');
    setCompareTarget(null);
    setActiveContext(context);
    setInput('');
    setMessages([{ id: 'welcome', role: 'assistant', content: welcome }]);
  };
  const handleBack = () => {
    const returnTo =
      typeof params.returnTo === 'string'
        ? params.returnTo
        : '';
    if (returnTo) {
      let parsedReturnParams: Record<
        string,
        string
      > = {};
      if (
        typeof params.returnParams ===
        'string'
      ) {
        try {
          parsedReturnParams = JSON.parse(
            params.returnParams,
          );
        } catch (error) {
          console.error(
            '챗봇 복귀 파라미터 파싱 오류:',
            error,
          );
        }
      }
      (router as any).replace({
        pathname: returnTo,
        params: parsedReturnParams,
      });
      return;
    }
    router.replace('/');
  };
  const openHistoryModal = async () => {
    setHistoryVisible(true);
    setHistoryLoading(true);
    try {
      const items =
        await getAnalysisHistory();
      setHistoryItems(items);
    } catch (error) {
      console.error(
        '챗봇 분석 기록 조회 실패:',
        error,
      );
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };
  const selectHistory = (item: AnalysisHistoryItem) => {
    setSelectedHistory(item);
    setHistoryVisible(false);
    resetChatContext(createHistoryContext(item), `'${item.title}' 분석을 기준으로 새 대화를 시작해요. 궁금한 점을 물어보세요.`);
  };
  const clearSelectedHistory = () => {
    setSelectedHistory(null);
    resetChatContext(initialContext, Object.keys(initialContext).length
      ? '화면에서 전달된 분석 결과를 기준으로 새 대화를 시작해요.'
      : '분석 연결을 해제했어요. 일반 상권 질문을 해주세요.');
  };
  const openCompareModal = async () => {
    if (!selectedHistory) {
      setMessages(prev => [
        ...prev,
        {
          id: `${Date.now()}-compare-no-base`,
          role: 'assistant',
          content:
            '먼저 비교 기준이 될 분석 기록을 하나 불러와주세요.',
        },
      ]);
      return;
    }
    let items = historyItems;
    if (items.length === 0) {
      items =
        await getAnalysisHistory();
      setHistoryItems(items);
    }
    const candidates =
      items.filter(
        item =>
          item.id !== selectedHistory.id,
      );
    if (candidates.length === 0) {
      setMessages(prev => [
        ...prev,
        {
          id: `${Date.now()}-compare-not-enough`,
          role: 'assistant',
          content:
            '비교하려면 분석 기록이 2개 이상 필요해요. 분석을 하나 더 진행한 뒤 다시 비교해보세요.',
        },
      ]);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({
          animated: true,
        });
      }, 100);
      return;
    }
    setCompareVisible(true);
  };
  const compareWithHistory = async (target: AnalysisHistoryItem) => {
    if (!selectedHistory || chatBlocked || requestLock.current) return;
    let context: ChatContext;
    try { context = createComparisonContext([selectedHistory, target], 'history'); }
    catch (error) {
      setMessages(prev => [...prev, { id: `${Date.now()}-compare-error`, role: 'assistant', content:
        error instanceof Error ? error.message : '비교 자료를 준비하지 못했어요.' }]);
      return;
    }
    resetChatContext(context, '두 분석을 비교해드릴게요. 이어지는 질문에도 같은 비교 자료를 사용해요.');
    setCompareTarget(target);
    setCompareVisible(false);
    // 상태 반영을 기다리지 않고 이번 요청에도 같은 context를 명시적으로 사용합니다.
    await handleSend('두 후보의 지표 차이, 강점과 위험 요소를 비교하고 어떤 조건에서 어느 후보가 더 적합한지 설명해줘.', context, []);
  };
  const handleSend = async (
    presetMessage?: string,
    contextOverride?: ChatContext,
    historyOverride?: ChatHistoryItem[],
  ) => {
    const trimmed = (presetMessage ?? input).trim();
    if (!trimmed || chatBlocked || requestLock.current) return;
    requestLock.current = true;
    const epoch = requestEpoch.current;
    const context = contextOverride ?? activeContext;
    const history: ChatHistoryItem[] = historyOverride ?? messages
      .filter(message => message.id !== 'welcome' && !message.id.endsWith('-error'))
      .map(message => ({ role: message.role, content: message.content }));
    setMessages(prev => [...prev, { id: `${Date.now()}-user`, role: 'user', content: trimmed }]);
    if (!presetMessage) setInput('');
    setIsLoading(true);
    try {
      const answer = await sendChatMessage(trimmed, context, history);
      if (requestEpoch.current !== epoch) return;
      setMessages(prev => [...prev, { id: `${Date.now()}-assistant`, role: 'assistant', content: answer }]);
    } catch (error) {
      if (requestEpoch.current !== epoch) return;
      setMessages(prev => [...prev, { id: `${Date.now()}-error`, role: 'assistant', content:
        `오류가 발생했습니다.\n${error instanceof Error ? error.message : 'AI 응답을 불러오지 못했어요.'}` }]);
    } finally {
      if (requestEpoch.current === epoch) {
        requestLock.current = false;
        setIsLoading(false);
      }
    }
  };
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
          hitSlop={{
            top: 8,
            bottom: 8,
            left: 8,
            right: 8,
          }}
        >
          <Text style={styles.backIcon}>
            ‹
          </Text>
        </TouchableOpacity>
        <View style={styles.headerTextArea}>
          <Text style={styles.headerTitle}>
            상권 분석 AI
          </Text>
          <Text
            style={styles.headerSubtitle}
            numberOfLines={1}
          >
            {contextLabel ||
              '창업 궁금증을 물어보세요'}
          </Text>
        </View>
      </View>
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={
          styles.messagesContent
        }
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({
            animated: true,
          })
        }
      >
        <View
          style={styles.contextSection}
        >
          <View
            style={styles.contextTopRow}
          >
            <View style={styles.contextTextArea}>
              <Text
                style={styles.contextSectionTitle}
              >
                분석 결과로 질문하기
              </Text>
              <Text
                style={
                  styles.contextSectionDescription
                }
              >
                저장된 분석 기록을 불러오면
                해당 결과를 기준으로 AI에게
                질문할 수 있어요.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.historyButton}
              activeOpacity={0.8}
              onPress={openHistoryModal}
            >
              <Text
                style={
                  styles.historyButtonText
                }
              >
                내 분석 기록
              </Text>
            </TouchableOpacity>
          </View>
          {comparisonLoadState === 'loading' ? (
            <View style={styles.compareStatusCard}><ActivityIndicator color="#202544" /><Text style={styles.compareStatusText}>비교 자료를 불러오고 있어요.</Text></View>
          ) : null}
          {comparisonLoadError ? (
            <View style={styles.compareStatusCard}>
              <Text style={styles.compareStatusText}>{comparisonLoadError}</Text>
              <TouchableOpacity onPress={handleBack}><Text style={styles.contextClearText}>찜한 분석으로 돌아가기 →</Text></TouchableOpacity>
            </View>
          ) : null}
          {activeContext.comparisonMode && activeContext.comparisonCandidates ? (
            <View style={styles.favoriteCompareCard}>
              <Text style={styles.favoriteCompareTitle}>{activeContext.comparisonTitle}</Text>
              {activeContext.comparisonCandidates.map(candidate => (
                <View key={candidate.analysisHistoryId} style={styles.favoriteCompareCandidate}>
                  <Text style={styles.favoriteCompareName}>후보 {candidate.candidateNumber} · {candidate.businessName}</Text>
                  <Text style={styles.favoriteCompareMeta}>{candidate.regions.join(', ') || candidate.areaName || '지역 미저장'} · 저장 {formatHistoryDate(candidate.createdAt)}</Text>
                  <Text style={styles.favoriteCompareMeta}>적합도 {candidate.metrics.suitabilityScore ?? '데이터 없음'} · 동종 점포 {candidate.metrics.storeCount ?? '데이터 없음'}</Text>
                </View>
              ))}
              <Text style={styles.favoriteCompareMeta}>찜 비교와 같은 저장 지표를 사용해요. 업종·분석 범위·시점 차이도 함께 확인해요.</Text>
              <TouchableOpacity onPress={clearSelectedHistory} accessibilityRole="button"><Text style={styles.contextClearText}>비교 상담 해제</Text></TouchableOpacity>
            </View>
          ) : null}
          {selectedHistory && (
            <View
              style={styles.selectedHistoryCard}
            >
              <View
                style={
                  styles.selectedHistoryTextArea
                }
              >
                <Text
                  style={
                    styles.selectedHistoryBadge
                  }
                >
                  현재 불러온 기록
                </Text>
                <Text
                  style={
                    styles.selectedHistoryTitle
                  }
                  numberOfLines={1}
                >
                  {selectedHistory.title}
                </Text>
                <Text
                  style={
                    styles.selectedHistoryMeta
                  }
                  numberOfLines={2}
                >
                  {getAnalysisTypeLabel(
                    selectedHistory.type,
                  )}
                  {' · '}
                  {selectedHistory.businessName}
                  {selectedHistory.regions
                    .length > 0
                    ? ` · ${selectedHistory.regions.join(
                      ', ',
                    )}`
                    : ''}
                </Text>
              </View>
              <View
                style={styles.selectedHistoryActions}
              >
                <TouchableOpacity
                  style={styles.compareButton}
                  activeOpacity={0.75}
                  onPress={openCompareModal}
                >
                  <Text
                    style={styles.compareButtonText}
                  >
                    다른 기록과 비교
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={
                    styles.contextClearButton
                  }
                  activeOpacity={0.7}
                  onPress={clearSelectedHistory}
                >
                  <Text
                    style={
                      styles.contextClearText
                    }
                  >
                    해제
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {compareTarget && selectedHistory && (
            <View style={styles.compareStatusCard}>
              <Text style={styles.compareStatusLabel}>
                최근 비교 대상
              </Text>
              <Text
                style={styles.compareStatusText}
                numberOfLines={1}
              >
                {selectedHistory.title}
                {'  ↔  '}
                {compareTarget.title}
              </Text>
            </View>
          )}
        </View>
        <View
          style={styles.suggestedSection}
        >
          <Text
            style={styles.suggestedTitle}
          >
            많이 묻는 질문
          </Text>
          <Text
            style={
              styles.suggestedDescription
            }
          >
            궁금한 질문을 바로 누르거나 직접
            입력해보세요.
          </Text>
          <View
            style={styles.suggestedWrap}
          >
            {suggestedQuestions.map(
              question => (
                <TouchableOpacity
                  key={question}
                  style={
                    styles.suggestedChip
                  }
                  activeOpacity={0.75}
                  disabled={chatBlocked}
                  onPress={() =>
                    handleSend(question)
                  }
                >
                  <Text
                    style={
                      styles.suggestedChipText
                    }
                  >
                    {question}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </View>
        </View>
        {messages.map(message => {
          const isUser =
            message.role === 'user';
          return (
            <View
              key={message.id}
              style={[
                styles.messageRow,
                isUser
                  ? styles.userMessageRow
                  : styles.assistantMessageRow,
              ]}
            >
              {!isUser && (
                <Image
                  source={require('../../assets/images/chatbot-question-map-red.png')}
                  style={styles.aiAvatar}
                  resizeMode="contain"
                />
              )}
              <View
                style={[
                  styles.bubble,
                  isUser
                    ? styles.userBubble
                    : styles.assistantBubble,
                ]}
              >
                {isUser ? (
                  <Text
                    style={[
                      styles.messageText,
                      styles.userMessageText,
                    ]}
                  >
                    {message.content}
                  </Text>
                ) : (
                  <AssistantContent
                    content={message.content}
                    messageId={message.id}
                    contextTitle={
                      contextLabel || undefined
                    }
                    businessName={
                      typeof params.businessName === 'string'
                        ? params.businessName
                        : selectedHistory?.businessName
                    }
                    areaName={
                      typeof params.areaName === 'string'
                        ? params.areaName
                        : typeof params.region === 'string'
                          ? params.region
                          : selectedHistory?.regions?.[0]
                    }
                  />
                )}
              </View>
            </View>
          );
        })}
        {isLoading && (
          <View style={styles.loadingRow}>
            <Image
              source={require('../../assets/images/chatbot-question-map-red.png')}
              style={styles.aiAvatar}
              resizeMode="contain"
            />
            <View
              style={styles.loadingBubble}
            >
              <ActivityIndicator size="small" color="#1F2444" />
              <Text
                style={styles.loadingText}
              >
                답변을 생각하고 있어요...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
      <View style={styles.inputArea}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="상권이나 창업에 대해 질문해보세요"
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={1000}
            editable={!chatBlocked}
            submitBehavior="submit"
            enterKeyHint="send"
            onSubmitEditing={() => {
              handleSend();
            }}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!input.trim() ||
                chatBlocked) &&
              styles.sendButtonDisabled,
            ]}
            onPress={() => handleSend()}
            disabled={
              !input.trim() ||
              chatBlocked
            }
            activeOpacity={0.8}
          >
            <Text
              style={styles.sendButtonText}
            >
              전송
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <Modal
        visible={historyVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setHistoryVisible(false)
        }
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() =>
            setHistoryVisible(false)
          }
        >
          <Pressable
            style={styles.modalCard}
            onPress={event =>
              event.stopPropagation()
            }
          >
            <View
              style={styles.modalHeader}
            >
              <View>
                <Text
                  style={styles.modalTitle}
                >
                  내 분석 기록
                </Text>
                <Text
                  style={
                    styles.modalDescription
                  }
                >
                  질문에 사용할 분석 결과를
                  선택해주세요.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                activeOpacity={0.7}
                onPress={() =>
                  setHistoryVisible(false)
                }
              >
                <Text
                  style={styles.modalCloseText}
                >
                  ×
                </Text>
              </TouchableOpacity>
            </View>
            {historyLoading ? (
              <View
                style={styles.historyLoading}
              >
                <ActivityIndicator
                  size="small"
                />
                <Text
                  style={
                    styles.historyLoadingText
                  }
                >
                  분석 기록을 불러오는 중...
                </Text>
              </View>
            ) : historyItems.length === 0 ? (
              <View
                style={styles.emptyHistory}
              >
                <Text
                  style={
                    styles.emptyHistoryTitle
                  }
                >
                  아직 저장된 분석 기록이 없어요
                </Text>
                <Text
                  style={
                    styles.emptyHistoryDescription
                  }
                >
                  상권 분석을 진행하고 결과를
                  저장하면 여기에서 불러올 수
                  있어요.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.historyList}
                showsVerticalScrollIndicator={
                  false
                }
              >
                {historyItems.map(item => {
                  const isSelected =
                    selectedHistory?.id ===
                    item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.historyItem,
                        isSelected &&
                        styles.historyItemSelected,
                      ]}
                      activeOpacity={0.75}
                      onPress={() =>
                        selectHistory(item)
                      }
                    >
                      <View
                        style={
                          styles.historyItemTop
                        }
                      >
                        <Text
                          style={
                            styles.historyType
                          }
                        >
                          {getAnalysisTypeLabel(
                            item.type,
                          )}
                        </Text>
                        {item.isFavorite && (
                          <Text
                            style={
                              styles.favoriteMark
                            }
                          >
                            ★
                          </Text>
                        )}
                      </View>
                      <Text
                        style={
                          styles.historyItemTitle
                        }
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text
                        style={
                          styles.historyItemMeta
                        }
                        numberOfLines={2}
                      >
                        {item.businessName}
                        {item.regions.length >
                          0
                          ? ` · ${item.regions.join(
                            ', ',
                          )}`
                          : ''}
                      </Text>
                      <Text
                        style={
                          styles.historyDate
                        }
                      >
                        {formatHistoryDate(
                          item.createdAt,
                        )}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
      <Modal
        visible={compareVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setCompareVisible(false)
        }
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() =>
            setCompareVisible(false)
          }
        >
          <Pressable
            style={styles.modalCard}
            onPress={event =>
              event.stopPropagation()
            }
          >
            <View
              style={styles.modalHeader}
            >
              <View>
                <Text
                  style={styles.modalTitle}
                >
                  비교할 분석 기록 선택
                </Text>
                <Text
                  style={
                    styles.modalDescription
                  }
                >
                  현재 기록과 비교할 다른 분석
                  결과를 선택해주세요.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                activeOpacity={0.7}
                onPress={() =>
                  setCompareVisible(false)
                }
              >
                <Text
                  style={styles.modalCloseText}
                >
                  ×
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.historyList}
              showsVerticalScrollIndicator={
                false
              }
            >
              {historyItems
                .filter(
                  item =>
                    item.id !==
                    selectedHistory?.id,
                )
                .map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.historyItem}
                    activeOpacity={0.75}
                    onPress={() =>
                      compareWithHistory(item)
                    }
                  >
                    <View
                      style={styles.historyItemTop}
                    >
                      <Text
                        style={styles.historyType}
                      >
                        {getAnalysisTypeLabel(
                          item.type,
                        )}
                      </Text>
                      {item.isFavorite && (
                        <Text
                          style={
                            styles.favoriteMark
                          }
                        >
                          ★
                        </Text>
                      )}
                    </View>
                    <Text
                      style={styles.historyItemTitle}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={styles.historyItemMeta}
                      numberOfLines={2}
                    >
                      {item.businessName}
                      {item.regions.length > 0
                        ? ` · ${item.regions.join(
                          ', ',
                        )}`
                        : ''}
                    </Text>
                    <Text
                      style={styles.historyDate}
                    >
                      {formatHistoryDate(
                        item.createdAt,
                      )}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  favoriteCompareCard: { marginTop: 12, backgroundColor: '#F3F5FA', borderWidth: 1, borderColor: '#E5ECF8', padding: 14, borderRadius: 14, gap: 9 },
  favoriteCompareTitle: { color: '#202544', fontSize: 15, fontWeight: '900' },
  favoriteCompareCandidate: { backgroundColor: '#FFFFFF', padding: 10, borderRadius: 10 },
  favoriteCompareName: { color: '#202544', fontSize: 13, fontWeight: '800' },
  favoriteCompareMeta: { color: '#7E8BA3', fontSize: 11, lineHeight: 17, marginTop: 3 },
  screen: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  header: {
    minHeight: 68,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 32,
    lineHeight: 34,
    color: '#111827',
  },
  headerTextArea: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
  },
  contextSection: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contextTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contextTextArea: {
    flex: 1,
  },
  contextSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  contextSectionDescription: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: '#6B7280',
  },
  historyButton: {
    minHeight: 38,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#1D2545',
  },
  historyButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  selectedHistoryCard: {
    marginTop: 13,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#EEF1F8',
    borderWidth: 1,
    borderColor: '#CDEED7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedHistoryTextArea: {
    flex: 1,
  },
  selectedHistoryActions: {
    alignItems: 'flex-end',
    gap: 7,
  },
  compareButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: '#1D2545',
  },
  compareButtonText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  compareStatusCard: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  compareStatusLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6B7280',
  },
  compareStatusText: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  selectedHistoryBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#25824A',
  },
  selectedHistoryTitle: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  selectedHistoryMeta: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 15,
    color: '#6B7280',
  },
  contextClearButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE8DF',
  },
  contextClearText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  suggestedSection: {
    marginBottom: 22,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  suggestedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  suggestedDescription: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 12,
    lineHeight: 17,
    color: '#6B7280',
  },
  suggestedWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestedChip: {
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F0DEA0',
    backgroundColor: '#FFF4C2',
  },
  suggestedChipText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: '#1D2545',
  },
  messageRow: {
    width: '100%',
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  assistantMessageRow: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 36,
    height: 36,
    marginRight: 9,
  },
  bubble: {
    maxWidth: '88%',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#1D2545',
    borderBottomRightRadius: 5,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8DFED',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  assistantMessageText: {
    color: '#1F2937',
  },
  markdownContainer: {
    width: '100%',
  },
  markdownHeading: {
    marginTop: 4,
    marginBottom: 8,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '900',
    color: '#1F2937',
  },
  markdownParagraph: {
    marginBottom: 7,
    fontSize: 14,
    lineHeight: 22,
    color: '#263238',
  },
  markdownStrong: {
    fontWeight: '800',
    color: '#1F2937',
  },
  markdownKeyword: {
    fontWeight: '900',
    color: '#1F2444',
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  checklistRowChecked: {
    backgroundColor: '#F3F8F4',
    borderColor: '#D7E8DB',
  },
  checklistRowCompact: {
    marginLeft: 18,
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 7,
    backgroundColor: '#FFFFFF',
    borderColor: '#EEF1EF',
  },
  checklistBox: {
    width: 20,
    height: 20,
    marginTop: 1,
    marginRight: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#AAB4AE',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checklistBoxChecked: {
    borderColor: '#25824A',
    backgroundColor: '#25824A',
  },
  checklistBoxCompact: {
    width: 17,
    height: 17,
    marginTop: 2,
    marginRight: 8,
    borderRadius: 4,
  },
  checklistCheck: {
    fontSize: 13,
    lineHeight: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  checklistText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: '#263238',
  },
  checklistTextChecked: {
    color: '#8A938E',
    textDecorationLine: 'line-through',
  },
  checklistTextCompact: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  markdownDivider: {
    height: 1,
    marginVertical: 12,
    backgroundColor: '#E3EAE5',
  },
  markdownSpacer: {
    height: 5,
  },
  markdownBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 7,
    paddingRight: 4,
  },
  markdownBulletDot: {
    width: 5,
    height: 5,
    marginTop: 8,
    marginRight: 9,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
  },
  markdownBulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: '#263238',
  },
  markdownNumberRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 9,
  },
  markdownNumberBadge: {
    width: 22,
    height: 22,
    marginTop: 1,
    marginRight: 9,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  markdownNumberText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#6B7280',
  },
  markdownNumberContent: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: '#263238',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 18,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  inputArea: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom:
      Platform.OS === 'ios'
        ? 24
        : 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingLeft: 15,
    paddingRight: 7,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 110,
    paddingVertical: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#111827',
    outlineStyle: 'none',
  } as any,
  sendButton: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D2545',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor:
      'rgba(17, 24, 39, 0.35)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '75%',
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
  },
  modalDescription: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: '#6B7280',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  modalCloseText: {
    marginTop: -2,
    fontSize: 22,
    color: '#6B7280',
  },
  historyLoading: {
    paddingVertical: 34,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  historyLoadingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyHistory: {
    paddingVertical: 36,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  emptyHistoryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  emptyHistoryDescription: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    color: '#6B7280',
  },
  historyList: {
    width: '100%',
  },
  historyItem: {
    marginBottom: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  historyItemSelected: {
    borderColor: '#25824A',
    backgroundColor: '#EEF1F8',
  },
  historyItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyType: {
    fontSize: 10,
    fontWeight: '800',
    color: '#25824A',
  },
  favoriteMark: {
    fontSize: 12,
    color: '#EAB308',
  },
  historyItemTitle: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  historyItemMeta: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: '#6B7280',
  },
  historyDate: {
    marginTop: 7,
    fontSize: 10,
    color: '#9CA3AF',
  },
});
