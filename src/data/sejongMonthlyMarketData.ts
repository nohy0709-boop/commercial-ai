/**
 * 세종시 월별 상권 비교용 데이터
 *
 * 원본:
 * - 세종특별자치시_행정동별 유동인구 현황_20260630
 * - 세종특별자치시_행정동별 유입인구 현황_20260630
 * - 세종특별자치시_카드매출_행정동별 카드소비 현황_20251231
 *
 * floatingPopulation:
 *   원본의 시간대별 '총인구'는 성별·연령 12개 항목의 합계 일평균 유동인구 수입니다.
 *   아래 값은 각 월의 24개 시간대 값을 합산한 '일평균 시간대 총합'입니다.
 *   고유 방문자 수나 월 누적 인구가 아닙니다.
 *
 * inflowPopulation:
 *   해당 행정동으로 유입된 거주지 시도별 총인구를 월 단위로 합산한 값입니다.
 *
 * cardSales:
 *   행정동별 카드 사용금액입니다.
 */

export interface SejongMonthlyMarketRow {
  period: string;
  floatingPopulation: number | null;
  inflowPopulation: number | null;
  cardSales: number | null;
  cardSalesShare: number | null;
  cardSalesChangeRate: number | null;
}

export type SejongMonthlyMarketData = Record<
  string,
  SejongMonthlyMarketRow[]
>;

