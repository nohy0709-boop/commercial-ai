export const COLORS = {
  background: '#F7F9F7',
  surface: '#FFFFFF',

  primary: '#16A34A',
  // 기존엔 #111111(거의 검정)이었으나, "primary의 진한 버전"이라는 이름 의미에 맞게
  // Figma 새 팔레트의 진한 그린으로 변경. 특정 화면에서 검정 톤이 필요했다면 text 값 사용으로 대체.
  primaryDark: '#15803D',

  // 기존 #A8FF00보다 살짝 어두운 라임 (Figma 새 디자인엔 대응 색 없음 → 기존 값 유지)
  neonLime: '#8FD400',

  lime: '#E6FFE6',

  text: '#111827',
  textSecondary: '#6B7280',

  border: '#E5E7EB',
  lightGray: '#F1F3F5',

  disabled: '#E9ECEF',

  mintBlue: '#E6FFE6',

  // --- 아래부터 Figma 새 디자인에서 추가된 색상 ---

  // primary 계열 보조 배경 (연한 초록 배경의 카드/뱃지 등에 사용)
  primaryLight: '#ECFDF3',
  subtle: '#F0FDF4',

  // AI 설명/추천 텍스트 영역을 일반 데이터와 구분하기 위한 강조색
  ai: '#0EA5E9',
  aiLight: '#F0F9FF',

  // 주의가 필요한 정보(위험요인 등) 표시용
  warning: '#F59E0B',
  warningLight: '#FFFBEB',

  danger: '#EF4444',
  dangerLight: '#FEF2F2',
};