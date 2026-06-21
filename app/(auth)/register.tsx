import { Link, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
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

import { AuthBackground } from '@/components/auth/AuthBackground';
import { authScreenStyles as styles } from '@/components/auth/authScreenStyles';
import { GlassInput } from '@/components/auth/GlassInput';
import { useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured } from '@/lib/supabase';

const registerBackground = require('../../assets/login2.jpg');

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
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
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (error) {
      Alert.alert('Registration failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthBackground source={registerBackground}>
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
            <Text style={styles.kicker}>Get started</Text>
            <Text style={styles.title}>TimeTracker</Text>
            <Text style={styles.subtitle}>Create an account and sync your time everywhere</Text>
          </View>

          <BlurView intensity={40} tint="light" style={styles.card}>
            <View style={styles.cardInner}>
              <Text style={styles.cardTitle}>Create account</Text>
              <Text style={styles.cardHint}>Track tags, stats, and geofences across devices.</Text>

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
                autoComplete="new-password"
              />
              <GlassInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                secureTextEntry
                autoComplete="new-password"
              />

              <Pressable onPress={handleRegister} disabled={submitting} style={styles.buttonWrap}>
                <LinearGradient
                  colors={['#10B981', '#3B82F6', '#8B5CF6']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.button}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Create account</Text>
                  )}
                </LinearGradient>
              </Pressable>

              <Link href="/(auth)/login" asChild>
                <Pressable style={styles.linkWrap}>
                  <Text style={styles.linkText}>Already have an account? Sign in</Text>
                </Pressable>
              </Link>
            </View>
          </BlurView>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthBackground>
  );
}
