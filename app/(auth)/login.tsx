import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';

import { AuthBackground } from '@/components/auth/AuthBackground';
import { authScreenStyles as styles } from '@/components/auth/authScreenStyles';
import { GlassInput } from '@/components/auth/GlassInput';
import { useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
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
            <Text style={styles.kicker}>Welcome back</Text>
            <Text style={styles.title}>TimeTracker</Text>
            <Text style={styles.subtitle}>Sign in and pick up where you left off</Text>
          </View>

          <BlurView intensity={40} tint="light" style={styles.card}>
            <View style={styles.cardInner}>
              <Text style={styles.cardTitle}>Sign in</Text>
              <Text style={styles.cardHint}>Your stats, tags, and sessions are waiting.</Text>

              <GlassInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              <GlassInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry
                autoComplete="password"
              />

              <Pressable onPress={handleLogin} disabled={submitting} style={styles.buttonWrap}>
                <LinearGradient
                  colors={['#3B82F6', '#6366F1', '#A855F7']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.button}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Sign in</Text>
                  )}
                </LinearGradient>
              </Pressable>

              <Link href="/(auth)/register" asChild>
                <Pressable style={styles.linkWrap}>
                  <Text style={styles.linkText}>New here? Create an account</Text>
                </Pressable>
              </Link>
            </View>
          </BlurView>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthBackground>
  );
}
