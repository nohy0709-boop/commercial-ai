export type AccessibilityData = {
  areaName: string;
  busStopCount: number;
};

export const accessibilityData: AccessibilityData[] = [
  { areaName: "한솔동", busStopCount: 18 },
  { areaName: "새롬동", busStopCount: 25 },
  { areaName: "나성동", busStopCount: 38 },
  { areaName: "도담동", busStopCount: 32 },
  { areaName: "어진동", busStopCount: 45 },
  { areaName: "해밀동", busStopCount: 29 },
  { areaName: "아름동", busStopCount: 24 },
  { areaName: "종촌동", busStopCount: 20 },
  { areaName: "고운동", busStopCount: 49 },
  { areaName: "소담동", busStopCount: 25 },
  { areaName: "반곡동", busStopCount: 78 },
  { areaName: "보람동", busStopCount: 21 },
  { areaName: "대평동", busStopCount: 16 },
  { areaName: "다정동", busStopCount: 14 },
];

export function getAccessibilityByArea(areaName: string) {
  return accessibilityData.find(
    (item) => item.areaName === areaName
  );
}