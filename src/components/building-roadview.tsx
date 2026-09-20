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
   * 카카오 JS SDK 키
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
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState('');

  const html =
    useMemo(
      () => {
        if (
          !kakaoJsKey
        ) {
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
      inset: 0;

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

  <script
    type="text/javascript"
    src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoJsKey}&autoload=false"
  ></script>
</head>

<body>
  <div id="roadview"></div>
  <div id="message">
    로드뷰를 불러오는 중입니다.
  </div>

  <script>
    const latitude = ${latitude};
    const longitude = ${longitude};

    function sendMessage(type, payload) {
      if (
        window.ReactNativeWebView
      ) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type,
            payload
          })
        );
      }
    }

    function showMessage(message) {
      const element =
        document.getElementById(
          'message'
        );

      if (
        element
      ) {
        element.style.display =
          'flex';

        element.innerText =
          message;
      }
    }

    function hideMessage() {
      const element =
        document.getElementById(
          'message'
        );

      if (
        element
      ) {
        element.style.display =
          'none';
      }
    }

    function initializeRoadview() {
      try {
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

        const roadviewContainer =
          document.getElementById(
            'roadview'
          );

        const roadview =
          new kakao.maps.Roadview(
            roadviewContainer
          );

        const roadviewClient =
          new kakao.maps.RoadviewClient();

        const position =
          new kakao.maps.LatLng(
            latitude,
            longitude
          );

        roadviewClient.getNearestPanoId(
          position,
          100,
          function (panoId) {
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
                panoId,
                latitude,
                longitude
              }
            );
          }
        );
      } catch (error) {
        const message =
          error &&
          error.message
            ? error.message
            : String(error);

        showMessage(
          '로드뷰를 불러오는 중 오류가 발생했습니다.'
        );

        sendMessage(
          'error',
          message
        );
      }
    }

    try {
      kakao.maps.load(
        function () {
          initializeRoadview();
        }
      );
    } catch (error) {
      const message =
        error &&
        error.message
          ? error.message
          : String(error);

      showMessage(
        '카카오 지도 SDK 초기화에 실패했습니다.'
      );

      sendMessage(
        'error',
        message
      );
    }
  </script>
</body>
</html>
`;
      },
      [
        kakaoJsKey,
        latitude,
        longitude,
      ],
    );

  if (
    !kakaoJsKey
  ) {
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
          .env의 EXPO_PUBLIC_KAKAO_JS_KEY를 확인해주세요.
        </Text>
      </View>
    );
  }

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
           * Kakao JavaScript SDK의 도메인 검사 때문에
           * baseUrl을 지정
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
          setLoading(
            false,
          );
        }}

        onError={
          event => {
            const description =
              event.nativeEvent
                .description ||
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
          }
        }

        onHttpError={
          event => {
            console.error(
              'Roadview HTTP error:',
              event.nativeEvent,
            );
          }
        }

        onMessage={
          event => {
            try {
              const message =
                JSON.parse(
                  event.nativeEvent
                    .data,
                );

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
              }

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
              }

              if (
                message.type ===
                'error'
              ) {
                setLoading(
                  false,
                );

                setError(
                  typeof message.payload ===
                    'string'
                    ? message.payload
                    : '로드뷰를 불러오지 못했습니다.',
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
          }
        }

        style={
          styles.webview
        }
      />

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

const styles =
  StyleSheet.create({
    container: {
      width:
        '100%',

      overflow:
        'hidden',

      borderRadius: 16,

      backgroundColor:
        '#F3F4F6',
    },

    webview: {
      flex: 1,

      backgroundColor:
        'transparent',
    },

    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 10,

      backgroundColor:
        'rgba(247,248,249,0.92)',
    },

    loadingText: {
      fontSize: 13,

      fontWeight:
        '600',

      color:
        '#667085',
    },

    errorOverlay: {
      ...StyleSheet.absoluteFillObject,

      alignItems:
        'center',

      justifyContent:
        'center',

      padding: 24,

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

      padding: 24,

      borderRadius: 16,

      backgroundColor:
        '#F7F8F9',
    },

    errorTitle: {
      marginBottom: 6,

      fontSize: 14,

      fontWeight:
        '800',

      color:
        '#344054',

      textAlign:
        'center',
    },

    errorText: {
      fontSize: 12,

      lineHeight: 18,

      color:
        '#667085',

      textAlign:
        'center',
    },
  });