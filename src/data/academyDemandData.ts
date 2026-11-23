/**
 * 학원 분석의 수요(분모) 데이터
 *
 * - schoolAgePopulation: 6~19세 주민등록 인구(명, 초·중·고 연령 + 재수 가능 연령 1년)
 *   출처: 행정안전부 주민등록 인구통계 (행정동별 연령별 인구현황, 1세 단위), 2026년 10월 말 기준
 * - teenAfterSchoolFloating: 10대(10~19세) 남녀 합계 유동인구의
 *   방과후 시간대(15~21시) 시간대별 일평균 값의 평균(명), 2026년 6월
 *   출처: 세종특별자치시 「행정동별 유동인구 현황」(공공데이터포털)
 *
 * 주의
 * - 반곡동: 2026년 7월 20일 집현동이 신설되며 행정동 경계가 바뀌었습니다.
 *   학령인구는 변경 후(2026년 10월) 경계이고, 유동인구는 변경 전(2026년 6월) 경계입니다.
 * - 학령인구는 주소지 기준이라 다른 동에 살면서 이 동 학원에 다니는 학생은 잡히지 않습니다.
 * - 방과후 시간대(15~21시)와 연령 범위(6~19세)는 분석을 위해 정한 가정입니다.
 */
export type AcademyDemandData = {
  areaName: string;
  schoolAgePopulation: number;
  teenAfterSchoolFloating: number;
};

export const academyDemandData: AcademyDemandData[] = [
  {
    areaName: "한솔동",
    schoolAgePopulation: 3771,
    teenAfterSchoolFloating: 954.0,
  },
  {
    areaName: "새롬동",
    schoolAgePopulation: 6314,
    teenAfterSchoolFloating: 1469.9,
  },
  {
    areaName: "나성동",
    schoolAgePopulation: 2555,
    teenAfterSchoolFloating: 2020.9,
  },
  {
    areaName: "도담동",
    schoolAgePopulation: 4722,
    teenAfterSchoolFloating: 1342.0,
  },
  {
    areaName: "어진동",
    schoolAgePopulation: 2118,
    teenAfterSchoolFloating: 1982.0,
  },
  {
    areaName: "해밀동",
    schoolAgePopulation: 5286,
    teenAfterSchoolFloating: 859.0,
  },
  {
    areaName: "아름동",
    schoolAgePopulation: 5392,
    teenAfterSchoolFloating: 3335.6,
  },
  {
    areaName: "종촌동",
    schoolAgePopulation: 5483,
    teenAfterSchoolFloating: 2148.3,
  },
  {
    areaName: "고운동",
    schoolAgePopulation: 7953,
    teenAfterSchoolFloating: 2889.0,
  },
  {
    areaName: "소담동",
    schoolAgePopulation: 4291,
    teenAfterSchoolFloating: 1282.3,
  },
  {
    areaName: "반곡동",
    schoolAgePopulation: 2778,
    teenAfterSchoolFloating: 1530.7,
  },
  {
    areaName: "보람동",
    schoolAgePopulation: 4063,
    teenAfterSchoolFloating: 1403.3,
  },
  {
    areaName: "대평동",
    schoolAgePopulation: 1819,
    teenAfterSchoolFloating: 518.3,
  },
  {
    areaName: "다정동",
    schoolAgePopulation: 6115,
    teenAfterSchoolFloating: 1799.4,
  },
];

export function getAcademyDemandByArea(areaName: string) {
  return academyDemandData.find(
    item => item.areaName === areaName,
  );
}
