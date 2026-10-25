
import { useWindowDimensions } from 'react-native';

import {
  BASE_SIZE,
  BREAKPOINTS,
  FRAME_SIZE,
  GRID_COLUMNS,
  SCALE,
  SPACING,
} from '@/constants/layout';

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isMobile = width <= BREAKPOINTS.mobile;

  const isTablet =
    width > BREAKPOINTS.mobile &&
    width <= BREAKPOINTS.tablet;

  const isDesktop = width > BREAKPOINTS.tablet;

  const device = isMobile
    ? 'mobile'
    : isTablet
    ? 'tablet'
    : 'desktop';

  const scale = SCALE[device];

  const frameMaxWidth = FRAME_SIZE[device];

  const horizontalPadding = SPACING[device];

  const columns = GRID_COLUMNS[device];

  const scaleSize = (size: number) =>
    Math.round(size * scale * 10) / 10;

  const fontSize = {
    title: scaleSize(BASE_SIZE.title),
    subtitle: scaleSize(BASE_SIZE.subtitle),
    body: scaleSize(BASE_SIZE.body),
    caption: scaleSize(BASE_SIZE.caption),
  };

  const buttonHeight = scaleSize(BASE_SIZE.buttonHeight);

  const cardPadding = scaleSize(BASE_SIZE.cardPadding);

  const borderRadius = scaleSize(BASE_SIZE.borderRadius);

  const sectionGap = scaleSize(BASE_SIZE.sectionGap);

  return {
    width,
    height,
    device,
    isMobile,
    isTablet,
    isDesktop,
    scale,
    scaleSize,
    frameMaxWidth,
    horizontalPadding,
    columns,
    fontSize,
    buttonHeight,
    cardPadding,
    borderRadius,
    sectionGap,
  };
}
