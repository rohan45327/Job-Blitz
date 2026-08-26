import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Typography, Spacing } from '../../theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function WebViewScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { url, title } = route.params;
  const [loading, setLoading] = useState(true);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{title || 'Apply'}</Text>
        <View style={styles.placeholder} />
      </View>
      <View style={styles.webContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
        <WebView
          source={{ uri: url }}
          onLoadEnd={() => setLoading(false)}
          style={styles.webview}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.sm,
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: Typography.base,
    fontWeight: '600',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 60,
  },
  webContainer: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    zIndex: 1,
  },
  webview: {
    flex: 1,
  },
});
