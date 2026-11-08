import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Coordinates } from '@/services/geocoding';

type Props = {
  coords?: Coordinates;
  areaName: string;
  score: number;
};

type KakaoMaps = {
  load: (callback: () => void) => void;
  LatLng: new (latitude: number, longitude: number) => unknown;
  Map: new (container: HTMLElement, options: Record<string, unknown>) => {
    relayout: () => void;
    setZoomable: (zoomable: boolean) => void;
    setCenter: (center: unknown) => void;
  };
  Marker: new (options: Record<string, unknown>) => { setMap: (map: null) => void };
};

declare global {
  interface Window {
    kakao?: { maps?: KakaoMaps };
  }
}

let kakaoSdkPromise: Promise<KakaoMaps> | null = null;

function getKakaoMaps(): Promise<KakaoMaps> {
  if (typeof window === 'undefined') return Promise.reject(new Error('웹 환경에서만 지도를 표시할 수 있습니다.'));
  if (window.kakao?.maps) {
    return new Promise(resolve => window.kakao!.maps!.load(() => resolve(window.kakao!.maps!)));
  }
  if (kakaoSdkPromise) return kakaoSdkPromise;

  kakaoSdkPromise = new Promise<KakaoMaps>((resolve, reject) => {
    const key = process.env.EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY
      || process.env.EXPO_PUBLIC_KAKAO_JS_KEY
      || process.env.EXPO_PUBLIC_KAKAO_MAP_API_KEY;
    if (!key) {
      reject(new Error('카카오맵 JavaScript 키를 .env에 설정해주세요.'));
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[src*="dapi.kakao.com/v2/maps/sdk.js"]');
    const script = existing || document.createElement('script');
    let finished = false;
    const onReady = () => {
      if (finished || !window.kakao?.maps) return;
      finished = true;
      window.kakao.maps.load(() => resolve(window.kakao!.maps!));
    };
    const onError = () => {
      if (finished) return;
      finished = true;
      reject(new Error('카카오 지도 SDK를 불러오지 못했습니다.'));
    };
    script.addEventListener('load', onReady, { once: true });
    script.addEventListener('error', onError, { once: true });
    if (!existing) {
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`;
      script.async = true;
      document.head.appendChild(script);
    }
    // 다른 화면에서 이미 스크립트가 삽입된 경우에도 대응
    if (window.kakao?.maps) onReady();
  }).catch(error => {
    kakaoSdkPromise = null;
    throw error;
  });
  return kakaoSdkPromise;
}

export default function CardMapThumbnail({ coords, areaName, score }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!coords || !containerRef.current) return;
    let cancelled = false;
    let observer: ResizeObserver | undefined;
    let marker: { setMap: (map: null) => void } | undefined;
    setError('');

    getKakaoMaps().then(kakao => {
      if (cancelled || !containerRef.current) return;
      const center = new kakao.LatLng(coords.lat, coords.lng);
      const map = new kakao.Map(containerRef.current, {
        center,
        level: 4,
        draggable: false,
        scrollwheel: false,
        disableDoubleClick: true,
        disableDoubleClickZoom: true,
      });
      map.setZoomable(false);
      marker = new kakao.Marker({ map, position: center, title: areaName, clickable: false });

      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(() => {
          map.relayout();
          map.setCenter(center);
        });
        observer.observe(containerRef.current);
      }
    }).catch(err => {
      if (!cancelled) setError(err instanceof Error ? err.message : '지도 로딩 실패');
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      marker?.setMap(null);
    };
  }, [coords?.lat, coords?.lng, areaName]);

  return (
    <View style={[styles.wrap, { pointerEvents: 'none' }]}>
      {coords ? React.createElement('div', {
        ref: containerRef,
        style: { width: '100%', height: '100%', background: '#F3F6FC' },
        'aria-label': `${areaName} 주변 지도`,
      }) : (
        <Text style={styles.empty}>위치 좌표를 찾지 못했어요</Text>
      )}
      {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}
      {!!coords && !error && (
        <View style={styles.labelWrap}>
          <Text style={styles.label}>{areaName} · {Number(score).toFixed(1)}점</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', height: 150, position: 'relative', backgroundColor: '#F3F6FC', justifyContent: 'center' },
  empty: { textAlign: 'center', color: '#7E8BA3', fontSize: 12 },
  errorBox: { position: 'absolute', left: 8, right: 8, bottom: 8, backgroundColor: '#FFFFFFE8', borderRadius: 8, padding: 7 },
  errorText: { color: '#C62320', fontSize: 11, textAlign: 'center' },
  labelWrap: { position: 'absolute', top: 10, left: 0, right: 0, alignItems: 'center' },
  label: { color: '#202544', fontSize: 12, fontWeight: '900', backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#202544', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, overflow: 'hidden' },
});
