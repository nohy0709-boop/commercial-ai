import {
    useMemo,
    useState,
} from 'react';

import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import Svg, {
    Circle,
    G,
    Line,
    Polyline,
    Rect,
    Text as SvgText,
} from 'react-native-svg';

import {
    sejongMonthlyMarketData,
} from '@/data/sejongMonthlyMarketData';

/**
 * =====================================================
 * TYPES
 * =====================================================
 */

type CompareItem = {
  areaName: string;
  rank: number;

  competitionScore?:
    | number
    | string;

  accessibilityScore?:
    | number
    | string;

  [key: string]:
    | number
    | string
    | undefined;
};

type MainTab =
  | 'population'
  | 'sales'
  | 'environment';

type PopulationMetric =
  | 'floatingPopulation'
  | 'inflowPopulation';

interface Props {
  compareItems: CompareItem[];

  currentAreaName?: string;

  maxAreas?: number;
}

interface ChartSeries {
  name: string;

  color: string;

  dashed: boolean;

  values: (
    | number
    | null
  )[];
}

/**
 * =====================================================
 * COLORS
 * =====================================================
 */

const CURRENT_COLOR =
  '#16A34A';

const AVERAGE_COLOR =
  '#0EA5E9';

/**
 * =====================================================
 * FORMAT
 * =====================================================
 */

function formatMonth(
  period: string,
) {
  const [, month] =
    period.split('-');

  return `${Number(
    month,
  )}월`;
}

function formatAxisValue(
  value: number,
) {
  return Math.round(
    value,
  ).toLocaleString();
}

function formatTableValue(
  value:
    | number
    | null,
  tab: MainTab,
) {
  if (
    value === null ||
    !Number.isFinite(
      value,
    )
  ) {
    return '-';
  }

  if (
    tab === 'sales'
  ) {
    return `${Math.round(
      value,
    ).toLocaleString()}원`;
  }

  return `${Math.round(
    value,
  ).toLocaleString()}명`;
}

function formatPercent(
  value: number,
) {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return '-';
  }

  return `${
    value > 0
      ? '+'
      : ''
  }${value.toFixed(
    1,
  )}%`;
}

/**
 * y축 보기 좋은 최대값
 */
function getNiceMax(
  value: number,
) {
  if (
    value <= 0
  ) {
    return 100;
  }

  const exponent =
    Math.floor(
      Math.log10(
        value,
      ),
    );

  const magnitude =
    Math.pow(
      10,
      exponent,
    );

  const normalized =
    value /
    magnitude;

  let niceNormalized =
    1;

  if (
    normalized <= 1
  ) {
    niceNormalized =
      1;
  } else if (
    normalized <= 2
  ) {
    niceNormalized =
      2;
  } else if (
    normalized <= 5
  ) {
    niceNormalized =
      5;
  } else {
    niceNormalized =
      10;
  }

  return (
    niceNormalized *
    magnitude
  );
}

/**
 * =====================================================
 * MAIN
 * =====================================================
 */

