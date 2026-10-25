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

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const markdownToHtml = (value?: string) => {
  if (!value) {
    return '';
  }

  return escapeHtml(value)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />');
};

const stripMarkdown = (value?: string) =>
  (value ?? '').replace(/\*\*(.*?)\*\*/g, '$1').trim();

const formatNumber = (value: number) =>
  Number.isFinite(value)
    ? Math.round(value).toLocaleString('ko-KR')
    : '-';

const formatDecimal = (value: number, digits = 2) =>
  Number.isFinite(value) ? value.toFixed(digits) : '-';

const formatChange = (value: number) =>
  Number.isFinite(value)
    ? `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
    : '-';

const formatScore = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(1)
    : '-';

function buildList(items: string[] | undefined, kind: 'good' | 'risk') {
  if (!items?.length) {
    return '<p class="muted">표시할 내용이 없습니다.</p>';
  }

  return items
    .map(
      item => `
        <div class="${kind === 'good' ? 'good' : 'risk'}">
          <span class="bullet">${kind === 'good' ? '✓' : '!'}</span>
          <span>${markdownToHtml(item)}</span>
        </div>
      `,
    )
    .join('');
}

function buildHtml(data: AnalysisReportData) {
  const generatedAt = new Date().toLocaleString('ko-KR');

  const locationTitle = data.isPointAnalysis
    ? `${data.areaName} · 반경 ${data.radius ?? '-'}m`
    : `${data.areaName} 일대`;

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

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<style>
@page {
  size: A4;
  margin: 13mm;
}

@media print {
  html,
  body {
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
  }

  .section,
  .metric,
  .ai-box,
  tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}

* {
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  min-height: 100%;
  margin: 0;
  padding: 0;
  overflow: visible !important;
}

body {
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Apple SD Gothic Neo",
    "Noto Sans KR",
    Arial,
    sans-serif;
  color: #171A18;
  background: #FFFFFF;
  font-size: 11px;
  line-height: 1.55;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.cover {
  padding: 26px;
  margin-bottom: 16px;
  border-radius: 18px;
  background: #111111;
  color: #FFFFFF;
}

.brand {
  margin-bottom: 18px;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.8px;
  color: #B7FF4A;
}

.cover h1 {
  margin: 0 0 6px;
  font-size: 25px;
  line-height: 1.25;
}

.subtitle {
  margin: 0;
  color: #C9CDCA;
}

.score-row {
  margin-top: 18px;
}

.score-label {
  color: #AEB4AF;
}

.score {
  margin-left: 8px;
  font-size: 28px;
  font-weight: 900;
  color: #B7FF4A;
}

.section {
  margin-bottom: 14px;
  padding: 16px;
  border: 1px solid #E3E8E4;
  border-radius: 14px;
}

.section h2 {
  margin: 0 0 10px;
  font-size: 15px;
}

.section h3 {
  margin: 14px 0 7px;
  font-size: 11px;
}

.metric-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.metric {
  padding: 11px;
  border-radius: 10px;
  background: #F6F9F7;
}

.metric-label {
  margin-bottom: 4px;
  color: #717871;
  font-size: 9px;
}

.metric-value {
  font-size: 13px;
  font-weight: 900;
}

table {
  width: 100%;
  border-collapse: collapse;
}

td,
th {
  padding: 7px 6px;
  border-bottom: 1px solid #EDF0ED;
  vertical-align: top;
}

th {
  text-align: left;
  background: #F7F9F7;
  color: #717871;
  font-size: 8px;
}

.detail-table td:first-child {
  width: 48%;
  color: #69706A;
}

.right {
  text-align: right;
}

.ai-summary {
  padding: 12px;
  margin-bottom: 10px;
  border-left: 4px solid #55B86B;
  background: #F5FBF6;
}

.ai-box {
  padding: 10px;
  margin-top: 7px;
  border-radius: 9px;
  background: #F7F9F7;
}

.good,
.risk {
  display: flex;
  gap: 7px;
  padding: 8px 9px;
  margin-bottom: 6px;
  border-radius: 9px;
}

.good {
  background: #F0FBF3;
  color: #1D5132;
}

.risk {
  background: #FFF8E8;
  color: #7A4C06;
}

.bullet {
  width: 14px;
  flex: 0 0 14px;
  font-weight: 900;
}

.compare-table {
  font-size: 8px;
}

.notice {
  margin-top: 10px;
  padding: 9px;
  border-radius: 8px;
  background: #F7F9F7;
  color: #747B75;
  font-size: 9px;
}

.muted {
  color: #8A918B;
}

.footer {
  padding-top: 10px;
  border-top: 1px solid #E8ECE9;
  text-align: center;
  color: #8A918B;
  font-size: 8px;
}
</style>
</head>
<body>

<section class="cover">
  <div class="brand">어디 차리지? · 상권 분석 보고서</div>

  <h1>${escapeHtml(locationTitle)}</h1>

  <p class="subtitle">
    ${escapeHtml(data.businessName)} · 후보 ${data.totalCount}곳 중 ${data.rank}위
  </p>

  <div class="score-row">
    <span class="score-label">종합 적합도</span>
    <span class="score">${escapeHtml(data.suitabilityScore)}</span>
    <span>/ 100</span>
  </div>
</section>

<section class="section">
  <h2>핵심 지표</h2>

  <div class="metric-grid">
    <div class="metric">
      <div class="metric-label">${data.isPointAnalysis ? '추정 유동인구' : '유동인구'}</div>
      <div class="metric-value">${formatNumber(data.floatingPopulation)}명</div>
    </div>

    <div class="metric">
      <div class="metric-label">${escapeHtml(data.businessName)} 수</div>
      <div class="metric-value">${formatNumber(data.storeCount)}개</div>
    </div>

    <div class="metric">
      <div class="metric-label">경쟁밀도</div>
      <div class="metric-value">${formatDecimal(data.competitionDensity, 3)}</div>
    </div>

    <div class="metric">
      <div class="metric-label">점포당 카드소비</div>
      <div class="metric-value">${formatNumber(data.averageSalesPerStore)}원</div>
    </div>
  </div>
</section>

<section class="section">
  <h2>전체 지표</h2>

  <table class="detail-table">
    <tr>
      <td>후보 순위</td>
      <td class="right">${data.rank}위 / ${data.totalCount}곳</td>
    </tr>
    <tr>
      <td>종합 적합도</td>
      <td class="right">${data.suitabilityScore} / 100</td>
    </tr>
    <tr>
      <td>${data.isPointAnalysis ? '추정 유동인구' : '유동인구'}</td>
      <td class="right">${formatNumber(data.floatingPopulation)}명</td>
    </tr>
    <tr>
      <td>${data.isPointAnalysis ? '추정 생활인구' : '생활인구'}</td>
      <td class="right">${formatNumber(data.livingPopulation)}명</td>
    </tr>
    <tr>
      <td>${escapeHtml(data.businessName)} 수</td>
      <td class="right">${formatNumber(data.storeCount)}개</td>
    </tr>
    <tr>
      <td>경쟁밀도</td>
      <td class="right">${formatDecimal(data.competitionDensity, 3)}</td>
    </tr>
    <tr>
      <td>${data.isPointAnalysis ? '추정 전체 카드소비' : '전체 카드소비'}</td>
      <td class="right">${formatNumber(data.salesAmount)}원</td>
    </tr>
    <tr>
      <td>점포당 카드소비</td>
      <td class="right">${formatNumber(data.averageSalesPerStore)}원</td>
    </tr>
    <tr>
      <td>생활인구 증감률</td>
      <td class="right">${formatChange(data.livingPopulationChangeRate)}</td>
    </tr>
    <tr>
      <td>유동인구 증감률</td>
      <td class="right">${formatChange(data.floatingPopulationChangeRate)}</td>
    </tr>
    <tr>
      <td>${data.isPointAnalysis ? '추정 버스정류장' : '버스정류장'}</td>
      <td class="right">${formatNumber(data.busStopCount)}개</td>
    </tr>
  </table>

  ${
    data.isPointAnalysis
      ? `
        <div class="notice">
          위치 기반 분석의 인구·카드소비·접근성 지표는 행정동 데이터를
          반경 내 점포 집중도에 따라 세분화한 추정값입니다.
        </div>
      `
      : ''
  }
</section>

<section class="section">
  <h2>AI 분석 전체 내용</h2>

  ${
    data.explanation
      ? `
        <h3>추천 이유</h3>
        <div class="ai-summary">
          ${markdownToHtml(data.explanation.recommendationReason)}
        </div>

        <h3>장점</h3>
        ${buildList(data.explanation.advantages, 'good')}

        <h3>주의할 점</h3>
        ${buildList(data.explanation.risks, 'risk')}

        <h3>주요 특징</h3>
        <div class="ai-box">
          ${
            data.explanation.keyFeatures
              ? markdownToHtml(data.explanation.keyFeatures)
              : '<span class="muted">표시할 내용이 없습니다.</span>'
          }
        </div>

        <h3>고려사항</h3>
        <div class="ai-box">
          ${
            data.explanation.considerations
              ? markdownToHtml(data.explanation.considerations)
              : '<span class="muted">표시할 내용이 없습니다.</span>'
          }
        </div>
      `
      : `
        <p class="muted">
          PDF 생성 시점에 AI 분석 결과가 아직 준비되지 않았습니다.
        </p>
      `
  }
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

<div class="footer">
  생성일 ${escapeHtml(generatedAt)} · 어디 차리지? 상권 분석 서비스
</div>

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

  const runPrint = () => {
    printWindow.focus();
    printWindow.print();
  };

  if (printWindow.document.readyState === 'complete') {
    setTimeout(runPrint, 250);
  } else {
    printWindow.addEventListener('load', () => {
      setTimeout(runPrint, 250);
    });
  }
}

export async function exportAnalysisReportPdf(
  data: AnalysisReportData,
) {
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
