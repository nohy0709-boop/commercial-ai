import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface BuildingRoadviewProps {
  latitude: number;

  longitude: number;

  buildingName?: string;

  address?: string;

  onClose: () => void;
}

declare global {
  interface Window {
    kakao: any;
  }
}

const KAKAO_JS_KEY =
  process.env.EXPO_PUBLIC_KAKAO_JS_KEY;

export default function BuildingRoadview({
  latitude,
  longitude,
  buildingName,
  address,
  onClose,
}: BuildingRoadviewProps) {
  const containerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState('');

  const [
    panoFound,
    setPanoFound,
  ] =
    useState(false);

  useEffect(() => {
    let cancelled = false;
    let sdkTimer: ReturnType<typeof setTimeout> | undefined;
    let panoTimer: ReturnType<typeof setTimeout> | undefined;
    let script: HTMLScriptElement | null = null;

    setLoading(true);
    setError('');
    setPanoFound(false);

    const fail = (message: string, detail?: unknown) => {
      if (cancelled) return;
      if (sdkTimer) clearTimeout(sdkTimer);
      if (panoTimer) clearTimeout(panoTimer);
      console.error('[로드뷰]', message, detail ?? '');
      setLoading(false);
      setPanoFound(false);
      setError(message);
    };

    const initRoadview = () => {
      if (cancelled || !containerRef.current) return;
      if (!window.kakao?.maps?.load) {
        fail('카카오 지도 SDK가 준비되지 않았어요. 배포 주소와 JS 키를 확인해 주세요.');
        return;
      }

      try {
        window.kakao.maps.load(() => {
          if (cancelled || !containerRef.current) return;
          if (sdkTimer) clearTimeout(sdkTimer);

          try {
            const maps = window.kakao.maps;
            if (!maps.Roadview || !maps.RoadviewClient) {
              fail('로드뷰 API를 사용할 수 없어요. 카카오 지도 SDK 설정을 확인해 주세요.');
              return;
            }

            const position = new maps.LatLng(latitude, longitude);
            const roadview = new maps.Roadview(containerRef.current);
            const client = new maps.RoadviewClient();

            // 네트워크/인증 오류로 콜백이 오지 않아도 무한 로딩되지 않도록 보호
            panoTimer = setTimeout(() => {
              fail('로드뷰 검색 응답이 지연되고 있어요. F12 콘솔/Network에서 카카오 요청을 확인해 주세요.');
            }, 15000);

            client.getNearestPanoId(position, 100, (panoId: number | null) => {
              if (cancelled) return;
              if (panoTimer) clearTimeout(panoTimer);

              if (!panoId) {
                fail('선택한 건물 주변 100m 안에서 거리뷰를 찾지 못했습니다.');
                return;
              }

              try {
                roadview.setPanoId(panoId, position);
                setPanoFound(true);
                setLoading(false);
                setError('');
                console.log('✅ Kakao 거리뷰 파노라마 설정 완료', { panoId, latitude, longitude });
              } catch (e) {
                fail('로드뷰 화면을 표시하는 중 오류가 발생했어요.', e);
              }
            });
          } catch (e) {
            fail('로드뷰 초기화 중 오류가 발생했어요.', e);
          }
        });
      } catch (e) {
        fail('카카오 지도 SDK 초기화에 실패했어요.', e);
      }
    };

    if (!KAKAO_JS_KEY) {
      fail('EXPO_PUBLIC_KAKAO_JS_KEY가 배포 빌드에 포함되지 않았어요.');
    } else if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      fail('선택한 위치의 좌표가 올바르지 않아요.');
    } else {
      sdkTimer = setTimeout(() => {
        fail('카카오 지도 SDK를 제한 시간 안에 불러오지 못했어요. F12 콘솔을 확인해 주세요.');
      }, 15000);

      if (window.kakao?.maps?.load) {
        initRoadview();
      } else {
        // 지도 화면에서 생성한 같은 id의 script가 이미 존재할 수 있음.
        // 그 스크립트가 로딩 중이라면 load 이벤트를 기다리고,
        // 이미 실패했다면 timeout으로 오류를 명확하게 표시함.
        const existing = document.getElementById('kakao-map-sdk') as HTMLScriptElement | null;
        if (existing) {
          script = existing;
          script.addEventListener('load', initRoadview);
          script.addEventListener('error', onScriptError);
        } else {
          script = document.createElement('script');
          script.id = 'kakao-map-sdk';
          script.async = true;
          script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(KAKAO_JS_KEY)}&autoload=false`;
          script.addEventListener('load', initRoadview);
          script.addEventListener('error', onScriptError);
          document.head.appendChild(script);
        }
      }
    }

    function onScriptError(event: Event) {
      fail('카카오 지도 SDK 요청이 실패했어요. F12 Network에서 dapi.kakao.com 응답을 확인해 주세요.', event);
    }

    return () => {
      cancelled = true;
      if (sdkTimer) clearTimeout(sdkTimer);
      if (panoTimer) clearTimeout(panoTimer);
      if (script) {
        script.removeEventListener('load', initRoadview);
        script.removeEventListener('error', onScriptError);
      }
    };
  }, [latitude, longitude]);

  return (
    <View
      style={
        styles.overlay
      }
    >
      <View
        style={
          styles.modal
        }
      >
        {/* HEADER */}

        <View
          style={
            styles.header
          }
        >
          <View
            style={{
              flex: 1,
            }}
          >
            <Text
              style={
                styles.eyebrow
              }
            >
              실제 거리 확인
            </Text>

            <Text
              style={
                styles.title
              }
            >
              📍{' '}
              {buildingName ||
                '선택 건물'}
            </Text>

            <Text
              numberOfLines={
                1
              }
              style={
                styles.address
              }
            >
              {address ||
                '선택한 위치 주변 거리뷰'}
            </Text>
          </View>

          <TouchableOpacity
            style={
              styles.closeButton
            }
            onPress={
              onClose
            }
          >
            <Text
              style={
                styles.closeText
              }
            >
              ×
            </Text>
          </TouchableOpacity>
        </View>

        {/* ROADVIEW */}

        <View
          style={
            styles.viewer
          }
        >
          <div
            ref={
              containerRef
            }
            style={{
              width:
                '100%',

              height:
                '100%',

              background:
                '#E5E7EB',
            }}
          />

          {loading && (
            <View
              style={
                styles.loadingOverlay
              }
            >
              <ActivityIndicator
                size="large"
                color="#22A447"
              />

              <Text
                style={
                  styles.loadingTitle
                }
              >
                거리뷰를 찾고 있어요
              </Text>

              <Text
                style={
                  styles.loadingText
                }
              >
                선택한 건물 주변의 가장 가까운 촬영 지점을 확인합니다.
              </Text>
            </View>
          )}

          {!loading &&
            !!error && (
              <View
                style={
                  styles.errorOverlay
                }
              >
                <Text
                  style={
                    styles.errorIcon
                  }
                >
                  🛣️
                </Text>

                <Text
                  style={
                    styles.errorTitle
                  }
                >
                  거리뷰가 없어요
                </Text>

                <Text
                  style={
                    styles.errorText
                  }
                >
                  {
                    error
                  }
                </Text>
              </View>
            )}

          {!loading &&
            panoFound && (
              <View
                style={
                  styles.guide
                }
              >
                <Text
                  style={
                    styles.guideText
                  }
                >
                  드래그해서 360° 둘러보기
                </Text>
              </View>
            )}
        </View>

        {/* FOOTER */}

        <View
          style={
            styles.footer
          }
        >
          <View
            style={
              styles.infoBox
            }
          >
            <Text
              style={
                styles.infoIcon
              }
            >
              ℹ️
            </Text>

            <Text
              style={
                styles.infoText
              }
            >
              거리뷰 촬영 위치는 선택한 건물의 정확한 출입구 위치와 다를 수 있습니다.
            </Text>
          </View>

          <View
            style={
              styles.coordinateBox
            }
          >
            <Text
              style={
                styles.coordinateLabel
              }
            >
              선택 위치
            </Text>

            <Text
              style={
                styles.coordinateText
              }
            >
              {latitude.toFixed(
                6,
              )}
              ,{' '}
              {longitude.toFixed(
                6,
              )}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,

      zIndex: 9999,

      alignItems:
        'center',

      justifyContent:
        'center',

      padding: 18,

      backgroundColor:
        'rgba(15,23,18,0.68)',
    },

    modal: {
      width:
        '100%',

      maxWidth: 1180,

      height:
        '92%',

      maxHeight: 760,

      overflow:
        'hidden',

      borderRadius: 24,

      backgroundColor:
        '#FFFFFF',

      boxShadow:
        '0 20px 60px rgba(0,0,0,0.35)',
    },

    header: {
      minHeight: 94,

      paddingHorizontal: 22,

      paddingVertical: 16,

      flexDirection:
        'row',

      alignItems:
        'center',

      borderBottomWidth: 1,

      borderBottomColor:
        '#E5E7EB',
    },

    eyebrow: {
      fontSize: 9,

      fontWeight:
        '900',

      color:
        '#22A447',
    },

    title: {
      marginTop: 3,

      fontSize: 18,

      fontWeight:
        '900',

      color:
        '#18201B',
    },

    address: {
      marginTop: 5,

      fontSize: 10,

      color:
        '#6B7280',
    },

    closeButton: {
      width: 42,

      height: 42,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 21,

      backgroundColor:
        '#F3F4F6',
    },

    closeText: {
      fontSize: 26,

      color:
        '#4B5563',
    },

    viewer: {
      flex: 1,

      position:
        'relative',

      minHeight: 430,

      backgroundColor:
        '#E5E7EB',
    },

    loadingOverlay: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        'rgba(255,255,255,0.94)',
    },

    loadingTitle: {
      marginTop: 13,

      fontSize: 15,

      fontWeight:
        '900',

      color:
        '#1F2937',
    },

    loadingText: {
      marginTop: 6,

      fontSize: 10,

      color:
        '#6B7280',
    },

    errorOverlay: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,

      alignItems:
        'center',

      justifyContent:
        'center',

      padding: 30,

      backgroundColor:
        '#F8FAF8',
    },

    errorIcon: {
      fontSize: 36,
    },

    errorTitle: {
      marginTop: 12,

      fontSize: 16,

      fontWeight:
        '900',

      color:
        '#1F2937',
    },

    errorText: {
      marginTop: 7,

      maxWidth: 430,

      textAlign:
        'center',

      fontSize: 10,

      lineHeight: 16,

      color:
        '#6B7280',
    },

    guide: {
      position:
        'absolute',

      left:
        '50%',

      bottom: 18,

      transform: [
        {
          translateX:
            -95,
        },
      ],

      width: 190,

      paddingVertical: 9,

      alignItems:
        'center',

      borderRadius: 999,

      backgroundColor:
        'rgba(20,25,22,0.78)',
    },

    guideText: {
      fontSize: 10,

      fontWeight:
        '800',

      color:
        '#FFFFFF',
    },

    footer: {
      minHeight: 86,

      paddingHorizontal: 20,

      paddingVertical: 13,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      gap: 20,

      borderTopWidth: 1,

      borderTopColor:
        '#E5E7EB',
    },

    infoBox: {
      flex: 1,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 8,
    },

    infoIcon: {
      fontSize: 14,
    },

    infoText: {
      flex: 1,

      fontSize: 9,

      lineHeight: 14,

      color:
        '#6B7280',
    },

    coordinateBox: {
      alignItems:
        'flex-end',
    },

    coordinateLabel: {
      fontSize: 8,

      color:
        '#9CA3AF',
    },

    coordinateText: {
      marginTop: 3,

      fontSize: 9,

      fontWeight:
        '700',

      color:
        '#4B5563',
    },
  });