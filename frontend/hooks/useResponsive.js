import { useWindowDimensions } from 'react-native';

/**
 * Hook to detect screen size and provide responsive design values
 * Mobile: < 768px
 * Tablet: 768px - 1024px
 * Desktop: > 1024px
 */
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    // Responsive spacing
    spacing: {
      xs: isMobile ? 4 : 6,
      sm: isMobile ? 8 : 12,
      md: isMobile ? 12 : 16,
      lg: isMobile ? 16 : 24,
      xl: isMobile ? 20 : 32,
    },
    // Responsive font sizes
    fontSize: {
      xs: isMobile ? 11 : 12,
      sm: isMobile ? 12 : 14,
      base: isMobile ? 14 : 16,
      lg: isMobile ? 16 : 18,
      xl: isMobile ? 18 : 22,
      xxl: isMobile ? 24 : 32,
    },
    // Responsive container width (max width on desktop)
    containerWidth: isDesktop ? Math.min(width - 80, 1200) : width,
    // Sidebar width for desktop
    sidebarWidth: 250,
  };
};
