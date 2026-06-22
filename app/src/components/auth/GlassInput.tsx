import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, TextInput, type TextInputProps } from 'react-native';

interface GlassInputProps extends TextInputProps {}

export function GlassInput(props: GlassInputProps) {
  const placeholderColor = props.placeholderTextColor ?? 'rgba(255,255,255,0.55)';

  if (Platform.OS === 'android') {
    return (
      <TextInput
        {...props}
        placeholderTextColor={placeholderColor}
        style={[androidStyles.input, props.style]}
      />
    );
  }

  return (
    <BlurView intensity={35} tint="light" style={styles.blur}>
      <TextInput
        {...props}
        placeholderTextColor={placeholderColor}
        style={[styles.input, props.style]}
      />
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blur: {
    marginBottom: 12,
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

const androidStyles = StyleSheet.create({
  input: {
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: '#FFFFFF',
    backgroundColor: '#292524',
  },
});