export default function MonthlyCandidateComparison({
  compareItems,
  currentAreaName,
}: Props) {
  const [
    activeTab,
    setActiveTab,
  ] =
    useState<MainTab>(
      'population',
    );

  const [
    populationMetric,
    setPopulationMetric,
  ] =
    useState<PopulationMetric>(
      'floatingPopulation',
    );

  const [
    tableOpen,
    setTableOpen,
  ] =
    useState(false);

  const [
    chartWidth,
    setChartWidth,
  ] =
    useState(0);

  /**
   * 현재 선택 지역이 없을 경우
   * compareItems 첫 번째 지역 사용
   */
  const selectedAreaName =
    currentAreaName ||
    compareItems[0]
      ?.areaName ||
    '';

  /**
   * 현재 지표 key
   */
  const valueKey =
    activeTab ===
    'sales'
      ? 'cardSales'
      : populationMetric;

  /**
   * 현재 동 데이터
   */
  const selectedRows =
    useMemo(
      () =>
        selectedAreaName
          ? sejongMonthlyMarketData[
              selectedAreaName
            ] ?? []
          : [],
      [
        selectedAreaName,
      ],
    );

  /**
   * 현재 선택 동을 제외한
   * 다른 모든 행정동
   */
  const otherAreaNames =
    useMemo(
      () =>
        Object.keys(
          sejongMonthlyMarketData,
        ).filter(
          areaName =>
            areaName !==
            selectedAreaName,
        ),
      [
        selectedAreaName,
      ],
    );

  /**
   * 선택 동에서 실제 데이터가 존재하는
   * 최근 6개월
   */
  const periods =
    useMemo(
      () => {
        if (
          activeTab ===
          'environment'
        ) {
          return [];
        }

        return selectedRows
          .filter(
            row =>
              row[
                valueKey
              ] !==
              null,
          )
          .map(
            row =>
              row.period,
          )
          .sort()
          .slice(
            -6,
          );
      },
      [
        activeTab,
        selectedRows,
        valueKey,
      ],
    );

  /**
   * 선택 동 월별 값
   */
  const selectedValues =
    useMemo(
      () => {
        const rowMap =
          new Map(
            selectedRows.map(
              row => [
                row.period,
                row,
              ],
            ),
          );

        return periods.map(
          period => {
            const value =
              rowMap.get(
                period,
              )?.[
                valueKey
              ];

            return typeof value ===
              'number'
              ? value
              : null;
          },
        );
      },
      [
        periods,
        selectedRows,
        valueKey,
      ],
    );

  /**
   * 다른 행정동 평균
   *
   * 해당 월에 값이 존재하는
   * 다른 행정동들만 평균 계산
   */
  const averageValues =
    useMemo(
      () =>
        periods.map(
          period => {
            const values:
              number[] = [];

            otherAreaNames.forEach(
              areaName => {
                const rows =
                  sejongMonthlyMarketData[
                    areaName
                  ] ?? [];

                const row =
                  rows.find(
                    item =>
                      item.period ===
                      period,
                  );

                const value =
                  row?.[
                    valueKey
                  ];

                if (
                  typeof value ===
                    'number' &&
                  Number.isFinite(
                    value,
                  )
                ) {
                  values.push(
                    value,
                  );
                }
              },
            );

            if (
              values.length ===
              0
            ) {
              return null;
            }

            const sum =
              values.reduce(
                (
                  total,
                  value,
                ) =>
                  total +
                  value,
                0,
              );

            return (
              sum /
              values.length
            );
          },
        ),
      [
        periods,
        otherAreaNames,
        valueKey,
      ],
    );

  /**
   * 그래프 시리즈
   */
  const series =
    useMemo<
      ChartSeries[]
    >(
      () => [
        {
          name:
            selectedAreaName,

          color:
            CURRENT_COLOR,

          dashed:
            false,

          values:
            selectedValues,
        },

        {
          name:
            '다른 지역 평균',

          color:
            AVERAGE_COLOR,

          dashed:
            true,

          values:
            averageValues,
        },
      ],
      [
        selectedAreaName,
        selectedValues,
        averageValues,
      ],
    );

  /**
   * Y축 최대
   */
  const yMax =
    useMemo(
      () => {
        const values =
          series.flatMap(
            item =>
              item.values.filter(
                (
                  value,
                ): value is number =>
                  typeof value ===
                  'number',
              ),
          );

        if (
          values.length ===
          0
        ) {
          return 100;
        }

        return getNiceMax(
          Math.max(
            ...values,
          ) *
            1.1,
        );
      },
      [
        series,
      ],
    );

  /**
   * 환경 지표
   *
   * 현재 지역 vs 후보 평균
   */
  const environmentRows =
    useMemo(
      () => {
        const selected =
          compareItems.find(
            item =>
              item.areaName ===
              selectedAreaName,
          );

        const others =
          compareItems.filter(
            item =>
              item.areaName !==
              selectedAreaName,
          );

        const averageMetric =
          (
            key:
              | 'competitionScore'
              | 'accessibilityScore',
          ) => {
            const values =
              others
                .map(
                  item =>
                    Number(
                      item[
                        key
                      ] ??
                        0,
                    ),
                )
                .filter(
                  value =>
                    Number.isFinite(
                      value,
                    ),
                );

            if (
              values.length ===
              0
            ) {
              return 0;
            }

            return (
              values.reduce(
                (
                  total,
                  value,
                ) =>
                  total +
                  value,
                0,
              ) /
              values.length
            );
          };

        return [
          {
            label:
              '경쟁 여유도',

            selectedValue:
              Number(
                selected?.competitionScore ??
                  0,
              ),

            averageValue:
              averageMetric(
                'competitionScore',
              ),
          },

          {
            label:
              '교통 접근성',

            selectedValue:
              Number(
                selected?.accessibilityScore ??
                  0,
              ),

            averageValue:
              averageMetric(
                'accessibilityScore',
              ),
          },
        ];
      },
      [
        compareItems,
        selectedAreaName,
      ],
    );

  return (
    <View
      style={
        styles.container
      }
    >
      {/* TITLE */}

      <Text
        style={
          styles.title
        }
      >
        세종시 다른 지역과 비교
      </Text>

      <Text
        style={
          styles.description
        }
      >
        {selectedAreaName}과 선택 지역을 제외한 다른 행정동의 평균을 비교해요.
      </Text>

      {/* MAIN TAB */}

      <View
        style={
          styles.tabBar
        }
      >
        <TabButton
          label="인구 지표"
          active={
            activeTab ===
            'population'
          }
          onPress={() => {
            setActiveTab(
              'population',
            );

            setTableOpen(
              false,
            );
          }}
        />

        <TabButton
          label="소비 지표"
          active={
            activeTab ===
            'sales'
          }
          onPress={() => {
            setActiveTab(
              'sales',
            );

            setTableOpen(
              false,
            );
          }}
        />

        <TabButton
          label="환경 지표"
          active={
            activeTab ===
            'environment'
          }
          onPress={() => {
            setActiveTab(
              'environment',
            );

            setTableOpen(
              false,
            );
          }}
        />
      </View>

      {/* POPULATION SUB TAB */}

      {activeTab ===
        'population' && (
        <View
          style={
            styles.subTabRow
          }
        >
          <TouchableOpacity
            style={[
              styles.subTab,

              populationMetric ===
                'floatingPopulation' &&
                styles.subTabActive,
            ]}
            onPress={() => {
              setPopulationMetric(
                'floatingPopulation',
              );

              setTableOpen(
                false,
              );
            }}
          >
            <Text
              style={[
                styles.subTabText,

                populationMetric ===
                  'floatingPopulation' &&
                  styles.subTabTextActive,
              ]}
            >
              유동인구
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.subTab,

              populationMetric ===
                'inflowPopulation' &&
                styles.subTabActive,
            ]}
            onPress={() => {
              setPopulationMetric(
                'inflowPopulation',
              );

              setTableOpen(
                false,
              );
            }}
          >
            <Text
              style={[
                styles.subTabText,

                populationMetric ===
                  'inflowPopulation' &&
                  styles.subTabTextActive,
              ]}
            >
              유입인구
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* LINE CHART */}

      {activeTab !==
        'environment' &&
        periods.length >
          0 && (
          <>
            <View
              style={
                styles.chartWrap
              }
              onLayout={
                event =>
                  setChartWidth(
                    event.nativeEvent.layout
                      .width,
                  )
              }
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
              >
                <ComparisonLineChart
                  periods={
                    periods
                  }
                  series={
                    series
                  }
                  yMax={
                    yMax
                  }
                  availableWidth={
                    chartWidth
                  }
                  activeTab={
                    activeTab
                  }
                />
              </ScrollView>
            </View>

            {/* LEGEND */}

            <View
              style={
                styles.legendRow
              }
            >
              <View
                style={
                  styles.legendItem
                }
              >
                <View
                  style={[
                    styles.legendLine,
                    {
                      backgroundColor:
                        CURRENT_COLOR,
                    },
                  ]}
                />

                <Text
                  style={
                    styles.legendText
                  }
                >
                  {
                    selectedAreaName
                  }
                </Text>
              </View>

              <View
                style={
                  styles.legendItem
                }
              >
                <View
                  style={
                    styles.dashedLegend
                  }
                >
                  <View
                    style={
                      styles.dash
                    }
                  />

                  <View
                    style={
                      styles.dash
                    }
                  />

                  <View
                    style={
                      styles.dash
                    }
                  />
                </View>

                <Text
                  style={
                    styles.legendText
                  }
                >
                  다른 지역 평균
                </Text>
              </View>
            </View>

            {/* TABLE SWITCH */}

            <TouchableOpacity
              style={
                styles.toggleRow
              }
              activeOpacity={
                0.8
              }
              onPress={() =>
                setTableOpen(
                  value =>
                    !value,
                )
              }
            >
              <View
                style={[
                  styles.switchTrack,

                  tableOpen &&
                    styles.switchTrackActive,
                ]}
              >
                <View
                  style={[
                    styles.switchCircle,

                    tableOpen &&
                      styles.switchCircleActive,
                  ]}
                />
              </View>

              <Text
                style={
                  styles.toggleText
                }
              >
                실제 수치로 보기
              </Text>
            </TouchableOpacity>

            {tableOpen && (
              <ValueTable
                periods={
                  periods
                }
                selectedAreaName={
                  selectedAreaName
                }
                selectedValues={
                  selectedValues
                }
                averageValues={
                  averageValues
                }
                activeTab={
                  activeTab
                }
              />
            )}
          </>
        )}

      {/* ENVIRONMENT */}

      {activeTab ===
        'environment' && (
        <View
          style={
            styles.environmentBox
          }
        >
          {environmentRows.map(
            row => (
              <View
                key={
                  row.label
                }
                style={
                  styles.environmentGroup
                }
              >
                <Text
                  style={
                    styles.environmentTitle
                  }
                >
                  {row.label}
                </Text>

                <EnvironmentRow
                  label={
                    selectedAreaName
                  }
                  value={
                    row.selectedValue
                  }
                  color={
                    CURRENT_COLOR
                  }
                />

                <EnvironmentRow
                  label="다른 지역 평균"
                  value={
                    row.averageValue
                  }
                  color={
                    AVERAGE_COLOR
                  }
                />
              </View>
            ),
          )}
        </View>
      )}

      {/* SOURCE */}

      <View
        style={
          styles.sourceBox
        }
      >
        <Text
          style={
            styles.sourceText
          }
        >
          {activeTab ===
          'sales'
            ? '출처: 세종특별자치시 행정동별 카드소비 현황'
            : activeTab ===
                'population'
              ? populationMetric ===
                'floatingPopulation'
                ? '출처: 세종특별자치시 행정동별 유동인구 현황'
                : '출처: 세종특별자치시 행정동별 유입인구 현황'
              : '환경 지표는 현재 상권 분석 결과를 기준으로 비교합니다.'}
        </Text>
      </View>
    </View>
  );
}

