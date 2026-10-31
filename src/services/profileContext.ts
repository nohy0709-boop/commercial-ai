/**
 * src/services/profileContext.ts
 *
 * "나의 창업 정보"(user_profiles)를 챗봇 / AI 분석 프롬프트에서 쓰기 좋은 형태로 바꿔주는 도우미.
 *
 * 핵심 원칙
 *  - 사용자가 따로 입력하지 않는다. 프롬프트를 만들 때마다 getUserProfile()로 최신 값을 읽어서 쓴다.
 *    (캐시하지 않으므로 사용자가 정보를 수정하면 다음 질문/분석부터 바로 반영된다.)
 *  - 객관적 지표 분석은 그대로 두고, "내 조건에 맞춘 판단"을 추가로 만든다.
 */

/** getUserProfile()이 돌려주는 행(snake_case). 필드가 없을 수 있으니 전부 선택값으로 둔다. */
export type UserProfileRow = {
  startup_stage?: string | null;
  interested_businesses?: string[] | null;
  interested_regions?: string[] | null;
  startup_type?: string | null;
  priority_factors?: string[] | null;
  target_customer?: string | null;
  has_location?: boolean | null;
  location_address?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
};

/** 원 단위 -> "1억 5,000만원" */
export function formatWon(won: number) {
  const manwon = Math.round(won / 10000);
  const eok = Math.floor(manwon / 10000);
  const rest = manwon % 10000;

  const parts: string[] = [];

  if (eok > 0) {
    parts.push(`${eok.toLocaleString()}억`);
  }

  if (rest > 0) {
    parts.push(`${rest.toLocaleString()}만`);
  }

  return `${parts.length ? parts.join(' ') : '0'}원`;
}

function formatBudgetRange(min?: number | null, max?: number | null) {
  if (typeof min !== 'number') {
    return null;
  }

  // 직접 입력한 예산(min === max)
  if (typeof max === 'number' && min === max) {
    return formatWon(min);
  }

  if (min <= 0 && typeof max === 'number') {
    return `${formatWon(max)} 이하`;
  }

  if (typeof max !== 'number') {
    return `${formatWon(min)} 이상`;
  }

  return `${formatWon(min)} ~ ${formatWon(max)}`;
}

function list(values?: string[] | null) {
  return Array.isArray(values) && values.length > 0 ? values.join(', ') : null;
}

/** 프로필이 사실상 비어 있는지 (온보딩을 건너뛴 경우 등) */
export function hasProfile(profile?: UserProfileRow | null) {
  return !!profile && !!(profile.startup_stage || list(profile.interested_businesses) || list(profile.interested_regions));
}

/**
 * 프롬프트 맨 앞에 붙일 "사용자 창업 정보" 블록.
 * 값이 없는 항목은 생략한다.
 */
export function buildProfileSummary(profile?: UserProfileRow | null) {
  if (!hasProfile(profile)) {
    return '';
  }

  const p = profile as UserProfileRow;

  const priorities = Array.isArray(p.priority_factors)
    ? p.priority_factors.map((item, index) => `${index + 1}순위 ${item}`).join(', ')
    : null;

  const lines: (string | null)[] = [
    p.startup_stage ? `- 창업 준비 단계: ${p.startup_stage}` : null,
    list(p.interested_businesses) ? `- 관심 업종: ${list(p.interested_businesses)}` : null,
    list(p.interested_regions) ? `- 관심 지역: ${list(p.interested_regions)}` : null,
    formatBudgetRange(p.budget_min, p.budget_max)
      ? `- 창업 가용 예산: ${formatBudgetRange(p.budget_min, p.budget_max)}`
      : null,
    p.startup_type ? `- 생각 중인 창업 형태: ${p.startup_type}` : null,
    priorities ? `- 중요하게 보는 기준(우선순위): ${priorities}` : null,
    p.target_customer ? `- 예상 주요 고객층: ${p.target_customer}` : null,
    typeof p.has_location === 'boolean'
      ? p.has_location
        ? `- 보유 점포/장소: 있음${p.location_address ? ` (${p.location_address})` : ''}`
        : '- 보유 점포/장소: 아직 없음'
      : null,
  ];

  return ['[사용자 창업 정보]', ...lines.filter(Boolean)].join('\n');
}

/**
 * 챗봇 시스템 프롬프트에 덧붙일 규칙.
 * 사용자가 따로 말하지 않아도 위 정보를 이미 알고 있는 것처럼 답하게 한다.
 */
export const CHATBOT_PROFILE_RULES = `
위 [사용자 창업 정보]는 사용자가 앱에 미리 입력해 둔 정보다.
- 사용자가 다시 설명하지 않아도 이 정보를 이미 알고 있는 것으로 대화한다.
- 질문과 관련 있을 때만 자연스럽게 반영하고, 정보를 그대로 나열하지 않는다.
- 객관적 상권 지표를 근거로 하되, 사용자의 예산·관심 업종·고객층·우선순위에 맞춰 판단한다.
- 정보가 없는 항목은 추측하지 않는다.
`.trim();

/**
 * AI 분석(강점/위험 요소) 프롬프트에 덧붙일 규칙.
 * 객관적 판단 + 사용자 맞춤형 판단, 두 부분을 모두 만들게 한다.
 * (출력 형식은 기존 분석 응답 구조에 맞게 조정)
 */
export const ANALYSIS_PERSONALIZATION_RULES = `
분석 결과는 아래 두 부분으로 나눠 작성한다.
1) 객관적 지표 판단: 유동 인구, 카드 소비, 경쟁 밀도 등 상권 지표만 근거로 한 강점과 위험 요소.
2) 내 조건 맞춤 판단: [사용자 창업 정보]를 근거로 이 지역이 이 사용자에게 어떤지 판단.
   - 중요하게 보는 기준(우선순위)과 지표를 연결해서 설명한다.
   - 예상 고객층, 관심 업종, 창업 형태와 맞는지 평가한다.
   - 예산이 있으면 예산 관점에서 유의할 점을 말한다. (데이터에 없는 임대료 등은 단정하지 않는다)
   - 근거가 되는 사용자 정보를 짧게 언급한다.
사용자 정보가 없으면 2)는 생략한다.
`.trim();

/**
 * "내 정보에 맞게 분석하기" 버튼용 기본 선택값.
 * 업종/지역을 미리 선택해 두되, 사용자가 다른 값도 추가로 골라 비교할 수 있게 한다.
 */
export function getAnalysisDefaults(profile?: UserProfileRow | null) {
  const businesses = Array.isArray(profile?.interested_businesses) ? profile!.interested_businesses! : [];
  const regions = Array.isArray(profile?.interested_regions) ? profile!.interested_regions! : [];

  return {
    /** 관심 업종이 여러 개면 첫 번째를 기본으로 선택하고, 나머지는 화면에서 바꿀 수 있게 한다. */
    business: businesses[0] ?? null,
    allBusinesses: businesses,
    /** 관심 지역은 전부 미리 선택 (비교 대상으로) */
    regions,
  };
}