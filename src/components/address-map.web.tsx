import React from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';

type AddressMapProps = {
  latitude: number;
  longitude: number;
};

export default function AddressMap({
  latitude,
  longitude,
}: AddressMapProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        지도 미리보기
      </Text>

      <Text style={styles.description}>
        지도는 모바일 환경에서 표시됩니다.
      </Text>

      <Text style={styles.coordinate}>
        위도 {latitude.toFixed(5)}
      </Text>

      <Text style={styles.coordinate}>
        경도 {longitude.toFixed(5)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 260,

    justifyContent: 'center',
    alignItems: 'center',

    padding: 20,

    borderRadius: 18,

    backgroundColor: '#F7F9F7',

    borderWidth: 1,
    borderColor: '#E9ECEF',
  },

  title: {
    fontSize: 17,
    fontWeight: '900',

    color: '#111111',

    marginBottom: 8,
  },

  description: {
    fontSize: 13,

    color: '#6B7280',

    marginBottom: 14,
  },

  coordinate: {
    fontSize: 12,
    fontWeight: '700',

    color: '#12A84F',

    marginTop: 3,
  },
});