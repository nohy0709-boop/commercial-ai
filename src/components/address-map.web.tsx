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
  id?: string;

  name: string;

  address?: string;

  category?: string;

  latitude: number;

  longitude: number;
}

export interface ClusterMarkerData {
  id: string;

  icon: string;

  label: string;

  category: string;

  count: number;

  latitude: number;

  longitude: number;
}

export interface MapViewport {
  centerLatitude: number;

  centerLongitude: number;

  level: number;

  bounds: {
    south: number;

    west: number;

    north: number;

    east: number;
  };
}

interface AddressMapProps {
  latitude: number;

  longitude: number;

  markers?: MapMarkerData[];

  clusterMarkers?: ClusterMarkerData[];

  selectable?: boolean;

  onMapPress?: (
    latitude: number,
    longitude: number,
  ) => void;

  onMarkerPress?: (
    marker: MapMarkerData,
  ) => void;

  onClusterPress?: (
    cluster: ClusterMarkerData,
  ) => void;

  onViewportChange?: (
    viewport: MapViewport,
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

  clusterMarkers = [],

  selectable = false,

  onMapPress,

  onMarkerPress,

  onClusterPress,

  onViewportChange,

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

  const selectableRef =
    useRef(
      selectable,
    );

  const onMapPressRef =
    useRef(
      onMapPress,
    );

  const onMarkerPressRef =
    useRef(
      onMarkerPress,
    );

  const onClusterPressRef =
    useRef(
      onClusterPress,
    );

  const onViewportChangeRef =
    useRef(
      onViewportChange,
    );

  const mapClickHandlerRef =
    useRef<any>(
      null,
    );

  const mapIdleHandlerRef =
    useRef<any>(
      null,
    );

  const [
    mapReady,
    setMapReady,
  ] =
    useState(false);

  /**
   * =====================================================
   * 최신 props
   * =====================================================
   */
  useEffect(() => {
    selectableRef.current =
      selectable;
  }, [
    selectable,
  ]);

  useEffect(() => {
    onMapPressRef.current =
      onMapPress;
  }, [
    onMapPress,
  ]);

  useEffect(() => {
    onMarkerPressRef.current =
      onMarkerPress;
  }, [
    onMarkerPress,
  ]);

  useEffect(() => {
    onClusterPressRef.current =
      onClusterPress;
  }, [
    onClusterPress,
  ]);

  useEffect(() => {
    onViewportChangeRef.current =
      onViewportChange;
  }, [
    onViewportChange,
  ]);

  /**
   * =====================================================
   * 현재 지도 화면 부모에게 전달
   * =====================================================
   */
  const emitViewport =
    () => {
      const map =
        mapRef.current;

      if (
        !map ||
        !window.kakao?.maps
      ) {
        return;
      }

      const center =
        map.getCenter();

      const bounds =
        map.getBounds();

      const southWest =
        bounds.getSouthWest();

      const northEast =
        bounds.getNorthEast();

      const viewport:
        MapViewport = {
        centerLatitude:
          center.getLat(),

        centerLongitude:
          center.getLng(),

        level:
          map.getLevel(),

        bounds: {
          south:
            southWest.getLat(),

          west:
            southWest.getLng(),

          north:
            northEast.getLat(),

          east:
            northEast.getLng(),
        },
      };

      onViewportChangeRef.current?.(
        viewport,
      );
    };

  /**
   * =====================================================
   * 지도 생성
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

            const map =
              new window.kakao.maps.Map(
                mapContainerRef.current,
                {
                  center,
                  level: 4,
                },
              );

            mapRef.current =
              map;

            /**
             * 빈 지도 클릭
             */
            const handleMapClick =
              (
                mouseEvent: any,
              ) => {
                if (
                  !selectableRef.current
                ) {
                  return;
                }

                const callback =
                  onMapPressRef.current;

                if (!callback) {
                  return;
                }

                const latLng =
                  mouseEvent.latLng;

                if (!latLng) {
                  return;
                }

                callback(
                  latLng.getLat(),
                  latLng.getLng(),
                );
              };

            /**
             * 지도 이동/확대/축소가 끝났을 때
             * 현재 화면 범위 전달
             */
            const handleIdle =
              () => {
                emitViewport();
              };

            mapClickHandlerRef.current =
              handleMapClick;

            mapIdleHandlerRef.current =
              handleIdle;

            window.kakao.maps.event.addListener(
              map,
              'click',
              handleMapClick,
            );

            window.kakao.maps.event.addListener(
              map,
              'idle',
              handleIdle,
            );

            requestAnimationFrame(
              () => {
                map.relayout();

                map.setCenter(
                  center,
                );

                setMapReady(
                  true,
                );

                /**
                 * 최초 화면에서도 바로 점포 조회
                 */
                setTimeout(
                  () => {
                    emitViewport();
                  },
                  50,
                );

                console.log(
                  '✅ Kakao Map 준비 완료',
                );
              },
            );
          },
        );
      };

    if (
      window.kakao &&
      window.kakao.maps
    ) {
      initializeMap();
    } else {
      const existingScript =
        document.getElementById(
          'kakao-map-sdk',
        ) as HTMLScriptElement | null;

      if (existingScript) {
        existingScript.addEventListener(
          'load',
          initializeMap,
        );
      } else {
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
              '❌ Kakao Maps SDK 로드 실패',
            );
          };

        document.head.appendChild(
          script,
        );
      }
    }

    return () => {
      const map =
        mapRef.current;

      if (
        map &&
        window.kakao?.maps?.event
      ) {
        if (
          mapClickHandlerRef.current
        ) {
          window.kakao.maps.event.removeListener(
            map,
            'click',
            mapClickHandlerRef.current,
          );
        }

        if (
          mapIdleHandlerRef.current
        ) {
          window.kakao.maps.event.removeListener(
            map,
            'idle',
            mapIdleHandlerRef.current,
          );
        }
      }
    };
  }, []);

  /**
   * =====================================================
   * 외부에서 중심 이동
   * =====================================================
   */
  useEffect(() => {
    if (
      !mapReady ||
      !mapRef.current ||
      !window.kakao?.maps
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
   * 일반 개별 마커
   *
   * 다른 화면 호환용
   * =====================================================
   */
  useEffect(() => {
    if (
      !mapReady ||
      !mapRef.current ||
      !window.kakao?.maps
    ) {
      return;
    }

    const map =
      mapRef.current;

    const overlays:
      any[] = [];

    markers.forEach(
      markerData => {
        const position =
          new window.kakao.maps.LatLng(
            markerData.latitude,
            markerData.longitude,
          );

        const root =
          document.createElement(
            'div',
          );

        root.style.width =
          '30px';

        root.style.height =
          '30px';

        root.style.display =
          'flex';

        root.style.alignItems =
          'center';

        root.style.justifyContent =
          'center';

        root.style.borderRadius =
          '50%';

        root.style.border =
          '3px solid white';

        root.style.background =
          '#22A447';

        root.style.boxShadow =
          '0 2px 7px rgba(0,0,0,0.2)';

        root.style.cursor =
          'pointer';

        root.style.pointerEvents =
          'auto';

        root.onclick =
          event => {
            event.stopPropagation();

            onMarkerPressRef.current?.(
              markerData,
            );
          };

        const overlay =
          new window.kakao.maps.CustomOverlay({
            map,

            position,

            content:
              root,

            xAnchor:
              0.5,

            yAnchor:
              0.5,

            clickable:
              true,
          });

        overlays.push(
          overlay,
        );
      },
    );

    return () => {
      overlays.forEach(
        overlay =>
          overlay.setMap(
            null,
          ),
      );
    };
  }, [
    mapReady,
    markers,
  ]);

  /**
   * =====================================================
   * ★ 업종 클러스터
   *
   * ☕ 4
   * 🍚 8
   * 🏪 3
   * =====================================================
   */
  useEffect(() => {
    if (
      !mapReady ||
      !mapRef.current ||
      !window.kakao?.maps
    ) {
      return;
    }

    const map =
      mapRef.current;

    const overlays:
      any[] = [];

    clusterMarkers.forEach(
      (
        cluster,
        index,
      ) => {
        const position =
          new window.kakao.maps.LatLng(
            cluster.latitude,
            cluster.longitude,
          );

        const root =
          document.createElement(
            'div',
          );

        root.style.display =
          'flex';

        root.style.alignItems =
          'center';

        root.style.justifyContent =
          'center';

        root.style.gap =
          '5px';

        root.style.height =
          '38px';

        root.style.minWidth =
          '54px';

        root.style.padding =
          '0 11px';

        root.style.borderRadius =
          '19px';

        root.style.background =
          '#FFFFFF';

        root.style.border =
          '1px solid rgba(0,0,0,0.10)';

        root.style.boxShadow =
          '0 3px 10px rgba(0,0,0,0.18)';

        root.style.cursor =
          'pointer';

        root.style.pointerEvents =
          'auto';

        root.style.userSelect =
          'none';

        root.style.whiteSpace =
          'nowrap';

        const icon =
          document.createElement(
            'span',
          );

        icon.innerText =
          cluster.icon;

        icon.style.fontSize =
          '18px';

        icon.style.lineHeight =
          '1';

        const count =
          document.createElement(
            'span',
          );

        count.innerText =
          String(
            cluster.count,
          );

        count.style.fontSize =
          '13px';

        count.style.fontWeight =
          '900';

        count.style.color =
          '#1F2937';

        root.appendChild(
          icon,
        );

        root.appendChild(
          count,
        );

        root.onclick =
          event => {
            event.stopPropagation();

            onClusterPressRef.current?.(
              cluster,
            );
          };

        root.onmouseenter =
          () => {
            root.style.transform =
              'scale(1.08)';
          };

        root.onmouseleave =
          () => {
            root.style.transform =
              'scale(1)';
          };

        const overlay =
          new window.kakao.maps.CustomOverlay({
            map,

            position,

            content:
              root,

            xAnchor:
              0.5,

            yAnchor:
              0.5,

            clickable:
              true,

            zIndex:
              100 + index,
          });

        overlays.push(
          overlay,
        );
      },
    );

    return () => {
      overlays.forEach(
        overlay => {
          overlay.setMap(
            null,
          );
        },
      );
    };
  }, [
    mapReady,
    clusterMarkers,
  ]);

  /**
   * =====================================================
   * 선택한 분석 위치
   * =====================================================
   */
  useEffect(() => {
    if (
      !mapReady ||
      !mapRef.current ||
      !window.kakao?.maps ||
      !selectedPoint
    ) {
      return;
    }

    const map =
      mapRef.current;

    const position =
      new window.kakao.maps.LatLng(
        selectedPoint.latitude,
        selectedPoint.longitude,
      );

    const root =
      document.createElement(
        'div',
      );

    root.style.display =
      'flex';

    root.style.flexDirection =
      'column';

    root.style.alignItems =
      'center';

    root.style.pointerEvents =
      'none';

    const label =
      document.createElement(
        'div',
      );

    label.innerText =
      selectedPointLabel ??
      '선택 위치';

    label.style.marginBottom =
      '5px';

    label.style.padding =
      '5px 9px';

    label.style.background =
      '#FFFFFF';

    label.style.border =
      '2px solid #4285F4';

    label.style.borderRadius =
      '999px';

    label.style.fontSize =
      '10px';

    label.style.fontWeight =
      '800';

    label.style.color =
      '#2563EB';

    label.style.whiteSpace =
      'nowrap';

    const point =
      document.createElement(
        'div',
      );

    point.style.width =
      '23px';

    point.style.height =
      '23px';

    point.style.borderRadius =
      '50%';

    point.style.background =
      '#4285F4';

    point.style.border =
      '4px solid #FFFFFF';

    point.style.boxShadow =
      '0 2px 8px rgba(0,0,0,0.25)';

    root.appendChild(
      label,
    );

    root.appendChild(
      point,
    );

    const overlay =
      new window.kakao.maps.CustomOverlay({
        map,

        position,

        content:
          root,

        xAnchor:
          0.5,

        yAnchor:
          1,

        clickable:
          false,

        zIndex:
          1000,
      });

    /**
     * 분석 위치를 선택했을 때만
     * 분석 반경 원 표시
     */
    const circle =
      new window.kakao.maps.Circle({
        map,

        center:
          position,

        radius,

        strokeWeight:
          2,

        strokeColor:
          '#22A447',

        strokeOpacity:
          0.75,

        fillColor:
          '#A7F3B5',

        fillOpacity:
          0.12,

        clickable:
          false,
      });

    return () => {
      overlay.setMap(
        null,
      );

      circle.setMap(
        null,
      );
    };
  }, [
    mapReady,
    selectedPoint,
    selectedPointLabel,
    radius,
  ]);

  /**
   * =====================================================
   * 리사이즈
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
            mapReady &&
            mapRef.current
          ) {
            mapRef.current.relayout();
          }
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
      ref={
        mapContainerRef
      }
      style={{
        width:
          '100%',

        height:
          '100%',

        minWidth:
          0,

        minHeight:
          250,

        position:
          'relative',

        overflow:
          'hidden',

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