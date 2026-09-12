import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

declare global {
  interface Window {
    kakao: any;
  }
}

export interface MapMarkerData {
  name: string;
  latitude: number;
  longitude: number;
}

interface AddressMapProps {
  latitude: number;
  longitude: number;
  markers?: MapMarkerData[];

  // 지도 클릭 허용
  selectable?: boolean;

  // 지도 클릭 좌표 반환
  onMapPress?: (
    latitude: number,
    longitude: number,
  ) => void;

  // 현재 직접 선택 중인 위치
  selectedPoint?: {
    latitude: number;
    longitude: number;
  } | null;

  // 선택 위치 반경
  radius?: number;
}

const KAKAO_JS_KEY =
  process.env.EXPO_PUBLIC_KAKAO_JS_KEY;

export default function AddressMap({
  latitude,
  longitude,
  markers = [],
  selectable = false,
  onMapPress,
  selectedPoint = null,
  radius = 500,
}: AddressMapProps) {
  const mapRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!KAKAO_JS_KEY) {
      console.error(
        'EXPO_PUBLIC_KAKAO_JS_KEY가 없습니다.',
      );
      return;
    }

    const createMap = () => {
      if (
        cancelled ||
        !mapRef.current ||
        !window.kakao?.maps
      ) {
        return;
      }

      window.kakao.maps.load(() => {
        if (
          cancelled ||
          !mapRef.current
        ) {
          return;
        }

        const center =
          new window.kakao.maps.LatLng(
            selectedPoint?.latitude ??
              latitude,
            selectedPoint?.longitude ??
              longitude,
          );

        const map =
          new window.kakao.maps.Map(
            mapRef.current,
            {
              center,
              level:
                selectedPoint
                  ? 4
                  : markers.length === 1
                    ? 4
                    : 7,
            },
          );

        const bounds =
          new window.kakao.maps.LatLngBounds();

        /**
         * 기존 선택 지역 마커
         */
        markers.forEach(item => {
          const position =
            new window.kakao.maps.LatLng(
              item.latitude,
              item.longitude,
            );

          new window.kakao.maps.Marker({
            map,
            position,
          });

          const label =
            document.createElement('div');

          label.innerText = item.name;

          Object.assign(
            label.style,
            {
              background: '#FFFFFF',
              border:
                '1px solid #22A447',
              borderRadius: '12px',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#16883A',
              whiteSpace: 'nowrap',
              boxShadow:
                '0 2px 7px rgba(0,0,0,0.12)',
            },
          );

          new window.kakao.maps.CustomOverlay({
            map,
            position,
            content: label,
            yAnchor: 2.5,
          });

          bounds.extend(position);
        });

        /**
         * 사용자가 지도에서 직접 찍은 위치
         */
        if (selectedPoint) {
          const pointPosition =
            new window.kakao.maps.LatLng(
              selectedPoint.latitude,
              selectedPoint.longitude,
            );

          new window.kakao.maps.Marker({
            map,
            position: pointPosition,
          });

          /**
           * 반경 원
           */
          new window.kakao.maps.Circle({
            map,
            center: pointPosition,
            radius,
            strokeWeight: 2,
            strokeColor: '#22A447',
            strokeOpacity: 0.8,
            fillColor: '#A7F3B5',
            fillOpacity: 0.25,
          });

          map.setCenter(pointPosition);
        } else if (
          markers.length > 1
        ) {
          map.setBounds(bounds);
        }

        /**
         * 지도 클릭
         */
        if (
          selectable &&
          onMapPress
        ) {
          window.kakao.maps.event.addListener(
            map,
            'click',
            (mouseEvent: any) => {
              const latLng =
                mouseEvent.latLng;

              onMapPress(
                latLng.getLat(),
                latLng.getLng(),
              );
            },
          );
        }
      });
    };

    if (window.kakao?.maps) {
      createMap();

      return () => {
        cancelled = true;
      };
    }

    const existingScript =
      document.getElementById(
        'kakao-map-script',
      ) as HTMLScriptElement | null;

    if (existingScript) {
      const handleLoad = () => {
        createMap();
      };

      existingScript.addEventListener(
        'load',
        handleLoad,
      );

      setTimeout(() => {
        if (window.kakao?.maps) {
          createMap();
        }
      }, 300);

      return () => {
        cancelled = true;

        existingScript.removeEventListener(
          'load',
          handleLoad,
        );
      };
    }

    const script =
      document.createElement('script');

    script.id =
      'kakao-map-script';

    script.src =
      `https://dapi.kakao.com/v2/maps/sdk.js` +
      `?appkey=${KAKAO_JS_KEY}` +
      `&autoload=false`;

    script.async = true;

    script.onload = () => {
      createMap();
    };

    script.onerror =
      error => {
        console.error(
          'Kakao Map SDK 로드 실패:',
          error,
        );
      };

    document.head.appendChild(
      script,
    );

    return () => {
      cancelled = true;
    };
  }, [
    latitude,
    longitude,
    markers,
    selectable,
    selectedPoint,
    radius,
    onMapPress,
  ]);

  if (!KAKAO_JS_KEY) {
    return (
      <View
        style={
          styles.errorContainer
        }
      >
        <Text
          style={
            styles.errorTitle
          }
        >
          지도 API 키가 없습니다
        </Text>

        <Text
          style={
            styles.errorText
          }
        >
          EXPO_PUBLIC_KAKAO_JS_KEY를
          확인해주세요.
        </Text>
      </View>
    );
  }

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: 320,
        cursor: selectable
          ? 'crosshair'
          : 'default',
      }}
    />
  );
}

const styles =
  StyleSheet.create({
    errorContainer: {
      width: '100%',
      height: 320,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F5F7F5',
    },

    errorTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: '#111111',
      marginBottom: 6,
    },

    errorText: {
      fontSize: 12,
      color: '#6B7280',
    },
  });