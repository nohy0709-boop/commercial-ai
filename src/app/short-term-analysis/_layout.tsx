import { Stack } from 'expo-router';

export default function ShortTermAnalysisLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{title: '단기 상권 분석'}} />
      <Stack.Screen name="field" options={{title: '운영 분야 선택'}} />
      <Stack.Screen name="event" options={{title: '행사 선택'}} />
      <Stack.Screen name="field-result" options={{title: '행사 적합도 순위'}} />
      <Stack.Screen
        name="event-recommend"
        options={{title: '행사/지역 선택'}}
      />
      <Stack.Screen
        name="event-recommend-result"
        options={{title: '운영 분야 추천 순위'}}
      />
    </Stack>
  );
}