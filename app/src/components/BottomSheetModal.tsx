import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type ScrollViewProps,
  type ViewProps,
} from 'react-native';

import { useAppColors } from '@/hooks/useAppColors';

interface BottomSheetModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  sheetClassName?: ViewProps['className'];
  maxHeightFraction?: number;
}

const DISMISS_DISTANCE = 64;
const DISMISS_VELOCITY = 0.45;
const SHEET_HEADER_HEIGHT = 96;
const SHEET_BOTTOM_PADDING = 32;

export function getBottomSheetScrollHeight(
  windowHeight: number,
  maxHeightFraction = 0.6,
): number {
  const maxSheetHeight = Math.round(windowHeight * maxHeightFraction);
  return maxSheetHeight - SHEET_HEADER_HEIGHT - SHEET_BOTTOM_PADDING;
}

type BottomSheetScrollViewProps = ScrollViewProps & {
  maxHeightFraction?: number;
};

export function BottomSheetScrollView({
  maxHeightFraction = 0.6,
  contentContainerStyle,
  children,
  ...props
}: BottomSheetScrollViewProps) {
  const { height: windowHeight } = useWindowDimensions();
  const scrollMaxHeight = getBottomSheetScrollHeight(windowHeight, maxHeightFraction);

  return (
    <ScrollView
      style={{ maxHeight: scrollMaxHeight }}
      nestedScrollEnabled
      showsVerticalScrollIndicator
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={contentContainerStyle}
      {...props}
    >
      {children}
    </ScrollView>
  );
}

export function BottomSheetModal({
  visible,
  title,
  onClose,
  children,
  sheetClassName,
  maxHeightFraction = 0.6,
}: BottomSheetModalProps) {
  const colors = useAppColors();
  const { height: windowHeight } = useWindowDimensions();
  const maxSheetHeight = Math.round(windowHeight * maxHeightFraction);
  const maxContentHeight = maxSheetHeight - SHEET_HEADER_HEIGHT - SHEET_BOTTOM_PADDING;
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
            maxHeight: maxSheetHeight,
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

          <View className="px-4" style={{ maxHeight: maxContentHeight, minHeight: 0 }}>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
