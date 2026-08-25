import { sejongAreas } from "@/constants/sejongAreas";
import { useRouter } from "expo-router";
import React, { useState } from "react";

import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function LocationRecommendScreen() {
  const router = useRouter();

  // 보유 장소를 지역 기반으로 분석
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const handleAnalyze = () => {
    if (!selectedRegion) {
      return;
    }

    router.push({
      pathname: "/market-analysis/location-recommend-result",
      params: {
        region: selectedRegion,
      },
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addressButton}
        activeOpacity={0.7}
        onPress={() => router.push('/market-analysis/address-input')}>
        <Text style={styles.addressButtonText}>주소로 찾기</Text>
      </TouchableOpacity>

      <Text style={styles.title}>보유 장소 업종 추천</Text>

      <Text style={styles.description}>
        보유하고 있는 지역을 선택하시면 해당 위치에 적합한 창업 업종을
        추천해드립니다.
      </Text>

      <Text style={styles.sectionTitle}>보유 지역 선택</Text>

      <FlatList
        data={sejongAreas}
        keyExtractor={(item) => item.code}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const selected = selectedRegion === item.name;

          return (
            <TouchableOpacity
              style={[styles.item, selected && styles.itemSelected]}
              activeOpacity={0.7}
              onPress={() => setSelectedRegion(item.name)}
            >
              <View>
                <Text
                  style={[
                    styles.itemText,
                    selected && styles.itemTextSelected,
                  ]}
                >
                  {item.name}
                </Text>

                <Text style={styles.itemDescription}>
                  {`세종특별자치시 ${item.name}`}
                </Text>
              </View>

              {selected && <Text style={styles.checkMark}>✓</Text>}
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity
        style={[
          styles.analyzeButton,
          !selectedRegion && styles.analyzeButtonDisabled,
        ]}
        activeOpacity={0.7}
        disabled={!selectedRegion}
        onPress={handleAnalyze}
      >
        <Text style={styles.analyzeButtonText}>
          {selectedRegion
            ? `${selectedRegion} 업종 추천받기`
            : "지역을 선택해주세요"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFFFFF",
  },

  addressButton: {
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1D4ED8",
    alignItems: "center",
  },

  addressButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1D4ED8",
  },

  title: {
    fontSize: 25,
    fontWeight: "800",
    marginTop: 12,
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
    color: "#777",
    marginTop: 8,
    marginBottom: 28,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
  },

  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#E0E0E0",

    borderRadius: 12,

    paddingVertical: 16,
    paddingHorizontal: 16,

    marginBottom: 10,

    backgroundColor: "#F8F9FA",
  },

  itemSelected: {
    borderColor: "#1D4ED8",
    backgroundColor: "#EAF2FF",
  },

  itemText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  itemTextSelected: {
    color: "#1D4ED8",
  },

  itemDescription: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },

  checkMark: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1D4ED8",
  },

  analyzeButton: {
    marginTop: 12,
    paddingVertical: 16,

    borderRadius: 12,

    backgroundColor: "#1D4ED8",

    alignItems: "center",
  },

  analyzeButtonDisabled: {
    backgroundColor: "#C6D3EE",
  },

  analyzeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});