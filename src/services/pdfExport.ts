import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export interface AnalysisReportData {
  businessName: string;
  areaName: string;
  rank: number;
  totalCount: number;
  suitabilityScore: number;
  floatingPopulation: number;
  livingPopulation: number;
  storeCount: number;
  competitionDensity: number;
  salesAmount: number;
  averageSalesPerStore: number;
  busStopCount: number;
  livingPopulationChangeRate: number;
  floatingPopulationChangeRate: number;
  isPointAnalysis?: boolean;
  actualDongName?: string;
  radius?: number;
  latitude?: number;
  longitude?: number;
  explanation?: {
    recommendationReason?: string;
    advantages?: string[];
    risks?: string[];
    keyFeatures?: string;
    considerations?: string;
  };
  nearbyStores?: Array<{
    name: string;
    address?: string;
  }>;
  compareItems?: Array<{
    areaName: string;
    rank: number;
    floatingPopulationScore?: number;
    livingPopulationScore?: number;
    floatingPopulationChangeScore?: number;
    livingPopulationChangeScore?: number;
    salesScore?: number;
    averageSalesScore?: number;
    competitionScore?: number;
    accessibilityScore?: number;
  }>;
}

const NAVY = '#202544';
const YELLOW = '#F59E0B';

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const markdownToHtml = (value?: string) =>
  escapeHtml(value)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\r?\n/g, '<br />');

const formatNumber = (value: number) =>
  Number.isFinite(value)
    ? value.toLocaleString('ko-KR')
    : '데이터 없음';

const formatMoney = (value: number) => {
  if (!Number.isFinite(value)) {
    return '데이터 없음';
  }

  if (Math.abs(value) >= 100000000) {
    return `${Number(
      (value / 100000000).toFixed(2),
    ).toLocaleString('ko-KR')}억 원`;
  }

  if (Math.abs(value) >= 10000) {
    return `${Number(
      (value / 10000).toFixed(2),
    ).toLocaleString('ko-KR')}만 원`;
  }

  return `${value.toLocaleString('ko-KR')}원`;
};

const formatDecimal = (value: number, digits = 3) =>
  Number.isFinite(value)
    ? value.toFixed(digits)
    : '데이터 없음';

