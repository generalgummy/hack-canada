import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CACHE_KEY = 'user_location_cache';

const saveLocationCache = async (formatted) => {
  try {
    if (Platform.OS === 'web') {
      window?.localStorage?.setItem(CACHE_KEY, formatted);
    } else {
      await SecureStore.setItemAsync(CACHE_KEY, formatted);
    }
  } catch (_) {}
};

const loadLocationCache = async () => {
  try {
    if (Platform.OS === 'web') {
      return window?.localStorage?.getItem(CACHE_KEY) || null;
    }
    return await SecureStore.getItemAsync(CACHE_KEY);
  } catch (_) {
    return null;
  }
};

export const useLocation = () => {
  const [locationLabel, setLocationLabel] = useState(null);
  const [coords, setCoords]               = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);

  // Load cached location on mount (call this in useEffect from consumer)
  const loadCached = useCallback(async () => {
    const cached = await loadLocationCache();
    if (cached) setLocationLabel(cached);
    return cached;
  }, []);

  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        setLoading(false);
        return null;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords(pos.coords);

      const [geo] = await Location.reverseGeocodeAsync(pos.coords);
      // Format: "City, Province" or fallback
      const city     = geo?.city || geo?.district || geo?.subregion || '';
      const province = geo?.region || geo?.country || '';
      const street   = geo?.streetNumber && geo?.street
        ? `${geo.streetNumber} ${geo.street}, `
        : '';
      const formatted = `${street}${city}${city && province ? ', ' : ''}${province}`.trim();

      setLocationLabel(formatted || 'Unknown Location');
      await saveLocationCache(formatted);
      return { formatted, coords: pos.coords, geo };
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { locationLabel, coords, loading, error, fetchLocation, loadCached };
};
