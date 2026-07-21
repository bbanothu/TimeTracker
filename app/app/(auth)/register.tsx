import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { AuthBackground } from '@/components/auth/AuthBackground';
import { AuthCard } from '@/components/auth/AuthCard';
import {
  CARD_CONTENT_DELAY,
  CARD_ENTER,
  CARD_FADE,
  CARD_STAGGER,
  HERO_ENTER,
} from '@/components/auth/authEnterAnimations';
import { getAuthScreenStyles } from '@/components/auth/authScreenStyles';
import { GlassInput } from '@/components/auth/GlassInput';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { useAuth } from '@/hooks/useAuth';
import { useAuthScreenEnter } from '@/hooks/useAuthScreenEnter';
import { useAppColors } from '@/hooks/useAppColors';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function RegisterScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const styles = useMemo(() => getAuthScreenStyles(colors), [colors]);
  const { signUp } = useAuth();
  const ready = useAuthScreenEnter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!isSupabaseConfigured) {
      Alert.alert(
        'Supabase not configured',
        'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to a .env file. See .env.example.',
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters.');
      return;
    }

    try {
      setSubmitting(true);
      await signUp(email.trim(), password);
      Alert.alert('Account created', 'You can now sign in.', [
        {
          text: 'OK',
          onPress: () => {
            if (router.canGoBack()) router.back();
            else router.replace('/(auth)/login');
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Registration failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            {ready ? (
              <>
                <Animated.Text entering={HERO_ENTER.delay(0)} style={styles.kicker}>
                  Get started
                </Animated.Text>
                <Animated.Text entering={HERO_ENTER.delay(90)} style={styles.title}>
                  TimeTracker
                </Animated.Text>
                <Animated.Text entering={HERO_ENTER.delay(180)} style={styles.subtitle}>
                  Create an account and sync your time everywhere
                </Animated.Text>
              </>
            ) : null}
          </View>

          {ready ? (
            <Animated.View entering={CARD_ENTER}>
              <AuthCard>
                <Animated.Text
                  entering={CARD_FADE.delay(CARD_CONTENT_DELAY)}
                  style={styles.cardTitle}
                >
                  Create account
                </Animated.Text>
                <Animated.Text
                  entering={CARD_FADE.delay(CARD_CONTENT_DELAY + CARD_STAGGER)}
                  style={styles.cardHint}
                >
                  Track tags, stats, and geofences across devices.
                </Animated.Text>

                <Animated.View entering={CARD_FADE.delay(CARD_CONTENT_DELAY + CARD_STAGGER * 2)}>
                  <GlassInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                </Animated.View>
                <Animated.View entering={CARD_FADE.delay(CARD_CONTENT_DELAY + CARD_STAGGER * 3)}>
                  <GlassInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    secureTextEntry
                    autoComplete="new-password"
                  />
                </Animated.View>
                <Animated.View entering={CARD_FADE.delay(CARD_CONTENT_DELAY + CARD_STAGGER * 4)}>
                  <GlassInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm password"
                    secureTextEntry
                    autoComplete="new-password"
                  />
                </Animated.View>

                <Animated.View entering={CARD_FADE.delay(CARD_CONTENT_DELAY + CARD_STAGGER * 5)}>
                  <Pressable
                    onPress={handleRegister}
                    disabled={submitting}
                    style={styles.buttonWrap}
                  >
                    <LinearGradient
                      colors={colors.authGradient}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.button}
                    >
                      {submitting ? (
                        <LoadingIndicator size="small" />
                      ) : (
                        <Text style={styles.buttonText}>Create account</Text>
                      )}
                    </LinearGradient>
                  </Pressable>
                </Animated.View>

                <Animated.View entering={CARD_FADE.delay(CARD_CONTENT_DELAY + CARD_STAGGER * 6)}>
                  <Pressable
                    style={styles.linkWrap}
                    onPress={() => {
                      if (router.canGoBack()) router.back();
                      else router.replace('/(auth)/login');
                    }}
                  >
                    <Text style={styles.linkText}>Already have an account? Sign in</Text>
                  </Pressable>
                </Animated.View>
              </AuthCard>
            </Animated.View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthBackground>
  );
}