const formatChange = (value: number) =>
  Number.isFinite(value)
    ? `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
    : '데이터 없음';

const formatScore = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(1)
    : '—';

function buildList(
  items: string[] | undefined,
  kind: 'good' | 'risk',
) {
  if (!items?.length) {
    return '<p class="muted">표시할 내용이 없습니다.</p>';
  }

  return items
    .map(
      item => `
        <div class="${kind}">
          <span class="bullet">${kind === 'good' ? '✓' : '!'}</span>
          <span>${markdownToHtml(item)}</span>
        </div>
      `,
    )
    .join('');
}

function buildHtml(data: AnalysisReportData) {
  const generatedAt = new Date().toLocaleString('ko-KR');

  const scorePercent = Number.isFinite(data.suitabilityScore)
    ? Math.max(0, Math.min(100, data.suitabilityScore))
    : 0;

  const pointInfo = data.isPointAnalysis
    ? `
      <p class="point-info">
        위치 기반 분석${
          data.radius != null
            ? ` · 반경 ${escapeHtml(data.radius)}m`
            : ''
        }
      </p>
    `
    : '';

  const metrics = [
    {
      label: '유동인구',
      description: '지역을 이동하거나 방문하는 인구 규모',
      value: `${formatNumber(data.floatingPopulation)}${
        Number.isFinite(data.floatingPopulation) ? '명' : ''
      }`,
    },
    {
      label: '생활인구',
      description: '지역에서 생활하거나 체류하는 인구 규모',
      value: `${formatNumber(data.livingPopulation)}${
        Number.isFinite(data.livingPopulation) ? '명' : ''
      }`,
    },
    {
      label: '동종 업종 점포 수',
      description: '해당 지역에 위치한 동일 업종 점포 수',
      value: `${formatNumber(data.storeCount)}${
        Number.isFinite(data.storeCount) ? '개' : ''
      }`,
    },
    {
      label: '경쟁 밀도',
      description: '해당 지역의 동종 업종 경쟁 수준',
      value: formatDecimal(data.competitionDensity),
    },
    {
      label: '전체 카드소비',
      description: '해당 지역의 전체 카드소비 규모',
      value: formatMoney(data.salesAmount),
    },
    {
      label: '점포당 카드소비',
      description: '점포 한 곳당 평균 카드소비 규모',
      value: formatMoney(data.averageSalesPerStore),
    },
    {
      label: '버스정류장 수',
      description: '해당 지역의 버스정류장 수',
      value: `${formatNumber(data.busStopCount)}${
        Number.isFinite(data.busStopCount) ? '개' : ''
      }`,
    },
    {
      label: '생활인구 증감률',
      description: '생활인구의 증가 또는 감소 비율',
      value: formatChange(data.livingPopulationChangeRate),
    },
    {
      label: '유동인구 증감률',
      description: '유동인구의 증가 또는 감소 비율',
      value: formatChange(data.floatingPopulationChangeRate),
    },
  ];

  const summaryCards = [
    metrics[0],
    metrics[2],
    metrics[3],
    metrics[5],
  ]
    .map(
      (metric, index) => `
        <div class="summary-card ${index % 2 === 0 ? 'navy' : 'yellow'}">
          <div class="summary-label">
            <span class="dot"></span>
            ${metric.label}
          </div>
          <div class="summary-value">${metric.value}</div>
        </div>
      `,
    )
    .join('');

  const metricRows = metrics
    .map(
      (metric, index) => `
        <div class="metric-item ${index % 2 === 0 ? 'navy' : 'yellow'}">
          <h3>
            <span class="accent"></span>
            ${metric.label}
          </h3>
          <p class="metric-description">${metric.description}</p>
          <div class="metric-value">${metric.value}</div>
        </div>
      `,
    )
    .join('');

  const compareRows = data.compareItems?.length
    ? data.compareItems
        .map(
          item => `
            <tr>
              <td>${escapeHtml(item.areaName)}</td>
              <td class="right">${escapeHtml(item.rank)}위</td>
              <td class="right">${formatScore(item.floatingPopulationScore)}</td>
              <td class="right">${formatScore(item.livingPopulationScore)}</td>
              <td class="right">${formatScore(item.salesScore)}</td>
              <td class="right">${formatScore(item.averageSalesScore)}</td>
              <td class="right">${formatScore(item.competitionScore)}</td>
              <td class="right">${formatScore(item.accessibilityScore)}</td>
            </tr>
          `,
        )
        .join('')
    : `
      <tr>
        <td colspan="8" class="muted">
          함께 분석한 다른 후보 지역이 없습니다.
        </td>
      </tr>
    `;

  const storeRows = data.nearbyStores?.length
    ? data.nearbyStores
        .map(
          store => `
            <tr>
              <td>${escapeHtml(store.name)}</td>
              <td>${escapeHtml(store.address || '-')}</td>
            </tr>
          `,
        )
        .join('')
    : `
      <tr>
        <td colspan="2" class="muted">
          표시할 주변 매장 정보가 없습니다.
        </td>
      </tr>
    `;

  const explanation = data.explanation;

  const emptyText =
    '<span class="muted">표시할 내용이 없습니다.</span>';

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />

<title>${escapeHtml(data.areaName)} ${escapeHtml(data.businessName)} 상권 분석 보고서</title>

<style>
@page {
  size: A4;
  margin: 13mm;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  height: auto;
  overflow: visible;
}

body {
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Apple SD Gothic Neo",
    "Malgun Gothic",
    "Noto Sans KR",
    Arial,
    sans-serif;
  background: #F7F9FE;
  color: #17233B;
  font-size: 11px;
  line-height: 1.6;
  overflow-wrap: anywhere;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.page {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 22px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.brand {
  color: ${NAVY};
  font-size: 21px;
  font-weight: 900;
  margin: 0;
}

.page-subtitle {
  color: #7E8BA3;
  font-size: 11px;
  margin: 3px 0 0;
}

.badge {
  background: #FFF5C2;
  color: ${NAVY};
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 10px;
  font-weight: 800;
}

.cover {
  background: ${NAVY};
  border-radius: 24px;
  padding: 26px;
  color: #FFFFFF;
  margin-bottom: 24px;
}

.eyebrow {
  color: #B5B9CB;
  font-size: 11px;
  margin: 0 0 14px;
}

.cover h1 {
  font-size: 28px;
  line-height: 1.3;
  margin: 0;
  font-weight: 900;
}

.business {
  color: #D5D9E5;
  font-size: 14px;
  margin: 12px 0 0;
}

.point-info {
  color: #D1D5DB;
  margin: 8px 0 0;
  font-size: 11px;
}

.score-row {
  margin-top: 24px;
  display: flex;
  align-items: baseline;
  gap: 7px;
}

.score-label,
.score-total {
  color: #B5B9CB;
  font-size: 11px;
}

.score {
  font-size: 36px;
  font-weight: 900;
  line-height: 1.3;
  color: ${YELLOW};
}

.progress-track {
  margin-top: 14px;
  height: 9px;
  border-radius: 999px;
  background: #394154;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: ${YELLOW};
}

.section-heading {
  font-size: 19px;
  font-weight: 900;
  color: ${NAVY};
  margin: 0 0 12px;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 22px;
}

.summary-card {
  background: #FFFFFF;
  border: 1px solid #E5ECF8;
  border-radius: 16px;
  padding: 17px;
}

.summary-label {
  color: #7E8BA3;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 10px;
}

.dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${NAVY};
  flex-shrink: 0;
}

.summary-value {
  font-size: 18px;
  line-height: 1.4;
  font-weight: 900;
}

.navy .summary-value,
.navy .metric-value {
  color: ${NAVY};
}

.yellow .summary-value,
.yellow .metric-value {
  color: ${YELLOW};
}

.yellow .dot,
.yellow .accent {
  background: ${YELLOW};
}

.section {
  background: #FFFFFF;
  border: 1px solid #E6ECF5;
  border-radius: 22px;
  padding: 20px;
  margin-bottom: 22px;
}

.section h2 {
  color: ${NAVY};
  font-size: 20px;
  line-height: 1.4;
  font-weight: 900;
  margin: 0 0 8px;
}

.section-description {
  color: #7E8BA3;
  font-size: 11px;
  margin: 0 0 15px;
}

.metric-item {
  border-bottom: 1px solid #E9EDF5;
  padding: 17px 0;
}

.metric-item:last-child {
  border-bottom: 0;
}

.metric-item h3 {
  color: ${NAVY};
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 14px;
  margin: 0;
  font-weight: 900;
}

.accent {
  display: inline-block;
  width: 4px;
  height: 17px;
  border-radius: 3px;
  background: ${NAVY};
  flex-shrink: 0;
}

.metric-description {
  color: #7C8798;
  font-size: 10px;
  margin: 6px 0 10px;
}

.metric-value {
  font-size: 17px;
  font-weight: 900;
}

.notice {
  color: #7E8BA3;
  font-size: 10px;
  line-height: 1.7;
  margin: 16px 0 0;
}

.estimate-notice {
  background: #FFFBEB;
  border-radius: 10px;
  padding: 12px;
}

.ai-block {
  margin-top: 16px;
}

.ai-label {
  color: ${NAVY};
  font-size: 12px;
  font-weight: 900;
  margin: 0 0 8px;
}

.ai-summary,
.ai-box {
  padding: 14px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 1.8;
}

.ai-summary {
  background: #FFFBEB;
}

.ai-box {
  background: #F3F6FC;
}

.good,
.risk {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 7px;
  font-size: 12px;
  line-height: 1.8;
}

.good {
  background: #F1FBF3;
}

.risk {
  background: #FFFBEB;
}

.bullet {
  font-weight: 900;
  flex: 0 0 14px;
  color: ${NAVY};
}

.good .bullet {
  color: #278848;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
}

thead {
  display: table-header-group;
}

th {
  background: #F3F6FC;
  color: #7E8BA3;
  text-align: left;
  font-size: 9px;
}

th,
td {
  padding: 9px 6px;
  border-bottom: 1px solid #E9EDF5;
  vertical-align: top;
}

.right {
  text-align: right;
}

.compare-table {
  font-size: 9px;
}

.compare-table th {
  font-size: 8px;
}

.muted {
  color: #7E8BA3;
}

.footer {
  text-align: center;
  padding: 16px 8px 4px;
  font-size: 10px;
  color: #7E8BA3;
}

.footer-title {
  color: ${NAVY};
  font-weight: 900;
  font-size: 17px;
  margin-bottom: 7px;
}

@media print {
  html,
  body,
  .page {
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
  }

  .page {
    max-width: none;
    padding: 0;
  }

  .cover,
  .summary-card,
  .metric-item,
  tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .section,
  .ai-block,
  .ai-summary,
  .ai-box,
  .good,
  .risk {
    break-inside: auto;
    page-break-inside: auto;
  }

  h2,
  h3,
  .ai-label,
  .section-heading {
    break-after: avoid;
    page-break-after: avoid;
  }

  p {
    orphans: 3;
    widows: 3;
  }
}
</style>
</head>

<body>
<main class="page">
  <header class="page-header">
    <div>
      <p class="brand">어디 차리지?</p>
      <p class="page-subtitle">상권 분석 보고서</p>
    </div>
    <span class="badge">저장된 분석 결과</span>
  </header>

  <section class="cover">
    <p class="eyebrow">
      ${escapeHtml(data.rank)}위 · 후보 ${escapeHtml(data.totalCount)}곳 중
    </p>

    <h1>${escapeHtml(data.areaName)} 일대</h1>
    <p class="business">${escapeHtml(data.businessName)}</p>

    ${pointInfo}

    <div class="score-row">
      <span class="score-label">종합 적합도</span>
      <span class="score">${
        Number.isFinite(data.suitabilityScore)
          ? Number(data.suitabilityScore.toFixed(1))
          : '—'
      }</span>
      <span class="score-total">/ 100</span>
    </div>

    <div class="progress-track">
      <div class="progress-fill" style="width: ${scorePercent}%"></div>
    </div>
  </section>

  <h2 class="section-heading">핵심 지표</h2>

  <div class="summary-grid">
    ${summaryCards}
  </div>

  <section class="section">
    <h2>세부 지표 비교</h2>

    <p class="section-description">
      저장된 상권 분석 지표를 항목별로 확인할 수 있어요.
    </p>

    ${metricRows}

    <p class="notice">
      ※ 각 지표는 분석 시점에 저장된 데이터입니다.
      서로 단위가 달라 단순한 수치 비교만으로
      창업 적합성을 판단할 수 없습니다.
    </p>

    ${
      data.isPointAnalysis
        ? `
          <p class="notice estimate-notice">
            위치 기반 분석의 인구·카드소비·접근성 지표는
            행정동 데이터를 반경 내 점포 집중도에 따라
            세분화한 추정값입니다.
          </p>
        `
        : ''
    }
  </section>

  <section class="section">
    <h2>AI 분석 전체 내용</h2>

    <p class="section-description">
      상권 데이터를 바탕으로 분석한 추천 이유와 고려사항입니다.
    </p>

    <div class="ai-block">
      <h3 class="ai-label">추천 이유</h3>
      <div class="ai-summary">
        ${markdownToHtml(explanation?.recommendationReason) || emptyText}
      </div>
    </div>

    <div class="ai-block">
      <h3 class="ai-label">장점</h3>
      ${buildList(explanation?.advantages, 'good')}
    </div>

    <div class="ai-block">
      <h3 class="ai-label">주의할 점</h3>
      ${buildList(explanation?.risks, 'risk')}
    </div>

    <div class="ai-block">
      <h3 class="ai-label">주요 특징</h3>
      <div class="ai-box">
        ${markdownToHtml(explanation?.keyFeatures) || emptyText}
      </div>
    </div>

    <div class="ai-block">
      <h3 class="ai-label">고려사항</h3>
      <div class="ai-box">
        ${markdownToHtml(explanation?.considerations) || emptyText}
      </div>
    </div>
  </section>

  <section class="section">
    <h2>다른 후보와 비교</h2>

    <table class="compare-table">
      <thead>
        <tr>
          <th>지역</th>
          <th class="right">순위</th>
          <th class="right">유동인구</th>
          <th class="right">생활인구</th>
          <th class="right">전체 소비</th>
          <th class="right">점포당 소비</th>
          <th class="right">경쟁</th>
          <th class="right">접근성</th>
        </tr>
      </thead>

      <tbody>
        ${compareRows}
      </tbody>
    </table>
  </section>

  <section class="section">
    <h2>주변 실제 ${escapeHtml(data.businessName)} 매장</h2>

    <table>
      <thead>
        <tr>
          <th>매장명</th>
          <th>주소</th>
        </tr>
      </thead>

      <tbody>
        ${storeRows}
      </tbody>
    </table>
  </section>

  <footer class="footer">
    <div class="footer-title">어디 차리지?</div>
    <div>
      상권 정보는 실제 창업 결정 시 현장 조사와 함께 참고해주세요.
    </div>
    <div>생성일 ${escapeHtml(generatedAt)}</div>
  </footer>
</main>
</body>
</html>
`;
}

