import { COLORS } from '@/constants/colors';
import { saveUserProfile } from '@/services/userProfile';

import { useRouter } from 'expo-router';
import { useState } from 'react';

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

const STARTUP_STAGES = [
  '아이디어 탐색',
  '업종 결정',
  '지역 탐색',
  '점포 탐색',
  '창업 준비 중',
];

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
  {
    label: '3,000만원 이하',
    min: 0,
    max: 30000000,
  },
  {
    label: '3,000만원 ~ 5,000만원',
    min: 30000000,
    max: 50000000,
  },
  {
    label: '5,000만원 ~ 1억원',
    min: 50000000,
    max: 100000000,
  },
  {
    label: '1억원 이상',
    min: 100000000,
    max: null,
  },
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

const STARTUP_TYPES = [
  '개인 창업',
  '프랜차이즈',
  '아직 미정',
];

const PRIORITY_OPTIONS = [
  '유동인구',
  '소비규모',
  '낮은 경쟁',
  '접근성',
  '생활인구',
];

export default function NeedsSetupScreen() {
  const router = useRouter();

  const [
    startupStage,
    setStartupStage,
  ] = useState('');

  const [
    interestedBusinesses,
    setInterestedBusinesses,
  ] = useState<string[]>([]);

  const [
    selectedBudget,
    setSelectedBudget,
  ] = useState<number | null>(null);

  const [
    preferredAreas,
    setPreferredAreas,
  ] = useState<string[]>([]);

  const [
    startupType,
    setStartupType,
  ] = useState('');

  const [
    priorities,
    setPriorities,
  ] = useState<string[]>([]);

  const [
    targetCustomer,
    setTargetCustomer,
  ] = useState('');

  const [
    hasLocation,
    setHasLocation,
  ] = useState<boolean | null>(null);

  const [
    locationAddress,
    setLocationAddress,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(false);

  const toggleBusiness = (
    business: string,
  ) => {
    setInterestedBusinesses(prev =>
      prev.includes(business)
        ? prev.filter(
            item => item !== business,
          )
        : [...prev, business],
    );
  };

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
      if (prev.includes(priority)) {
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

      return [...prev, priority];
    });
  };

  const validateForm = () => {
    if (!startupStage) {
      Alert.alert(
        '확인',
        '현재 창업 준비 단계를 선택해주세요.',
      );
      return false;
    }

    if (
      interestedBusinesses.length === 0
    ) {
      Alert.alert(
        '확인',
        '관심 업종을 하나 이상 선택해주세요.',
      );
      return false;
    }

    if (selectedBudget === null) {
      Alert.alert(
        '확인',
        '창업 예산을 선택해주세요.',
      );
      return false;
    }

    if (preferredAreas.length === 0) {
      Alert.alert(
        '확인',
        '관심 지역을 하나 이상 선택해주세요.',
      );
      return false;
    }

    if (!startupType) {
      Alert.alert(
        '확인',
        '창업 형태를 선택해주세요.',
      );
      return false;
    }

    if (priorities.length === 0) {
      Alert.alert(
        '확인',
        '중요하게 보는 기준을 하나 이상 선택해주세요.',
      );
      return false;
    }

    if (!targetCustomer.trim()) {
      Alert.alert(
        '확인',
        '주요 고객층을 입력해주세요.',
      );
      return false;
    }

    if (hasLocation === null) {
      Alert.alert(
        '확인',
        '현재 보유한 점포나 장소가 있는지 선택해주세요.',
      );
      return false;
    }

    if (
      hasLocation &&
      !locationAddress.trim()
    ) {
      Alert.alert(
        '확인',
        '보유한 점포 또는 장소의 주소를 입력해주세요.',
      );
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const budget =
      BUDGET_OPTIONS[selectedBudget!];

    try {
      setLoading(true);

      await saveUserProfile({
        startupStage,

        budgetMin: budget.min,
        budgetMax: budget.max,

        interestedBusinesses,
        interestedRegions:
          preferredAreas,

        startupType,

        hasLocation:
          hasLocation === true,

        locationAddress:
          hasLocation
            ? locationAddress.trim()
            : null,

        priorityFactors:
          priorities,

        targetCustomer:
          targetCustomer.trim(),
      });

      Alert.alert(
        '설정 완료',
        '나의 창업 정보가 저장되었습니다.',
        [
          {
            text: '확인',
            onPress: () =>
              router.replace('/'),
          },
        ],
      );
    } catch (error: any) {
      console.error(
        '창업 정보 저장 실패:',
        error,
      );

      Alert.alert(
        '저장 실패',
        error?.message ??
          '창업 정보를 저장하지 못했습니다.',
      );
    } finally {
      setLoading(false);
    }
  };

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
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          START-UP
        </Text>

        <Text style={styles.title}>
          나의 창업 정보
        </Text>

        <Text
          style={styles.description}
        >
          나에게 맞는 상권과 업종을 분석할 수 있도록
          현재 창업 계획을 알려주세요.
        </Text>
      </View>

      {/* 창업 준비 단계 */}
      <View style={styles.section}>
        <Text
          style={styles.sectionTitle}
        >
          현재 창업 준비 단계
        </Text>

        <Text
          style={
            styles.sectionDescription
          }
        >
          지금 가장 가까운 단계를 선택해주세요.
        </Text>

        <View
          style={styles.optionWrap}
        >
          {STARTUP_STAGES.map(item => {
            const selected =
              startupStage === item;

            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.option,
                  selected &&
                    styles.optionSelected,
                ]}
                onPress={() =>
                  setStartupStage(item)
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    selected &&
                      styles.optionTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 관심 업종 */}
      <View style={styles.section}>
        <Text
          style={styles.sectionTitle}
        >
          관심 업종
        </Text>

        <Text
          style={
            styles.sectionDescription
          }
        >
          여러 업종을 선택할 수 있어요.
        </Text>

        <View
          style={styles.optionWrap}
        >
          {BUSINESS_TYPES.map(item => {
            const selected =
              interestedBusinesses.includes(
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
                  toggleBusiness(item)
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    selected &&
                      styles.optionTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 예산 */}
      <View style={styles.section}>
        <Text
          style={styles.sectionTitle}
        >
          창업 가용 예산
        </Text>

        <Text
          style={
            styles.sectionDescription
          }
        >
          실제 창업에 사용할 수 있는 예산을 선택해주세요.
        </Text>

        <View
          style={styles.optionWrap}
        >
          {BUDGET_OPTIONS.map(
            (item, index) => {
              const selected =
                selectedBudget === index;

              return (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.option,
                    selected &&
                      styles.optionSelected,
                  ]}
                  onPress={() =>
                    setSelectedBudget(
                      index,
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
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            },
          )}
        </View>
      </View>

      {/* 관심 지역 */}
      <View style={styles.section}>
        <Text
          style={styles.sectionTitle}
        >
          관심 지역
        </Text>

        <Text
          style={
            styles.sectionDescription
          }
        >
          관심 있는 세종시 지역을 모두 선택해주세요.
        </Text>

        <View
          style={styles.optionWrap}
        >
          {AREA_OPTIONS.map(area => {
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
          })}
        </View>
      </View>

      {/* 창업 형태 */}
      <View style={styles.section}>
        <Text
          style={styles.sectionTitle}
        >
          생각 중인 창업 형태
        </Text>

        <View
          style={styles.optionWrap}
        >
          {STARTUP_TYPES.map(item => {
            const selected =
              startupType === item;

            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.option,
                  selected &&
                    styles.optionSelected,
                ]}
                onPress={() =>
                  setStartupType(item)
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    selected &&
                      styles.optionTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 중요 기준 */}
      <View style={styles.section}>
        <Text
          style={styles.sectionTitle}
        >
          중요하게 보는 기준
        </Text>

        <Text
          style={
            styles.sectionDescription
          }
        >
          최대 3개를 선택하세요. 선택한 순서가 우선순위가 됩니다.
        </Text>

        <View
          style={styles.optionWrap}
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
                    togglePriority(item)
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

      {/* 주요 고객층 */}
      <View style={styles.section}>
        <Text
          style={styles.sectionTitle}
        >
          예상 주요 고객층
        </Text>

        <Text
          style={
            styles.sectionDescription
          }
        >
          아직 정하지 못했다면 예상하는 고객층을 간단히 적어주세요.
        </Text>

        <TextInput
          style={styles.input}
          value={targetCustomer}
          onChangeText={
            setTargetCustomer
          }
          placeholder="예: 20~30대 직장인"
          placeholderTextColor="#A0A0A0"
        />
      </View>

      {/* 장소 보유 여부 */}
      <View style={styles.section}>
        <Text
          style={styles.sectionTitle}
        >
          현재 보유한 점포나 장소가 있나요?
        </Text>

        <View
          style={styles.optionWrap}
        >
          <TouchableOpacity
            style={[
              styles.option,
              hasLocation === false &&
                styles.optionSelected,
            ]}
            onPress={() => {
              setHasLocation(false);
              setLocationAddress('');
            }}
          >
            <Text
              style={[
                styles.optionText,
                hasLocation === false &&
                  styles.optionTextSelected,
              ]}
            >
              아직 없어요
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.option,
              hasLocation === true &&
                styles.optionSelected,
            ]}
            onPress={() =>
              setHasLocation(true)
            }
          >
            <Text
              style={[
                styles.optionText,
                hasLocation === true &&
                  styles.optionTextSelected,
              ]}
            >
              있어요
            </Text>
          </TouchableOpacity>
        </View>

        {hasLocation === true && (
          <TextInput
            style={[
              styles.input,
              styles.addressInput,
            ]}
            value={locationAddress}
            onChangeText={
              setLocationAddress
            }
            placeholder="보유한 점포 또는 장소의 주소"
            placeholderTextColor="#A0A0A0"
          />
        )}
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

const styles = StyleSheet.create({
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
    color: COLORS.primary,
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
    lineHeight: 17,
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
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
    color: COLORS.primary,
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
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    color: COLORS.text,
  },

  addressInput: {
    marginTop: 16,
  },

  saveButton: {
    minHeight: 54,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
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