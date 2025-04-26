import { extendTheme } from 'native-base';

const theme = extendTheme({
  colors: {
    primary: {
      50: '#e3f2fd',
      100: '#bbdefb',
      200: '#90caf9',
      300: '#64b5f6',
      400: '#42a5f5',
      500: '#1a73e8', // Main primary color
      600: '#1565c0',
      700: '#0d47a1',
      800: '#0a3880',
      900: '#052e56',
    },
    secondary: {
      50: '#e8f5e9',
      100: '#c8e6c9',
      200: '#a5d6a7',
      300: '#81c784',
      400: '#66bb6a',
      500: '#4caf50',
      600: '#43a047',
      700: '#388e3c',
      800: '#2e7d32',
      900: '#1b5e20',
    },
    success: {
      500: '#4caf50',
    },
    error: {
      500: '#f44336',
    },
    warning: {
      500: '#ff9800',
    },
    info: {
      500: '#2196f3',
    },
    // Custom gradient colors for prediction confidence
    confidence: {
      low: '#f44336',
      medium: '#ff9800',
      high: '#4caf50',
    },
  },
  fonts: {
    heading: 'Roboto_700Bold',
    body: 'Roboto_400Regular',
    mono: 'Roboto_Mono',
  },
  fontConfig: {
    Roboto: {
      300: {
        normal: 'Roboto_300Light',
      },
      400: {
        normal: 'Roboto_400Regular',
      },
      500: {
        normal: 'Roboto_500Medium',
      },
      700: {
        normal: 'Roboto_700Bold',
      },
    },
  },
  config: {
    initialColorMode: 'light',
  },
  components: {
    Button: {
      baseStyle: {
        rounded: 'md',
      },
      defaultProps: {
        colorScheme: 'primary',
      },
    },
    Heading: {
      baseStyle: {
        color: 'primary.900',
      },
    },
    Card: {
      baseStyle: {
        rounded: 'lg',
        p: 4,
        shadowOpacity: 0.1,
      },
    },
    Badge: {
      baseStyle: {
        rounded: 'full',
      },
    },
  },
});

type CustomThemeType = typeof theme;

declare module 'native-base' {
  interface ICustomTheme extends CustomThemeType {}
}

export default theme;