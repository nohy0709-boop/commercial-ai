import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { Coordinates } from '@/services/geocoding';

type Props = {
  coords?: Coordinates;
  areaName: string;
  score: number;
};

export default function CardMapThumbnail({ coords, areaName, score }: Props) {
  if (!coords) {
    return <View style={styles.fallback}><Text style={styles.fallbackText}>위치 좌표를 찾지 못했어요</Text></View>;
  }
  return (
    <View style={[styles.wrap, { pointerEvents: 'none' }]}>
      <MapView
        style={styles.map}
        region={{ latitude: coords.lat, longitude: coords.lng, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        toolbarEnabled={false}
      >
        <Marker coordinate={{ latitude: coords.lat, longitude: coords.lng }} title={areaName} />
      </MapView>
      <View style={styles.labelWrap}>
        <Text style={styles.label}>{areaName} · {Number(score).toFixed(1)}점</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 150, width: '100%', position: 'relative' },
  map: { height: '100%', width: '100%' },
  fallback: { height: 150, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F6FC' },
  fallbackText: { color: '#7E8BA3', fontSize: 12 },
  labelWrap: { position: 'absolute', top: 10, left: 0, right: 0, alignItems: 'center' },
  label: { color: '#202544', fontSize: 12, fontWeight: '900', backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#202544', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, overflow: 'hidden' },
});
