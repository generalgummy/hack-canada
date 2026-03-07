import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';
import jwtDecode from 'jwt-decode';
import api from './api';

// Auth0 Configuration
const auth0Domain = 'dev-aq644xrnfatz30d7.us.auth0.com';
const auth0ClientId = 'o5vVpDqIsPH0zIwCP6prstxN40Uh5Ukq';
const redirectUrl = AuthSession.getRedirectUrl();

// ============================================
// Platform Detection
// ============================================
const isWeb = typeof window !== 'undefined' && !global.HermesInternal;

console.log('🔐 [Auth0] Platform:', isWeb ? 'WEB' : 'MOBILE');
console.log('🔐 [Auth0] Redirect URL:', redirectUrl);

/**
 * Web-based OAuth flow using popup window
 */
const webOAuthFlow = async (authUrl) => {
  return new Promise((resolve) => {
    const width = 500;
    const height = 600;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;

    console.log('🔐 [Auth0] Opening popup window for OAuth...');
    const popup = window.open(
      authUrl,
      'auth0-login',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Listen for messages from the callback page
    const messageHandler = (event) => {
      // Accept messages from any origin since callback is served from backend
      // Validate by checking message type instead of origin

      if (event.data?.type === 'AUTH0_CODE') {
        console.log('✅ [Auth0] Code received from popup:', event.data.code);
        window.removeEventListener('message', messageHandler);
        if (popup) popup.close();
        resolve({ code: event.data.code, type: 'success' });
      } else if (event.data?.type === 'AUTH0_ERROR') {
        console.log('❌ [Auth0] Error from popup:', event.data.error);
        window.removeEventListener('message', messageHandler);
        if (popup) popup.close();
        resolve({ type: 'error', error: event.data.error });
      }
    };

    window.addEventListener('message', messageHandler);

    // Fallback: check URL for code if popup is blocked
    setTimeout(() => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('code')) {
        const code = urlParams.get('code');
        console.log('✅ [Auth0] Code found in URL:', code);
        window.removeEventListener('message', messageHandler);
        if (popup) popup.close();
        resolve({ code, type: 'success' });
      }
    }, 2000);
  });
};

/**
 * Initiate Auth0 login with social provider
 * @param {string} connection - Auth0 connection name: 'google-oauth2', 'facebook', 'github', etc.
 * @returns {Promise<object>} - User profile and tokens
 */
export const loginWithAuth0Social = async (connection = 'google-oauth2') => {
  try {
    console.log('🔐 [Auth0] loginWithAuth0Social called with connection:', connection);
    console.log('🔐 [Auth0] Redirect URL:', redirectUrl);

    // Determine redirect_uri based on platform
    let redirectUri;
    if (isWeb && typeof window !== 'undefined') {
      // For web, redirect to backend's /auth-callback endpoint
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        redirectUri = 'http://localhost:5001/auth-callback';
      } else {
        // For production, construct backend URL
        const backendHost = window.location.hostname;
        const backendPort = process.env.REACT_APP_API_PORT || '5001';
        redirectUri = `${window.location.protocol}//${backendHost}:${backendPort}/auth-callback`;
      }
    } else {
      redirectUri = redirectUrl;
    }

    const params = {
      client_id: auth0ClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      connection,
      prompt: 'login',
    };

    const authUrl = `https://${auth0Domain}/authorize?${new URLSearchParams(params).toString()}`;
    console.log('🔐 [Auth0] Auth URL:', authUrl);

    let result;

    if (isWeb) {
      // Web platform: use popup window
      console.log('🔐 [Auth0] Using web popup flow...');
      result = await webOAuthFlow(authUrl);
    } else {
      // Mobile platform: use AuthSession
      console.log('🔐 [Auth0] Using mobile AuthSession flow...');
      result = await AuthSession.startAsync({ authUrl });
    }

    console.log('🔐 [Auth0] OAuth result:', result);

    if (result.type === 'success' || (result.code && !result.error)) {
      const code = result.code;
      console.log('✅ [Auth0] Authorization code received:', code);

      // Exchange code for tokens via backend
      console.log('🔐 [Auth0] Exchanging code for tokens...');
      // Calculate the correct redirect_uri that was used in the authorization request
      let backendRedirectUri;
      if (isWeb && typeof window !== 'undefined') {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          backendRedirectUri = 'http://localhost:5001/auth-callback';
        } else {
          const backendHost = window.location.hostname;
          const backendPort = process.env.REACT_APP_API_PORT || '5001';
          backendRedirectUri = `${window.location.protocol}//${backendHost}:${backendPort}/auth-callback`;
        }
      } else {
        backendRedirectUri = redirectUrl;
      }
      const tokenResponse = await api.post('/auth/auth0/callback', { code, connection, redirectUri: backendRedirectUri });
      const { token, user } = tokenResponse.data;
      console.log('✅ [Auth0] Token received:', { token: token?.substring(0, 20) + '...', user });

      // Store token securely
      if (token) {
        try {
          await SecureStore.setItemAsync('auth0_token', token);
        } catch (e) {
          // Fallback for web
          if (isWeb && typeof window !== 'undefined') {
            window.localStorage.setItem('auth0_token', token);
          }
        }
      }

      return { token, user, success: true };
    } else if (result.type === 'cancel') {
      console.log('❌ [Auth0] Login cancelled by user');
      return { success: false, error: 'Login cancelled' };
    } else {
      console.log('❌ [Auth0] Unexpected result type:', result.type, result);
      return { success: false, error: result.error || `Unexpected result: ${result.type}` };
    }
  } catch (error) {
    console.error('❌ [Auth0] Social login error:', error);
    console.error('❌ [Auth0] Error details:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Initiate Auth0 passwordless login (email or SMS)
 * @param {string} email - User email
 * @returns {Promise<object>} - Passwordless challenge initiated
 */
export const loginWithAuth0Passwordless = async (email) => {
  try {
    console.log('🔐 Initiating Auth0 passwordless login for:', email);

    // Call backend to start passwordless flow
    const response = await api.post('/auth/auth0/passwordless/start', { email });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Auth0 passwordless login error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verify OTP from passwordless email
 * @param {string} email - User email
 * @param {string} otp - One-time password
 * @returns {Promise<object>} - Token and user data if successful
 */
export const verifyAuth0Passwordless = async (email, otp) => {
  try {
    console.log('🔐 Verifying Auth0 passwordless OTP');

    const response = await api.post('/auth/auth0/passwordless/verify', { email, otp });
    const { token, user } = response.data;

    if (token) {
      await SecureStore.setItemAsync('auth0_token', token);
    }

    return { token, user, success: true };
  } catch (error) {
    console.error('Auth0 passwordless verification error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get stored Auth0 token
 */
export const getAuth0Token = async () => {
  try {
    return await SecureStore.getItemAsync('auth0_token');
  } catch (error) {
    console.log('Error retrieving Auth0 token:', error);
    return null;
  }
};

/**
 * Clear Auth0 token on logout
 */
export const clearAuth0Token = async () => {
  try {
    await SecureStore.deleteItemAsync('auth0_token');
  } catch (error) {
    console.log('Error clearing Auth0 token:', error);
  }
};

/**
 * Decode and validate JWT token
 */
export const decodeToken = (token) => {
  try {
    return jwtDecode(token);
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
};
