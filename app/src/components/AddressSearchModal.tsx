import { useEffect, useRef, useState } from 'react';
import { Keyboard, ScrollView, Text, TextInput } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { BottomSheetModal } from '@/components/BottomSheetModal';
import { useAppColors } from '@/hooks/useAppColors';
import { geocodeAddress } from '@/lib/geocodeAddress';

interface AddressSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (latitude: number, longitude: number) => void;
}

const FOCUS_DELAY_MS = 400;

export function AddressSearchModal({ visible, onClose, onSelect }: AddressSearchModalProps) {
  const colors = useAppColors();
  const inputRef = useRef<TextInput>(null);
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!visible) return;

    setAddress('');
    setError(null);
    setSearching(false);
    Keyboard.dismiss();

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, FOCUS_DELAY_MS);

    return () => clearTimeout(timer);
  }, [visible]);

  const handleDone = async () => {
    if (!address.trim()) {
      setError('Enter an address.');
      return;
    }

    try {
      setSearching(true);
      setError(null);
      const location = await geocodeAddress(address);
      if (!location) {
        setError('No results for that address.');
        return;
      }
      onSelect(location.latitude, location.longitude);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not look up address');
    } finally {
      setSearching(false);
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      title="Find address"
      onClose={onClose}
      maxHeightFraction={0.45}
      keyboardAdjust="offset"
    >
      <ScrollView
        keyboardShouldPersistTaps="always"
        scrollEnabled={false}
        automaticallyAdjustKeyboardInsets={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <Text className="mb-3 text-sm" style={{ color: colors.textMuted }}>
          Enter a street address, city, or place name.
        </Text>
        <TextInput
          ref={inputRef}
          value={address}
          onChangeText={setAddress}
          placeholder="123 Main St, San Francisco"
          placeholderTextColor={colors.inputPlaceholder}
          className="mb-3 rounded-xl border px-4 py-3 text-base"
          style={{
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            color: colors.text,
          }}
          onSubmitEditing={() => {
            handleDone().catch(console.error);
          }}
        />
        {error ? (
          <Text className="mb-3 text-sm" style={{ color: colors.destructiveText }}>
            {error}
          </Text>
        ) : null}
        <ActionButton label="Done" onPress={handleDone} loading={searching} disabled={searching} />
      </ScrollView>
    </BottomSheetModal>
  );
}
