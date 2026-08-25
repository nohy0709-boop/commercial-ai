export type PopulationData = {
  areaName: string;

  livingPopulation: number;
  floatingPopulation: number;

  previousLivingPopulation: number;
  previousFloatingPopulation: number;

  livingPopulationChangeRate: number;
  floatingPopulationChangeRate: number;
};

export const populationData: PopulationData[] = [
  {
    areaName: "한솔동",
    livingPopulation: 14061,
    floatingPopulation: 63268,
    previousLivingPopulation: 14069,
    previousFloatingPopulation: 68052,
    livingPopulationChangeRate: -0.06,
    floatingPopulationChangeRate: -7.03,
  },
  {
    areaName: "새롬동",
    livingPopulation: 19481,
    floatingPopulation: 62253,
    previousLivingPopulation: 18772,
    previousFloatingPopulation: 62663,
    livingPopulationChangeRate: 3.78,
    floatingPopulationChangeRate: -0.65,
  },
  {
    areaName: "나성동",
    livingPopulation: 18807,
    floatingPopulation: 141491,
    previousLivingPopulation: 17989,
    previousFloatingPopulation: 135113,
    livingPopulationChangeRate: 4.55,
    floatingPopulationChangeRate: 4.72,
  },
  {
    areaName: "도담동",
    livingPopulation: 17267,
    floatingPopulation: 76174,
    previousLivingPopulation: 16414,
    previousFloatingPopulation: 79466,
    livingPopulationChangeRate: 5.2,
    floatingPopulationChangeRate: -4.14,
  },
  {
    areaName: "어진동",
    livingPopulation: 31096,
    floatingPopulation: 180023,
    previousLivingPopulation: 30374,
    previousFloatingPopulation: 181213,
    livingPopulationChangeRate: 2.38,
    floatingPopulationChangeRate: -0.66,
  },
  {
    areaName: "해밀동",
    livingPopulation: 15772,
    floatingPopulation: 43891,
    previousLivingPopulation: 14808,
    previousFloatingPopulation: 41356,
    livingPopulationChangeRate: 6.51,
    floatingPopulationChangeRate: 6.13,
  },
  {
    areaName: "아름동",
    livingPopulation: 31965,
    floatingPopulation: 144273,
    previousLivingPopulation: 32328,
    previousFloatingPopulation: 152362,
    livingPopulationChangeRate: -1.12,
    floatingPopulationChangeRate: -5.31,
  },
  {
    areaName: "종촌동",
    livingPopulation: 16913,
    floatingPopulation: 97762,
    previousLivingPopulation: 17060,
    previousFloatingPopulation: 100563,
    livingPopulationChangeRate: -0.86,
    floatingPopulationChangeRate: -2.79,
  },
  {
    areaName: "고운동",
    livingPopulation: 30302,
    floatingPopulation: 117818,
    previousLivingPopulation: 27993,
    previousFloatingPopulation: 126249,
    livingPopulationChangeRate: 8.25,
    floatingPopulationChangeRate: -6.68,
  },
  {
    areaName: "소담동",
    livingPopulation: 13568,
    floatingPopulation: 62723,
    previousLivingPopulation: 12909,
    previousFloatingPopulation: 65543,
    livingPopulationChangeRate: 5.1,
    floatingPopulationChangeRate: -4.3,
  },
  {
    areaName: "반곡동",
    livingPopulation: 23959,
    floatingPopulation: 92518,
    previousLivingPopulation: 22177,
    previousFloatingPopulation: 88488,
    livingPopulationChangeRate: 8.04,
    floatingPopulationChangeRate: 4.55,
  },
  {
    areaName: "보람동",
    livingPopulation: 13730,
    floatingPopulation: 76508,
    previousLivingPopulation: 12638,
    previousFloatingPopulation: 77224,
    livingPopulationChangeRate: 8.64,
    floatingPopulationChangeRate: -0.93,
  },
  {
    areaName: "대평동",
    livingPopulation: 9755,
    floatingPopulation: 44885,
    previousLivingPopulation: 10017,
    previousFloatingPopulation: 50857,
    livingPopulationChangeRate: -2.62,
    floatingPopulationChangeRate: -11.74,
  },
  {
    areaName: "다정동",
    livingPopulation: 12570,
    floatingPopulation: 76168,
    previousLivingPopulation: 11444,
    previousFloatingPopulation: 78990,
    livingPopulationChangeRate: 9.84,
    floatingPopulationChangeRate: -3.57,
  },
];

export function getPopulationByArea(areaName: string) {
  return populationData.find(
    (item) => item.areaName === areaName
  );
}