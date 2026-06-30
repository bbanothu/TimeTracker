import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
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
import { authScreenStyles as styles } from '@/components/auth/authScreenStyles';
import { GlassInput } from '@/components/auth/GlassInput';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { useAuth } from '@/hooks/useAuth';
import { useAuthScreenEnter } from '@/hooks/useAuthScreenEnter';
import { useAppColors } from '@/hooks/useAppColors';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const { signIn } = useAuth();
  const ready = useAuthScreenEnter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!isSupabaseConfigured) {
      Alert.alert(
        'Supabase not configured',
        'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to a .env file. See .env.example.',
      );
      return;
    }

    try {
      setSubmitting(true);
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Login failed', error instanceof Error ? error.message : 'Unknown error');
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
                  Welcome back
                </Animated.Text>
                <Animated.Text entering={HERO_ENTER.delay(90)} style={styles.title}>
                  TimeTracker
                </Animated.Text>
                <Animated.Text entering={HERO_ENTER.delay(180)} style={styles.subtitle}>
                  Sign in and pick up where you left off
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
                Sign in
              </Animated.Text>
              <Animated.Text
                entering={CARD_FADE.delay(CARD_CONTENT_DELAY + CARD_STAGGER)}
                style={styles.cardHint}
              >
                Your stats, tags, and sessions are waiting.
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
                  autoComplete="password"
                />
              </Animated.View>

              <Animated.View entering={CARD_FADE.delay(CARD_CONTENT_DELAY + CARD_STAGGER * 4)}>
                <Pressable onPress={handleLogin} disabled={submitting} style={styles.buttonWrap}>
                  <LinearGradient
                    colors={colors.authGradient}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.button}
                  >
                    {submitting ? (
                      <LoadingIndicator size="small" />
                    ) : (
                      <Text style={styles.buttonText}>Sign in</Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </Animated.View>

              <Animated.View entering={CARD_FADE.delay(CARD_CONTENT_DELAY + CARD_STAGGER * 5)}>
                <Link href="/(auth)/register" asChild>
                  <Pressable style={styles.linkWrap}>
                    <Text style={styles.linkText}>New here? Create an account</Text>
                  </Pressable>
                </Link>
              </Animated.View>
            </AuthCard>
            </Animated.View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthBackground>
  );
}
