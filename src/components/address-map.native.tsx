import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

interface AddressMapProps {
  latitude: number;
  longitude: number;
}

export default function AddressMap({
  latitude,
  longitude,
}: AddressMapProps) {
  return (
    <MapView
      style={styles.map}
      region={{
        latitude,
        longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }}>
      <Marker
        coordinate={{
          latitude,
          longitude,
        }}
      />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 240,
    borderRadius: 12,
  },
});