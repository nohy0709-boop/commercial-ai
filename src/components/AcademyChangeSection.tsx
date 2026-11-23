import { COLORS } from '@/constants/colors';
import {
  TEEN_FLOW_MONTHS,
  getAcademyChangeByArea,
} from '@/data/academyChangeData';
import { getAcademyDemandByArea } from '@/data/academyDemandData';

import { useState } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import Svg, {
  Circle,
  Polyline,
  Text as SvgText,
} from 'react-native-svg';

type Props = {
  /** 분석 대상 지역(행정동) 이름 */
  areaName: string;
};

const CHART_HEIGHT = 120;
const CHART_PADDING_X = 8;
const CHART_PADDING_TOP = 18;
const CHART_PADDING_BOTTOM = 22;

function formatCount(value: number) {
  return Math.round(value).toLocaleString('ko-KR');
}

/** 증감률(%) 문자열. 이전 값이 0이면 계산하지 않습니다. */
function formatChange(before: number, after: number) {
  if (!(before > 0)) {
    return null;
  }

  const rate = (after / before - 1) * 100;
  const rounded = Math.round(rate * 10) / 10;
  const sign = rounded > 0 ? '+' : '';

  return `${sign}${rounded.toFixed(1)}%`;
}

function monthLabel(ym: string) {
  const [year, month] = ym.split('-');

  return `${year.slice(2)}.${month}`;
}

/**
 * 학원 분석: 최근 변화 (참고 정보)
 *
 * 학령인구, 10대 방과후 유동인구, 등록 학원 수가 최근 어떻게 바뀌었는지
 * 보여주기만 합니다. 종합 점수에는 반영하지 않습니다.
 */
