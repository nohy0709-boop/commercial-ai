import {
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { WebView } from 'react-native-webview';

type Props = {
  latitude: number;
  longitude: number;

  /**
   * map.tsx에서 전달하는 건물 정보
   */
  buildingName?: string;
  address?: string;
  onClose?: () => void;

  /**
   * 카카오 JavaScript SDK 키
   * .env의 EXPO_PUBLIC_KAKAO_JS_KEY 사용
   */
  kakaoJsKey?: string;

  height?: number;
};

export default function BuildingRoadview({
  latitude,
  longitude,
  kakaoJsKey =
    process.env.EXPO_PUBLIC_KAKAO_JS_KEY,
  height = 320,
}: Props) {
  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  /**
   * =====================================================
   * ROADVIEW HTML
   * =====================================================
   */

  const html = useMemo(() => {
    if (!kakaoJsKey) {
      return '';
    }

    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
  />

  <style>
    html,
    body {
      margin: 0;
      padding: 0;

      width: 100%;
      height: 100%;

      overflow: hidden;

      background: #f3f4f6;
    }

    #roadview {
      width: 100%;
      height: 100%;
    }

    #message {
      position: absolute;

      top: 0;
      right: 0;
      bottom: 0;
      left: 0;

      z-index: 10;

      display: flex;
      align-items: center;
      justify-content: center;

      padding: 24px;

      text-align: center;

      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

      font-size: 14px;
      line-height: 1.5;

      color: #667085;

      background: #f7f8f9;
    }
  </style>
</head>

<body>
  <div id="roadview"></div>

  <div id="message">
    로드뷰를 불러오는 중입니다.
  </div>

  <script>
    (function () {
      var latitude = ${latitude};
      var longitude = ${longitude};

      var initializationStarted = false;

      /**
       * React Native 쪽으로 메시지 전달
       */
      function sendMessage(
        type,
        payload
      ) {
        try {
          if (
            window.ReactNativeWebView &&
            window.ReactNativeWebView.postMessage
          ) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: type,
                payload: payload
              })
            );
          }
        } catch (error) {
          // 메시지 전송 오류가
          // 로드뷰 실행 자체를 막지 않도록 함
        }
      }

      /**
       * 에러 메시지 문자열 변환
       */
      function getErrorMessage(
        error
      ) {
        if (
          error &&
          typeof error === 'object' &&
          'message' in error
        ) {
          return String(
            error.message
          );
        }

        return String(
          error
        );
      }

      /**
       * 화면 메시지 표시
       */
      function showMessage(
        message
      ) {
        var element =
          document.getElementById(
            'message'
          );

        if (!element) {
          return;
        }

        element.style.display =
          'flex';

        element.innerText =
          message;
      }

      /**
       * 화면 메시지 숨기기
       */
      function hideMessage() {
        var element =
          document.getElementById(
            'message'
          );

        if (!element) {
          return;
        }

        element.style.display =
          'none';
      }

      /**
       * =================================================
       * ROADVIEW 초기화
       * =================================================
       */
      function initializeRoadview() {
        if (
          initializationStarted
        ) {
          return;
        }

        /**
         * Kakao SDK가 실제로 준비되었는지 확인
         */
        if (
          !window.kakao ||
          !window.kakao.maps
        ) {
          showMessage(
            '카카오 지도 SDK를 불러오지 못했습니다.'
          );

          sendMessage(
            'error',
            'Kakao Maps SDK is unavailable.'
          );

          return;
        }

        initializationStarted =
          true;

        try {
          /**
           * kakao를 전역 변수로 직접 사용하지 않고
           * window.kakao.maps를 통해 접근
           */
          var kakaoMaps =
            window.kakao.maps;

          var roadviewContainer =
            document.getElementById(
              'roadview'
            );

          if (
            !roadviewContainer
          ) {
            throw new Error(
              '로드뷰 컨테이너를 찾을 수 없습니다.'
            );
          }

          var roadview =
            new kakaoMaps.Roadview(
              roadviewContainer
            );

          var roadviewClient =
            new kakaoMaps.RoadviewClient();

          var position =
            new kakaoMaps.LatLng(
              latitude,
              longitude
            );

          /**
           * 선택 위치에서
           * 100m 이내 가장 가까운 로드뷰 탐색
           */
          roadviewClient.getNearestPanoId(
            position,
            100,
            function (
              panoId
            ) {
              if (
                !panoId
              ) {
                showMessage(
                  '이 위치 주변에는 이용 가능한 로드뷰가 없습니다.'
                );

                sendMessage(
                  'no_roadview',
                  'No roadview available near this location.'
                );

                return;
              }

              roadview.setPanoId(
                panoId,
                position
              );

              hideMessage();

              sendMessage(
                'loaded',
                {
                  panoId: panoId,
                  latitude: latitude,
                  longitude: longitude
                }
              );
            }
          );
        } catch (
          error
        ) {
          initializationStarted =
            false;

          var message =
            getErrorMessage(
              error
            );

          showMessage(
            '로드뷰를 불러오는 중 오류가 발생했습니다.'
          );

          sendMessage(
            'error',
            message
          );
        }
      }

      /**
       * =================================================
       * KAKAO MAPS 초기화
       * =================================================
       */
      function startKakaoMaps() {
        if (
          !window.kakao ||
          !window.kakao.maps
        ) {
          showMessage(
            '카카오 지도 SDK를 불러오지 못했습니다.'
          );

          sendMessage(
            'error',
            'Kakao Maps SDK is unavailable.'
          );

          return;
        }

        try {
          /**
           * autoload=false 이므로
           * SDK 다운로드 완료 후 maps.load 실행
           */
          window.kakao.maps.load(
            function () {
              initializeRoadview();
            }
          );
        } catch (
          error
        ) {
          var message =
            getErrorMessage(
              error
            );

          showMessage(
            '카카오 지도 SDK 초기화에 실패했습니다.'
          );

          sendMessage(
            'error',
            message
          );
        }
      }

      /**
       * =================================================
       * KAKAO SDK 동적 로딩
       * =================================================
       */
      function loadKakaoSdk() {
        try {
          var script =
            document.createElement(
              'script'
            );

          script.type =
            'text/javascript';

          script.async =
            true;

          script.src =
            'https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoJsKey}&autoload=false';

          /**
           * SDK 파일이 실제로 다운로드된 뒤
           * Kakao Maps 초기화
           */
          script.onload =
            function () {
              startKakaoMaps();
            };

          script.onerror =
            function () {
              showMessage(
                '카카오 지도 SDK를 불러오지 못했습니다. 네트워크 또는 API 설정을 확인해주세요.'
              );

              sendMessage(
                'error',
                'Failed to load Kakao Maps SDK.'
              );
            };

          document.head.appendChild(
            script
          );
        } catch (
          error
        ) {
          showMessage(
            '카카오 지도 SDK를 준비하지 못했습니다.'
          );

          sendMessage(
            'error',
            getErrorMessage(
              error
            )
          );
        }
      }

      /**
       * WebView 내부에서 예상하지 못한
       * JavaScript 오류가 발생한 경우
       */
      window.onerror =
        function (
          message,
          source,
          line,
          column,
          error
        ) {
          sendMessage(
            'javascript_error',
            {
              message:
                String(
                  message
                ),

              source:
                source || '',

              line:
                line || 0,

              column:
                column || 0,

              detail:
                error
                  ? getErrorMessage(
                      error
                    )
                  : ''
            }
          );

          return true;
        };

      /**
       * HTML이 실행된 뒤
       * Kakao SDK 로딩 시작
       */
      loadKakaoSdk();
    })();
  </script>
