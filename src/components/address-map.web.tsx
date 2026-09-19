import {
  useEffect,
  useRef,
  useState,
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
    useRef<any>(
      null,
    );

  /**
   * 지도 생성 완료 여부
   */
  const [
    mapReady,
    setMapReady,
  ] =
    useState(
      false,
    );

  /**
   * =====================================================
   * Kakao SDK + 지도 최초 생성
   * =====================================================
   */
  useEffect(() => {
    if (!KAKAO_JS_KEY) {
      console.error(
        'EXPO_PUBLIC_KAKAO_JS_KEY가 없습니다.',
      );

      return;
    }

    const initializeMap =
      () => {
        if (
          !window.kakao ||
          !window.kakao.maps
        ) {
          return;
        }

        window.kakao.maps.load(
          () => {
            if (
              !mapContainerRef.current
            ) {
              return;
            }

            /**
             * 이미 생성됐으면
             * 다시 생성하지 않음
             */
            if (mapRef.current) {
              setMapReady(
                true,
              );

              return;
            }

            const center =
              new window.kakao.maps.LatLng(
                latitude,
                longitude,
              );

            /**
             * 지도 생성
             */
            mapRef.current =
              new window.kakao.maps.Map(
                mapContainerRef.current,
                {
                  center,
                  level: 4,
                },
              );

            /**
             * DOM 크기가 확정된 다음
             * 지도 영역 재계산
             */
            requestAnimationFrame(
              () => {
                if (
                  !mapRef.current
                ) {
                  return;
                }

                mapRef.current.relayout();

                mapRef.current.setCenter(
                  center,
                );

                setMapReady(
                  true,
                );

                console.log(
                  '✅ Kakao Map 준비 완료',
                );
              },
            );
          },
        );
      };

    /**
     * 이미 SDK 로드 완료
     */
    if (
      window.kakao &&
      window.kakao.maps
    ) {
      initializeMap();

      return;
    }

    /**
     * 기존 script 존재
     */
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

    /**
     * SDK 최초 로드
     */
    const script =
      document.createElement(
        'script',
      );

    script.id =
      'kakao-map-sdk';

    script.async =
      true;

    script.src =
      `https://dapi.kakao.com/v2/maps/sdk.js` +
      `?appkey=${KAKAO_JS_KEY}` +
      `&autoload=false`;

    script.onload =
      initializeMap;

    script.onerror =
      () => {
        console.error(
          'Kakao Maps SDK 로드 실패',
        );
      };

    document.head.appendChild(
      script,
    );
  }, []);

  /**
   * =====================================================
   * 지도 중심 변경
   * =====================================================
   */
  useEffect(() => {
    if (
      !mapReady ||
      !mapRef.current ||
      !window.kakao ||
      !window.kakao.maps
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
    mapReady,
  ]);

  /**
   * =====================================================
   * 지도 클릭 이벤트
   * =====================================================
   */
  useEffect(() => {
    if (
      !mapReady ||
      !mapRef.current ||
      !window.kakao ||
      !window.kakao.maps
    ) {
      return;
    }

    if (
      !selectable ||
      !onMapPress
    ) {
      return;
    }

    const map =
      mapRef.current;

    const handleClick =
      (
        mouseEvent: any,
      ) => {
        const latLng =
          mouseEvent.latLng;

        const clickedLatitude =
          latLng.getLat();

        const clickedLongitude =
          latLng.getLng();

        console.log(
          '✅ Kakao 지도 클릭:',
          {
            latitude:
              clickedLatitude,

            longitude:
              clickedLongitude,
          },
        );

        onMapPress(
          clickedLatitude,
          clickedLongitude,
        );
      };

    window.kakao.maps.event.addListener(
      map,
      'click',
      handleClick,
    );

    return () => {
      window.kakao.maps.event.removeListener(
        map,
        'click',
        handleClick,
      );
    };
  }, [
    mapReady,
    selectable,
    onMapPress,
  ]);

  /**
   * =====================================================
   * 마커 / 선택 위치 / 반경
   * =====================================================
   */
  useEffect(() => {
    if (
      !mapReady ||
      !mapRef.current ||
      !window.kakao ||
      !window.kakao.maps
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
     * =================================================
     * 동 마커
     * =================================================
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
              user-select:none;
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
                pointer-events:none;
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
                pointer-events:none;
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
            clickable: false,
          });

        createdOverlays.push(
          overlay,
        );
      },
    );

    /**
     * =================================================
     * 선택된 위치
     * =================================================
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
            user-select:none;
          "
        >
          <div
            style="
              margin-bottom:7px;
              background:#FFFFFF;
              border:2px solid #4285F4;
              border-radius:999px;
              padding:7px 13px;
              font-size:12px;
              font-weight:800;
              color:#2563EB;
              white-space:nowrap;
              box-shadow:0 3px 9px rgba(0,0,0,0.18);
              pointer-events:none;
            "
          >
            ${label}
          </div>

          <div
            style="
              width:38px;
              height:38px;
              background:#4285F4;
              border:4px solid #FFFFFF;
              border-radius:50% 50% 50% 0;
              transform:rotate(-45deg);
              box-shadow:0 4px 10px rgba(0,0,0,0.30);
              display:flex;
              align-items:center;
              justify-content:center;
              pointer-events:none;
            "
          >
            <div
              style="
                width:11px;
                height:11px;
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

          clickable: false,

          zIndex: 10,
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
            0.9,

          strokeStyle:
            'solid',

          fillColor:
            '#A7F3B5',

          fillOpacity:
            0.23,

          clickable:
            false,

          zIndex: 2,
        });

      /**
       * 선택 위치를 중심으로
       */
      map.setCenter(
        pointPosition,
      );

      /**
       * 반경별 줌
       */
      if (radius === 300) {
        map.setLevel(
          3,
        );
      } else if (
        radius === 500
      ) {
        map.setLevel(
          4,
        );
      } else {
        map.setLevel(
          5,
        );
      }
    }

    return () => {
      createdOverlays.forEach(
        overlay => {
          overlay.setMap(
            null,
          );
        },
      );

      if (
        selectedCircle
      ) {
        selectedCircle.setMap(
          null,
        );
      }
    };
  }, [
    mapReady,
    markers,
    selectedPoint,
    selectedPointLabel,
    radius,
  ]);

  /**
   * =====================================================
   * 부모 영역 크기 변경 감지
   * =====================================================
   */
  useEffect(() => {
    if (
      !mapContainerRef.current ||
      typeof ResizeObserver ===
        'undefined'
    ) {
      return;
    }

    const observer =
      new ResizeObserver(
        () => {
          if (
            !mapReady ||
            !mapRef.current
          ) {
            return;
          }

          mapRef.current.relayout();
        },
      );

    observer.observe(
      mapContainerRef.current,
    );

    return () => {
      observer.disconnect();
    };
  }, [
    mapReady,
  ]);

  /**
   * =====================================================
   * API KEY 오류
   * =====================================================
   */
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

  /**
   * =====================================================
   * 중요
   *
   * position:absolute 사용하지 않음.
   *
   * 부모 View의 크기 안에서만
   * 지도가 렌더링되도록 함.
   * =====================================================
   */
  return (
    <div
      ref={
        mapContainerRef
      }
      style={{
        width:
          '100%',

        height:
          '100%',

        minWidth: 0,

        minHeight:
          250,

        position:
          'relative',

        display:
          'block',

        overflow:
          'hidden',

        pointerEvents:
          'auto',

        touchAction:
          'auto',

        cursor:
          selectable
            ? 'crosshair'
            : 'grab',
      }}
    />
  );
}

const styles =
  StyleSheet.create({
    errorContainer: {
      flex: 1,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#F7F7F7',
    },

    errorText: {
      fontSize: 13,

      color:
        '#DC2626',
    },
  });