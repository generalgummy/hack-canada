import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

const Auth0SignInButton = ({ 
  provider = 'google', 
  loading = false, 
  onPress,
  style 
}) => {
  const providers = {
    google: {
      label: '🔵 Continue with Google',
      connection: 'google-oauth2',
      bgColor: '#fff',
      textColor: '#333',
      borderColor: '#ddd',
    },
    facebook: {
      label: '🔵 Continue with Facebook',
      connection: 'facebook',
      bgColor: '#1877F2',
      textColor: '#fff',
      borderColor: '#1877F2',
    },
    github: {
      label: '⬛ Continue with GitHub',
      connection: 'github',
      bgColor: '#333',
      textColor: '#fff',
      borderColor: '#333',
    },
    apple: {
      label: '🍎 Continue with Apple',
      connection: 'apple',
      bgColor: '#000',
      textColor: '#fff',
      borderColor: '#000',
    },
    passwordless: {
      label: '✉️  Passwordless (Email)',
      connection: 'email',
      bgColor: '#2E7D32',
      textColor: '#fff',
      borderColor: '#2E7D32',
    },
  };

  const config = providers[provider] || providers.google;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
        },
        style,
      ]}
      onPress={() => {
        console.log('🔐 [Auth0SignInButton] Button pressed for:', provider, 'connection:', config.connection);
        if (!loading) {
          onPress(config.connection);
        }
      }}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={config.textColor} />
      ) : (
        <Text style={[styles.label, { color: config.textColor }]}>
          {config.label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default Auth0SignInButton;
