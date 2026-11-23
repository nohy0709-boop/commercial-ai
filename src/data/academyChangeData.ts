/**
 * 학원 결과 화면의 "최근 변화" 카드용 참고 데이터 (점수에는 반영하지 않음)
 *
 * - schoolAgePopulation2025: 6~19세 주민등록 인구(명), 2025년 10월 말
 *   (2026년 10월 값은 academyDemandData.ts) / 출처: 행정안전부 주민등록 인구통계
 * - teenFlowMonthly: 10대 방과후(15~21시) 시간대 평균 유동인구, 2025-01 ~ 2026-06 월별
 *   출처: 세종특별자치시 「행정동별 유동인구 현황」
 * - academyCount2025 / academyCount2026: NEIS 등록 학원·교습소 전체 수(개원 상태),
 *   2025년 10월 31일 / 2026년 10월 31일 기준. 주소의 동 이름으로 집계했고
 *   앱의 업종 분류·논문 집계와 기준이 달라 숫자가 다를 수 있음.
 * - academyNew / academyGone: 두 시점 사이 새로 생긴 곳 / 2026년 목록에서 사라진 곳
 *   (폐원 외 사유가 섞였을 수 있음)
 * - boundaryChanged: 2026년 7월 20일 집현동 신설로 행정동 경계가 바뀌어
 *   전년과 인구를 직접 비교할 수 없는 동(반곡동)
 */
export const TEEN_FLOW_MONTHS = ["2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"];

export type AcademyChangeData = {
  areaName: string;
  schoolAgePopulation2025: number;
  boundaryChanged: boolean;
  teenFlowMonthly: number[];
  academyCount2025: number;
  academyCount2026: number;
  academyNew: number;
  academyGone: number;
};

