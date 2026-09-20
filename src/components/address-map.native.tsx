import {
  StyleSheet,
} from 'react-native';

import MapView, {
  Circle,
  MapPressEvent,
  Marker,
} from 'react-native-maps';

export interface MapMarkerData {
  name: string;
  latitude: number;
  longitude: number;
}

interface AddressMapProps {
  latitude: number;
  longitude: number;

  markers?: MapMarkerData[];

  selectable?: boolean;

  onMapPress?: (
    latitude: number,
    longitude: number,
  ) => void;

  selectedPoint?: {
    latitude: number;
    longitude: number;
  } | null;

  radius?: number;
}

export default function AddressMap({
  latitude,
  longitude,
  markers = [],
  selectable = false,
  onMapPress,
  selectedPoint = null,
  radius = 500,
}: AddressMapProps) {
  const handlePress = (
    event: MapPressEvent,
  ) => {
    if (
      !selectable ||
      !onMapPress
    ) {
      return;
    }

    const {
      latitude,
      longitude,
    } =
      event.nativeEvent.coordinate;

    onMapPress(
      latitude,
      longitude,
    );
  };

  return (
    <MapView
      style={styles.map}
      region={{
        latitude:
          selectedPoint?.latitude ??
          latitude,

        longitude:
          selectedPoint?.longitude ??
          longitude,

        latitudeDelta:
          selectedPoint
            ? 0.02
            : 0.09,

        longitudeDelta:
          selectedPoint
            ? 0.02
            : 0.09,
      }}
      onPress={handlePress}
    >
      {markers.map(marker => (
        <Marker
          key={`${marker.name}-${marker.latitude}-${marker.longitude}`}
          title={marker.name}
          coordinate={{
            latitude:
              marker.latitude,

            longitude:
              marker.longitude,
          }}
        />
      ))}

      {selectedPoint && (
        <>
          <Marker
            title="선택한 위치"
            coordinate={{
              latitude:
                selectedPoint.latitude,

              longitude:
                selectedPoint.longitude,
            }}
          />

          <Circle
            center={{
              latitude:
                selectedPoint.latitude,

              longitude:
                selectedPoint.longitude,
            }}
            radius={radius}
            strokeWidth={2}
            strokeColor="rgba(34,164,71,0.8)"
            fillColor="rgba(34,164,71,0.18)"
          />
        </>
      )}
    </MapView>
  );
}

const styles =
  StyleSheet.create({
    map: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
  });