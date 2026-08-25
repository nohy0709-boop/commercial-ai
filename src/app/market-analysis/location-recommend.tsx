import { COLORS } from "@/constants/colors";
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

  // 보유 입지는 한 곳을 기준으로 분석
  const [selectedRegion, setSelectedRegion] =
    useState<string | null>(null);

  const handleAnalyze = () => {
    if (!selectedRegion) {
      return;
    }

    router.push({
      pathname:
        "/market-analysis/location-recommend-result",
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
        onPress={() =>
          router.push("/market-analysis/address-input")
        }
      >
        <Text style={styles.addressButtonText}>
          주소로 찾기
        </Text>
      </TouchableOpacity>

      <Text style={styles.title}>
        보유 입지 업종 추천
      </Text>

      <Text style={styles.description}>
        보유하고 있는 지역을 선택하면 해당 입지에 적합한
        창업 업종을 추천해드립니다.
      </Text>

      <Text style={styles.sectionTitle}>
        보유 지역 선택
      </Text>

      <FlatList
        data={sejongAreas}
        keyExtractor={item => item.code}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const selected =
            selectedRegion === item.name;

          return (
            <TouchableOpacity
              style={[
                styles.item,
                selected && styles.itemSelected,
              ]}
              activeOpacity={0.7}
              onPress={() =>
                setSelectedRegion(item.name)
              }
            >
              <View>
                <Text
                  style={[
                    styles.itemText,
                    selected &&
                      styles.itemTextSelected,
                  ]}
                >
                  {item.name}
                </Text>

                <Text style={styles.itemDescription}>
                  세종특별자치시 {item.name}
                </Text>
              </View>

              <View
                style={[
                  styles.checkCircle,
                  selected &&
                    styles.checkCircleSelected,
                ]}
              >
                {selected && (
                  <Text style={styles.checkMark}>
                    ✓
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity
        style={[
          styles.analyzeButton,
          !selectedRegion &&
            styles.analyzeButtonDisabled,
        ]}
        activeOpacity={0.7}
        disabled={!selectedRegion}
        onPress={handleAnalyze}
      >
        <Text
          style={[
            styles.analyzeButtonText,
            !selectedRegion &&
              styles.analyzeButtonTextDisabled,
          ]}
        >
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
    backgroundColor: COLORS.background,
  },

  addressButton: {
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
    alignItems: "center",
  },

  addressButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
  },

  title: {
    fontSize: 25,
    fontWeight: "900",
    color: COLORS.text,
    marginTop: 12,
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 28,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 15,
  },

  listContent: {
    paddingBottom: 8,
  },

  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    backgroundColor: COLORS.surface,
  },

  itemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#F1FFF5",
  },

  itemText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },

  itemTextSelected: {
    color: COLORS.primary,
  },

  itemDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  checkCircleSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },

  checkMark: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  analyzeButton: {
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: COLORS.neonLime,
    alignItems: "center",
  },

  analyzeButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },

  analyzeButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
  },

  analyzeButtonTextDisabled: {
    color: "#9CA3AF",
  },
});