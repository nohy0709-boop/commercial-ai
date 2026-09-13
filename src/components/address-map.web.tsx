import React, {
  useEffect,
  useRef,
} from 'react';

import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

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

  selectedPointLabel?: string;

  radius?: number;
}

declare global {
  interface Window {
    kakao: any;
  }
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
  selectedPointLabel,
  radius = 500,
}: AddressMapProps) {
  const mapContainerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const mapRef =
    useRef<any>(null);

  /**
   * Kakao Map SDK
   */
  useEffect(() => {
    if (!KAKAO_JS_KEY) {
      console.error(
        'EXPO_PUBLIC_KAKAO_JS_KEY가 없습니다.',
      );

      return;
    }

    const initializeMap = () => {
      if (
        !window.kakao ||
        !window.kakao.maps
      ) {
        return;
      }

      window.kakao.maps.load(() => {
        if (
          !mapContainerRef.current
        ) {
          return;
        }

        const center =
          new window.kakao.maps.LatLng(
            latitude,
            longitude,
          );

        if (!mapRef.current) {
          mapRef.current =
            new window.kakao.maps.Map(
              mapContainerRef.current,
              {
                center,
                level: 4,
              },
            );
        }
      });
    };

    if (
      window.kakao &&
      window.kakao.maps
    ) {
      initializeMap();

      return;
    }

    const existingScript =
      document.getElementById(
        'kakao-map-sdk',
      ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener(
        'load',
        initializeMap,
      );

      return () => {
        existingScript.removeEventListener(
          'load',
          initializeMap,
        );
      };
    }

    const script =
      document.createElement(
        'script',
      );

    script.id =
      'kakao-map-sdk';

    script.async = true;

    script.src =
      `https://dapi.kakao.com/v2/maps/sdk.js` +
      `?appkey=${KAKAO_JS_KEY}` +
      `&autoload=false`;

    script.onload =
      initializeMap;

    script.onerror = () => {
      console.error(
        'Kakao Maps SDK 로드 실패',
      );
    };

    document.head.appendChild(
      script,
    );
  }, []);

  /**
   * ★ 항상 부모가 넘겨준
   * latitude / longitude를 중심으로 사용
   *
   * selectedPoint가 있다고 해서
   * 파란핀 위치로 강제로 되돌리지 않음.
   */
  useEffect(() => {
    if (
      !mapRef.current ||
      !window.kakao
    ) {
      return;
    }

    const center =
      new window.kakao.maps.LatLng(
        latitude,
        longitude,
      );

    mapRef.current.setCenter(
      center,
    );
  }, [
    latitude,
    longitude,
  ]);

  /**
   * 마커 / 원 / 라벨
   */
  useEffect(() => {
    if (
      !mapRef.current ||
      !window.kakao
    ) {
      return;
    }

    const map =
      mapRef.current;

    const createdOverlays: any[] =
      [];

    let selectedCircle:
      | any
      | null = null;

    /**
     * =============================
     * 동 전체 초록핀
     * =============================
     */
    markers.forEach(
      markerData => {
        const position =
          new window.kakao.maps.LatLng(
            markerData.latitude,
            markerData.longitude,
          );

        const content = `
          <div
            style="
              display:flex;
              flex-direction:column;
              align-items:center;
              justify-content:flex-end;
              pointer-events:none;
            "
          >
            <div
              style="
                margin-bottom:6px;
                background:#FFFFFF;
                border:2px solid #22A447;
                border-radius:999px;
                padding:6px 12px;
                font-size:12px;
                font-weight:800;
                color:#168A37;
                white-space:nowrap;
                box-shadow:0 2px 7px rgba(0,0,0,0.15);
              "
            >
              ${markerData.name}
            </div>

            <div
              style="
                width:36px;
                height:36px;
                background:#22A447;
                border:3px solid #FFFFFF;
                border-radius:50% 50% 50% 0;
                transform:rotate(-45deg);
                box-shadow:0 3px 8px rgba(0,0,0,0.28);
                display:flex;
                align-items:center;
                justify-content:center;
              "
            >
              <div
                style="
                  width:10px;
                  height:10px;
                  background:#FFFFFF;
                  border-radius:50%;
                "
              ></div>
            </div>
          </div>
        `;

        const overlay =
          new window.kakao.maps.CustomOverlay({
            map,
            position,
            content,
            xAnchor: 0.5,
            yAnchor: 1,
          });

        createdOverlays.push(
          overlay,
        );
      },
    );

    /**
     * =============================
     * 지도 직접 선택 파란핀
     * =============================
     */
    if (selectedPoint) {
      const pointPosition =
        new window.kakao.maps.LatLng(
          selectedPoint.latitude,
          selectedPoint.longitude,
        );

      const label =
        selectedPointLabel ||
        '선택한 위치';

      const selectedContent = `
        <div
          style="
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:flex-end;
            pointer-events:none;
          "
        >
          <div
            style="
              margin-bottom:6px;
              background:#FFFFFF;
              border:2px solid #4285F4;
              border-radius:999px;
              padding:6px 12px;
              font-size:12px;
              font-weight:800;
              color:#2563EB;
              white-space:nowrap;
              box-shadow:0 2px 7px rgba(0,0,0,0.15);
            "
          >
            ${label}
          </div>

          <div
            style="
              width:36px;
              height:36px;
              background:#4285F4;
              border:3px solid #FFFFFF;
              border-radius:50% 50% 50% 0;
              transform:rotate(-45deg);
              box-shadow:0 3px 8px rgba(0,0,0,0.28);
              display:flex;
              align-items:center;
              justify-content:center;
            "
          >
            <div
              style="
                width:10px;
                height:10px;
                background:#FFFFFF;
                border-radius:50%;
              "
            ></div>
          </div>
        </div>
      `;

      const selectedOverlay =
        new window.kakao.maps.CustomOverlay({
          map,
          position:
            pointPosition,
          content:
            selectedContent,
          xAnchor: 0.5,
          yAnchor: 1,
        });

      createdOverlays.push(
        selectedOverlay,
      );

      /**
       * 반경 원
       */
      selectedCircle =
        new window.kakao.maps.Circle({
          map,

          center:
            pointPosition,

          radius,

          strokeWeight: 2,

          strokeColor:
            '#22A447',

          strokeOpacity:
            0.85,

          strokeStyle:
            'solid',

          fillColor:
            '#A7F3B5',

          fillOpacity:
            0.25,
        });

      /**
       * 중요:
       *
       * 여기서 map.setCenter(pointPosition)
       * 절대 하지 않음.
       *
       * 지도 중심은 무조건
       * region.tsx의 mapCenter가 결정함.
       */

      /**
       * 반경을 바꿀 때만
       * 줌 정도 조절
       */
      if (radius === 300) {
        map.setLevel(3);
      } else if (
        radius === 500
      ) {
        map.setLevel(4);
      } else {
        map.setLevel(5);
      }
    } else {
      /**
       * 파란핀 없을 때
       * 일반 동 선택 확대 수준
       */
      if (
        markers.length > 0
      ) {
        map.setLevel(4);
      }
    }

    /**
     * 지도 클릭
     */
    const handleClick = (
      mouseEvent: any,
    ) => {
      if (
        !selectable ||
        !onMapPress
      ) {
        return;
      }

      const latLng =
        mouseEvent.latLng;

      onMapPress(
        latLng.getLat(),
        latLng.getLng(),
      );
    };

    if (
      selectable &&
      onMapPress
    ) {
      window.kakao.maps.event.addListener(
        map,
        'click',
        handleClick,
      );
    }

    return () => {
      createdOverlays.forEach(
        overlay => {
          overlay.setMap(null);
        },
      );

      if (
        selectedCircle
      ) {
        selectedCircle.setMap(
          null,
        );
      }

      if (
        selectable &&
        onMapPress
      ) {
        window.kakao.maps.event.removeListener(
          map,
          'click',
          handleClick,
        );
      }
    };
  }, [
    markers,
    selectedPoint,
    selectedPointLabel,
    radius,
    selectable,
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
            styles.errorText
          }
        >
          Kakao 지도 API 키를 확인해주세요.
        </Text>
      </View>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: 250,
      }}
    />
  );
}

const styles =
  StyleSheet.create({
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F7F7F7',
    },

    errorText: {
      fontSize: 13,
      color: '#DC2626',
    },
  });