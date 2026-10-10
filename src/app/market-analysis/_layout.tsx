import { Stack } from 'expo-router';

export default function MarketAnalysisLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />

      <Stack.Screen name="industry" />

      <Stack.Screen name="region" />

      <Stack.Screen name="region-result" />

      <Stack.Screen name="region-result-detail" />

      <Stack.Screen name="result" />

      <Stack.Screen name="location-recommend" />

      <Stack.Screen name="location-recommend-result" />

      <Stack.Screen name="suitability" />

      <Stack.Screen name="suitability-region" />

      <Stack.Screen name="address-input" />
    </Stack>
  );
}