/**
 * =====================================================
 * TAB
 * =====================================================
 */

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.tabButton,

        active &&
          styles.tabButtonActive,
      ]}
      onPress={
        onPress
      }
    >
      <Text
        style={[
          styles.tabText,

          active &&
            styles.tabTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * =====================================================
 * CHART
 * =====================================================
 */

function ComparisonLineChart({
  periods,
  series,
  yMax,
  availableWidth,
  activeTab,
}: {
  periods: string[];
  series: ChartSeries[];
  yMax: number;
  availableWidth: number;
  activeTab: MainTab;
}) {
  const [
    hoverIndex,
    setHoverIndex,
  ] =
    useState<
      number | null
    >(
      null,
    );

  const W =
    Math.max(
      availableWidth,
      760,
    );

  const H = 330;

  const left = 72;
  const right = 24;
  const top = 24;
  const bottom = 50;

  const plotWidth =
    W -
    left -
    right;

  const plotHeight =
    H -
    top -
    bottom;

  const xFor = (
    index: number,
  ) =>
    left +
    (index /
      Math.max(
        periods.length -
          1,
        1,
      )) *
      plotWidth;

  const yFor = (
    value: number,
  ) =>
    top +
    plotHeight -
    (value /
      Math.max(
        yMax,
        1,
      )) *
      plotHeight;

  const yTicks =
    Array.from(
      {
        length: 5,
      },
      (_, index) =>
        (yMax / 4) *
        index,
    );

  const tooltipWidth =
    210;

  const tooltipHeight =
    106;

  const tooltipX =
    hoverIndex === null
      ? 0
      : Math.min(
          xFor(
            hoverIndex,
          ) + 14,
          W -
            tooltipWidth -
            8,
        );

  const tooltipY = 15;

  const selectedValue =
    hoverIndex !== null
      ? series[0].values[
          hoverIndex
        ]
      : null;

  const averageValue =
    hoverIndex !== null
      ? series[1].values[
          hoverIndex
        ]
      : null;

  const differenceRate =
    selectedValue !==
      null &&
    averageValue !==
      null &&
    averageValue !== 0
      ? ((selectedValue -
          averageValue) /
          averageValue) *
        100
      : null;

  return (
    <Svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      onMouseLeave={() =>
        setHoverIndex(
          null,
        )
      }
    >
      {/* GRID */}

      {yTicks.map(
        (
          tick,
          index,
        ) => (
          <Line
            key={
              index
            }
            x1={left}
            x2={
              W -
              right
            }
            y1={
              yFor(
                tick,
              )
            }
            y2={
              yFor(
                tick,
              )
            }
            stroke="#E5E7EB"
            strokeDasharray="3 4"
          />
        ),
      )}

      {/* Y LABEL */}

      {yTicks.map(
        (
          tick,
          index,
        ) => (
          <SvgText
            key={`y-${index}`}
            x={
              left -
              10
            }
            y={
              yFor(
                tick,
              ) + 4
            }
            textAnchor="end"
            fontSize="10"
            fill="#98A2B3"
          >
            {formatAxisValue(
              tick,
            )}
          </SvgText>
        ),
      )}

      {/* X MONTH */}

      {periods.map(
        (
          period,
          index,
        ) => (
          <SvgText
            key={
              period
            }
            x={
              xFor(
                index,
              )
            }
            y={
              H - 16
            }
            textAnchor="middle"
            fontSize="11"
            fill="#667085"
          >
            {formatMonth(
              period,
            )}
          </SvgText>
        ),
      )}

      {/* LINES */}

      {series.map(
        item => {
          const points =
            item.values
              .map(
                (
                  value,
                  index,
                ) =>
                  value ===
                  null
                    ? null
                    : `${xFor(
                        index,
                      )},${yFor(
                        value,
                      )}`,
              )
              .filter(
                (
                  point,
                ): point is string =>
                  point !==
                  null,
              )
              .join(
                ' ',
              );

          return (
            <Polyline
              key={
                item.name
              }
              points={
                points
              }
              fill="none"
              stroke={
                item.color
              }
              strokeWidth={
                item.dashed
                  ? 2
                  : 2.8
              }
              strokeDasharray={
                item.dashed
                  ? '7 6'
                  : undefined
              }
              strokeLinecap="round"
            />
          );
        },
      )}

      {/* DOTS */}

      {series.flatMap(
        item =>
          item.values.map(
            (
              value,
              index,
            ) =>
              value ===
              null
                ? null
                : (
                  <Circle
                    key={`${item.name}-${index}`}
                    cx={
                      xFor(
                        index,
                      )
                    }
                    cy={
                      yFor(
                        value,
                      )
                    }
                    r={
                      hoverIndex ===
                      index
                        ? 4
                        : 3
                    }
                    fill={
                      item.color
                    }
                    stroke="#FFFFFF"
                    strokeWidth={1}
                  />
                ),
          ),
      )}

      {/* HOVER GUIDE */}

      {hoverIndex !==
        null && (
        <Line
          x1={
            xFor(
              hoverIndex,
            )
          }
          x2={
            xFor(
              hoverIndex,
            )
          }
          y1={top}
          y2={
            top +
            plotHeight
          }
          stroke="#98A2B3"
          strokeDasharray="3 3"
        />
      )}

      {/* TOOLTIP */}

      {hoverIndex !==
        null && (
        <G>
          <Rect
            x={
              tooltipX
            }
            y={
              tooltipY
            }
            width={
              tooltipWidth
            }
            height={
              tooltipHeight
            }
            rx={10}
            fill="#FFFFFF"
            stroke="#D0D5DD"
          />

          <SvgText
            x={
              tooltipX +
              12
            }
            y={
              tooltipY +
              21
            }
            fontSize="12"
            fontWeight="700"
            fill="#344054"
          >
            {formatMonth(
              periods[
                hoverIndex
              ],
            )}
          </SvgText>

          <SvgText
            x={
              tooltipX +
              12
            }
            y={
              tooltipY +
              45
            }
            fontSize="11"
            fill={
              CURRENT_COLOR
            }
          >
            {`${series[0].name}: ${
              selectedValue ===
              null
                ? '-'
                : formatTableValue(
                    selectedValue,
                    activeTab,
                  )
            }`}
          </SvgText>

          <SvgText
            x={
              tooltipX +
              12
            }
            y={
              tooltipY +
              66
            }
            fontSize="11"
            fill={
              AVERAGE_COLOR
            }
          >
            {`다른 지역 평균: ${
              averageValue ===
              null
                ? '-'
                : formatTableValue(
                    averageValue,
                    activeTab,
                  )
            }`}
          </SvgText>

          <SvgText
            x={
              tooltipX +
              12
            }
            y={
              tooltipY +
              89
            }
            fontSize="11"
            fontWeight="700"
            fill={
              differenceRate !==
                null &&
              differenceRate >=
                0
                ? '#16A34A'
                : '#EF4444'
            }
          >
            {differenceRate ===
            null
              ? '평균 대비 -'
              : `평균 대비 ${formatPercent(
                  differenceRate,
                )}`}
          </SvgText>
        </G>
      )}

      {/* HOVER AREAS */}

      {periods.map(
        (
          period,
          index,
        ) => {
          const currentX =
            xFor(
              index,
            );

          const previousX =
            index === 0
              ? left
              : xFor(
                  index -
                    1,
                );

          const nextX =
            index ===
            periods.length -
              1
              ? W -
                right
              : xFor(
                  index +
                    1,
                );

          const areaLeft =
            index === 0
              ? left
              : (previousX +
                  currentX) /
                2;

          const areaRight =
            index ===
            periods.length -
              1
              ? W -
                right
              : (currentX +
                  nextX) /
                2;

          return (
            <Rect
              key={
                period
              }
              x={
                areaLeft
              }
              y={top}
              width={
                areaRight -
                areaLeft
              }
              height={
                plotHeight
              }
              fill="transparent"
              onMouseEnter={() =>
                setHoverIndex(
                  index,
                )
              }
            />
          );
        },
      )}
    </Svg>
  );
}

/**
 * =====================================================
 * TABLE
 * =====================================================
 */

function ValueTable({
  periods,
  selectedAreaName,
  selectedValues,
  averageValues,
  activeTab,
}: {
  periods: string[];

  selectedAreaName: string;

  selectedValues: (
    | number
    | null
  )[];

  averageValues: (
    | number
    | null
  )[];

  activeTab: MainTab;
}) {
  return (
    <View
      style={
        styles.table
      }
    >
      <View
        style={[
          styles.tableRow,
          styles.tableHeader,
        ]}
      >
        <Text
          style={
            styles.monthCell
          }
        >
          기간
        </Text>

        <Text
          style={
            styles.valueCell
          }
        >
          {
            selectedAreaName
          }
        </Text>

        <Text
          style={
            styles.valueCell
          }
        >
          다른 지역 평균
        </Text>
      </View>

      {periods.map(
        (
          period,
          index,
        ) => (
          <View
            key={
              period
            }
            style={
              styles.tableRow
            }
          >
            <Text
              style={
                styles.monthCell
              }
            >
              {formatMonth(
                period,
              )}
            </Text>

            <Text
              style={
                styles.valueCell
              }
            >
              {formatTableValue(
                selectedValues[
                  index
                ],
                activeTab,
              )}
            </Text>

            <Text
              style={
                styles.valueCell
              }
            >
              {formatTableValue(
                averageValues[
                  index
                ],
                activeTab,
              )}
            </Text>
          </View>
        ),
      )}
    </View>
  );
}

/**
 * =====================================================
 * ENVIRONMENT
 * =====================================================
 */

function EnvironmentRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const safeValue =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          value,
        ) || 0,
      ),
    );

  return (
    <View
      style={
        styles.environmentRow
      }
    >
      <Text
        style={
          styles.environmentName
        }
      >
        {label}
      </Text>

      <View
        style={
          styles.environmentTrack
        }
      >
        <View
          style={[
            styles.environmentFill,
            {
              width:
                `${safeValue}%`,

              backgroundColor:
                color,
            },
          ]}
        />
      </View>

      <Text
        style={
          styles.environmentValue
        }
      >
        {Math.round(
          safeValue,
        )}
      </Text>
    </View>
  );
}

