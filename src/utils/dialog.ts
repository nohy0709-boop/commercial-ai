import { Alert, Platform } from 'react-native';

/**
 * 웹/폰 모두에서 동작하는 확인창.
 * (React Native의 Alert.alert 는 웹에서 버튼이 동작하지 않음)
 */
export function confirmDialog(
  title: string,
  message: string,
  confirmText = '확인',
  destructive = false,
): Promise<boolean> {
  if (Platform.OS === 'web') {
    const g = globalThis as any;
    return Promise.resolve(
      typeof g.confirm === 'function' ? g.confirm(`${title}\n\n${message}`) : false,
    );
  }

  return new Promise<boolean>((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: '취소', style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

/** 웹/폰 모두에서 동작하는 단순 알림창 */
export function notify(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    const g = globalThis as any;
    if (typeof g.alert === 'function') g.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}