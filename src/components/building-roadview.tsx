import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

type Props = {
  latitude: number;
  longitude: number;
  buildingName?: string;
  address?: string;
  onClose?: () => void;
  kakaoJsKey?: string;
  height?: number;
};

type RoadviewMessage = {
  type: 'loaded' | 'no_roadview' | 'error';
  payload?: unknown;
};

export default function BuildingRoadview({
  latitude,
  longitude,
  buildingName,
  address,
  onClose,
  kakaoJsKey = process.env.EXPO_PUBLIC_KAKAO_JS_KEY,
  height = 320,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const html = useMemo(() => {
    if (!kakaoJsKey) return '';

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <style>
    html, body, #roadview { width:100%; height:100%; margin:0; padding:0; overflow:hidden; }
    body { background:#f3f4f6; }
    #message { position:absolute; inset:0; display:flex; align-items:center;
      justify-content:center; padding:20px; text-align:center; color:#667085;
      background:#f7f8f9; font:14px/1.5 sans-serif; }
  </style>
  <script
    src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(kakaoJsKey)}&autoload=false"
    onerror="window.__roadviewSdkError = true"
  ></script>
</head>
<body>
  <div id="roadview"></div>
  <div id="message">로드뷰를 불러오는 중입니다.</div>
  <script>
    (function () {
      var latitude = ${JSON.stringify(latitude)};
      var longitude = ${JSON.stringify(longitude)};
      var messageEl = document.getElementById('message');
      var completed = false;
      function notify(type, payload) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type:type, payload:payload }));
        }
      }
      function fail(message) {
        if (completed) return;
        completed = true;
        messageEl.textContent = message;
        messageEl.style.display = 'flex';
        notify('error', message);
      }
      var timer = setTimeout(function () {
        fail('로드뷰 응답 시간이 초과됐습니다. 네트워크와 카카오 지도 설정을 확인해주세요.');
      }, 15000);
      function initialize() {
        if (!window.kakao || !window.kakao.maps) {
          clearTimeout(timer);
          fail('카카오 지도 SDK를 불러오지 못했습니다.');
          return;
        }
        try {
          window.kakao.maps.load(function () {
            try {
              var position = new window.kakao.maps.LatLng(latitude, longitude);
              var roadview = new window.kakao.maps.Roadview(document.getElementById('roadview'));
              var client = new window.kakao.maps.RoadviewClient();
              client.getNearestPanoId(position, 100, function (panoId) {
                if (completed) return;
                clearTimeout(timer);
                if (!panoId) {
                  completed = true;
                  messageEl.textContent = '이 위치 주변에는 이용 가능한 로드뷰가 없습니다.';
                  messageEl.style.display = 'flex';
                  notify('no_roadview');
                  return;
                }
                try {
                  roadview.setPanoId(panoId, position);
                  messageEl.style.display = 'none';
                  completed = true;
                  notify('loaded', { panoId:panoId, latitude:latitude, longitude:longitude });
                } catch (e) {
                  fail(String(e && e.message ? e.message : e));
                }
              });
            } catch (e) {
              fail(String(e && e.message ? e.message : e));
            }
          });
        } catch (e) {
          fail(String(e && e.message ? e.message : e));
        }
      }
      if (window.__roadviewSdkError) {
        clearTimeout(timer);
        fail('카카오 지도 SDK 요청에 실패했습니다.');
      } else {
        initialize();
      }
    })();
  </script>
</body>
</html>`;
  }, [kakaoJsKey, latitude, longitude]);

  if (!kakaoJsKey) {
    return (
      <View style={[styles.fallback, { height }]}>
        <Text style={styles.errorTitle}>카카오 지도 키가 없습니다.</Text>
        <Text style={styles.errorText}>
          .env의 EXPO_PUBLIC_KAKAO_JS_KEY를 확인해주세요.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {(buildingName || address || onClose) && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {buildingName || '선택 위치 거리뷰'}
            </Text>
            {!!address && (
              <Text style={styles.address} numberOfLines={1}>{address}</Text>
            )}
          </View>
          {!!onClose && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="거리뷰 닫기"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <View style={[styles.container, { height }]}>
        <WebView
          key={`${latitude},${longitude}`}
          source={{ html, baseUrl: 'https://localhost' }}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          setSupportMultipleWindows={false}
          onLoadStart={() => {
            setLoading(true);
            setError('');
          }}
          onError={(event) => {
            const message = event.nativeEvent.description || 'WebView 오류가 발생했습니다.';
            console.error('Roadview WebView error:', message);
            setLoading(false);
            setError(message);
          }}
          onHttpError={(event) => {
            console.error('Roadview HTTP error:', event.nativeEvent);
          }}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data) as RoadviewMessage;
              if (data.type === 'loaded') {
                setLoading(false);
                setError('');
              } else if (data.type === 'no_roadview') {
                setLoading(false);
                setError('이 위치 주변에는 이용 가능한 로드뷰가 없습니다.');
              } else if (data.type === 'error') {
                setLoading(false);
                setError(typeof data.payload === 'string' ? data.payload : '로드뷰를 불러오지 못했습니다.');
              }
            } catch (parseError) {
              console.error('Roadview message parsing error:', parseError);
            }
          }}
          style={styles.webview}
        />
        {loading && (
          <View pointerEvents="none" style={styles.loadingOverlay}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>로드뷰를 불러오는 중...</Text>
          </View>
        )}
        {!!error && (
          <View pointerEvents="none" style={styles.errorOverlay}>
            <Text style={styles.errorTitle}>로드뷰를 표시할 수 없어요</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
  address: { marginTop: 3, fontSize: 11, color: '#667085' },
  closeButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#F3F4F6' },
  closeText: { fontSize: 23, color: '#4B5563' },
  container: { width: '100%', overflow: 'hidden', backgroundColor: '#F3F4F6' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loadingOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(247,248,249,0.92)' },
  loadingText: { fontSize: 13, fontWeight: '600', color: '#667085' },
  errorOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F7F8F9' },
  fallback: { width: '100%', alignItems: 'center', justifyContent: 'center', padding: 24, borderRadius: 16, backgroundColor: '#F7F8F9' },
  errorTitle: { marginBottom: 6, fontSize: 14, fontWeight: '800', color: '#344054', textAlign: 'center' },
  errorText: { fontSize: 12, lineHeight: 18, color: '#667085', textAlign: 'center' },
});