export default function AcademyChangeSection({
  areaName,
}: Props) {
  const [chartWidth, setChartWidth] = useState(0);

  const change = getAcademyChangeByArea(areaName);
  const demand = getAcademyDemandByArea(areaName);

  if (!change || !demand) {
    return null;
  }

  const flow = change.teenFlowMonthly;
  const flowMonths = TEEN_FLOW_MONTHS;

  // 같은 달의 1년 전 값과 비교 (마지막 달 = 2026-06, 1년 전 = 2025-06)
  const lastIndex = flow.length - 1;
  const yearAgoIndex = lastIndex - 12;
  const flowLast = flow[lastIndex];
  const flowYearAgo =
    yearAgoIndex >= 0 ? flow[yearAgoIndex] : undefined;

  const flowChange =
    flowYearAgo !== undefined
      ? formatChange(flowYearAgo, flowLast)
      : null;

  const schoolChange = change.boundaryChanged
    ? null
    : formatChange(
        change.schoolAgePopulation2025,
        demand.schoolAgePopulation,
      );

  const academyDiff =
    change.academyCount2026 - change.academyCount2025;
  const academyChange = formatChange(
    change.academyCount2025,
    change.academyCount2026,
  );

  // 꺾은선 그래프 좌표
  const minValue = Math.min(...flow);
  const maxValue = Math.max(...flow);
  const valueRange = maxValue - minValue || 1;
  const innerWidth = Math.max(chartWidth - CHART_PADDING_X * 2, 1);
  const innerHeight =
    CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;

  const points = flow.map((value, index) => ({
    x:
      CHART_PADDING_X +
      (flow.length > 1
        ? (innerWidth * index) / (flow.length - 1)
        : innerWidth / 2),
    y:
      CHART_PADDING_TOP +
      innerHeight -
      ((value - minValue) / valueRange) * innerHeight,
  }));

  const lastPoint = points[points.length - 1];

  return (
    <View style={styles.box}>
      <Text style={styles.title}>최근 변화</Text>

      <Text style={styles.description}>
        참고 정보예요. 종합 점수에는 반영하지 않아요.
      </Text>

      {/* 학령인구 */}
      <View style={styles.row}>
        <View style={styles.rowHeader}>
          <Text style={styles.label}>학령인구 (6~19세)</Text>

          <Text style={styles.value}>
            {schoolChange ?? '비교 불가'}
          </Text>
        </View>

        <Text style={styles.hint}>
          {change.boundaryChanged
            ? `2026년 7월 행정동 경계가 바뀌어 전년과 비교할 수 없어요. (2026년 10월 ${formatCount(demand.schoolAgePopulation)}명)`
            : `${formatCount(change.schoolAgePopulation2025)}명(2025년 10월) → ${formatCount(demand.schoolAgePopulation)}명(2026년 10월)`}
        </Text>
      </View>

      {/* 10대 방과후 유동인구 추이 */}
      <View style={styles.row}>
        <View style={styles.rowHeader}>
          <Text style={styles.label}>10대 방과후 유동인구</Text>

          <Text style={styles.value}>
            {flowChange ?? '-'}
          </Text>
        </View>

        <Text style={styles.hint}>
          {flowYearAgo !== undefined
            ? `${formatCount(flowYearAgo)}명(${monthLabel(flowMonths[yearAgoIndex])}) → ${formatCount(flowLast)}명(${monthLabel(flowMonths[lastIndex])}) · 방과후(15~21시) 시간대 평균`
            : '방과후(15~21시) 시간대 평균'}
        </Text>

        <View
          style={styles.chartBox}
          onLayout={event =>
            setChartWidth(event.nativeEvent.layout.width)
          }
        >
          {chartWidth > 0 && (
            <Svg width={chartWidth} height={CHART_HEIGHT}>
              <Polyline
                points={points
                  .map(point => `${point.x},${point.y}`)
                  .join(' ')}
                fill="none"
                stroke={COLORS.primary}
                strokeWidth={2}
              />

              <Circle
                cx={lastPoint.x}
                cy={lastPoint.y}
                r={4}
                fill={COLORS.primary}
              />

              <SvgText
                x={CHART_PADDING_X}
                y={CHART_HEIGHT - 6}
                fontSize={10}
                fill={COLORS.textSecondary}
              >
                {monthLabel(flowMonths[0])}
              </SvgText>

              <SvgText
                x={chartWidth - CHART_PADDING_X}
                y={CHART_HEIGHT - 6}
                fontSize={10}
                textAnchor="end"
                fill={COLORS.textSecondary}
              >
                {monthLabel(flowMonths[lastIndex])}
              </SvgText>

              <SvgText
                x={CHART_PADDING_X}
                y={11}
                fontSize={10}
                fill={COLORS.textSecondary}
              >
                {`최고 ${formatCount(maxValue)}명 · 최저 ${formatCount(minValue)}명`}
              </SvgText>
            </Svg>
          )}
        </View>

        <Text style={styles.hint}>
          월별 변동이 있어 한두 달 값만으로 판단하지 않는 게 좋아요.
        </Text>
      </View>

      {/* 학원 수 */}
      <View style={[styles.row, styles.rowLast]}>
        <View style={styles.rowHeader}>
          <Text style={styles.label}>등록 학원·교습소 수</Text>

          <Text style={styles.value}>
            {academyChange
              ? `${academyDiff > 0 ? '+' : ''}${academyDiff}곳 (${academyChange})`
              : `${academyDiff > 0 ? '+' : ''}${academyDiff}곳`}
          </Text>
        </View>

        <Text style={styles.hint}>
          {`${change.academyCount2025}곳(2025년 10월) → ${change.academyCount2026}곳(2026년 10월) · 새로 생긴 곳 ${change.academyNew}곳, 목록에서 사라진 곳 ${change.academyGone}곳`}
        </Text>
      </View>

      <Text style={styles.note}>
        학령인구는 행정안전부 주민등록 통계(주소지 기준), 유동인구는 세종시 행정동별 유동인구 현황(2025년 1월~2026년 6월), 학원 수는 교육청 등록 학원·교습소 전체(개원 상태) 기준이에요. 학원 수는 위의 업종별 분류와 기준이 달라 숫자가 다를 수 있고, 사라진 곳에는 폐원 외 사유가 섞여 있을 수 있어요.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
  },

  title: {
    marginBottom: 4,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },

  description: {
    marginBottom: 12,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  row: {
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  rowLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },

  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  label: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },

  value: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },

  hint: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textSecondary,
  },

  chartBox: {
    marginTop: 8,
    width: '100%',
  },

  note: {
    marginTop: 12,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textSecondary,
  },
});
