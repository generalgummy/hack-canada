import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const OTP_LENGTH = 6;

const OTPScreen = () => {
  const { pendingOtp, verifyOtp, resendOtp, cancelOtp } = useAuth();
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (text, index) => {
    if (text.length > 1) {
      // Handle paste — distribute digits across inputs
      const digits = text.replace(/[^0-9]/g, '').split('').slice(0, OTP_LENGTH);
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < OTP_LENGTH) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputs.current[nextIndex]?.focus();

      // Auto-submit if all filled
      if (newOtp.every((d) => d !== '')) {
        handleVerify(newOtp.join(''));
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-submit when last digit entered
    if (text && index === OTP_LENGTH - 1) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === OTP_LENGTH) {
        handleVerify(fullOtp);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

  const handleVerify = async (otpString) => {
    const code = otpString || otp.join('');
    if (code.length !== OTP_LENGTH) {
      Alert.alert('Error', 'Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(code);
      // Navigation happens automatically via AuthContext
    } catch (error) {
      Alert.alert(
        'Verification Failed',
        error.response?.data?.message || error.message || 'Invalid OTP'
      );
      setOtp(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendOtp();
      setCountdown(60);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
      Alert.alert('OTP Resent', 'A new OTP has been sent to your phone (check server logs)');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const maskedPhone = pendingOtp?.phone
    ? '•••••' + pendingOtp.phone.slice(-4)
    : '';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>🔐</Text>
        <Text style={styles.title}>Verify Your Phone</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit code to{'\n'}
          <Text style={styles.phone}>{maskedPhone}</Text>
        </Text>
        <Text style={styles.hint}>(Check the server console for the OTP)</Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputs.current[index] = ref)}
              style={[
                styles.otpInput,
                digit ? styles.otpInputFilled : null,
              ]}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={index === 0 ? OTP_LENGTH : 1}
              autoFocus={index === 0}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.buttonDisabled]}
          onPress={() => handleVerify()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify & Continue</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendRow}>
          {countdown > 0 ? (
            <Text style={styles.countdownText}>
              Resend code in {countdown}s
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              <Text style={styles.resendText}>
                {resending ? 'Resending...' : "Didn't receive code? Resend"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.backButton} onPress={cancelOtp}>
          <Text style={styles.backText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9F5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  icon: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1B5E20',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  phone: {
    fontWeight: '700',
    color: '#333',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 32,
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    backgroundColor: '#fff',
    color: '#333',
  },
  otpInputFilled: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E9',
  },
  verifyButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  resendRow: {
    marginTop: 20,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 14,
    color: '#999',
  },
  resendText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  backButton: {
    marginTop: 24,
  },
  backText: {
    fontSize: 15,
    color: '#888',
    fontWeight: '600',
  },
});

export default OTPScreen;
