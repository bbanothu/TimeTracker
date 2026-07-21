import { TextInput, type TextInputProps } from 'react-native';

import { useAppColors } from '@/hooks/useAppColors';

interface GlassInputProps extends TextInputProps {}

export function GlassInput(props: GlassInputProps) {
  const colors = useAppColors();

  return (
    <TextInput
      {...props}
      placeholderTextColor={props.placeholderTextColor ?? colors.inputPlaceholder}
      style={[
        {
          marginBottom: 12,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontSize: 17,
          color: colors.text,
          backgroundColor: colors.inputBg,
        },
        props.style,
      ]}
    />
  );
}
