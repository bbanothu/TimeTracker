import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  Text,
  View,
  type ViewProps,
} from 'react-native';

import { useAppColors } from '@/hooks/useAppColors';

interface BottomSheetModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  sheetClassName?: ViewProps['className'];
}

const DISMISS_DISTANCE = 64;
const DISMISS_VELOCITY = 0.45;

export function BottomSheetModal({
  visible,
  title,
  onClose,
  children,
  sheetClassName = 'max-h-[60%]',
}: BottomSheetModalProps) {
  const colors = useAppColors();
  const translateY = useRef(new Animated.Value(0)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [translateY, visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          gestureState.dy > 2 && Math.abs(gestureState.dy) >= Math.abs(gestureState.dx),
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            translateY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > DISMISS_DISTANCE || gestureState.vy > DISMISS_VELOCITY) {
            Animated.timing(translateY, {
              toValue: 420,
              duration: 180,
              useNativeDriver: true,
            }).start(() => {
              translateY.setValue(0);
              onCloseRef.current();
            });
            return;
          }

          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        },
      }),
    [translateY],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable
          className="absolute inset-0"
          style={{ backgroundColor: colors.overlay }}
          onPress={onClose}
        />

        <Animated.View
          className={`rounded-t-3xl pb-8 ${sheetClassName ?? ''}`}
          style={{
            backgroundColor: colors.surfaceSolid,
            transform: [{ translateY }],
          }}
        >
          <View {...panResponder.panHandlers} className="px-4 pb-2 pt-3">
            <View className="mb-3 items-center">
              <View
                className="h-1 w-10 rounded-full"
                style={{ backgroundColor: colors.textMuted, opacity: 0.45 }}
              />
            </View>

            <View className="mb-2 flex-row items-center justify-between">
              <Text className="flex-1 text-lg font-semibold" style={{ color: colors.text }}>
                {title}
              </Text>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
                className="ml-3 rounded-full p-1"
                hitSlop={8}
              >
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>

          <View className="px-4">{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}