/**
 * =====================================================
 * STYLES
 * =====================================================
 */

const styles =
  StyleSheet.create({
    container: {
      width:
        '100%',

      padding: 16,

      borderWidth: 1,

      borderColor:
        '#E2E7E5',

      borderRadius: 18,

      backgroundColor:
        '#FFFFFF',
    },

    title: {
      fontSize: 15,

      fontWeight:
        '900',

      color:
        '#101828',
    },

    description: {
      marginTop: 5,

      marginBottom: 14,

      fontSize: 11,

      color:
        '#667085',
    },

    tabBar: {
      alignSelf:
        'flex-start',

      flexDirection:
        'row',

      padding: 3,

      borderRadius: 13,

      backgroundColor:
        '#F4F6F5',
    },

    tabButton: {
      minHeight: 34,

      paddingHorizontal: 14,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 10,
    },

    tabButtonActive: {
      borderWidth: 1,

      borderColor:
        '#E0E4E2',

      backgroundColor:
        '#FFFFFF',

      boxShadow:
        '0px 1px 4px rgba(16,24,40,0.1)',
    },

    tabText: {
      fontSize: 11,

      fontWeight:
        '700',

      color:
        '#667085',
    },

    tabTextActive: {
      color:
        '#172033',
    },

    subTabRow: {
      flexDirection:
        'row',

      gap: 7,

      marginTop: 12,
    },

    subTab: {
      paddingHorizontal: 11,

      paddingVertical: 6,

      borderRadius: 999,

      backgroundColor:
        '#F2F4F7',
    },

    subTabActive: {
      backgroundColor:
        '#E8F7EB',
    },

    subTabText: {
      fontSize: 10,

      fontWeight:
        '700',

      color:
        '#667085',
    },

    subTabTextActive: {
      color:
        CURRENT_COLOR,
    },

    chartWrap: {
      width:
        '100%',

      marginTop: 14,
    },

    legendRow: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      justifyContent:
        'center',

      gap: 18,

      marginTop: 2,

      marginBottom: 14,
    },

    legendItem: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 7,
    },

    legendLine: {
      width: 24,

      height: 2,
    },

    dashedLegend: {
      width: 28,

      flexDirection:
        'row',

      gap: 3,
    },

    dash: {
      width: 7,

      height: 2,

      backgroundColor:
        AVERAGE_COLOR,
    },

    legendText: {
      fontSize: 10,

      fontWeight:
        '700',

      color:
        '#667085',
    },

    toggleRow: {
      alignSelf:
        'flex-start',

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 7,

      marginBottom: 12,
    },

    switchTrack: {
      width: 31,

      height: 18,

      padding: 2,

      borderRadius: 9,

      backgroundColor:
        '#D0D5DD',
    },

    switchTrackActive: {
      backgroundColor:
        CURRENT_COLOR,
    },

    switchCircle: {
      width: 14,

      height: 14,

      borderRadius: 7,

      backgroundColor:
        '#FFFFFF',
    },

    switchCircleActive: {
      transform: [
        {
          translateX:
            13,
        },
      ],
    },

    toggleText: {
      fontSize: 10,

      color:
        '#667085',
    },

    table: {
      width:
        '100%',

      overflow:
        'hidden',

      borderWidth: 1,

      borderColor:
        '#E5E7EB',

      borderRadius: 12,
    },

    tableRow: {
      minHeight: 40,

      flexDirection:
        'row',

      alignItems:
        'center',

      borderBottomWidth: 1,

      borderBottomColor:
        '#F0F2F1',
    },

    tableHeader: {
      backgroundColor:
        '#F7F9F8',
    },

    monthCell: {
      flex: 0.7,

      paddingHorizontal: 12,

      fontSize: 10,

      color:
        '#475467',
    },

    valueCell: {
      flex: 1,

      paddingHorizontal: 12,

      textAlign:
        'right',

      fontSize: 10,

      color:
        '#344054',
    },

    environmentBox: {
      marginTop: 20,

      gap: 24,
    },

    environmentGroup: {
      gap: 12,
    },

    environmentTitle: {
      fontSize: 11,

      fontWeight:
        '900',

      color:
        '#344054',
    },

    environmentRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 10,
    },

    environmentName: {
      width: 90,

      fontSize: 10,

      color:
        '#667085',
    },

    environmentTrack: {
      flex: 1,

      height: 8,

      overflow:
        'hidden',

      borderRadius: 999,

      backgroundColor:
        '#EEF1F3',
    },

    environmentFill: {
      height:
        '100%',

      borderRadius: 999,
    },

    environmentValue: {
      width: 32,

      textAlign:
        'right',

      fontSize: 10,

      fontWeight:
        '800',

      color:
        '#475467',
    },

    sourceBox: {
      marginTop: 14,

      paddingTop: 10,

      borderTopWidth: 1,

      borderTopColor:
        '#EEF1EF',
    },

    sourceText: {
      fontSize: 9,

      color:
        '#98A2B3',
    },
  });