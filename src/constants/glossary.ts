export type GlossaryCategory = '점수 지표' | '변화 추이' | '분석 기본';

export type GlossaryEntry = {
  /** 코드에서 쓰는 고유 키 (영문) */
  key: string;
  /** 화면에 보이는 용어 */
  term: string;
  category: GlossaryCategory;
  /** 한두 줄짜리 쉬운 설명 (팝업에 먼저 보임) */
  short: string;
  /** 이 앱에서는 어떻게 쓰는지 (없으면 생략) */
  appNote?: string;
};

export const GLOSSARY: GlossaryEntry[] = [
  /* ---------- 점수 지표 ---------- */
  {
    key: 'floatingPopulation',
    term: '유동인구',
    category: '점수 지표',
    short: '그 지역을 지나다니는 사람 수예요. 가게 앞을 얼마나 많은 사람이 지나가는지 보여줘요.',
    appNote: '종합 점수에서 비중 18%로 반영돼요.',
  },
  {
    key: 'livingPopulation',
    term: '생활인구',
    category: '점수 지표',
    short: '그 지역에 실제로 머무는 사람 수예요. 사는 사람, 일하는 사람, 방문한 사람이 모두 포함돼요.',
    appNote: '종합 점수에서 비중 9%로 반영돼요.',
  },
  {
    key: 'floatingChange',
    term: '유동인구 증감',
    category: '점수 지표',
    short: '이전과 비교해 지나다니는 사람이 늘었는지 줄었는지 보여줘요. 늘고 있으면 앞으로 기대할 만해요.',
    appNote: '종합 점수에서 비중 9%로 반영돼요.',
  },
  {
    key: 'livingChange',
    term: '생활인구 증감',
    category: '점수 지표',
    short: '이전과 비교해 머무는 사람이 늘었는지 줄었는지 보여줘요.',
    appNote: '종합 점수에서 비중 9%로 반영돼요.',
  },
  {
    key: 'cardPerStore',
    term: '점포당 카드소비',
    category: '점수 지표',
    short: '카드 소비액을 점포 수로 나눈 값이에요. 가게 하나가 가져갈 수 있는 매출 규모를 짐작하는 힌트예요.',
    appNote: '종합 점수에서 비중 18%로 반영돼요.',
  },
  {
    key: 'cardTotal',
    term: '전체 카드소비',
    category: '점수 지표',
    short: '그 지역에서 카드로 쓰인 총금액이에요. 지역 전체에 돈이 얼마나 도는지 보여줘요.',
    appNote: '종합 점수에서 비중 14%로 반영돼요.',
  },
  {
    key: 'competitionDensity',
    term: '경쟁밀도',
    category: '점수 지표',
    short: '같은 업종 가게가 얼마나 몰려 있는지예요. 높을수록 손님을 나눠야 해서 경쟁이 치열해요.',
    appNote: '종합 점수에서 비중 14%로 반영돼요. 경쟁이 적을수록 좋은 점수를 받아요.',
  },
  {
    key: 'accessibility',
    term: '접근성',
    category: '점수 지표',
    short: '사람들이 그 지역에 얼마나 쉽게 올 수 있는지예요. 교통이 편할수록 손님이 오기 쉬워요.',
    appNote: '종합 점수에서 비중 9%로 반영돼요.',
  },

  /* ---------- 변화 추이 ---------- */
  {
    key: 'storeCount',
    term: '점포 수',
    category: '변화 추이',
    short: '그 시점에 그 지역·업종에 있던 가게 수예요.',
  },
  {
    key: 'baseStoreCount',
    term: '기초 점포 수',
    category: '변화 추이',
    short: '선택한 기간이 시작될 때의 점포 수예요. 개업률·폐업률을 계산할 때 기준(분모)이 돼요.',
  },
  {
    key: 'openRate',
    term: '개업률',
    category: '변화 추이',
    short: '기초 점포 수 대비 새로 생긴 가게의 비율이에요. 높으면 새로 뛰어드는 사람이 많은 지역이에요.',
    appNote: '새로 생긴 가게 수 ÷ 기초 점포 수 × 100 으로 계산해요.',
  },
  {
    key: 'closeRate',
    term: '폐업률',
    category: '변화 추이',
    short: '기초 점포 수 대비 사라진 가게의 비율이에요. 높으면 버티기 어려운 지역일 수 있어요.',
    appNote: '사라진 가게 수 ÷ 기초 점포 수 × 100 으로 계산해요.',
  },
  {
    key: 'netChange',
    term: '순증감',
    category: '변화 추이',
    short: '개업한 가게 수에서 폐업한 가게 수를 뺀 값이에요. 플러스면 가게가 늘어난 거예요.',
  },
  {
    key: 'estimate',
    term: '추정치',
    category: '변화 추이',
    short: '공식 신고 통계가 아니라 계산으로 짐작한 값이라는 뜻이에요.',
    appNote:
      '시점이 다른 상가 파일을 비교해서, 새로 보이면 개업, 사라지면 폐업으로 봤어요. 양도나 업종 변경도 개업·폐업으로 잡힐 수 있어서 실제와 조금 다를 수 있어요.',
  },
  {
    key: 'granularity',
    term: '월별·분기별·연도별',
    category: '변화 추이',
    short: '데이터를 어떤 단위로 묶어서 볼지 고르는 거예요. 분기는 3개월, 연도는 12개월이에요.',
    appNote: '가진 데이터 간격이 3개월이면 월별 보기는 선택할 수 없어요.',
  },
  {
    key: 'sampleData',
    term: '샘플 데이터',
    category: '변화 추이',
    short: '화면을 확인하려고 만든 가짜 데이터예요. 실제 상권의 값이 아니에요.',
  },

  /* ---------- 분석 기본 ---------- */
  {
    key: 'adminDong',
    term: '행정동',
    category: '분석 기본',
    short: '주민센터가 관리하는 기준으로 나눈 동네 단위예요. 이 앱은 행정동 단위로 지역을 비교해요.',
  },
  {
    key: 'commercialArea',
    term: '상권',
    category: '분석 기본',
    short: '손님이 모여들어 장사가 이루어지는 상업 지역의 범위예요.',
  },
  {
    key: 'businessType',
    term: '업종',
    category: '분석 기본',
    short: '한식, 카페처럼 어떤 장사를 하는지에 따른 분류예요.',
  },
  {
    key: 'candidateCompare',
    term: '후보 비교',
    category: '분석 기본',
    short: '여러 후보 지역을 같은 기준의 점수로 나란히 놓고 견주는 거예요.',
  },
  {
    key: 'tieRank',
    term: '공동 순위',
    category: '분석 기본',
    short: '점수가 같은 지역은 같은 순위로 표시해요. 예를 들어 공동 2위가 둘이면 다음은 4위예요.',
  },
];

export function findTerm(key: string): GlossaryEntry | undefined {
  return GLOSSARY.find(g => g.key === key);
}