function printHtmlOnWeb(html: string) {
  if (typeof window === 'undefined') {
    throw new Error('웹 인쇄 창을 열 수 없습니다.');
  }

  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    throw new Error(
      '브라우저에서 팝업이 차단되었습니다. 주소창 오른쪽의 팝업 차단 아이콘에서 이 사이트의 팝업을 허용한 뒤 다시 시도해주세요.',
    );
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  let printStarted = false;

  const runPrint = async () => {
    if (printStarted) return;
    printStarted = true;

    try {
      await printWindow.document.fonts?.ready;
    } catch {
      // 글꼴 준비 확인이 실패해도 기본 글꼴로 인쇄합니다.
    }

    printWindow.requestAnimationFrame(() => {
      printWindow.requestAnimationFrame(() => {
        if (printWindow.closed) return;

        printWindow.focus();
        printWindow.print();
      });
    });
  };

  if (printWindow.document.readyState === 'complete') {
    void runPrint();
  } else {
    printWindow.addEventListener(
      'load',
      () => void runPrint(),
      { once: true },
    );
  }
}

function requireAIExplanation(data: AnalysisReportData) {
  const explanation = data.explanation;

  const hasText = (value: string | undefined) =>
    typeof value === 'string' && value.trim().length > 0;

  if (
    !explanation ||
    !(
      hasText(explanation.recommendationReason) ||
      explanation.advantages?.some(hasText) ||
      explanation.risks?.some(hasText) ||
      hasText(explanation.keyFeatures) ||
      hasText(explanation.considerations)
    )
  ) {
    throw new Error('AI 분석이 완료된 후 PDF로 저장해주세요.');
  }
}

