import { COLORS } from '@/constants/colors';

import {
  getStartupNeeds,
  saveStartupNeeds,
} from '@/services/startupNeeds';

import { useRouter } from 'expo-router';

import {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const BUSINESS_TYPES = [
  '카페',
  '한식',
  '분식',
  '베이커리',
  '편의점',
  '미용실',
  '의류',
  '기타',
];

const BUDGET_OPTIONS = [
  '3,000만원 이하',
  '5,000만원 이하',
  '1억원 이하',
  '1억원 이상',
];

const AREA_OPTIONS = [
  '한솔동',
  '새롬동',
  '나성동',
  '도담동',
  '어진동',
  '해밀동',
  '아름동',
  '종촌동',
  '고운동',
  '소담동',
  '반곡동',
  '보람동',
  '대평동',
  '다정동',
];

const PRIORITY_OPTIONS = [
  '유동인구',
  '매출',
  '경쟁도',
  '접근성',
  '생활인구',
];

export default function NeedsSetupScreen() {
  const router = useRouter();

  const [
    businessType,
    setBusinessType,
  ] = useState('');

  const [
    budget,
    setBudget,
  ] = useState('');

  const [
    preferredAreas,
    setPreferredAreas,
  ] = useState<string[]>([]);

  const [
    priorities,
    setPriorities,
  ] = useState<string[]>([]);

  const [
    targetCustomer,
    setTargetCustomer,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    initialLoading,
    setInitialLoading,
  ] = useState(true);

  /**
   * 기존에 저장된 창업 니즈가 있으면
   * 화면에 자동으로 불러오기
   *
   * MY → 수정으로 들어왔을 때
   * 기존 선택값이 그대로 표시됨
   */
  useEffect(() => {
    let mounted = true;

    async function loadExistingNeeds() {
      try {
        const existing =
          await getStartupNeeds();

        if (!mounted) {
          return;
        }

        if (!existing) {
          return;
        }

        setBusinessType(
          existing.businessType,
        );

        setBudget(
          existing.budget,
        );

        setPreferredAreas(
          existing.preferredAreas,
        );

        setPriorities(
          existing.priorities,
        );

        setTargetCustomer(
          existing.targetCustomer,
        );
      } catch (error) {
        console.error(
          '기존 창업 니즈 불러오기 실패:',
          error,
        );
      } finally {
        if (mounted) {
          setInitialLoading(false);
        }
      }
    }

    loadExistingNeeds();

    return () => {
      mounted = false;
    };
  }, []);

  const toggleArea = (
    area: string,
  ) => {
    setPreferredAreas(prev =>
      prev.includes(area)
        ? prev.filter(
            item => item !== area,
          )
        : [...prev, area],
    );
  };

  const togglePriority = (
    priority: string,
  ) => {
    setPriorities(prev => {
      if (
        prev.includes(priority)
      ) {
        return prev.filter(
          item => item !== priority,
        );
      }

      if (prev.length >= 3) {
        Alert.alert(
          '확인',
          '중요 기준은 최대 3개까지 선택할 수 있어요.',
        );

        return prev;
      }

      return [
        ...prev,
        priority,
      ];
    });
  };

  const handleSave = async () => {
    if (!businessType) {
      Alert.alert(
        '확인',
        '희망 업종을 선택해주세요.',
      );

      return;
    }

    if (!budget) {
      Alert.alert(
        '확인',
        '예산을 선택해주세요.',
      );

      return;
    }

    if (
      preferredAreas.length === 0
    ) {
      Alert.alert(
        '확인',
        '선호 지역을 하나 이상 선택해주세요.',
      );

      return;
    }

    if (
      priorities.length === 0
    ) {
      Alert.alert(
        '확인',
        '중요하게 보는 기준을 선택해주세요.',
      );

      return;
    }

    if (
      !targetCustomer.trim()
    ) {
      Alert.alert(
        '확인',
        '주요 고객층을 입력해주세요.',
      );

      return;
    }

    try {
      setLoading(true);

      await saveStartupNeeds({
        businessType,

        budget,

        preferredAreas,

        priorities,

        targetCustomer:
          targetCustomer.trim(),
      });

      /**
       * 저장 완료 후
       * 메인 화면으로 이동
       */
      router.replace('/');
    } catch (error) {
      console.error(
        '창업 니즈 저장 실패:',
        error,
      );

      Alert.alert(
        '오류',
        '창업 니즈를 저장하지 못했습니다.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View
        style={
          styles.fullLoading
        }
      >
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />

        <Text
          style={
            styles.loadingText
          }
        >
          창업 정보를 불러오고 있어요...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={
        styles.container
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      <View
        style={styles.header}
      >
        <Text
          style={styles.eyebrow}
        >
          START-UP
        </Text>

        <Text
          style={styles.title}
        >
          나의 창업 니즈
        </Text>

        <Text
          style={
            styles.description
          }
        >
          분석 결과를 더 나에게 맞게 추천할 수 있도록
          창업 계획을 알려주세요.
        </Text>
      </View>

      <View
        style={styles.section}
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          희망 업종
        </Text>

        <View
          style={
            styles.optionWrap
          }
        >
          {BUSINESS_TYPES.map(
            item => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.option,

                  businessType ===
                    item &&
                    styles.optionSelected,
                ]}
                onPress={() =>
                  setBusinessType(
                    item,
                  )
                }
              >
                <Text
                  style={[
                    styles.optionText,

                    businessType ===
                      item &&
                      styles.optionTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </View>
      </View>

      <View
        style={styles.section}
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          창업 예산
        </Text>

        <View
          style={
            styles.optionWrap
          }
        >
          {BUDGET_OPTIONS.map(
            item => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.option,

                  budget ===
                    item &&
                    styles.optionSelected,
                ]}
                onPress={() =>
                  setBudget(item)
                }
              >
                <Text
                  style={[
                    styles.optionText,

                    budget ===
                      item &&
                      styles.optionTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </View>
      </View>

      <View
        style={styles.section}
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          선호 지역
        </Text>

        <Text
          style={
            styles.sectionDescription
          }
        >
          여러 지역을 선택할 수 있어요.
        </Text>

        <View
          style={
            styles.optionWrap
          }
        >
          {AREA_OPTIONS.map(
            area => {
              const selected =
                preferredAreas.includes(
                  area,
                );

              return (
                <TouchableOpacity
                  key={area}
                  style={[
                    styles.option,

                    selected &&
                      styles.optionSelected,
                  ]}
                  onPress={() =>
                    toggleArea(area)
                  }
                >
                  <Text
                    style={[
                      styles.optionText,

                      selected &&
                        styles.optionTextSelected,
                    ]}
                  >
                    {area}
                  </Text>
                </TouchableOpacity>
              );
            },
          )}
        </View>
      </View>

      <View
        style={styles.section}
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          중요하게 보는 기준
        </Text>

        <Text
          style={
            styles.sectionDescription
          }
        >
          최대 3개를 선택하세요.
          선택한 순서가 우선순위가 됩니다.
        </Text>

        <View
          style={
            styles.optionWrap
          }
        >
          {PRIORITY_OPTIONS.map(
            item => {
              const selected =
                priorities.includes(
                  item,
                );

              const priorityIndex =
                priorities.indexOf(
                  item,
                );

              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.option,

                    selected &&
                      styles.optionSelected,
                  ]}
                  onPress={() =>
                    togglePriority(
                      item,
                    )
                  }
                >
                  <Text
                    style={[
                      styles.optionText,

                      selected &&
                        styles.optionTextSelected,
                    ]}
                  >
                    {selected
                      ? `${priorityIndex + 1}. ${item}`
                      : item}
                  </Text>
                </TouchableOpacity>
              );
            },
          )}
        </View>
      </View>

      <View
        style={styles.section}
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          주요 고객층
        </Text>

        <TextInput
          style={styles.input}
          value={
            targetCustomer
          }
          onChangeText={
            setTargetCustomer
          }
          placeholder="예: 20~30대 직장인"
          placeholderTextColor="#A0A0A0"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.saveButton,

          loading &&
            styles.disabledButton,
        ]}
        activeOpacity={0.8}
        disabled={loading}
        onPress={handleSave}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color="#111111"
          />
        ) : (
          <Text
            style={
              styles.saveButtonText
            }
          >
            설정 완료
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    fullLoading: {
      flex: 1,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.background,
    },

    loadingText: {
      marginTop: 12,

      fontSize: 13,

      color:
        COLORS.textSecondary,
    },

    screen: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    container: {
      width: '100%',

      maxWidth: 700,

      alignSelf: 'center',

      padding: 24,

      paddingVertical: 50,

      paddingBottom: 80,
    },

    header: {
      marginBottom: 30,
    },

    eyebrow: {
      fontSize: 11,

      fontWeight: '900',

      color:
        COLORS.primary,

      letterSpacing: 1.4,

      marginBottom: 8,
    },

    title: {
      fontSize: 30,

      fontWeight: '900',

      color: COLORS.text,
    },

    description: {
      marginTop: 8,

      fontSize: 14,

      lineHeight: 21,

      color:
        COLORS.textSecondary,
    },

    section: {
      marginBottom: 28,
    },

    sectionTitle: {
      fontSize: 16,

      fontWeight: '900',

      color: COLORS.text,

      marginBottom: 6,
    },

    sectionDescription: {
      fontSize: 11,

      color:
        COLORS.textSecondary,

      marginBottom: 12,
    },

    optionWrap: {
      flexDirection: 'row',

      flexWrap: 'wrap',

      gap: 9,

      marginTop: 10,
    },

    option: {
      minHeight: 42,

      paddingHorizontal: 15,

      borderRadius: 999,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        '#FFFFFF',

      alignItems: 'center',

      justifyContent:
        'center',
    },

    optionSelected: {
      borderColor:
        COLORS.primary,

      backgroundColor:
        '#EAF8ED',
    },

    optionText: {
      fontSize: 12,

      fontWeight: '700',

      color:
        COLORS.textSecondary,
    },

    optionTextSelected: {
      color:
        COLORS.primary,

      fontWeight: '900',
    },

    input: {
      marginTop: 10,

      minHeight: 52,

      paddingHorizontal: 15,

      borderRadius: 13,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        '#FFFFFF',

      fontSize: 14,

      color: COLORS.text,
    },

    saveButton: {
      minHeight: 54,

      borderRadius: 15,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.neonLime,

      marginTop: 10,
    },

    disabledButton: {
      opacity: 0.6,
    },

    saveButtonText: {
      fontSize: 14,

      fontWeight: '900',

      color: '#111111',
    },
  });