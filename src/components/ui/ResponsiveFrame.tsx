import { useResponsive } from '@/hooks/useResponsive';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  children: ReactNode;
};

export default function ResponsiveFrame({ children }: Props) {
  const { frameMaxWidth, horizontalPadding } = useResponsive();

  return (
    <View
      style={[
        styles.frame,
        {
          maxWidth: frameMaxWidth,
          paddingHorizontal: horizontalPadding,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    alignSelf: 'center',
  },
});