</body>
</html>
`;
  }, [
    kakaoJsKey,
    latitude,
    longitude,
  ]);

  /**
   * =====================================================
   * KAKAO KEY 없음
   * =====================================================
   */

  if (!kakaoJsKey) {
    return (
      <View
        style={[
          styles.fallback,
          {
            height,
          },
        ]}
      >
        <Text
          style={
            styles.errorTitle
          }
        >
          카카오 지도 키가 없습니다.
        </Text>

        <Text
          style={
            styles.errorText
          }
        >
          .env의 EXPO_PUBLIC_KAKAO_JS_KEY를
          확인해주세요.
        </Text>
      </View>
    );
  }

  /**
   * =====================================================
   * WEBVIEW ERROR
   * =====================================================
   */

  const handleWebViewError = (
    event: any,
  ) => {
    const description =
      event.nativeEvent
        ?.description ||
      'WebView 오류가 발생했습니다.';

    console.error(
      'Roadview WebView error:',
      description,
    );

    setLoading(
      false,
    );

    setError(
      description,
    );
  };

  /**
   * =====================================================
   * HTTP ERROR
   * =====================================================
   */

  const handleHttpError = (
    event: any,
  ) => {
    console.error(
      'Roadview HTTP error:',
      event.nativeEvent,
    );
  };

  /**
   * =====================================================
   * WEBVIEW MESSAGE
   * =====================================================
   */

  const handleMessage = (
    event: any,
  ) => {
    try {
      const message =
        JSON.parse(
          event.nativeEvent
            .data,
        );

      /**
       * 로드뷰 정상 로드
       */
      if (
        message.type ===
        'loaded'
      ) {
        setLoading(
          false,
        );

        setError(
          '',
        );

        console.log(
          '✅ 앱 로드뷰 로드 완료',
          message.payload,
        );

        return;
      }

      /**
       * 해당 위치 주변에
       * 로드뷰가 존재하지 않음
       */
      if (
        message.type ===
        'no_roadview'
      ) {
        setLoading(
          false,
        );

        setError(
          '이 위치 주변에는 이용 가능한 로드뷰가 없습니다.',
        );

        return;
      }

      /**
       * WebView 내부 JavaScript 오류
       */
      if (
        message.type ===
        'javascript_error'
      ) {
        setLoading(
          false,
        );

        const errorMessage =
          message.payload
            ?.message ||
          '로드뷰 JavaScript 오류가 발생했습니다.';

        setError(
          errorMessage,
        );

        console.error(
          '로드뷰 JavaScript 오류:',
          message.payload,
        );

        return;
      }

      /**
       * Kakao SDK / Roadview 오류
       */
      if (
        message.type ===
        'error'
      ) {
        setLoading(
          false,
        );

        const errorMessage =
          typeof message.payload ===
          'string'
            ? message.payload
            : '로드뷰를 불러오지 못했습니다.';

        setError(
          errorMessage,
        );

        console.error(
          '로드뷰 내부 오류:',
          message.payload,
        );
      }
    } catch (
      parseError
    ) {
      console.error(
        'Roadview message parsing error:',
        parseError,
      );
    }
  };

  /**
   * =====================================================
   * UI
   * =====================================================
   */

  return (
    <View
      style={[
        styles.container,
        {
          height,
        },
      ]}
    >
      <WebView
        source={{
          html,

          /**
           * WebView HTML의 기준 URL
           */
          baseUrl:
            'https://localhost',
        }}

        originWhitelist={[
          '*',
        ]}

        javaScriptEnabled

        domStorageEnabled

        mixedContentMode="always"

        allowsInlineMediaPlayback

        setSupportMultipleWindows={
          false
        }

        startInLoadingState={
          false
        }

        onLoadStart={() => {
          setLoading(
            true,
          );

          setError(
            '',
          );
        }}

        onLoadEnd={() => {
          /**
           * 여기서는 loading을 끄지 않음.
           *
           * HTML 로딩 완료와
           * 실제 Kakao Roadview 로딩 완료는
           * 서로 다르기 때문.
           *
           * Roadview가 준비되면
           * WebView 내부에서 loaded 메시지를 보냄.
           */
        }}

        onError={
          handleWebViewError
        }

        onHttpError={
          handleHttpError
        }

        onMessage={
          handleMessage
        }

        style={
          styles.webview
        }
      />

      {/* LOADING */}

      {loading && (
        <View
          pointerEvents="none"
          style={
            styles.loadingOverlay
          }
        >
          <ActivityIndicator
            size="large"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            로드뷰를 불러오는 중...
          </Text>
        </View>
      )}

      {/* ERROR */}

      {error !==
        '' && (
        <View
          pointerEvents="none"
          style={
            styles.errorOverlay
          }
        >
          <Text
            style={
              styles.errorTitle
            }
          >
            로드뷰를 표시할 수 없어요
          </Text>

          <Text
            style={
              styles.errorText
            }
          >
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * =====================================================
 * STYLES
 * =====================================================
 */

const styles =
  StyleSheet.create({
    container: {
      width:
        '100%',

      overflow:
        'hidden',

      borderRadius:
        16,

      backgroundColor:
        '#F3F4F6',
    },

    webview: {
      flex:
        1,

      backgroundColor:
        'transparent',
    },

    loadingOverlay: {
      ...StyleSheet.absoluteFill,

      alignItems:
        'center',

      justifyContent:
        'center',

      gap:
        10,

      backgroundColor:
        'rgba(247,248,249,0.92)',
    },

    loadingText: {
      fontSize:
        13,

      fontWeight:
        '600',

      color:
        '#667085',
    },

    errorOverlay: {
      ...StyleSheet.absoluteFill,

      alignItems:
        'center',

      justifyContent:
        'center',

      padding:
        24,

      backgroundColor:
        '#F7F8F9',
    },

    fallback: {
      width:
        '100%',

      alignItems:
        'center',

      justifyContent:
        'center',

      padding:
        24,

      borderRadius:
        16,

      backgroundColor:
        '#F7F8F9',
    },

    errorTitle: {
      marginBottom:
        6,

      fontSize:
        14,

      fontWeight:
        '800',

      color:
        '#344054',

      textAlign:
        'center',
    },

    errorText: {
      fontSize:
        12,

      lineHeight:
        18,

      color:
        '#667085',

      textAlign:
        'center',
    },
  });