export async function exportAnalysisReportPdf(
  data: AnalysisReportData,
) {
  requireAIExplanation(data);

  const html = buildHtml(data);

  if (Platform.OS === 'web') {
    printHtmlOnWeb(html);
    return null;
  }

  const { uri } = await Print.printToFileAsync({
    html,
    width: 595,
    height: 842,
  });

  const available = await Sharing.isAvailableAsync();

  if (!available) {
    throw new Error(
      '이 기기에서는 PDF 저장 화면을 열 수 없습니다.',
    );
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle:
      `${data.areaName} ${data.businessName} 분석 보고서 저장`,
  });

  return uri;
}

export async function shareAnalysisReportPdf(
  data: AnalysisReportData,
) {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') {
      throw new Error('웹 공유 기능을 사용할 수 없습니다.');
    }

    const title =
      `${data.areaName} ${data.businessName} 상권 분석`;

    const text =
      `${data.areaName} ${data.businessName} 분석 결과를 확인해보세요.`;

    const url = window.location.href;

    if (navigator.share) {
      await navigator.share({
        title,
        text,
        url,
      });

      return true;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);

      window.alert(
        '분석 결과 링크를 클립보드에 복사했어요.',
      );

      return true;
    }

    throw new Error(
      '이 브라우저에서는 공유 기능을 지원하지 않습니다. 주소창의 링크를 복사해서 공유해주세요.',
    );
  }

  requireAIExplanation(data);

  const html = buildHtml(data);

  const { uri } = await Print.printToFileAsync({
    html,
    width: 595,
    height: 842,
  });

  const available = await Sharing.isAvailableAsync();

  if (!available) {
    throw new Error(
      '이 기기에서는 파일 공유 기능을 사용할 수 없습니다.',
    );
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle:
      `${data.areaName} ${data.businessName} 분석 보고서 공유`,
  });

  return true;
}