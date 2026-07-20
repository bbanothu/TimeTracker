import { useEffect, useState } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { useAppColors } from '@/contexts/ThemeContext';
import { geocodeAddress } from '@/lib/geocodeAddress';

interface AddressSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (latitude: number, longitude: number) => void;
}

export function AddressSearchModal({ visible, onClose, onSelect }: AddressSearchModalProps) {
  const colors = useAppColors();
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setAddress('');
    setError(null);
    setSearching(false);
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
      zIndexClass="z-[9999]"
    >
      <p className="mb-3 text-sm" style={{ color: colors.textMuted }}>
        Enter a street address, city, or place name.
      </p>
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="123 Main St, San Francisco"
        autoFocus
        className="mb-3 w-full rounded-xl border px-4 py-2.5 text-base"
        style={{
          backgroundColor: colors.inputBg,
          borderColor: colors.inputBorder,
          color: colors.text,
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            handleDone().catch(console.error);
          }
        }}
      />
      {error ? (
        <p className="mb-3 text-sm" style={{ color: colors.destructiveText }}>
          {error}
        </p>
      ) : null}
      <ActionButton
        label="Done"
        onClick={handleDone}
        loading={searching}
        disabled={searching}
        className="w-full"
      />
    </BottomSheetModal>
  );
}
