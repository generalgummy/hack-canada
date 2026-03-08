import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const { login, loginWithSocial } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const showError = (msg) => {
    setErrorMsg(msg);
    if (Platform.OS !== 'web') {
      Alert.alert('Login Failed', msg);
    }
  };

  // Normal email + password login
  const handleNormalLogin = async () => {
    setErrorMsg('');
    if (!email || !password) {
      showError('Please enter your email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Please try again';
      console.error('Login error:', msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Auth0 Google login
  const handleAuth0Login = async () => {
    setErrorMsg('');
    setGoogleLoading(true);
    try {
      await loginWithSocial('google-oauth2');
    } catch (error) {
      const msg = error.message || 'Please try again';
      showError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🌾</Text>
          <Text style={styles.title}>Northern Harvest</Text>
          <Text style={styles.subtitle}>
            Connecting communities with fresh local food
          </Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardText}>Sign in to your account</Text>

          {/* Error Message */}
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Normal Login Form */}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleNormalLogin}
            disabled={loading || googleLoading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Auth0 Google Login */}
          <TouchableOpacity
            style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
            onPress={handleAuth0Login}
            disabled={loading || googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.googleIcon}>🔍</Text>
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerText}>
              Don't have an account?{' '}
              <Text style={styles.registerTextBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9F5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1B5E20',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#F5F9F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  loginButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#4285F4',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerTextBold: {
    color: '#2E7D32',
    fontWeight: '700',
  },
  footer: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#E53935',
  },
  errorText: {
    color: '#C62828',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default LoginScreen;