export const sejongMonthlyMarketData: SejongMonthlyMarketData =
{
  "고운동": [
    {
      "period": "2025-01",
      "floatingPopulation": 117172,
      "inflowPopulation": 706703,
      "cardSales": 12001337694,
      "cardSalesShare": 2.52,
      "cardSalesChangeRate": 6.9
    },
    {
      "period": "2025-02",
      "floatingPopulation": 122505,
      "inflowPopulation": 691127,
      "cardSales": 11281344454,
      "cardSalesShare": 2.45,
      "cardSalesChangeRate": 6.5
    },
    {
      "period": "2025-03",
      "floatingPopulation": 119522,
      "inflowPopulation": 780040,
      "cardSales": 12537214086,
      "cardSalesShare": 2.52,
      "cardSalesChangeRate": 9.4
    },
    {
      "period": "2025-04",
      "floatingPopulation": 131068,
      "inflowPopulation": 760656,
      "cardSales": 12022931529,
      "cardSalesShare": 2.29,
      "cardSalesChangeRate": 8.1
    },
    {
      "period": "2025-05",
      "floatingPopulation": 128389,
      "inflowPopulation": 754488,
      "cardSales": 12350972143,
      "cardSalesShare": 2.38,
      "cardSalesChangeRate": 7.0
    },
    {
      "period": "2025-06",
      "floatingPopulation": 130000,
      "inflowPopulation": 697368,
      "cardSales": 12179069462,
      "cardSalesShare": 2.3,
      "cardSalesChangeRate": 7.4
    },
    {
      "period": "2025-07",
      "floatingPopulation": 124115,
      "inflowPopulation": 733457,
      "cardSales": 12569138519,
      "cardSalesShare": 2.32,
      "cardSalesChangeRate": 9.4
    },
    {
      "period": "2025-08",
      "floatingPopulation": 124021,
      "inflowPopulation": 739407,
      "cardSales": 13063592560,
      "cardSalesShare": 2.57,
      "cardSalesChangeRate": 14.9
    },
    {
      "period": "2025-09",
      "floatingPopulation": 125765,
      "inflowPopulation": 716533,
      "cardSales": 12565780864,
      "cardSalesShare": 2.36,
      "cardSalesChangeRate": 9.8
    },
    {
      "period": "2025-10",
      "floatingPopulation": 119421,
      "inflowPopulation": 758712,
      "cardSales": 12989510941,
      "cardSalesShare": 2.63,
      "cardSalesChangeRate": 10.9
    },
    {
      "period": "2025-11",
      "floatingPopulation": 126659,
      "inflowPopulation": 771268,
      "cardSales": 13057849971,
      "cardSalesShare": 2.38,
      "cardSalesChangeRate": 8.6
    },
    {
      "period": "2025-12",
      "floatingPopulation": 120694,
      "inflowPopulation": 758908,
      "cardSales": 14005449634,
      "cardSalesShare": 2.33,
      "cardSalesChangeRate": 7.2
    },
    {
      "period": "2026-01",
      "floatingPopulation": 116240,
      "inflowPopulation": 805779,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-02",
      "floatingPopulation": 112923,
      "inflowPopulation": 805155,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-03",
      "floatingPopulation": 117877,
      "inflowPopulation": 774049,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-04",
      "floatingPopulation": 118560,
      "inflowPopulation": 769326,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-05",
      "floatingPopulation": 120628,
      "inflowPopulation": 793479,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-06",
      "floatingPopulation": 121935,
      "inflowPopulation": 782185,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    }
  ],
  "금남면": [
    {
      "period": "2025-01",
      "floatingPopulation": 48256,
      "inflowPopulation": 371639,
      "cardSales": 10038057264,
      "cardSalesShare": 2.11,
      "cardSalesChangeRate": 20.1
    },
    {
      "period": "2025-02",
      "floatingPopulation": 43510,
      "inflowPopulation": 372804,
      "cardSales": 9143258860,
      "cardSalesShare": 1.98,
      "cardSalesChangeRate": 8.1
    },
    {
      "period": "2025-03",
      "floatingPopulation": 46078,
      "inflowPopulation": 390000,
      "cardSales": 10880788753,
      "cardSalesShare": 2.19,
      "cardSalesChangeRate": 17.7
    },
    {
      "period": "2025-04",
      "floatingPopulation": 47488,
      "inflowPopulation": 396283,
      "cardSales": 10444409556,
      "cardSalesShare": 1.99,
      "cardSalesChangeRate": 12.9
    },
    {
      "period": "2025-05",
      "floatingPopulation": 51649,
      "inflowPopulation": 404887,
      "cardSales": 11514417407,
      "cardSalesShare": 2.22,
      "cardSalesChangeRate": 14.9
    },
    {
      "period": "2025-06",
      "floatingPopulation": 49681,
      "inflowPopulation": 361581,
      "cardSales": 10840734320,
      "cardSalesShare": 2.05,
      "cardSalesChangeRate": 5.9
    },
    {
      "period": "2025-07",
      "floatingPopulation": 46657,
      "inflowPopulation": 386713,
      "cardSales": 10890597986,
      "cardSalesShare": 2.01,
      "cardSalesChangeRate": 8.1
    },
    {
      "period": "2025-08",
      "floatingPopulation": 43924,
      "inflowPopulation": 390747,
      "cardSales": 10942357150,
      "cardSalesShare": 2.15,
      "cardSalesChangeRate": 5.6
    },
    {
      "period": "2025-09",
      "floatingPopulation": 44683,
      "inflowPopulation": 380235,
      "cardSales": 9595064579,
      "cardSalesShare": 1.8,
      "cardSalesChangeRate": -4.1
    },
    {
      "period": "2025-10",
      "floatingPopulation": 43396,
      "inflowPopulation": 404694,
      "cardSales": 9704607539,
      "cardSalesShare": 1.96,
      "cardSalesChangeRate": -6.2
    },
    {
      "period": "2025-11",
      "floatingPopulation": 42815,
      "inflowPopulation": 392330,
      "cardSales": 10011729051,
      "cardSalesShare": 1.83,
      "cardSalesChangeRate": 0.0
    },
    {
      "period": "2025-12",
      "floatingPopulation": 40589,
      "inflowPopulation": 366715,
      "cardSales": 11524661337,
      "cardSalesShare": 1.92,
      "cardSalesChangeRate": 6.3
    },
    {
      "period": "2026-01",
      "floatingPopulation": 38797,
      "inflowPopulation": 386263,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-02",
      "floatingPopulation": 40117,
      "inflowPopulation": 392175,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-03",
      "floatingPopulation": 39541,
      "inflowPopulation": 377546,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-04",
      "floatingPopulation": 40223,
      "inflowPopulation": 390476,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-05",
      "floatingPopulation": 44629,
      "inflowPopulation": 402076,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-06",
      "floatingPopulation": 40471,
      "inflowPopulation": 400643,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    }
  ],
  "나성동": [
    {
      "period": "2025-01",
      "floatingPopulation": 130202,
      "inflowPopulation": 410329,
      "cardSales": 33872005071,
      "cardSalesShare": 7.12,
      "cardSalesChangeRate": 3.8
    },
    {
      "period": "2025-02",
      "floatingPopulation": 143263,
      "inflowPopulation": 397993,
      "cardSales": 32102763466,
      "cardSalesShare": 6.97,
      "cardSalesChangeRate": 7.8
    },
    {
      "period": "2025-03",
      "floatingPopulation": 135925,
      "inflowPopulation": 435243,
      "cardSales": 33966835172,
      "cardSalesShare": 6.83,
      "cardSalesChangeRate": 9.1
    },
    {
      "period": "2025-04",
      "floatingPopulation": 136824,
      "inflowPopulation": 428679,
      "cardSales": 34337635529,
      "cardSalesShare": 6.55,
      "cardSalesChangeRate": 8.5
    },
    {
      "period": "2025-05",
      "floatingPopulation": 138377,
      "inflowPopulation": 427764,
      "cardSales": 36570613793,
      "cardSalesShare": 7.04,
      "cardSalesChangeRate": 9.9
    },
    {
      "period": "2025-06",
      "floatingPopulation": 136513,
      "inflowPopulation": 410996,
      "cardSales": 34647271665,
      "cardSalesShare": 6.54,
      "cardSalesChangeRate": 12.6
    },
    {
      "period": "2025-07",
      "floatingPopulation": 132439,
      "inflowPopulation": 414527,
      "cardSales": 37838402939,
      "cardSalesShare": 6.98,
      "cardSalesChangeRate": 14.1
    },
    {
      "period": "2025-08",
      "floatingPopulation": 126234,
      "inflowPopulation": 423034,
      "cardSales": 37475486781,
      "cardSalesShare": 7.37,
      "cardSalesChangeRate": 18.2
    },
    {
      "period": "2025-09",
      "floatingPopulation": 128917,
      "inflowPopulation": 411498,
      "cardSales": 35559275051,
      "cardSalesShare": 6.67,
      "cardSalesChangeRate": 21.1
    },
    {
      "period": "2025-10",
      "floatingPopulation": 132764,
      "inflowPopulation": 430262,
      "cardSales": 36184356626,
      "cardSalesShare": 7.32,
      "cardSalesChangeRate": 10.4
    },
    {
      "period": "2025-11",
      "floatingPopulation": 129683,
      "inflowPopulation": 422123,
      "cardSales": 35315365067,
      "cardSalesShare": 6.44,
      "cardSalesChangeRate": 2.5
    },
    {
      "period": "2025-12",
      "floatingPopulation": 135612,
      "inflowPopulation": 426502,
      "cardSales": 40169038628,
      "cardSalesShare": 6.68,
      "cardSalesChangeRate": 10.1
    },
    {
      "period": "2026-01",
      "floatingPopulation": 138294,
      "inflowPopulation": 461548,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-02",
      "floatingPopulation": 136628,
      "inflowPopulation": 430242,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-03",
      "floatingPopulation": 139182,
      "inflowPopulation": 436566,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-04",
      "floatingPopulation": 142444,
      "inflowPopulation": 441641,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-05",
      "floatingPopulation": 147878,
      "inflowPopulation": 456157,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-06",
      "floatingPopulation": 143103,
      "inflowPopulation": 442911,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    }
  ],
  "다정동": [
    {
      "period": "2025-01",
      "floatingPopulation": 77025,
      "inflowPopulation": 283206,
      "cardSales": 11108076381,
      "cardSalesShare": 2.34,
      "cardSalesChangeRate": 13.7
    },
    {
      "period": "2025-02",
      "floatingPopulation": 81584,
      "inflowPopulation": 247338,
      "cardSales": 10628017235,
      "cardSalesShare": 2.31,
      "cardSalesChangeRate": 15.3
    },
    {
      "period": "2025-03",
      "floatingPopulation": 79574,
      "inflowPopulation": 316761,
      "cardSales": 11629748254,
      "cardSalesShare": 2.34,
      "cardSalesChangeRate": 16.1
    },
    {
      "period": "2025-04",
      "floatingPopulation": 81732,
      "inflowPopulation": 306320,
      "cardSales": 11251051717,
      "cardSalesShare": 2.15,
      "cardSalesChangeRate": 7.8
    },
    {
      "period": "2025-05",
      "floatingPopulation": 79731,
      "inflowPopulation": 305522,
      "cardSales": 11640262898,
      "cardSalesShare": 2.24,
      "cardSalesChangeRate": 8.3
    },
    {
      "period": "2025-06",
      "floatingPopulation": 81282,
      "inflowPopulation": 289029,
      "cardSales": 11379360394,
      "cardSalesShare": 2.15,
      "cardSalesChangeRate": 13.9
    },
    {
      "period": "2025-07",
      "floatingPopulation": 80521,
      "inflowPopulation": 297833,
      "cardSales": 12530142405,
      "cardSalesShare": 2.31,
      "cardSalesChangeRate": 18.8
    },
    {
      "period": "2025-08",
      "floatingPopulation": 74369,
      "inflowPopulation": 302917,
      "cardSales": 12736699524,
      "cardSalesShare": 2.5,
      "cardSalesChangeRate": 20.8
    },
    {
      "period": "2025-09",
      "floatingPopulation": 75281,
      "inflowPopulation": 285615,
      "cardSales": 11943784968,
      "cardSalesShare": 2.24,
      "cardSalesChangeRate": 19.5
    },
    {
      "period": "2025-10",
      "floatingPopulation": 70363,
      "inflowPopulation": 303539,
      "cardSales": 12102609475,
      "cardSalesShare": 2.45,
      "cardSalesChangeRate": 16.4
    },
    {
      "period": "2025-11",
      "floatingPopulation": 72628,
      "inflowPopulation": 293123,
      "cardSales": 12356178638,
      "cardSalesShare": 2.25,
      "cardSalesChangeRate": 9.9
    },
    {
      "period": "2025-12",
      "floatingPopulation": 72101,
      "inflowPopulation": 301298,
      "cardSales": 13000827936,
      "cardSalesShare": 2.16,
      "cardSalesChangeRate": 5.9
    },
    {
      "period": "2026-01",
      "floatingPopulation": 75183,
      "inflowPopulation": 336304,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-02",
      "floatingPopulation": 73439,
      "inflowPopulation": 326701,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-03",
      "floatingPopulation": 75851,
      "inflowPopulation": 313894,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-04",
      "floatingPopulation": 75373,
      "inflowPopulation": 310575,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-05",
      "floatingPopulation": 76299,
      "inflowPopulation": 321433,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-06",
      "floatingPopulation": 78456,
      "inflowPopulation": 322219,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    }
  ],
  "대평동": [
    {
      "period": "2025-01",
      "floatingPopulation": 53321,
      "inflowPopulation": 259928,
      "cardSales": 7087214951,
      "cardSalesShare": 1.49,
      "cardSalesChangeRate": 7.5
    },
    {
      "period": "2025-02",
      "floatingPopulation": 52289,
      "inflowPopulation": 264583,
      "cardSales": 6621133110,
      "cardSalesShare": 1.44,
      "cardSalesChangeRate": 12.5
    },
    {
      "period": "2025-03",
      "floatingPopulation": 52895,
      "inflowPopulation": 272755,
      "cardSales": 7056178285,
      "cardSalesShare": 1.42,
      "cardSalesChangeRate": 11.2
    },
    {
      "period": "2025-04",
      "floatingPopulation": 51881,
      "inflowPopulation": 259083,
      "cardSales": 7081925155,
      "cardSalesShare": 1.35,
      "cardSalesChangeRate": 15.2
    },
    {
      "period": "2025-05",
      "floatingPopulation": 53169,
      "inflowPopulation": 275930,
      "cardSales": 7337319921,
      "cardSalesShare": 1.41,
      "cardSalesChangeRate": 14.8
    },
    {
      "period": "2025-06",
      "floatingPopulation": 53975,
      "inflowPopulation": 250869,
      "cardSales": 7012307895,
      "cardSalesShare": 1.32,
      "cardSalesChangeRate": 13.3
    },
    {
      "period": "2025-07",
      "floatingPopulation": 50864,
      "inflowPopulation": 262296,
      "cardSales": 7320082295,
      "cardSalesShare": 1.35,
      "cardSalesChangeRate": 20.8
    },
    {
      "period": "2025-08",
      "floatingPopulation": 50841,
      "inflowPopulation": 271458,
      "cardSales": 7560116005,
      "cardSalesShare": 1.49,
      "cardSalesChangeRate": 14.8
    },
    {
      "period": "2025-09",
      "floatingPopulation": 48603,
      "inflowPopulation": 258410,
      "cardSales": 7310780099,
      "cardSalesShare": 1.37,
      "cardSalesChangeRate": 17.9
    },
    {
      "period": "2025-10",
      "floatingPopulation": 48863,
      "inflowPopulation": 277868,
      "cardSales": 6958724062,
      "cardSalesShare": 1.41,
      "cardSalesChangeRate": 8.3
    },
    {
      "period": "2025-11",
      "floatingPopulation": 49275,
      "inflowPopulation": 267174,
      "cardSales": 6940734035,
      "cardSalesShare": 1.27,
      "cardSalesChangeRate": 7.0
    },
    {
      "period": "2025-12",
      "floatingPopulation": 50519,
      "inflowPopulation": 269817,
      "cardSales": 7824668305,
      "cardSalesShare": 1.3,
      "cardSalesChangeRate": 13.6
    },
    {
      "period": "2026-01",
      "floatingPopulation": 50267,
      "inflowPopulation": 290129,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-02",
      "floatingPopulation": 52469,
      "inflowPopulation": 290893,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-03",
      "floatingPopulation": 48200,
      "inflowPopulation": 272840,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-04",
      "floatingPopulation": 47037,
      "inflowPopulation": 267652,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-05",
      "floatingPopulation": 48911,
      "inflowPopulation": 284487,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-06",
      "floatingPopulation": 47678,
      "inflowPopulation": 268693,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    }
  ],
  "도담동": [
    {
      "period": "2025-01",
      "floatingPopulation": 87134,
      "inflowPopulation": 419487,
      "cardSales": 18521698940,
      "cardSalesShare": 3.89,
      "cardSalesChangeRate": 1.1
    },
    {
      "period": "2025-02",
      "floatingPopulation": 90442,
      "inflowPopulation": 393942,
      "cardSales": 17521991351,
      "cardSalesShare": 3.8,
      "cardSalesChangeRate": 0.2
    },
    {
      "period": "2025-03",
      "floatingPopulation": 89141,
      "inflowPopulation": 438360,
      "cardSales": 18810880442,
      "cardSalesShare": 3.78,
      "cardSalesChangeRate": 5.2
    },
    {
      "period": "2025-04",
      "floatingPopulation": 84053,
      "inflowPopulation": 441792,
      "cardSales": 18486665945,
      "cardSalesShare": 3.53,
      "cardSalesChangeRate": -1.9
    },
    {
      "period": "2025-05",
      "floatingPopulation": 80178,
      "inflowPopulation": 430330,
      "cardSales": 18828511785,
      "cardSalesShare": 3.63,
      "cardSalesChangeRate": -0.8
    },
    {
      "period": "2025-06",
      "floatingPopulation": 81400,
      "inflowPopulation": 404864,
      "cardSales": 18642777145,
      "cardSalesShare": 3.52,
      "cardSalesChangeRate": 11.6
    },
    {
      "period": "2025-07",
      "floatingPopulation": 79063,
      "inflowPopulation": 424026,
      "cardSales": 19928512923,
      "cardSalesShare": 3.68,
      "cardSalesChangeRate": 6.2
    },
    {
      "period": "2025-08",
      "floatingPopulation": 76266,
      "inflowPopulation": 426469,
      "cardSales": 19608158074,
      "cardSalesShare": 3.86,
      "cardSalesChangeRate": 12.2
    },
    {
      "period": "2025-09",
      "floatingPopulation": 77642,
      "inflowPopulation": 405858,
      "cardSales": 19309478358,
      "cardSalesShare": 3.62,
      "cardSalesChangeRate": 22.5
    },
    {
      "period": "2025-10",
      "floatingPopulation": 73849,
      "inflowPopulation": 425729,
      "cardSales": 18045799966,
      "cardSalesShare": 3.65,
      "cardSalesChangeRate": 10.5
    },
    {
      "period": "2025-11",
      "floatingPopulation": 77688,
      "inflowPopulation": 432659,
      "cardSales": 19466404187,
      "cardSalesShare": 3.55,
      "cardSalesChangeRate": 14.1
    },
    {
      "period": "2025-12",
      "floatingPopulation": 76441,
      "inflowPopulation": 436352,
      "cardSales": 20695219810,
      "cardSalesShare": 3.44,
      "cardSalesChangeRate": 6.0
    },
    {
      "period": "2026-01",
      "floatingPopulation": 75802,
      "inflowPopulation": 467930,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-02",
      "floatingPopulation": 73715,
      "inflowPopulation": 454625,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-03",
      "floatingPopulation": 75920,
      "inflowPopulation": 442501,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-04",
      "floatingPopulation": 78896,
      "inflowPopulation": 450152,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-05",
      "floatingPopulation": 78833,
      "inflowPopulation": 458578,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-06",
      "floatingPopulation": 78677,
      "inflowPopulation": 445782,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    }
  ],
  "반곡동": [
    {
      "period": "2025-01",
      "floatingPopulation": 97076,
      "inflowPopulation": 594015,
      "cardSales": 10378348408,
      "cardSalesShare": 2.18,
      "cardSalesChangeRate": 11.8
    },
    {
      "period": "2025-02",
      "floatingPopulation": 93263,
      "inflowPopulation": 532771,
      "cardSales": 10069611772,
      "cardSalesShare": 2.19,
      "cardSalesChangeRate": 12.9
    },
    {
      "period": "2025-03",
      "floatingPopulation": 91781,
      "inflowPopulation": 597119,
      "cardSales": 11311972135,
      "cardSalesShare": 2.28,
      "cardSalesChangeRate": 20.2
    },
    {
      "period": "2025-04",
      "floatingPopulation": 99998,
      "inflowPopulation": 590014,
      "cardSales": 11335237680,
      "cardSalesShare": 2.16,
      "cardSalesChangeRate": 18.4
    },
    {
      "period": "2025-05",
      "floatingPopulation": 92152,
      "inflowPopulation": 589710,
      "cardSales": 11273831060,
      "cardSalesShare": 2.17,
      "cardSalesChangeRate": 11.2
    },
    {
      "period": "2025-06",
      "floatingPopulation": 92694,
      "inflowPopulation": 564199,
      "cardSales": 11396465269,
      "cardSalesShare": 2.15,
      "cardSalesChangeRate": 16.6
    },
    {
      "period": "2025-07",
      "floatingPopulation": 88264,
      "inflowPopulation": 600587,
      "cardSales": 11781274520,
      "cardSalesShare": 2.17,
      "cardSalesChangeRate": 19.3
    },
    {
      "period": "2025-08",
      "floatingPopulation": 83335,
      "inflowPopulation": 601440,
      "cardSales": 11852616411,
      "cardSalesShare": 2.33,
      "cardSalesChangeRate": 17.0
    },
    {
      "period": "2025-09",
      "floatingPopulation": 89006,
      "inflowPopulation": 594872,
      "cardSales": 11816275420,
      "cardSalesShare": 2.22,
      "cardSalesChangeRate": 24.4
    },
    {
      "period": "2025-10",
      "floatingPopulation": 82713,
      "inflowPopulation": 610777,
      "cardSales": 11351039390,
      "cardSalesShare": 2.3,
      "cardSalesChangeRate": 6.3
    },
    {
      "period": "2025-11",
      "floatingPopulation": 86248,
      "inflowPopulation": 605641,
      "cardSales": 12195777247,
      "cardSalesShare": 2.23,
      "cardSalesChangeRate": 12.0
    },
    {
      "period": "2025-12",
      "floatingPopulation": 87655,
      "inflowPopulation": 608370,
      "cardSales": 12913142101,
      "cardSalesShare": 2.15,
      "cardSalesChangeRate": 14.6
    },
    {
      "period": "2026-01",
      "floatingPopulation": 86100,
      "inflowPopulation": 654131,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-02",
      "floatingPopulation": 84232,
      "inflowPopulation": 613323,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-03",
      "floatingPopulation": 92312,
      "inflowPopulation": 628567,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-04",
      "floatingPopulation": 92993,
      "inflowPopulation": 620609,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-05",
      "floatingPopulation": 88811,
      "inflowPopulation": 623068,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-06",
      "floatingPopulation": 96625,
      "inflowPopulation": 627883,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    }
  ],
  "보람동": [
    {
      "period": "2025-01",
      "floatingPopulation": 84000,
      "inflowPopulation": 328226,
      "cardSales": 11425885890,
      "cardSalesShare": 2.4,
      "cardSalesChangeRate": 12.9
    },
    {
      "period": "2025-02",
      "floatingPopulation": 88486,
      "inflowPopulation": 308425,
      "cardSales": 10729719518,
      "cardSalesShare": 2.33,
      "cardSalesChangeRate": 6.0
    },
    {
      "period": "2025-03",
      "floatingPopulation": 84430,
      "inflowPopulation": 346915,
      "cardSales": 11914910594,
      "cardSalesShare": 2.4,
      "cardSalesChangeRate": 13.7
    },
    {
      "period": "2025-04",
      "floatingPopulation": 82335,
      "inflowPopulation": 340011,
      "cardSales": 11610176985,
      "cardSalesShare": 2.21,
      "cardSalesChangeRate": 10.6
    },
    {
      "period": "2025-05",
      "floatingPopulation": 81872,
      "inflowPopulation": 351328,
      "cardSales": 12462734476,
      "cardSalesShare": 2.4,
      "cardSalesChangeRate": 13.0
    },
    {
      "period": "2025-06",
      "floatingPopulation": 80456,
      "inflowPopulation": 330324,
      "cardSales": 11810797303,
      "cardSalesShare": 2.23,
      "cardSalesChangeRate": 14.3
    },
    {
      "period": "2025-07",
      "floatingPopulation": 69147,
      "inflowPopulation": 335367,
      "cardSales": 12395236647,
      "cardSalesShare": 2.29,
      "cardSalesChangeRate": 14.5
    },
    {
      "period": "2025-08",
      "floatingPopulation": 69541,
      "inflowPopulation": 345989,
      "cardSales": 12649129501,
      "cardSalesShare": 2.49,
      "cardSalesChangeRate": 19.4
    },
    {
      "period": "2025-09",
      "floatingPopulation": 69692,
      "inflowPopulation": 336859,
      "cardSales": 13279243777,
      "cardSalesShare": 2.49,
      "cardSalesChangeRate": 31.4
    },
    {
      "period": "2025-10",
      "floatingPopulation": 71002,
      "inflowPopulation": 353607,
      "cardSales": 13206776428,
      "cardSalesShare": 2.67,
      "cardSalesChangeRate": 15.0
    },
    {
      "period": "2025-11",
      "floatingPopulation": 73271,
      "inflowPopulation": 349543,
      "cardSales": 12844893293,
      "cardSalesShare": 2.34,
      "cardSalesChangeRate": 9.4
    },
    {
      "period": "2025-12",
      "floatingPopulation": 75803,
      "inflowPopulation": 353070,
      "cardSales": 15215689991,
      "cardSalesShare": 2.53,
      "cardSalesChangeRate": 16.8
    },
    {
      "period": "2026-01",
      "floatingPopulation": 76591,
      "inflowPopulation": 386372,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-02",
      "floatingPopulation": 75122,
      "inflowPopulation": 377549,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-03",
      "floatingPopulation": 77666,
      "inflowPopulation": 364824,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-04",
      "floatingPopulation": 79001,
      "inflowPopulation": 366993,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-05",
      "floatingPopulation": 77242,
      "inflowPopulation": 371842,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-06",
      "floatingPopulation": 79668,
      "inflowPopulation": 370015,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    }
  ],
  "부강면": [
    {
      "period": "2025-01",
      "floatingPopulation": 44495,
      "inflowPopulation": 315515,
      "cardSales": 10275946630,
      "cardSalesShare": 2.16,
      "cardSalesChangeRate": 9.4
    },
    {
      "period": "2025-02",
      "floatingPopulation": 40360,
      "inflowPopulation": 282098,
      "cardSales": 9885445084,
      "cardSalesShare": 2.15,
      "cardSalesChangeRate": 6.8
    },
    {
      "period": "2025-03",
      "floatingPopulation": 42502,
      "inflowPopulation": 295270,
      "cardSales": 11089960326,
      "cardSalesShare": 2.23,
      "cardSalesChangeRate": 5.2
    },
    {
      "period": "2025-04",
      "floatingPopulation": 47029,
      "inflowPopulation": 297395,
      "cardSales": 11742749297,
      "cardSalesShare": 2.24,
      "cardSalesChangeRate": 9.8
    },
    {
      "period": "2025-05",
      "floatingPopulation": 44613,
      "inflowPopulation": 294041,
      "cardSales": 11973005512,
      "cardSalesShare": 2.31,
      "cardSalesChangeRate": 9.9
    },
    {
      "period": "2025-06",
      "floatingPopulation": 45952,
      "inflowPopulation": 266765,
      "cardSales": 10984657202,
      "cardSalesShare": 2.07,
      "cardSalesChangeRate": 4.8
    },
    {
      "period": "2025-07",
      "floatingPopulation": 45446,
      "inflowPopulation": 291454,
      "cardSales": 12164272133,
      "cardSalesShare": 2.24,
      "cardSalesChangeRate": 9.5
    },
    {
      "period": "2025-08",
      "floatingPopulation": 42215,
      "inflowPopulation": 293980,
      "cardSales": 11809351059,
      "cardSalesShare": 2.32,
      "cardSalesChangeRate": 8.3
    },
    {
      "period": "2025-09",
      "floatingPopulation": 44841,
      "inflowPopulation": 298924,
      "cardSales": 12034227991,
      "cardSalesShare": 2.26,
      "cardSalesChangeRate": 18.8
    },
    {
      "period": "2025-10",
      "floatingPopulation": 42581,
      "inflowPopulation": 299480,
      "cardSales": 11319882317,
      "cardSalesShare": 2.29,
      "cardSalesChangeRate": 6.2
    },
    {
      "period": "2025-11",
      "floatingPopulation": 45256,
      "inflowPopulation": 299544,
      "cardSales": 12117874704,
      "cardSalesShare": 2.21,
      "cardSalesChangeRate": 15.2
    },
    {
      "period": "2025-12",
      "floatingPopulation": 42483,
      "inflowPopulation": 290457,
      "cardSales": 12537205667,
      "cardSalesShare": 2.09,
      "cardSalesChangeRate": 17.1
    },
    {
      "period": "2026-01",
      "floatingPopulation": 40268,
      "inflowPopulation": 289818,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-02",
      "floatingPopulation": 41528,
      "inflowPopulation": 290282,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-03",
      "floatingPopulation": 43438,
      "inflowPopulation": 289887,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-04",
      "floatingPopulation": 45427,
      "inflowPopulation": 292674,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-05",
      "floatingPopulation": 44082,
      "inflowPopulation": 296121,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-06",
      "floatingPopulation": 44560,
      "inflowPopulation": 293217,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    }
  ],
  "새롬동": [
    {
      "period": "2025-01",
      "floatingPopulation": 72498,
      "inflowPopulation": 497883,
      "cardSales": 12992570443,
      "cardSalesShare": 2.73,
      "cardSalesChangeRate": 14.0
    },
    {
      "period": "2025-02",
      "floatingPopulation": 72569,
      "inflowPopulation": 454696,
      "cardSales": 12387553348,
      "cardSalesShare": 2.69,
      "cardSalesChangeRate": 18.5
    },
    {
      "period": "2025-03",
      "floatingPopulation": 69525,
      "inflowPopulation": 526847,
      "cardSales": 13755690727,
      "cardSalesShare": 2.77,
      "cardSalesChangeRate": 16.0
    },
    {
      "period": "2025-04",
      "floatingPopulation": 66897,
      "inflowPopulation": 502262,
      "cardSales": 13231975649,
      "cardSalesShare": 2.52,
      "cardSalesChangeRate": 13.7
    },
    {
      "period": "2025-05",
      "floatingPopulation": 64306,
      "inflowPopulation": 510613,
      "cardSales": 13397101488,
      "cardSalesShare": 2.58,
      "cardSalesChangeRate": 13.9
    },
    {
      "period": "2025-06",
      "floatingPopulation": 64217,
      "inflowPopulation": 486643,
      "cardSales": 13157332661,
      "cardSalesShare": 2.48,
      "cardSalesChangeRate": 9.6
    },
    {
      "period": "2025-07",
      "floatingPopulation": 62072,
      "inflowPopulation": 504093,
      "cardSales": 13786458017,
      "cardSalesShare": 2.54,
      "cardSalesChangeRate": 15.2
    },
    {
      "period": "2025-08",
      "floatingPopulation": 56150,
      "inflowPopulation": 510837,
      "cardSales": 14008629416,
      "cardSalesShare": 2.75,
      "cardSalesChangeRate": 15.5
    },
    {
      "period": "2025-09",
      "floatingPopulation": 60551,
      "inflowPopulation": 495030,
      "cardSales": 13624710027,
      "cardSalesShare": 2.56,
      "cardSalesChangeRate": 20.4
    },
    {
      "period": "2025-10",
      "floatingPopulation": 56587,
      "inflowPopulation": 516784,
      "cardSales": 13069240089,
      "cardSalesShare": 2.64,
      "cardSalesChangeRate": 7.1
    },
    {
      "period": "2025-11",
      "floatingPopulation": 59042,
      "inflowPopulation": 502927,
      "cardSales": 13683214983,
      "cardSalesShare": 2.5,
      "cardSalesChangeRate": 11.2
    },
    {
      "period": "2025-12",
      "floatingPopulation": 58424,
      "inflowPopulation": 516287,
      "cardSales": 14618992880,
      "cardSalesShare": 2.43,
      "cardSalesChangeRate": 10.8
    },
    {
      "period": "2026-01",
      "floatingPopulation": 61293,
      "inflowPopulation": 558045,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-02",
      "floatingPopulation": 60539,
      "inflowPopulation": 541104,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-03",
      "floatingPopulation": 62096,
      "inflowPopulation": 527289,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-04",
      "floatingPopulation": 61562,
      "inflowPopulation": 511764,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-05",
      "floatingPopulation": 62265,
      "inflowPopulation": 530817,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-06",
      "floatingPopulation": 63846,
      "inflowPopulation": 519816,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    }
  ],
  "소담동": [
    {
      "period": "2025-01",
      "floatingPopulation": 65668,
      "inflowPopulation": 366601,
      "cardSales": 9550174490,
      "cardSalesShare": 2.01,
      "cardSalesChangeRate": 5.8
    },
    {
      "period": "2025-02",
      "floatingPopulation": 61322,
      "inflowPopulation": 352662,
      "cardSales": 9071499578,
      "cardSalesShare": 1.97,
      "cardSalesChangeRate": 9.9
    },
    {
      "period": "2025-03",
      "floatingPopulation": 63520,
      "inflowPopulation": 375380,
      "cardSales": 9964037687,
      "cardSalesShare": 2.0,
      "cardSalesChangeRate": 11.9
    },
    {
      "period": "2025-04",
      "floatingPopulation": 69251,
      "inflowPopulation": 367101,
      "cardSales": 10129175260,
      "cardSalesShare": 1.93,
      "cardSalesChangeRate": 11.1
    },
    {
      "period": "2025-05",
      "floatingPopulation": 66904,
      "inflowPopulation": 371908,
      "cardSales": 9975147520,
      "cardSalesShare": 1.92,
      "cardSalesChangeRate": 8.9
    },
    {
      "period": "2025-06",
      "floatingPopulation": 68043,
      "inflowPopulation": 341140,
      "cardSales": 10342752440,
      "cardSalesShare": 1.95,
      "cardSalesChangeRate": 26.5
    },
    {
      "period": "2025-07",
      "floatingPopulation": 62255,
      "inflowPopulation": 344453,
      "cardSales": 10252741127,
      "cardSalesShare": 1.89,
      "cardSalesChangeRate": 12.4
    },
    {
      "period": "2025-08",
      "floatingPopulation": 59432,
      "inflowPopulation": 356386,
      "cardSales": 10508132867,
      "cardSalesShare": 2.07,
      "cardSalesChangeRate": 18.1
    },
    {
      "period": "2025-09",
      "floatingPopulation": 62730,
      "inflowPopulation": 338239,
      "cardSales": 10107859168,
      "cardSalesShare": 1.9,
      "cardSalesChangeRate": 22.5
    },
    {
      "period": "2025-10",
      "floatingPopulation": 58152,
      "inflowPopulation": 357514,
      "cardSales": 9743783078,
      "cardSalesShare": 1.97,
      "cardSalesChangeRate": 11.6
    },
    {
      "period": "2025-11",
      "floatingPopulation": 60373,
      "inflowPopulation": 340804,
      "cardSales": 10232740350,
      "cardSalesShare": 1.87,
      "cardSalesChangeRate": 13.0
    },
    {
      "period": "2025-12",
      "floatingPopulation": 60055,
      "inflowPopulation": 352375,
      "cardSales": 11324783567,
      "cardSalesShare": 1.88,
      "cardSalesChangeRate": 17.4
    },
    {
      "period": "2026-01",
      "floatingPopulation": 62457,
      "inflowPopulation": 389184,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-02",
      "floatingPopulation": 62476,
      "inflowPopulation": 385497,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-03",
      "floatingPopulation": 64359,
      "inflowPopulation": 368397,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-04",
      "floatingPopulation": 64992,
      "inflowPopulation": 362677,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-05",
      "floatingPopulation": 64808,
      "inflowPopulation": 378677,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-06",
      "floatingPopulation": 65120,
      "inflowPopulation": 363357,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    }
  ],
  "소정면": [
    {
      "period": "2025-01",
      "floatingPopulation": 15871,
      "inflowPopulation": 185550,
      "cardSales": 2718543098,
      "cardSalesShare": 0.57,
      "cardSalesChangeRate": -10.8
    },
    {
      "period": "2025-02",
      "floatingPopulation": 17116,
      "inflowPopulation": 177757,
      "cardSales": 2479892981,
      "cardSalesShare": 0.54,
      "cardSalesChangeRate": -26.0
    },
    {
      "period": "2025-03",
      "floatingPopulation": 16805,
      "inflowPopulation": 183899,
      "cardSales": 3020648163,
      "cardSalesShare": 0.61,
      "cardSalesChangeRate": -6.5
    },
    {
      "period": "2025-04",
      "floatingPopulation": 18443,
      "inflowPopulation": 180611,
      "cardSales": 3146073892,
      "cardSalesShare": 0.6,
      "cardSalesChangeRate": -11.4
    },
    {
      "period": "2025-05",
      "floatingPopulation": 19382,
      "inflowPopulation": 184620,
      "cardSales": 3088643854,
      "cardSalesShare": 0.59,
      "cardSalesChangeRate": -20.1
    },
    {
      "period": "2025-06",
      "floatingPopulation": 19764,
      "inflowPopulation": 168383,
      "cardSales": 3041385223,
      "cardSalesShare": 0.57,
      "cardSalesChangeRate": -8.9
    },
    {
      "period": "2025-07",
      "floatingPopulation": 15626,
      "inflowPopulation": 178964,
      "cardSales": 3151875126,
      "cardSalesShare": 0.58,
      "cardSalesChangeRate": -5.4
    },
    {
      "period": "2025-08",
      "floatingPopulation": 14929,
      "inflowPopulation": 184455,
      "cardSales": 3293614394,
      "cardSalesShare": 0.65,
      "cardSalesChangeRate": -7.6
    },
    {
      "period": "2025-09",
      "floatingPopulation": 16746,
      "inflowPopulation": 180945,
      "cardSales": 3720229276,
      "cardSalesShare": 0.7,
      "cardSalesChangeRate": 11.0
    },
    {
      "period": "2025-10",
      "floatingPopulation": 18624,
      "inflowPopulation": 196021,
      "cardSales": 3467413234,
      "cardSalesShare": 0.7,
      "cardSalesChangeRate": -2.2
    },
    {
      "period": "2025-11",
      "floatingPopulation": 17596,
      "inflowPopulation": 190618,
      "cardSales": 3301756780,
      "cardSalesShare": 0.6,
      "cardSalesChangeRate": 3.6
    },
    {
      "period": "2025-12",
      "floatingPopulation": 14381,
      "inflowPopulation": 180844,
      "cardSales": 2977710608,
      "cardSalesShare": 0.5,
      "cardSalesChangeRate": 7.1
    },
    {
      "period": "2026-01",
      "floatingPopulation": 13511,
      "inflowPopulation": 181391,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-02",
      "floatingPopulation": 16897,
      "inflowPopulation": 186154,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-03",
      "floatingPopulation": 15456,
      "inflowPopulation": 176324,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-04",
      "floatingPopulation": 16525,
      "inflowPopulation": 180302,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-05",
      "floatingPopulation": 17050,
      "inflowPopulation": 182473,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-06",
      "floatingPopulation": 14932,
      "inflowPopulation": 176875,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    }
  ],
  "아름동": [
    {
      "period": "2025-01",
      "floatingPopulation": 136469,
      "inflowPopulation": 789593,
      "cardSales": 17416482243,
      "cardSalesShare": 3.66,
      "cardSalesChangeRate": 16.2
    },
    {
      "period": "2025-02",
      "floatingPopulation": 135187,
      "inflowPopulation": 864970,
      "cardSales": 14859688007,
      "cardSalesShare": 3.22,
      "cardSalesChangeRate": 8.3
    },
    {
      "period": "2025-03",
      "floatingPopulation": 141043,
      "inflowPopulation": 881654,
      "cardSales": 17542146960,
      "cardSalesShare": 3.53,
      "cardSalesChangeRate": 16.1
    },
    {
      "period": "2025-04",
      "floatingPopulation": 152475,
      "inflowPopulation": 833440,
      "cardSales": 17330167229,
      "cardSalesShare": 3.3,
      "cardSalesChangeRate": 10.2
    },
    {
      "period": "2025-05",
      "floatingPopulation": 150824,
      "inflowPopulation": 871756,
      "cardSales": 17683705256,
      "cardSalesShare": 3.41,
      "cardSalesChangeRate": 9.3
    },
    {
      "period": "2025-06",
      "floatingPopulation": 154875,
      "inflowPopulation": 845435,
      "cardSales": 17122416678,
      "cardSalesShare": 3.23,
      "cardSalesChangeRate": 11.9
    },
    {
      "period": "2025-07",
      "floatingPopulation": 152223,
      "inflowPopulation": 872077,
      "cardSales": 18551317024,
      "cardSalesShare": 3.42,
      "cardSalesChangeRate": 13.1
    },
    {
      "period": "2025-08",
      "floatingPopulation": 144164,
      "inflowPopulation": 892998,
      "cardSales": 17941250071,
      "cardSalesShare": 3.53,
      "cardSalesChangeRate": 12.1
    },
    {
      "period": "2025-09",
      "floatingPopulation": 152125,
      "inflowPopulation": 876187,
      "cardSales": 16766973852,
      "cardSalesShare": 3.15,
      "cardSalesChangeRate": 7.3
    },
    {
      "period": "2025-10",
      "floatingPopulation": 142790,
      "inflowPopulation": 900177,
      "cardSales": 16479100779,
      "cardSalesShare": 3.33,
      "cardSalesChangeRate": 3.4
    },
    {
      "period": "2025-11",
      "floatingPopulation": 149743,
      "inflowPopulation": 874346,
      "cardSales": 18138107815,
      "cardSalesShare": 3.31,
      "cardSalesChangeRate": 8.5
    },
    {
      "period": "2025-12",
      "floatingPopulation": 147658,
      "inflowPopulation": 880702,
      "cardSales": 18555643724,
      "cardSalesShare": 3.09,
      "cardSalesChangeRate": -2.6
    },
    {
      "period": "2026-01",
      "floatingPopulation": 142621,
      "inflowPopulation": 921420,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-02",
      "floatingPopulation": 139449,
      "inflowPopulation": 884498,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-03",
      "floatingPopulation": 142559,
      "inflowPopulation": 865172,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-04",
      "floatingPopulation": 144433,
      "inflowPopulation": 860998,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-05",
      "floatingPopulation": 144617,
      "inflowPopulation": 871922,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-06",
      "floatingPopulation": 147781,
      "inflowPopulation": 866680,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    }
  ],
  "어진동": [
    {
      "period": "2025-01",
      "floatingPopulation": 190378,
      "inflowPopulation": 500157,
      "cardSales": 204083000000,
      "cardSalesShare": 42.9,
      "cardSalesChangeRate": -5.6
    },
    {
      "period": "2025-02",
      "floatingPopulation": 202273,
      "inflowPopulation": 491279,
      "cardSales": 212115000000,
      "cardSalesShare": 46.03,
      "cardSalesChangeRate": -8.5
    },
    {
      "period": "2025-03",
      "floatingPopulation": 200574,
      "inflowPopulation": 522783,
      "cardSales": 213319000000,
      "cardSalesShare": 42.91,
      "cardSalesChangeRate": -3.6
    },
    {
      "period": "2025-04",
      "floatingPopulation": 192310,
      "inflowPopulation": 562064,
      "cardSales": 238949000000,
      "cardSalesShare": 45.57,
      "cardSalesChangeRate": -3.8
    },
    {
      "period": "2025-05",
      "floatingPopulation": 183059,
      "inflowPopulation": 524933,
      "cardSales": 220816000000,
      "cardSalesShare": 42.53,
      "cardSalesChangeRate": -6.6
    },
    {
      "period": "2025-06",
      "floatingPopulation": 183388,
      "inflowPopulation": 507771,
      "cardSales": 241718000000,
      "cardSalesShare": 45.64,
      "cardSalesChangeRate": 19.5
    },
    {
      "period": "2025-07",
      "floatingPopulation": 186392,
      "inflowPopulation": 528694,
      "cardSales": 245937000000,
      "cardSalesShare": 45.39,
      "cardSalesChangeRate": 7.3
    },
    {
      "period": "2025-08",
      "floatingPopulation": 168173,
      "inflowPopulation": 519043,
      "cardSales": 213644000000,
      "cardSalesShare": 42.01,
      "cardSalesChangeRate": 0.9
    },
    {
      "period": "2025-09",
      "floatingPopulation": 182560,
      "inflowPopulation": 527366,
      "cardSales": 244201000000,
      "cardSalesShare": 45.81,
      "cardSalesChangeRate": 6.7
    },
    {
      "period": "2025-10",
      "floatingPopulation": 176531,
      "inflowPopulation": 513108,
      "cardSales": 208492000000,
      "cardSalesShare": 42.16,
      "cardSalesChangeRate": -14.2
    },
    {
      "period": "2025-11",
      "floatingPopulation": 176899,
      "inflowPopulation": 531416,
      "cardSales": 258115000000,
      "cardSalesShare": 47.09,
      "cardSalesChangeRate": 11.4
    },
    {
      "period": "2025-12",
      "floatingPopulation": 180439,
      "inflowPopulation": 524370,
      "cardSales": 290250000000,
      "cardSalesShare": 48.29,
      "cardSalesChangeRate": 28.1
    },
    {
      "period": "2026-01",
      "floatingPopulation": 175871,
      "inflowPopulation": 489662,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-02",
      "floatingPopulation": 167030,
      "inflowPopulation": 515653,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-03",
      "floatingPopulation": 177818,
      "inflowPopulation": 558635,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-04",
      "floatingPopulation": 185814,
      "inflowPopulation": 547434,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-05",
      "floatingPopulation": 182059,
      "inflowPopulation": 538478,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-06",
      "floatingPopulation": 182719,
      "inflowPopulation": 545463,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    }
  ],
  "연기면": [
    {
      "period": "2025-01",
      "floatingPopulation": 1743,
      "inflowPopulation": 149398,
      "cardSales": 3314678887,
      "cardSalesShare": 0.7,
      "cardSalesChangeRate": 9.6
    },
    {
      "period": "2025-02",
      "floatingPopulation": 2138,
      "inflowPopulation": 162262,
      "cardSales": 3078257373,
      "cardSalesShare": 0.67,
      "cardSalesChangeRate": -32.7
    },
    {
      "period": "2025-03",
      "floatingPopulation": 1912,
      "inflowPopulation": 165910,
      "cardSales": 3288865697,
      "cardSalesShare": 0.66,
      "cardSalesChangeRate": -33.0
    },
    {
      "period": "2025-04",
      "floatingPopulation": 2110,
      "inflowPopulation": 169466,
      "cardSales": 3230360917,
      "cardSalesShare": 0.62,
      "cardSalesChangeRate": -39.3
    },
    {
      "period": "2025-05",
      "floatingPopulation": 1942,
      "inflowPopulation": 177255,
      "cardSales": 3449623564,
      "cardSalesShare": 0.66,
      "cardSalesChangeRate": -33.6
    },
    {
      "period": "2025-06",
      "floatingPopulation": 1978,
      "inflowPopulation": 150394,
      "cardSales": 3214523342,
      "cardSalesShare": 0.61,
      "cardSalesChangeRate": -24.7
    },
    {
      "period": "2025-07",
      "floatingPopulation": 1943,
      "inflowPopulation": 165275,
      "cardSales": 3193147456,
      "cardSalesShare": 0.59,
      "cardSalesChangeRate": -43.7
    },
    {
      "period": "2025-08",
      "floatingPopulation": 1821,
      "inflowPopulation": 168310,
      "cardSales": 3205467497,
      "cardSalesShare": 0.63,
      "cardSalesChangeRate": -33.4
    },
    {
      "period": "2025-09",
      "floatingPopulation": 1960,
      "inflowPopulation": 167363,
      "cardSales": 3097151049,
      "cardSalesShare": 0.58,
      "cardSalesChangeRate": -34.1
    },
    {
      "period": "2025-10",
      "floatingPopulation": 1912,
      "inflowPopulation": 182506,
      "cardSales": 2946957086,
      "cardSalesShare": 0.6,
      "cardSalesChangeRate": -31.6
    },
    {
      "period": "2025-11",
      "floatingPopulation": 1969,
      "inflowPopulation": 171496,
      "cardSales": 3236194219,
      "cardSalesShare": 0.59,
      "cardSalesChangeRate": -24.9
    },
    {
      "period": "2025-12",
      "floatingPopulation": 1600,
      "inflowPopulation": 159513,
      "cardSales": 3246288133,
      "cardSalesShare": 0.54,
      "cardSalesChangeRate": -18.5
    },
    {
      "period": "2026-01",
      "floatingPopulation": 1416,
      "inflowPopulation": 167689,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-02",
      "floatingPopulation": 1722,
      "inflowPopulation": 176123,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-03",
      "floatingPopulation": 1754,
      "inflowPopulation": 168362,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-04",
      "floatingPopulation": 1773,
      "inflowPopulation": 174517,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-05",
      "floatingPopulation": 1585,
      "inflowPopulation": 180569,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-06",
      "floatingPopulation": 1605,
      "inflowPopulation": 173993,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    }
  ],
  "연동면": [
    {
      "period": "2025-01",
      "floatingPopulation": 15108,
      "inflowPopulation": 168081,
      "cardSales": 1936458869,
      "cardSalesShare": 0.41,
      "cardSalesChangeRate": 2.2
    },
    {
      "period": "2025-02",
      "floatingPopulation": 15897,
      "inflowPopulation": 152639,
      "cardSales": 1885974611,
      "cardSalesShare": 0.41,
      "cardSalesChangeRate": 3.1
    },
    {
      "period": "2025-03",
      "floatingPopulation": 15308,
      "inflowPopulation": 161361,
      "cardSales": 2409415862,
      "cardSalesShare": 0.48,
      "cardSalesChangeRate": 3.3
    },
    {
      "period": "2025-04",
      "floatingPopulation": 15657,
      "inflowPopulation": 163544,
      "cardSales": 2268590244,
      "cardSalesShare": 0.43,
      "cardSalesChangeRate": -0.6
    },
    {
      "period": "2025-05",
      "floatingPopulation": 14319,
      "inflowPopulation": 167539,
      "cardSales": 2473906811,
      "cardSalesShare": 0.48,
      "cardSalesChangeRate": 7.3
    },
    {
      "period": "2025-06",
      "floatingPopulation": 14695,
      "inflowPopulation": 149156,
      "cardSales": 2382269224,
      "cardSalesShare": 0.45,
      "cardSalesChangeRate": 10.1
    },
    {
      "period": "2025-07",
      "floatingPopulation": 15608,
      "inflowPopulation": 166398,
      "cardSales": 2385507250,
      "cardSalesShare": 0.44,
      "cardSalesChangeRate": 14.6
    },
    {
      "period": "2025-08",
      "floatingPopulation": 12896,
      "inflowPopulation": 166584,
      "cardSales": 2242006790,
      "cardSalesShare": 0.44,
      "cardSalesChangeRate": 11.7
    },
    {
      "period": "2025-09",
      "floatingPopulation": 15526,
      "inflowPopulation": 172816,
      "cardSales": 2392419526,
      "cardSalesShare": 0.45,
      "cardSalesChangeRate": 12.1
    },
    {
      "period": "2025-10",
      "floatingPopulation": 13497,
      "inflowPopulation": 182587,
      "cardSales": 2240900776,
      "cardSalesShare": 0.45,
      "cardSalesChangeRate": 1.1
    },
    {
      "period": "2025-11",
      "floatingPopulation": 15212,
      "inflowPopulation": 177047,
      "cardSales": 2414368091,
      "cardSalesShare": 0.44,
      "cardSalesChangeRate": -1.8
    },
    {
      "period": "2025-12",
      "floatingPopulation": 14138,
      "inflowPopulation": 166276,
      "cardSales": 2459737916,
      "cardSalesShare": 0.41,
      "cardSalesChangeRate": 13.7
    },
    {
      "period": "2026-01",
      "floatingPopulation": 13876,
      "inflowPopulation": 162272,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-02",
      "floatingPopulation": 14016,
      "inflowPopulation": 167404,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-03",
      "floatingPopulation": 15833,
      "inflowPopulation": 166345,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-04",
      "floatingPopulation": 16756,
      "inflowPopulation": 170818,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-05",
      "floatingPopulation": 14311,
      "inflowPopulation": 173186,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-06",
      "floatingPopulation": 14721,
      "inflowPopulation": 168389,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    }
  ],
  "연서면": [
    {
      "period": "2025-01",
      "floatingPopulation": 23987,
      "inflowPopulation": 288584,
      "cardSales": 6478337688,
      "cardSalesShare": 1.36,
      "cardSalesChangeRate": -12.2
    },
    {
      "period": "2025-02",
      "floatingPopulation": 23244,
      "inflowPopulation": 240771,
      "cardSales": 6034366405,
      "cardSalesShare": 1.31,
      "cardSalesChangeRate": 3.8
    },
    {
      "period": "2025-03",
      "floatingPopulation": 23196,
      "inflowPopulation": 268492,
      "cardSales": 7640542547,
      "cardSalesShare": 1.54,
      "cardSalesChangeRate": 11.7
    },
    {
      "period": "2025-04",
      "floatingPopulation": 25925,
      "inflowPopulation": 280475,
      "cardSales": 8392521151,
      "cardSalesShare": 1.6,
      "cardSalesChangeRate": 7.4
    },
    {
      "period": "2025-05",
      "floatingPopulation": 23320,
      "inflowPopulation": 278205,
      "cardSales": 8300632278,
      "cardSalesShare": 1.6,
      "cardSalesChangeRate": 9.1
    },
    {
      "period": "2025-06",
      "floatingPopulation": 23058,
      "inflowPopulation": 248359,
      "cardSales": 7553322714,
      "cardSalesShare": 1.43,
      "cardSalesChangeRate": 6.1
    },
    {
      "period": "2025-07",
      "floatingPopulation": 23728,
      "inflowPopulation": 281506,
      "cardSales": 8488872015,
      "cardSalesShare": 1.57,
      "cardSalesChangeRate": 14.8
    },
    {
      "period": "2025-08",
      "floatingPopulation": 22003,
      "inflowPopulation": 278295,
      "cardSales": 8634474274,
      "cardSalesShare": 1.7,
      "cardSalesChangeRate": 11.3
    },
    {
      "period": "2025-09",
      "floatingPopulation": 23507,
      "inflowPopulation": 277286,
      "cardSales": 7657252793,
      "cardSalesShare": 1.44,
      "cardSalesChangeRate": 5.4
    },
    {
      "period": "2025-10",
      "floatingPopulation": 21719,
      "inflowPopulation": 292891,
      "cardSales": 7702488928,
      "cardSalesShare": 1.56,
      "cardSalesChangeRate": 4.5
    },
    {
      "period": "2025-11",
      "floatingPopulation": 22366,
      "inflowPopulation": 285392,
      "cardSales": 6882291066,
      "cardSalesShare": 1.26,
      "cardSalesChangeRate": -1.5
    },
    {
      "period": "2025-12",
      "floatingPopulation": 19306,
      "inflowPopulation": 250762,
      "cardSales": 6868019443,
      "cardSalesShare": 1.14,
      "cardSalesChangeRate": 5.8
    },
    {
      "period": "2026-01",
      "floatingPopulation": 18429,
      "inflowPopulation": 261080,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-02",
      "floatingPopulation": 19526,
      "inflowPopulation": 276866,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-03",
      "floatingPopulation": 22706,
      "inflowPopulation": 270624,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-04",
      "floatingPopulation": 25516,
      "inflowPopulation": 280155,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-05",
      "floatingPopulation": 21359,
      "inflowPopulation": 285781,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-06",
      "floatingPopulation": 22059,
      "inflowPopulation": 275928,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    }
  ],
  "장군면": [
    {
      "period": "2025-01",
      "floatingPopulation": 19188,
      "inflowPopulation": 289370,
      "cardSales": 7261839814,
      "cardSalesShare": 1.53,
      "cardSalesChangeRate": 10.5
    },
    {
      "period": "2025-02",
      "floatingPopulation": 19005,
      "inflowPopulation": 297335,
      "cardSales": 6872104596,
      "cardSalesShare": 1.49,
      "cardSalesChangeRate": 13.8
    },
    {
      "period": "2025-03",
      "floatingPopulation": 19428,
      "inflowPopulation": 285943,
      "cardSales": 7468429318,
      "cardSalesShare": 1.5,
      "cardSalesChangeRate": 8.4
    },
    {
      "period": "2025-04",
      "floatingPopulation": 18057,
      "inflowPopulation": 286017,
      "cardSales": 7752131729,
      "cardSalesShare": 1.48,
      "cardSalesChangeRate": 8.2
    },
    {
      "period": "2025-05",
      "floatingPopulation": 16943,
      "inflowPopulation": 285295,
      "cardSales": 8355161837,
      "cardSalesShare": 1.61,
      "cardSalesChangeRate": 7.2
    },
    {
      "period": "2025-06",
      "floatingPopulation": 14917,
      "inflowPopulation": 248757,
      "cardSales": 8211460971,
      "cardSalesShare": 1.55,
      "cardSalesChangeRate": 19.3
    },
    {
      "period": "2025-07",
      "floatingPopulation": 13793,
      "inflowPopulation": 254834,
      "cardSales": 8047547767,
      "cardSalesShare": 1.49,
      "cardSalesChangeRate": 11.9
    },
    {
      "period": "2025-08",
      "floatingPopulation": 14612,
      "inflowPopulation": 283232,
      "cardSales": 8541708142,
      "cardSalesShare": 1.68,
      "cardSalesChangeRate": 15.4
    },
    {
      "period": "2025-09",
      "floatingPopulation": 16865,
      "inflowPopulation": 281268,
      "cardSales": 7629208763,
      "cardSalesShare": 1.43,
      "cardSalesChangeRate": 6.5
    },
    {
      "period": "2025-10",
      "floatingPopulation": 15758,
      "inflowPopulation": 298293,
      "cardSales": 7824981256,
      "cardSalesShare": 1.58,
      "cardSalesChangeRate": -1.5
    },
    {
      "period": "2025-11",
      "floatingPopulation": 15402,
      "inflowPopulation": 286349,
      "cardSales": 8397963390,
      "cardSalesShare": 1.53,
      "cardSalesChangeRate": 5.7
    },
    {
      "period": "2025-12",
      "floatingPopulation": 12572,
      "inflowPopulation": 260768,
      "cardSales": 9309933841,
      "cardSalesShare": 1.55,
      "cardSalesChangeRate": 13.8
    },
    {
      "period": "2026-01",
      "floatingPopulation": 10736,
      "inflowPopulation": 251897,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-02",
      "floatingPopulation": 12588,
      "inflowPopulation": 290820,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-03",
      "floatingPopulation": 15903,
      "inflowPopulation": 298422,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-04",
      "floatingPopulation": 14234,
      "inflowPopulation": 290406,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-05",
      "floatingPopulation": 18646,
      "inflowPopulation": 308429,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-06",
      "floatingPopulation": 15123,
      "inflowPopulation": 278345,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    }
  ],
  "전동면": [
    {
      "period": "2025-01",
      "floatingPopulation": 14895,
      "inflowPopulation": 237801,
      "cardSales": 2199907713,
      "cardSalesShare": 0.46,
      "cardSalesChangeRate": -2.8
    },
    {
      "period": "2025-02",
      "floatingPopulation": 13488,
      "inflowPopulation": 202600,
      "cardSales": 2421284682,
      "cardSalesShare": 0.53,
      "cardSalesChangeRate": 13.7
    },
    {
      "period": "2025-03",
      "floatingPopulation": 13494,
      "inflowPopulation": 219067,
      "cardSales": 2770244793,
      "cardSalesShare": 0.56,
      "cardSalesChangeRate": 5.5
    },
    {
      "period": "2025-04",
      "floatingPopulation": 14066,
      "inflowPopulation": 233293,
      "cardSales": 3429584981,
      "cardSalesShare": 0.65,
      "cardSalesChangeRate": 5.2
    },
    {
      "period": "2025-05",
      "floatingPopulation": 12261,
      "inflowPopulation": 242999,
      "cardSales": 3515131233,
      "cardSalesShare": 0.68,
      "cardSalesChangeRate": 1.7
    },
    {
      "period": "2025-06",
      "floatingPopulation": 12047,
      "inflowPopulation": 204829,
      "cardSales": 3211392760,
      "cardSalesShare": 0.61,
      "cardSalesChangeRate": 18.4
    },
    {
      "period": "2025-07",
      "floatingPopulation": 12669,
      "inflowPopulation": 228954,
      "cardSales": 2624635320,
      "cardSalesShare": 0.48,
      "cardSalesChangeRate": -1.2
    },
    {
      "period": "2025-08",
      "floatingPopulation": 11087,
      "inflowPopulation": 229821,
      "cardSales": 2582513948,
      "cardSalesShare": 0.51,
      "cardSalesChangeRate": -9.8
    },
    {
      "period": "2025-09",
      "floatingPopulation": 12255,
      "inflowPopulation": 227408,
      "cardSales": 2714594383,
      "cardSalesShare": 0.51,
      "cardSalesChangeRate": -1.5
    },
    {
      "period": "2025-10",
      "floatingPopulation": 10836,
      "inflowPopulation": 246906,
      "cardSales": 2894915679,
      "cardSalesShare": 0.59,
      "cardSalesChangeRate": -15.2
    },
    {
      "period": "2025-11",
      "floatingPopulation": 11934,
      "inflowPopulation": 242143,
      "cardSales": 3209453522,
      "cardSalesShare": 0.59,
      "cardSalesChangeRate": 3.4
    },
    {
      "period": "2025-12",
      "floatingPopulation": 9798,
      "inflowPopulation": 217188,
      "cardSales": 2591258637,
      "cardSalesShare": 0.43,
      "cardSalesChangeRate": -4.2
    },
    {
      "period": "2026-01",
      "floatingPopulation": 7619,
      "inflowPopulation": 218189,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-02",
      "floatingPopulation": 13087,
      "inflowPopulation": 221465,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-03",
      "floatingPopulation": 12869,
      "inflowPopulation": 218567,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-04",
      "floatingPopulation": 12899,
      "inflowPopulation": 232770,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-05",
      "floatingPopulation": 10847,
      "inflowPopulation": 248548,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-06",
      "floatingPopulation": 11208,
      "inflowPopulation": 224919,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    }
  ],
  "전의면": [
    {
      "period": "2025-01",
      "floatingPopulation": 32550,
      "inflowPopulation": 308378,
      "cardSales": 7485792871,
      "cardSalesShare": 1.57,
      "cardSalesChangeRate": -1.8
    },
    {
      "period": "2025-02",
      "floatingPopulation": 31029,
      "inflowPopulation": 275804,
      "cardSales": 6484995624,
      "cardSalesShare": 1.41,
      "cardSalesChangeRate": -17.3
    },
    {
      "period": "2025-03",
      "floatingPopulation": 32243,
      "inflowPopulation": 295038,
      "cardSales": 8544582444,
      "cardSalesShare": 1.72,
      "cardSalesChangeRate": -16.5
    },
    {
      "period": "2025-04",
      "floatingPopulation": 36275,
      "inflowPopulation": 304957,
      "cardSales": 10231056240,
      "cardSalesShare": 1.95,
      "cardSalesChangeRate": -7.9
    },
    {
      "period": "2025-05",
      "floatingPopulation": 36557,
      "inflowPopulation": 304649,
      "cardSales": 11009770217,
      "cardSalesShare": 2.12,
      "cardSalesChangeRate": -8.9
    },
    {
      "period": "2025-06",
      "floatingPopulation": 34995,
      "inflowPopulation": 269450,
      "cardSales": 11039931836,
      "cardSalesShare": 2.08,
      "cardSalesChangeRate": 0.4
    },
    {
      "period": "2025-07",
      "floatingPopulation": 34080,
      "inflowPopulation": 297743,
      "cardSales": 8475905829,
      "cardSalesShare": 1.56,
      "cardSalesChangeRate": -11.3
    },
    {
      "period": "2025-08",
      "floatingPopulation": 31606,
      "inflowPopulation": 294636,
      "cardSales": 8308917414,
      "cardSalesShare": 1.63,
      "cardSalesChangeRate": -21.0
    },
    {
      "period": "2025-09",
      "floatingPopulation": 37042,
      "inflowPopulation": 307435,
      "cardSales": 9997199825,
      "cardSalesShare": 1.88,
      "cardSalesChangeRate": -15.0
    },
    {
      "period": "2025-10",
      "floatingPopulation": 35369,
      "inflowPopulation": 313039,
      "cardSales": 9805909447,
      "cardSalesShare": 1.98,
      "cardSalesChangeRate": -25.7
    },
    {
      "period": "2025-11",
      "floatingPopulation": 38201,
      "inflowPopulation": 309272,
      "cardSales": 10356089420,
      "cardSalesShare": 1.89,
      "cardSalesChangeRate": -13.5
    },
    {
      "period": "2025-12",
      "floatingPopulation": 31842,
      "inflowPopulation": 286526,
      "cardSales": 10454314748,
      "cardSalesShare": 1.74,
      "cardSalesChangeRate": 20.0
    },
    {
      "period": "2026-01",
      "floatingPopulation": 28854,
      "inflowPopulation": 292199,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-02",
      "floatingPopulation": 31203,
      "inflowPopulation": 289931,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-03",
      "floatingPopulation": 33316,
      "inflowPopulation": 289581,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-04",
      "floatingPopulation": 36129,
      "inflowPopulation": 296739,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-05",
      "floatingPopulation": 35394,
      "inflowPopulation": 297725,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-06",
      "floatingPopulation": 32400,
      "inflowPopulation": 295215,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    }
  ],
  "조치원읍": [
    {
      "period": "2025-01",
      "floatingPopulation": 347729,
      "inflowPopulation": 1237366,
      "cardSales": 41225520637,
      "cardSalesShare": 8.67,
      "cardSalesChangeRate": 1.0
    },
    {
      "period": "2025-02",
      "floatingPopulation": 346096,
      "inflowPopulation": 1198176,
      "cardSales": 36334514161,
      "cardSalesShare": 7.89,
      "cardSalesChangeRate": -3.5
    },
    {
      "period": "2025-03",
      "floatingPopulation": 331119,
      "inflowPopulation": 1051231,
      "cardSales": 44513047772,
      "cardSalesShare": 8.95,
      "cardSalesChangeRate": -4.4
    },
    {
      "period": "2025-04",
      "floatingPopulation": 306230,
      "inflowPopulation": 1055810,
      "cardSales": 44475306787,
      "cardSalesShare": 8.48,
      "cardSalesChangeRate": -1.1
    },
    {
      "period": "2025-05",
      "floatingPopulation": 297521,
      "inflowPopulation": 1017430,
      "cardSales": 47877674485,
      "cardSalesShare": 9.22,
      "cardSalesChangeRate": 3.7
    },
    {
      "period": "2025-06",
      "floatingPopulation": 300245,
      "inflowPopulation": 945984,
      "cardSales": 45793024508,
      "cardSalesShare": 8.65,
      "cardSalesChangeRate": 9.6
    },
    {
      "period": "2025-07",
      "floatingPopulation": 270867,
      "inflowPopulation": 929065,
      "cardSales": 45130154448,
      "cardSalesShare": 8.33,
      "cardSalesChangeRate": 9.0
    },
    {
      "period": "2025-08",
      "floatingPopulation": 273020,
      "inflowPopulation": 1015911,
      "cardSales": 42857353271,
      "cardSalesShare": 8.43,
      "cardSalesChangeRate": 3.4
    },
    {
      "period": "2025-09",
      "floatingPopulation": 333016,
      "inflowPopulation": 1114284,
      "cardSales": 43647646548,
      "cardSalesShare": 8.19,
      "cardSalesChangeRate": -1.5
    },
    {
      "period": "2025-10",
      "floatingPopulation": 287706,
      "inflowPopulation": 1024009,
      "cardSales": 43226347135,
      "cardSalesShare": 8.74,
      "cardSalesChangeRate": -2.1
    },
    {
      "period": "2025-11",
      "floatingPopulation": 296572,
      "inflowPopulation": 1063233,
      "cardSales": 42174262028,
      "cardSalesShare": 7.69,
      "cardSalesChangeRate": -0.1
    },
    {
      "period": "2025-12",
      "floatingPopulation": 241203,
      "inflowPopulation": 1040019,
      "cardSales": 44216264400,
      "cardSalesShare": 7.36,
      "cardSalesChangeRate": 2.1
    },
    {
      "period": "2026-01",
      "floatingPopulation": 246953,
      "inflowPopulation": 930844,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-02",
      "floatingPopulation": 277694,
      "inflowPopulation": 1017604,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-03",
      "floatingPopulation": 328576,
      "inflowPopulation": 1102735,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-04",
      "floatingPopulation": 324946,
      "inflowPopulation": 1037744,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-05",
      "floatingPopulation": 304532,
      "inflowPopulation": 1009585,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-06",
      "floatingPopulation": 290103,
      "inflowPopulation": 1021508,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    }
  ],
  "종촌동": [
    {
      "period": "2025-01",
      "floatingPopulation": 92846,
      "inflowPopulation": 425420,
      "cardSales": 10419886053,
      "cardSalesShare": 2.19,
      "cardSalesChangeRate": 10.4
    },
    {
      "period": "2025-02",
      "floatingPopulation": 98375,
      "inflowPopulation": 310700,
      "cardSales": 9699647315,
      "cardSalesShare": 2.11,
      "cardSalesChangeRate": 9.7
    },
    {
      "period": "2025-03",
      "floatingPopulation": 96906,
      "inflowPopulation": 378644,
      "cardSales": 10388256521,
      "cardSalesShare": 2.09,
      "cardSalesChangeRate": 7.2
    },
    {
      "period": "2025-04",
      "floatingPopulation": 107146,
      "inflowPopulation": 391279,
      "cardSales": 10054327700,
      "cardSalesShare": 1.92,
      "cardSalesChangeRate": 6.4
    },
    {
      "period": "2025-05",
      "floatingPopulation": 102612,
      "inflowPopulation": 370878,
      "cardSales": 10249650535,
      "cardSalesShare": 1.97,
      "cardSalesChangeRate": 7.3
    },
    {
      "period": "2025-06",
      "floatingPopulation": 103067,
      "inflowPopulation": 348870,
      "cardSales": 9497344598,
      "cardSalesShare": 1.79,
      "cardSalesChangeRate": 1.2
    },
    {
      "period": "2025-07",
      "floatingPopulation": 99042,
      "inflowPopulation": 365176,
      "cardSales": 9758837931,
      "cardSalesShare": 1.8,
      "cardSalesChangeRate": 6.9
    },
    {
      "period": "2025-08",
      "floatingPopulation": 91070,
      "inflowPopulation": 369756,
      "cardSales": 9678949257,
      "cardSalesShare": 1.9,
      "cardSalesChangeRate": -0.1
    },
    {
      "period": "2025-09",
      "floatingPopulation": 97959,
      "inflowPopulation": 359777,
      "cardSales": 9756070407,
      "cardSalesShare": 1.83,
      "cardSalesChangeRate": 2.4
    },
    {
      "period": "2025-10",
      "floatingPopulation": 96302,
      "inflowPopulation": 376515,
      "cardSales": 9631340760,
      "cardSalesShare": 1.95,
      "cardSalesChangeRate": -2.3
    },
    {
      "period": "2025-11",
      "floatingPopulation": 99596,
      "inflowPopulation": 352862,
      "cardSales": 9695984406,
      "cardSalesShare": 1.77,
      "cardSalesChangeRate": -2.3
    },
    {
      "period": "2025-12",
      "floatingPopulation": 103301,
      "inflowPopulation": 375730,
      "cardSales": 10790195493,
      "cardSalesShare": 1.8,
      "cardSalesChangeRate": -7.0
    },
    {
      "period": "2026-01",
      "floatingPopulation": 99812,
      "inflowPopulation": 382431,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-02",
      "floatingPopulation": 98658,
      "inflowPopulation": 372444,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-03",
      "floatingPopulation": 97130,
      "inflowPopulation": 360824,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-04",
      "floatingPopulation": 96308,
      "inflowPopulation": 356409,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-05",
      "floatingPopulation": 100092,
      "inflowPopulation": 366951,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-06",
      "floatingPopulation": 100433,
      "inflowPopulation": 359887,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    }
  ],
  "한솔동": [
    {
      "period": "2025-01",
      "floatingPopulation": 74995,
      "inflowPopulation": 378027,
      "cardSales": 17853341393,
      "cardSalesShare": 3.75,
      "cardSalesChangeRate": 6.9
    },
    {
      "period": "2025-02",
      "floatingPopulation": 74282,
      "inflowPopulation": 385948,
      "cardSales": 12993990720,
      "cardSalesShare": 2.82,
      "cardSalesChangeRate": -3.3
    },
    {
      "period": "2025-03",
      "floatingPopulation": 74684,
      "inflowPopulation": 400762,
      "cardSales": 15047449653,
      "cardSalesShare": 3.03,
      "cardSalesChangeRate": 2.8
    },
    {
      "period": "2025-04",
      "floatingPopulation": 69166,
      "inflowPopulation": 394786,
      "cardSales": 14804084104,
      "cardSalesShare": 2.82,
      "cardSalesChangeRate": 0.4
    },
    {
      "period": "2025-05",
      "floatingPopulation": 72654,
      "inflowPopulation": 405560,
      "cardSales": 15657057957,
      "cardSalesShare": 3.02,
      "cardSalesChangeRate": 7.3
    },
    {
      "period": "2025-06",
      "floatingPopulation": 70918,
      "inflowPopulation": 368331,
      "cardSales": 15447729484,
      "cardSalesShare": 2.92,
      "cardSalesChangeRate": 7.4
    },
    {
      "period": "2025-07",
      "floatingPopulation": 66402,
      "inflowPopulation": 386955,
      "cardSales": 16056101123,
      "cardSalesShare": 2.96,
      "cardSalesChangeRate": 3.9
    },
    {
      "period": "2025-08",
      "floatingPopulation": 66326,
      "inflowPopulation": 389868,
      "cardSales": 15987048151,
      "cardSalesShare": 3.14,
      "cardSalesChangeRate": 1.6
    },
    {
      "period": "2025-09",
      "floatingPopulation": 66973,
      "inflowPopulation": 372768,
      "cardSales": 14821839348,
      "cardSalesShare": 2.78,
      "cardSalesChangeRate": -2.2
    },
    {
      "period": "2025-10",
      "floatingPopulation": 67319,
      "inflowPopulation": 399218,
      "cardSales": 15479386237,
      "cardSalesShare": 3.13,
      "cardSalesChangeRate": 6.0
    },
    {
      "period": "2025-11",
      "floatingPopulation": 65505,
      "inflowPopulation": 378629,
      "cardSales": 14717816448,
      "cardSalesShare": 2.69,
      "cardSalesChangeRate": -11.4
    },
    {
      "period": "2025-12",
      "floatingPopulation": 61909,
      "inflowPopulation": 378525,
      "cardSales": 16199484517,
      "cardSalesShare": 2.7,
      "cardSalesChangeRate": 3.5
    },
    {
      "period": "2026-01",
      "floatingPopulation": 63553,
      "inflowPopulation": 398573,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-02",
      "floatingPopulation": 66300,
      "inflowPopulation": 407907,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-03",
      "floatingPopulation": 67988,
      "inflowPopulation": 390344,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-04",
      "floatingPopulation": 65639,
      "inflowPopulation": 387419,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-05",
      "floatingPopulation": 70352,
      "inflowPopulation": 408335,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-06",
      "floatingPopulation": 66018,
      "inflowPopulation": 384484,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    }
  ],
  "해밀동": [
    {
      "period": "2025-01",
      "floatingPopulation": 50085,
      "inflowPopulation": 432680,
      "cardSales": 6029691980,
      "cardSalesShare": 1.27,
      "cardSalesChangeRate": 64.6
    },
    {
      "period": "2025-02",
      "floatingPopulation": 47826,
      "inflowPopulation": 417894,
      "cardSales": 6048240372,
      "cardSalesShare": 1.31,
      "cardSalesChangeRate": 63.6
    },
    {
      "period": "2025-03",
      "floatingPopulation": 49168,
      "inflowPopulation": 437821,
      "cardSales": 8258816505,
      "cardSalesShare": 1.66,
      "cardSalesChangeRate": 49.3
    },
    {
      "period": "2025-04",
      "floatingPopulation": 46981,
      "inflowPopulation": 421489,
      "cardSales": 8626118222,
      "cardSalesShare": 1.64,
      "cardSalesChangeRate": 44.0
    },
    {
      "period": "2025-05",
      "floatingPopulation": 44726,
      "inflowPopulation": 433109,
      "cardSales": 9309703428,
      "cardSalesShare": 1.79,
      "cardSalesChangeRate": 40.4
    },
    {
      "period": "2025-06",
      "floatingPopulation": 43981,
      "inflowPopulation": 398198,
      "cardSales": 8968967097,
      "cardSalesShare": 1.69,
      "cardSalesChangeRate": 43.7
    },
    {
      "period": "2025-07",
      "floatingPopulation": 42974,
      "inflowPopulation": 414414,
      "cardSales": 8601764582,
      "cardSalesShare": 1.59,
      "cardSalesChangeRate": 46.3
    },
    {
      "period": "2025-08",
      "floatingPopulation": 41537,
      "inflowPopulation": 424981,
      "cardSales": 9348855038,
      "cardSalesShare": 1.84,
      "cardSalesChangeRate": 41.4
    },
    {
      "period": "2025-09",
      "floatingPopulation": 44039,
      "inflowPopulation": 407743,
      "cardSales": 9456923446,
      "cardSalesShare": 1.77,
      "cardSalesChangeRate": 39.8
    },
    {
      "period": "2025-10",
      "floatingPopulation": 41087,
      "inflowPopulation": 429132,
      "cardSales": 9611009158,
      "cardSalesShare": 1.94,
      "cardSalesChangeRate": 38.6
    },
    {
      "period": "2025-11",
      "floatingPopulation": 42680,
      "inflowPopulation": 417317,
      "cardSales": 9227501146,
      "cardSalesShare": 1.68,
      "cardSalesChangeRate": 33.7
    },
    {
      "period": "2025-12",
      "floatingPopulation": 40647,
      "inflowPopulation": 415595,
      "cardSales": 9275718051,
      "cardSalesShare": 1.54,
      "cardSalesChangeRate": 42.7
    },
    {
      "period": "2026-01",
      "floatingPopulation": 42055,
      "inflowPopulation": 438571,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-02",
      "floatingPopulation": 41961,
      "inflowPopulation": 436503,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-03",
      "floatingPopulation": 45760,
      "inflowPopulation": 430626,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-04",
      "floatingPopulation": 46805,
      "inflowPopulation": 430247,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-05",
      "floatingPopulation": 45936,
      "inflowPopulation": 450246,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    },
    {
      "period": "2026-06",
      "floatingPopulation": 46946,
      "inflowPopulation": 439980,
      "cardSales": null,
      "cardSalesShare": null,
      "cardSalesChangeRate": null
    }
  ]
};
