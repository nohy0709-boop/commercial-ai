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
    Line,
    Polyline,
    Text as SvgText,
} from 'react-native-svg';

import {
    sejongMonthlyMarketData,
} from '@/data/sejongMonthlyMarketData';

type CompareItem = {
  areaName: string;
  rank: number;
  competitionScore?: number | string;
  accessibilityScore?: number | string;
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

const SERIES_COLORS = [
  '#16A34A',
  '#0EA5E9',
  '#F59E0B',
  '#8B5CF6',
  '#EF4444',
];

function formatMonth(
  period: string,
) {
  const [
    year,
    month,
  ] = period.split('-');

  return `${Number(month)}월`;
}

function formatPeriodRange(
  periods: string[],
) {
  if (
    periods.length === 0
  ) {
    return '';
  }

  const first =
    periods[0];

  const last =
    periods[
      periods.length -
        1
    ];

  const format =
    (
      value: string,
    ) => {
      const [
        y,
        m,
      ] =
        value.split(
          '-',
        );

      return `${y}.${m}`;
    };

  return `${format(
    first,
  )} ~ ${format(
    last,
  )}`;
}

function formatCompact(
  value: number,
) {
  const abs =
    Math.abs(
      value,
    );

  if (
    abs >=
    100000000
  ) {
    return `${(
      value /
      100000000
    ).toFixed(
      value %
          100000000 ===
        0
        ? 0
        : 1,
    )}억`;
  }

  if (
    abs >= 10000
  ) {
    return `${(
      value /
      10000
    ).toFixed(
      value %
          10000 ===
        0
        ? 0
        : 1,
    )}만`;
  }

  return Math.round(
    value,
  ).toLocaleString();
}

function formatCellValue(
  value:
    | number
    | null,
  tab: MainTab,
) {
  if (
    value === null ||
    Number.isNaN(
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

export default function MonthlyCandidateComparison({
  compareItems,
  currentAreaName,
  maxAreas = 5,
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

  /**
   * 현재 후보가 비교 목록에서 잘리지 않도록 구성
   */
  const candidateNames =
    useMemo(
      () => {
        const unique =
          Array.from(
            new Set(
              compareItems
                .map(
                  item =>
                    item.areaName,
                )
                .filter(
                  Boolean,
                ),
            ),
          );

        let selected =
          unique.slice(
            0,
            maxAreas,
          );

        if (
          currentAreaName &&
          unique.includes(
            currentAreaName,
          ) &&
          !selected.includes(
            currentAreaName,
          )
        ) {
          selected = [
            ...selected.slice(
              0,
              Math.max(
                0,
                maxAreas -
                  1,
              ),
            ),
            currentAreaName,
          ];
        }

        return selected.filter(
          name =>
            Boolean(
              sejongMonthlyMarketData[
                name
              ],
            ),
        );
      },
      [
        compareItems,
        currentAreaName,
        maxAreas,
      ],
    );

  /**
   * 현재 탭에서 사용할 월별 key
   */
  const valueKey =
    activeTab ===
    'sales'
      ? 'cardSales'
      : populationMetric;

  /**
   * 모든 후보에 공통으로 존재하는 기간 중
   * 가장 최근 6개월 사용
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

        const periodSets =
          candidateNames.map(
            name => {
              const rows =
                sejongMonthlyMarketData[
                  name
                ] ??
                [];

              return new Set(
                rows
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
                  ),
              );
            },
          );

        if (
          periodSets.length ===
          0
        ) {
          return [];
        }

        let common =
          Array.from(
            periodSets[0],
          );

        periodSets
          .slice(1)
          .forEach(
            set => {
              common =
                common.filter(
                  period =>
                    set.has(
                      period,
                    ),
                );
            },
          );

        return common
          .sort()
          .slice(-6);
      },
      [
        candidateNames,
        activeTab,
        valueKey,
      ],
    );

  const series =
    useMemo(
      () =>
        candidateNames.map(
          (
            areaName,
            index,
          ) => {
            const rows =
              sejongMonthlyMarketData[
                areaName
              ] ??
              [];

            const rowMap =
              new Map(
                rows.map(
                  row => [
                    row.period,
                    row,
                  ],
                ),
              );

            const values =
              periods.map(
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

            return {
              name:
                areaName,

              color:
                SERIES_COLORS[
                  index %
                    SERIES_COLORS.length
                ],

              values,
            };
          },
        ),
      [
        candidateNames,
        periods,
        valueKey,
      ],
    );

  const allNumericValues =
    useMemo(
      () =>
        series.flatMap(
          item =>
            item.values.filter(
              (
                value,
              ): value is number =>
                typeof value ===
                'number',
            ),
        ),
      [
        series,
      ],
    );

  const chartMin =
    allNumericValues.length >
    0
      ? Math.min(
          ...allNumericValues,
        )
      : 0;

  const chartMax =
    allNumericValues.length >
    0
      ? Math.max(
          ...allNumericValues,
        )
      : 1;

  const range =
    Math.max(
      chartMax -
        chartMin,
      1,
    );

  /**
   * y축을 데이터 최소/최대에 딱 붙이지 않고
   * 약간 여유 있게 보여줌
   */
  const yMin =
    Math.max(
      0,
      chartMin -
        range *
          0.12,
    );

  const yMax =
    chartMax +
    range *
      0.12;

  const environmentRows =
    useMemo(
      () => {
        const keys = [
          {
            key:
              'competitionScore',
            label:
              '경쟁 여유도',
          },
          {
            key:
              'accessibilityScore',
            label:
              '교통 접근성',
          },
        ];

        return keys.map(
          metric => ({
            label:
              metric.label,

            values:
              candidateNames.map(
                name => {
                  const item =
                    compareItems.find(
                      compare =>
                        compare.areaName ===
                        name,
                    );

                  const value =
                    Number(
                      item?.[
                        metric.key
                      ] ??
                        0,
                    );

                  return Number.isFinite(
                    value,
                  )
                    ? value
                    : 0;
                },
              ),
          }),
        );
      },
      [
        candidateNames,
        compareItems,
      ],
    );

  const subtitle =
    activeTab ===
    'population'
      ? populationMetric ===
        'floatingPopulation'
        ? '행정동별 월간 일평균 유동인구 추이'
        : '행정동별 월간 유입인구 추이'
      : activeTab ===
          'sales'
        ? '행정동별 월간 카드소비액 추이'
        : '현재 분석 시점의 환경 점수 비교';

  return (
    <View
      style={
        styles.container
      }
    >
      <Text
        style={
          styles.title
        }
      >
        다른 후보와 비교
      </Text>

      <Text
        style={
          styles.description
        }
      >
        같이 분석한 후보 지역들의 실제 월별 흐름을 비교해봤어요.
      </Text>

      <View
        style={
          styles.tabRow
        }
      >
        <TabButton
          label="인구 지표"
          active={
            activeTab ===
            'population'
          }
          onPress={() =>
            setActiveTab(
              'population',
            )
          }
        />

        <TabButton
          label="소비 지표"
          active={
            activeTab ===
            'sales'
          }
          onPress={() =>
            setActiveTab(
              'sales',
            )
          }
        />

        <TabButton
          label="환경 지표"
          active={
            activeTab ===
            'environment'
          }
          onPress={() =>
            setActiveTab(
              'environment',
            )
          }
        />
      </View>

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
            onPress={() =>
              setPopulationMetric(
                'floatingPopulation',
              )
            }
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
            onPress={() =>
              setPopulationMetric(
                'inflowPopulation',
              )
            }
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

      <View
        style={
          styles.chartMetaRow
        }
      >
        <Text
          style={
            styles.chartSubtitle
          }
        >
          {subtitle}
        </Text>

        {periods.length >
          0 && (
          <Text
            style={
              styles.periodText
            }
          >
            {formatPeriodRange(
              periods,
            )}
          </Text>
        )}
      </View>

      <View
        style={
          styles.legendRow
        }
      >
        {candidateNames.map(
          (
            name,
            index,
          ) => (
            <View
              key={
                name
              }
              style={
                styles.legendItem
              }
            >
              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor:
                      SERIES_COLORS[
                        index %
                          SERIES_COLORS.length
                      ],
                  },
                ]}
              />

              <Text
                style={
                  styles.legendText
                }
              >
                {name}
              </Text>
            </View>
          ),
        )}
      </View>

      {activeTab ===
      'environment' ? (
        <EnvironmentChart
          candidateNames={
            candidateNames
          }
          rows={
            environmentRows
          }
        />
      ) : periods.length ===
          0 ||
        series.length ===
          0 ? (
        <View
          style={
            styles.emptyBox
          }
        >
          <Text
            style={
              styles.emptyText
            }
          >
            선택한 후보 지역의 월별 데이터가 부족합니다.
          </Text>
        </View>
      ) : (
        <MonthlyLineChart
          periods={
            periods
          }
          series={
            series
          }
          yMin={
            yMin
          }
          yMax={
            yMax
          }
        />
      )}

      {activeTab !==
        'environment' && (
        <>
          <TouchableOpacity
            style={
              styles.toggleButton
            }
            activeOpacity={
              0.7
            }
            onPress={() =>
              setTableOpen(
                prev =>
                  !prev,
              )
            }
          >
            <Text
              style={
                styles.toggleText
              }
            >
              {tableOpen
                ? '실제 수치 접기 ▲'
                : '실제 수치로 보기 ▼'}
            </Text>
          </TouchableOpacity>

          {tableOpen && (
            <MonthlyValueTable
              periods={
                periods
              }
              series={
                series
              }
              activeTab={
                activeTab
              }
            />
          )}
        </>
      )}

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
              : '환경 지표는 현재 상권 분석 점수 기준입니다.'}
        </Text>

        {activeTab ===
          'population' &&
          populationMetric ===
            'floatingPopulation' && (
            <Text
              style={
                styles.sourceSubText
              }
            >
              유동인구 값은 시간대별 일평균 유동인구를 24시간 합산한 값이며 고유 방문자 수나 월 누적 인구가 아닙니다.
            </Text>
          )}
      </View>
    </View>
  );
}

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
      activeOpacity={
        0.75
      }
      onPress={
        onPress
      }
    >
      <Text
        style={[
          styles.tabButtonText,

          active &&
            styles.tabButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function MonthlyLineChart({
  periods,
  series,
  yMin,
  yMax,
}: {
  periods: string[];
  series: {
    name: string;
    color: string;
    values: (
      | number
      | null
    )[];
  }[];
  yMin: number;
  yMax: number;
}) {
  const W =
    760;

  const H =
    260;

  const padLeft =
    66;

  const padRight =
    18;

  const padTop =
    18;

  const padBottom =
    42;

  const plotW =
    W -
    padLeft -
    padRight;

  const plotH =
    H -
    padTop -
    padBottom;

  const xFor =
    (
      index: number,
    ) =>
      periods.length >
      1
        ? padLeft +
          (
            index /
            (
              periods.length -
              1
            )
          ) *
            plotW
        : padLeft +
          plotW /
            2;

  const yFor =
    (
      value: number,
    ) => {
      const normalized =
        (
          value -
          yMin
        ) /
        Math.max(
          yMax -
            yMin,
          1,
        );

      return (
        padTop +
        plotH -
        normalized *
          plotH
      );
    };

  const ticks =
    Array.from(
      {
        length: 5,
      },
      (
        _,
        index,
      ) =>
        yMin +
        (
          (
            yMax -
            yMin
          ) /
          4
        ) *
          index,
    );

  return (
    <View
      style={
        styles.chartBox
      }
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
      >
        <Svg
          width={
            Math.max(
              W,
              periods.length *
                105,
            )
          }
          height={
            H
          }
          viewBox={`0 0 ${W} ${H}`}
        >
          {ticks.map(
            (
              tick,
              index,
            ) => {
              const y =
                yFor(
                  tick,
                );

              return (
                <Line
                  key={`line-${index}`}
                  x1={
                    padLeft
                  }
                  x2={
                    W -
                    padRight
                  }
                  y1={
                    y
                  }
                  y2={
                    y
                  }
                  stroke="#E5E7EB"
                  strokeWidth={
                    1
                  }
                  strokeDasharray="3 4"
                />
              );
            },
          )}

          {ticks.map(
            (
              tick,
              index,
            ) => {
              const y =
                yFor(
                  tick,
                );

              return (
                <SvgText
                  key={`label-${index}`}
                  x={
                    padLeft -
                    8
                  }
                  y={
                    y +
                    3
                  }
                  fontSize="9"
                  fill="#8A94A3"
                  textAnchor="end"
                >
                  {formatCompact(
                    tick,
                  )}
                </SvgText>
              );
            },
          )}

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
                  H -
                  12
                }
                fontSize="10"
                fill="#6B7280"
                textAnchor="middle"
              >
                {formatMonth(
                  period,
                )}
              </SvgText>
            ),
          )}

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
                      value,
                    ): value is string =>
                      value !==
                      null,
                  )
                  .join(
                    ' ',
                  );

              return points ? (
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
                    2.5
                  }
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ) : null;
            },
          )}

          {series.flatMap(
            item =>
              item.values.map(
                (
                  value,
                  index,
                ) =>
                  value ===
                  null ? null : (
                    <Circle
                      key={`${item.name}-${periods[index]}`}
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
                        3.5
                      }
                      fill={
                        item.color
                      }
                    />
                  ),
              ),
          )}
        </Svg>
      </ScrollView>
    </View>
  );
}

