import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useAuthStore } from './src/store/authStore';
import { Colors } from './src/theme/tokens';
import { ThemeProvider } from './src/theme/ThemeContext';
import { usePushNotifications } from './src/hooks/usePushNotifications';

// Screens
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { RegisterScreen } from './src/screens/auth/RegisterScreen';
import { OnboardingScreen } from './src/screens/auth/OnboardingScreen';
import { HomeScreen } from './src/screens/main/HomeScreen';
import { PrepareScreen } from './src/screens/main/PrepareScreen';
import { CompanyIntelligenceScreen } from './src/screens/main/CompanyIntelligenceScreen';
import { JobDetailScreen } from './src/screens/main/JobDetailScreen';
import { ApplicationsScreen } from './src/screens/main/ApplicationsScreen';
import { ProfileScreen } from './src/screens/main/ProfileScreen';
import { WatchlistScreen } from './src/screens/main/WatchlistScreen';
import { WebViewScreen } from './src/screens/main/WebViewScreen';
import { TabBar } from './src/components/navigation/TabBar';

export type RootStackParams = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  JobDetail: { jobId: string };
  CompanyIntelligence: { jobId: string };
  WebView: { url: string };
};

export type MainTabParams = {
  Home: undefined;
  Prepare: undefined;
  Applications: undefined;
  Watchlist: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParams>();
const Tab = createBottomTabNavigator<MainTabParams>();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Prepare" component={PrepareScreen} />
      <Tab.Screen name="Applications" component={ApplicationsScreen} />
      <Tab.Screen name="Watchlist" component={WatchlistScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated } = useAuthStore();
  usePushNotifications(isAuthenticated);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'fade_from_bottom',
      }}
    >
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="JobDetail"
            component={JobDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="CompanyIntelligence"
            component={CompanyIntelligenceScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen name="WebView" component={WebViewScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
