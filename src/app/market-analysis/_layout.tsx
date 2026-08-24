import { Stack } from 'expo-router';

export default function MarketAnalysisLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{title: '장기 상권 분석'}} />
      <Stack.Screen name="industry" options={{title: '업종 선택'}} />
      <Stack.Screen name="region" options={{title: '지역 선택'}} />
      <Stack.Screen name="result" options={{title: '분석 결과'}} />
      <Stack.Screen
        name="location-recommend"
        options={{title: '보유 장소 선택'}}
      />
      <Stack.Screen
        name="location-recommend-result"
        options={{title: '업종 추천 순위'}}
      />
      <Stack.Screen
        name="suitability"
        options={{title: '적합성 분석'}}
      />
    </Stack>
  );
}