function EnvironmentChart({
  candidateNames,
  rows,
}: {
  candidateNames: string[];
  rows: {
    label: string;
    values: number[];
  }[];
}) {
  return (
    <View
      style={
        styles.environmentBox
      }
    >
      {rows.map(
        row => (
          <View
            key={
              row.label
            }
            style={
              styles.environmentMetric
            }
          >
            <Text
              style={
                styles.environmentLabel
              }
            >
              {row.label}
            </Text>

            {candidateNames.map(
              (
                name,
                index,
              ) => {
                const value =
                  Math.max(
                    0,
                    Math.min(
                      100,
                      row.values[
                        index
                      ] ??
                        0,
                    ),
                  );

                return (
                  <View
                    key={`${row.label}-${name}`}
                    style={
                      styles.environmentRow
                    }
                  >
                    <Text
                      style={
                        styles.environmentName
                      }
                    >
                      {name}
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
                              `${value}%`,
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
                        value,
                      )}
                    </Text>
                  </View>
                );
              },
            )}
          </View>
        ),
      )}
    </View>
  );
}

function MonthlyValueTable({
  periods,
  series,
  activeTab,
}: {
  periods: string[];
  series: {
    name: string;
    values: (
      | number
      | null
    )[];
  }[];
  activeTab: MainTab;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={
        false
      }
      style={
        styles.tableScroll
      }
    >
      <View
        style={
          styles.table
        }
      >
        <View
          style={[
            styles.tableRow,
            styles.tableHeaderRow,
          ]}
        >
          <View
            style={
              styles.periodCell
            }
          >
            <Text
              style={
                styles.tableHeaderText
              }
            >
              기간
            </Text>
          </View>

          {series.map(
            item => (
              <View
                key={
                  item.name
                }
                style={
                  styles.valueCell
                }
              >
                <Text
                  style={
                    styles.tableHeaderText
                  }
                >
                  {
                    item.name
                  }
                </Text>
              </View>
            ),
          )}
        </View>

        {periods.map(
          (
            period,
            periodIndex,
          ) => (
            <View
              key={
                period
              }
              style={
                styles.tableRow
              }
            >
              <View
                style={
                  styles.periodCell
                }
              >
                <Text
                  style={
                    styles.tablePeriodText
                  }
                >
                  {formatMonth(
                    period,
                  )}
                </Text>
              </View>

              {series.map(
                item => (
                  <View
                    key={`${period}-${item.name}`}
                    style={
                      styles.valueCell
                    }
                  >
                    <Text
                      style={
                        styles.tableValueText
                      }
                    >
                      {formatCellValue(
                        item.values[
                          periodIndex
                        ],
                        activeTab,
                      )}
                    </Text>
                  </View>
                ),
              )}
            </View>
          ),
        )}
      </View>
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      width:
        '100%',

      borderWidth: 1,

      borderColor:
        '#E4E7EB',

      borderRadius: 22,

      padding: 22,

      backgroundColor:
        '#FFFFFF',
    },

    title: {
      fontSize: 20,

      fontWeight:
        '900',

      color:
        '#111827',
    },

    description: {
      marginTop: 5,

      fontSize: 13,

      color:
        '#6B7280',
    },

    tabRow: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      gap: 10,

      marginTop: 18,
    },

    tabButton: {
      paddingHorizontal: 18,

      paddingVertical: 11,

      borderWidth: 1,

      borderColor:
        '#E4E7EB',

      borderRadius: 18,

      backgroundColor:
        '#F8FAF9',
    },

    tabButtonActive: {
      borderColor:
        '#47A653',

      backgroundColor:
        '#47A653',
    },

    tabButtonText: {
      fontSize: 13,

      fontWeight:
        '800',

      color:
        '#667085',
    },

    tabButtonTextActive: {
      color:
        '#FFFFFF',
    },

    subTabRow: {
      flexDirection:
        'row',

      gap: 8,

      marginTop: 12,
    },

    subTab: {
      paddingHorizontal: 12,

      paddingVertical: 7,

      borderRadius: 999,

      backgroundColor:
        '#F3F4F6',
    },

    subTabActive: {
      backgroundColor:
        '#E9F7EC',
    },

    subTabText: {
      fontSize: 11,

      fontWeight:
        '700',

      color:
        '#6B7280',
    },

    subTabTextActive: {
      color:
        '#2F8F43',
    },

    chartMetaRow: {
      marginTop: 16,

      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'center',

      gap: 12,
    },

    chartSubtitle: {
      flex: 1,

      fontSize: 12,

      fontWeight:
        '800',

      color:
        '#344054',
    },

    periodText: {
      fontSize: 10,

      color:
        '#98A2B3',
    },

    legendRow: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      gap: 12,

      marginTop: 13,

      marginBottom: 3,
    },

    legendItem: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 5,
    },

    legendDot: {
      width: 9,

      height: 9,

      borderRadius: 5,
    },

    legendText: {
      fontSize: 11,

      fontWeight:
        '700',

      color:
        '#667085',
    },

    chartBox: {
      marginTop: 6,

      overflow:
        'hidden',

      borderRadius: 14,

      backgroundColor:
        '#FFFFFF',
    },

    toggleButton: {
      alignSelf:
        'center',

      marginTop: 5,

      paddingHorizontal: 12,

      paddingVertical: 8,
    },

    toggleText: {
      fontSize: 12,

      fontWeight:
        '800',

      color:
        '#667085',
    },

    tableScroll: {
      marginTop: 6,

      borderWidth: 1,

      borderColor:
        '#E5E7EB',

      borderRadius: 14,
    },

    table: {
      minWidth: 650,
    },

    tableRow: {
      flexDirection:
        'row',

      minHeight: 42,

      alignItems:
        'center',

      borderBottomWidth: 1,

      borderBottomColor:
        '#F0F2F4',
    },

    tableHeaderRow: {
      backgroundColor:
        '#F7F9F8',
    },

    periodCell: {
      width: 90,

      paddingHorizontal: 12,
    },

    valueCell: {
      width: 150,

      paddingHorizontal: 12,

      alignItems:
        'flex-end',
    },

    tableHeaderText: {
      fontSize: 11,

      fontWeight:
        '800',

      color:
        '#667085',
    },

    tablePeriodText: {
      fontSize: 11,

      color:
        '#475467',
    },

    tableValueText: {
      fontSize: 11,

      fontWeight:
        '700',

      color:
        '#344054',
    },

    environmentBox: {
      marginTop: 18,

      gap: 20,
    },

    environmentMetric: {
      gap: 10,
    },

    environmentLabel: {
      fontSize: 12,

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

      gap: 9,
    },

    environmentName: {
      width: 70,

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

      backgroundColor:
        '#47A653',
    },

    environmentValue: {
      width: 28,

      textAlign:
        'right',

      fontSize: 10,

      fontWeight:
        '800',

      color:
        '#475467',
    },

    emptyBox: {
      marginTop: 18,

      minHeight: 130,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 14,

      backgroundColor:
        '#F8FAF9',
    },

    emptyText: {
      fontSize: 11,

      color:
        '#98A2B3',
    },

    sourceBox: {
      marginTop: 12,

      paddingTop: 10,

      borderTopWidth: 1,

      borderTopColor:
        '#F0F2F4',
    },

    sourceText: {
      fontSize: 9,

      color:
        '#98A2B3',
    },

    sourceSubText: {
      marginTop: 4,

      fontSize: 8,

      lineHeight: 12,

      color:
        '#A3AAB4',
    },
  });
