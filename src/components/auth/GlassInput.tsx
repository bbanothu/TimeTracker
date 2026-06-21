import { BlurView } from 'expo-blur';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

interface GlassInputProps extends TextInputProps {}

export function GlassInput(props: GlassInputProps) {
  return (
    <BlurView intensity={35} tint="light" style={styles.blur}>
      <TextInput
        {...props}
        placeholderTextColor={props.placeholderTextColor ?? 'rgba(255,255,255,0.55)'}
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
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});
