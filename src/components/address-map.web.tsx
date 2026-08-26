import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AddressMapProps {
  latitude: number;
  longitude: number;
}

export default function AddressMap({
  latitude,
  longitude,
}: AddressMapProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📍</Text>

      <Text style={styles.title}>검색된 위치</Text>

      <Text style={styles.coordinate}>
        위도 {latitude.toFixed(6)}
      </Text>

      <Text style={styles.coordinate}>
        경도 {longitude.toFixed(6)}
      </Text>

      <Text style={styles.description}>
        지도는 모바일 앱에서 확인할 수 있습니다.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 240,
    marginTop: 12,

    backgroundColor: '#F7F9F7',

    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 16,

    justifyContent: 'center',
    alignItems: 'center',
  },

  icon: {
    fontSize: 32,
    marginBottom: 8,
  },

  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 8,
  },

  coordinate: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 3,
  },

  description: {
    marginTop: 10,
    fontSize: 12,
    color: '#9CA3AF',
  },
});