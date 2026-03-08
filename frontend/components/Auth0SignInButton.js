import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PROVIDERS = {
  google: {
    label: 'Continue with Google',
    icon: 'logo-google',
    bgColor: '#FFFFFF',
    textColor: '#3A3A3A',
    borderColor: '#D0C4A8',
    iconColor: '#DB4437',
  },
  facebook: {
    label: 'Continue with Facebook',
    icon: 'logo-facebook',
    bgColor: '#1877F2',
    textColor: '#FFFFFF',
    borderColor: '#1877F2',
    iconColor: '#FFFFFF',
  },
  github: {
    label: 'Continue with GitHub',
    icon: 'logo-github',
    bgColor: '#24292E',
    textColor: '#FFFFFF',
    borderColor: '#24292E',
    iconColor: '#FFFFFF',
  },
  apple: {
    label: 'Continue with Apple',
    icon: 'logo-apple',
    bgColor: '#000000',
    textColor: '#FFFFFF',
    borderColor: '#000000',
    iconColor: '#FFFFFF',
  },
  passwordless: {
    label: 'Passwordless (Email)',
    icon: 'mail-outline',
    bgColor: '#2A5C2A',
    textColor: '#FFFFFF',
    borderColor: '#2A5C2A',
    iconColor: '#FFFFFF',
  },
};

const Auth0SignInButton = ({ provider = 'google', loading = false, onPress, style }) => {
  const config = PROVIDERS[provider] || PROVIDERS.google;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: config.bgColor, borderColor: config.borderColor },
        style,
      ]}
      onPress={() => { if (!loading) onPress(config.connection); }}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={config.textColor} />
      ) : (
        <View style={styles.inner}>
          <Ionicons name={config.icon} size={20} color={config.iconColor} style={styles.icon} />
          <Text style={[styles.label, { color: config.textColor }]}>{config.label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    marginBottom: 12,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: { marginRight: 2 },
  label: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Nunito_400Regular',
  },
});

export default Auth0SignInButton;