export const academyChangeData: AcademyChangeData[] = [
  {
    areaName: "한솔동",
    schoolAgePopulation2025: 3953,
    boundaryChanged: false,
    teenFlowMonthly: [1121.7, 1156.6, 1174.9, 902.0, 963.7, 922.4, 843.6, 836.0, 866.0, 862.0, 876.6, 821.1, 817.7, 868.7, 979.9, 919.6, 1014.6, 954.0],
    academyCount2025: 34,
    academyCount2026: 36,
    academyNew: 3,
    academyGone: 1,
  },
  {
    areaName: "새롬동",
    schoolAgePopulation2025: 6408,
    boundaryChanged: false,
    teenFlowMonthly: [1666.7, 1795.0, 1820.3, 1555.1, 1462.9, 1444.3, 1365.3, 1172.3, 1388.7, 1218.7, 1350.6, 1293.9, 1293.9, 1261.7, 1445.0, 1403.0, 1394.9, 1469.9],
    academyCount2025: 209,
    academyCount2026: 214,
    academyNew: 15,
    academyGone: 10,
  },
  {
    areaName: "나성동",
    schoolAgePopulation2025: 2651,
    boundaryChanged: false,
    teenFlowMonthly: [1882.7, 2165.7, 2078.6, 1790.6, 1909.0, 1839.0, 1747.9, 1659.3, 1713.4, 1830.7, 1777.7, 1880.7, 1835.7, 1810.9, 1883.9, 1912.3, 2143.6, 2020.9],
    academyCount2025: 169,
    academyCount2026: 187,
    academyNew: 29,
    academyGone: 11,
  },
  {
    areaName: "도담동",
    schoolAgePopulation2025: 4912,
    boundaryChanged: false,
    teenFlowMonthly: [1327.0, 1455.1, 1564.1, 1450.9, 1388.6, 1384.7, 1256.0, 1220.0, 1332.6, 1214.1, 1355.7, 1268.1, 1105.3, 1101.7, 1250.4, 1363.3, 1354.6, 1342.0],
    academyCount2025: 73,
    academyCount2026: 73,
    academyNew: 6,
    academyGone: 6,
  },
  {
    areaName: "어진동",
    schoolAgePopulation2025: 2131,
    boundaryChanged: false,
    teenFlowMonthly: [1827.9, 2051.3, 2162.4, 1968.0, 1979.0, 1976.1, 1882.7, 1764.7, 1923.9, 2035.9, 1946.1, 1954.9, 1699.9, 1709.9, 1846.9, 1917.1, 2113.0, 1982.0],
    academyCount2025: 37,
    academyCount2026: 37,
    academyNew: 4,
    academyGone: 4,
  },
  {
    areaName: "해밀동",
    schoolAgePopulation2025: 5068,
    boundaryChanged: false,
    teenFlowMonthly: [674.6, 676.4, 757.0, 616.6, 616.4, 607.7, 561.3, 533.7, 601.1, 551.0, 587.6, 553.6, 663.0, 649.1, 821.3, 847.0, 828.0, 859.0],
    academyCount2025: 38,
    academyCount2026: 41,
    academyNew: 5,
    academyGone: 2,
  },
  {
    areaName: "아름동",
    schoolAgePopulation2025: 5555,
    boundaryChanged: false,
    teenFlowMonthly: [2468.6, 2706.7, 2983.0, 3546.0, 3484.3, 3572.6, 3381.1, 3154.3, 3583.3, 3092.1, 3460.7, 3308.7, 2888.7, 2852.9, 3212.1, 3242.3, 3151.0, 3335.6],
    academyCount2025: 165,
    academyCount2026: 175,
    academyNew: 17,
    academyGone: 7,
  },
  {
    areaName: "종촌동",
    schoolAgePopulation2025: 5723,
    boundaryChanged: false,
    teenFlowMonthly: [1645.7, 1777.0, 1902.4, 2359.7, 2243.7, 2231.6, 2117.3, 1829.6, 2168.9, 2005.9, 2209.4, 2252.1, 1892.3, 1834.4, 1988.0, 2037.9, 2072.4, 2148.3],
    academyCount2025: 84,
    academyCount2026: 91,
    academyNew: 7,
    academyGone: 0,
  },
  {
    areaName: "고운동",
    schoolAgePopulation2025: 8259,
    boundaryChanged: false,
    teenFlowMonthly: [2065.0, 2479.9, 2500.3, 3086.9, 2937.6, 3063.3, 2757.4, 2728.1, 2961.3, 2630.3, 2984.1, 2763.0, 2419.1, 2301.9, 2738.1, 2785.9, 2722.1, 2889.0],
    academyCount2025: 166,
    academyCount2026: 184,
    academyNew: 29,
    academyGone: 11,
  },
  {
    areaName: "소담동",
    schoolAgePopulation2025: 4386,
    boundaryChanged: false,
    teenFlowMonthly: [1184.9, 1168.1, 1270.4, 1153.3, 1110.3, 1165.0, 1055.6, 1004.9, 1134.6, 996.6, 1079.7, 1027.3, 1058.6, 1061.3, 1257.0, 1275.4, 1232.9, 1282.3],
    academyCount2025: 145,
    academyCount2026: 145,
    academyNew: 16,
    academyGone: 16,
  },
  {
    areaName: "반곡동",
    schoolAgePopulation2025: 4904,
    boundaryChanged: true,
    teenFlowMonthly: [1539.0, 1547.3, 1526.4, 1318.7, 1213.1, 1214.3, 1121.1, 1047.3, 1228.6, 1080.0, 1210.7, 1159.4, 1254.9, 1210.4, 1498.1, 1465.3, 1373.9, 1530.7],
    academyCount2025: 89,
    academyCount2026: 87,
    academyNew: 11,
    academyGone: 13,
  },
  {
    areaName: "보람동",
    schoolAgePopulation2025: 4151,
    boundaryChanged: false,
    teenFlowMonthly: [1343.0, 1439.9, 1456.7, 1249.0, 1264.7, 1234.0, 1074.1, 1071.1, 1077.1, 1138.4, 1226.6, 1224.9, 1194.9, 1150.4, 1338.1, 1348.6, 1294.7, 1403.3],
    academyCount2025: 159,
    academyCount2026: 172,
    academyNew: 28,
    academyGone: 15,
  },
  {
    areaName: "대평동",
    schoolAgePopulation2025: 1856,
    boundaryChanged: false,
    teenFlowMonthly: [622.4, 629.6, 651.6, 520.7, 568.1, 551.1, 510.4, 498.6, 463.6, 476.9, 495.3, 496.1, 481.1, 499.3, 505.1, 502.9, 530.9, 518.3],
    academyCount2025: 49,
    academyCount2026: 47,
    academyNew: 3,
    academyGone: 5,
  },
  {
    areaName: "다정동",
    schoolAgePopulation2025: 6223,
    boundaryChanged: false,
    teenFlowMonthly: [1733.4, 1864.1, 1876.3, 1780.7, 1730.3, 1760.9, 1662.1, 1478.9, 1609.9, 1417.3, 1535.7, 1503.1, 1495.1, 1450.9, 1681.9, 1697.7, 1666.7, 1799.4],
    academyCount2025: 114,
    academyCount2026: 121,
    academyNew: 16,
    academyGone: 9,
  },
];

export function getAcademyChangeByArea(areaName: string) {
  return academyChangeData.find(
    item => item.areaName === areaName,
  );
}
