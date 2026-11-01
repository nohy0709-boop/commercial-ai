/** 공식 안내를 검토해 작성한 안내 데이터입니다. 자동 갱신되지는 않습니다. */
export const PERMIT_REVIEWED_AT = '2026-11-01';
export type BusinessPermitInput = {
  businessName?: string;
  lclsCode?: string;
  mclsCode?: string;
  sclsCode?: string;
};
export type PermitSource = { title: string; url: string };
export type PermitStep = {
  id: string;
  title: string;
  type: '신고' | '등록' | '지정' | '확인';
  condition: string;
  agency: string;
  method: string;
  preparations: string[];
  source: PermitSource;
};
export type BusinessPermitGuide = {
  kind: 'restaurant' | 'coffee' | 'retail';
  title: string;
  summary: string;
  steps: PermitStep[];
  notes: string[];
  reviewedAt: string;
};
const SOURCES = {
  food: { title: '정부24 · 식품관련영업신고', url: 'https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=14600000021' },
  coffee: { title: '생활법령정보 · 커피전문점 영업신고', url: 'https://www.easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=3&cciNo=2&cnpClsNo=1&csmSeq=706' },
  kinds: { title: '국가법령정보센터 · 식품위생법 시행령 제21조', url: 'https://www.law.go.kr/법령/식품위생법시행령/제21조' },
  size: { title: '국가법령정보센터 · 식품위생법 시행규칙 제39조', url: 'https://www.law.go.kr/법령/식품위생법시행규칙/제39조' },
  tobacco: { title: '정부24 · 담배소매인 지정신청', url: 'https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=11900000008' },
  health: { title: '정부24 · 건강기능식품 영업신고', url: 'https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=14700000484' },
  medicine: { title: '정부24 · 안전상비의약품 판매자 등록', url: 'https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=13520000027' },
  liquor: { title: '정부24 · 주류판매업 면허신청', url: 'https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=12100000262' },
};
const NOTES = [
  '업종명만으로 최종 인허가를 확정하지 않아요. 실제 메뉴·판매 품목·영업장 시설에 따라 적용 절차가 달라질 수 있어요.',
  '임대 계약 전에 건축물 용도와 해당 장소의 영업 가능 여부를 관할기관에 확인해주세요.',
  '아래 준비사항은 주요 항목이며 전체 제출서류 목록은 아니에요. 공식 안내에서 최신 서류·수수료·처리기간을 확인해주세요.',
  '사업자등록은 영업신고·등록·지정과 별도 절차예요.',
];
function foodStep(coffee: boolean): PermitStep {
  return {
    id: 'food', title: coffee ? '휴게음식점 영업신고 검토' : '일반음식점 영업신고 검토', type: '신고',
    condition: coffee ? '커피·음료 등을 조리·판매하고 매장 내 음주를 허용하지 않는 형태를 기준으로 안내해요.' : '음식류를 조리·판매하는 일반적인 음식점 운영 형태를 기준으로 안내해요.',
    agency: '영업장 소재지 관할 식품위생 담당기관',
    method: '정부24 안내에서 온라인·방문·우편 접수 가능 여부 확인',
    preparations: ['영업신고서와 영업시설 준비', '식품위생교육 이수 확인', '건강진단 대상자의 건강진단결과서 확인', '지하수 사용 시 수질검사 서류 확인', '해당 시설은 소방·가스 관련 증명서 확인'],
    source: coffee ? SOURCES.coffee : SOURCES.food,
  };
}
function retailSteps(): PermitStep[] {
  return [
    {
      id: 'retail-food', title: '식품 판매·조리 방식 확인', type: '확인',
      condition: '식품을 판매하거나 매장에서 조리하는 경우',
      agency: '영업장 소재지 관할 식품위생 담당기관', method: '판매 품목·조리 방법·면적을 정해 사전 문의',
      preparations: ['영업장 면적이 300㎡ 이상이면 기타 식품판매업 신고 대상 여부 확인', '직접 조리·제조·소분하는 경우 별도 식품 영업 해당 여부 확인', '컵라면 등에 물만 부어주는 경우와 직접 조리하는 경우를 구분'], source: SOURCES.size,
    },
    {
      id: 'tobacco', title: '담배소매인 지정', type: '지정', condition: '담배를 판매하려는 경우',
      agency: '영업장 소재지 관할 담배소매인 지정 담당기관', method: '정부24에서 신청방법과 관할 접수기관 확인',
      preparations: ['점포 사용 권한 증빙 준비', '사업자등록·건축물 관련 확인사항 점검', '지역의 거리 기준과 지정 가능 여부 사전 확인'], source: SOURCES.tobacco,
    },
    {
      id: 'health', title: '건강기능식품 판매업 신고', type: '신고', condition: '건강기능식품을 판매하려는 경우',
      agency: '영업장 소재지 관할 식품위생 담당기관', method: '정부24에서 온라인·방문·우편 접수 안내 확인',
      preparations: ['취급 제품이 건강기능식품인지 확인', '영업신고서 준비', '영업자 교육과 적용 예외 여부 확인'], source: SOURCES.health,
    },
    {
      id: 'medicine', title: '안전상비의약품 판매자 등록', type: '등록', condition: '안전상비의약품을 판매하려는 경우',
      agency: '영업장 소재지 관할 보건소 등 등록 담당기관', method: '정부24 안내 확인 후 관할기관 방문 신청',
      preparations: ['연중무휴 24시간 운영 등 등록기준 확인', '판매자 교육 수료증 준비', '사업자등록 및 판매차단시스템 등 요건 확인'], source: SOURCES.medicine,
    },
    {
      id: 'liquor', title: '주류 판매 절차 확인', type: '확인', condition: '주류를 판매하려는 경우',
      agency: '영업장 소재지 관할 세무서', method: '판매 방식에 맞는 면허·의제면허 신고 절차 문의',
      preparations: ['판매할 주류와 판매 방식을 정해 문의', '사업자등록과 함께 처리할 수 있는 절차인지 확인'], source: SOURCES.liquor,
    },
  ];
}
/** 코드가 전달되면 코드를 우선합니다. 매핑되지 않은 코드를 업종명으로 덮어쓰지 않습니다. */
export function getBusinessPermitGuide(input: BusinessPermitInput): BusinessPermitGuide | null {
  const name = (input.businessName ?? '').trim();
  const hasCodes = !!(input.lclsCode || input.mclsCode || input.sclsCode);
  let kind: BusinessPermitGuide['kind'] | null = null;
  if (hasCodes) {
    if (input.lclsCode && input.lclsCode !== 'I2' && input.lclsCode !== 'G2') return null;
    if ((!input.lclsCode || input.lclsCode === 'I2') && !input.sclsCode && ['I201', 'I202', 'I203', 'I204'].includes(input.mclsCode ?? '')) kind = 'restaurant';
    if ((!input.lclsCode || input.lclsCode === 'I2') && input.mclsCode === 'I212' && input.sclsCode === 'I21201') kind = 'coffee';
    if ((!input.lclsCode || input.lclsCode === 'G2') && input.mclsCode === 'G204' && input.sclsCode === 'G20405') kind = 'retail';
  } else {
    if (['한식', '중식', '일식', '양식'].includes(name)) kind = 'restaurant';
    if (['커피전문점', '카페'].includes(name)) kind = 'coffee';
    if (name === '편의점') kind = 'retail';
  }
  if (!kind) return null;
  return {
    kind,
    title: `${name || '선택 업종'} 인허가 안내`,
    summary: kind === 'retail'
      ? '판매 품목과 조리 방식에 따라 필요한 신고·등록·지정을 확인하세요.'
      : kind === 'coffee'
        ? '일반적인 커피전문점의 영업신고와 운영 방식별 확인사항이에요.'
        : '일반적인 음식점 운영을 기준으로 영업신고 준비사항을 확인하세요.',
    steps: kind === 'retail' ? retailSteps() : [foodStep(kind === 'coffee'), ...(kind === 'coffee' ? [{
      id: 'coffee-alcohol', title: '주류·제과 등 추가 운영 확인', type: '확인' as const,
      condition: '매장 내 음주를 허용하거나 직접 제과·제빵 등을 하는 경우',
      agency: '영업장 소재지 관할 식품위생 담당기관', method: '메뉴와 운영 방식을 정해 영업 종류 사전 확인',
      preparations: ['휴게음식점은 음주행위가 허용되지 않으므로 운영 방식에 맞는 영업 종류 확인', '제과·제빵 등은 해당 영업 종류와 시설기준 확인'], source: SOURCES.kinds,
    }] : [])],
    notes: [...NOTES], reviewedAt: PERMIT_REVIEWED_AT,
  };
}
/** 화면과 동일한 안내를 AI 요청에 포함합니다. 조건부 항목을 확정 의무로 해석하지 않습니다. */
export function getBusinessPermitContext(input: BusinessPermitInput) {
  const guide = getBusinessPermitGuide(input);
  if (!guide) return { status: 'not-mapped', instruction: '인허가 정보 미매핑. 절차나 영업 가능 여부를 추측하지 마세요.' };
  return {
    status: 'reference-guide', reviewedAt: guide.reviewedAt,
    instruction: '공식 출처를 검토한 안내입니다. 조건은 미확인입니다. 모든 절차가 필수이거나 해당 위치에서 영업 가능하다고 단정하지 마세요. 비용·기간을 추측하지 마세요.',
    businessName: input.businessName, summary: guide.summary,
    steps: guide.steps, notes: guide.notes,
  };
}
