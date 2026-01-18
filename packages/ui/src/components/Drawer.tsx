import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { cn } from '../lib/utils';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ========================================
// Drawer Types
// ========================================

export type DrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showHandle?: boolean;
  childrenOverlay?: React.ReactNode;
};

// ========================================
// Drawer Component
// ========================================

/**
 * Drawer (Bottom Sheet) 컴포넌트
 * 화면 하단에서 올라오는 모달 형태의 컴포넌트
 *
 * backdrop은 fade, 콘텐츠는 slide 애니메이션으로 분리
 */
export const Drawer = ({ isOpen, onClose, children, title, showHandle = true, childrenOverlay }: DrawerProps) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (isOpen) {
      // 열릴 때: 아래에서 위로 슬라이드
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      // 닫힐 때: 위에서 아래로 슬라이드
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen, slideAnim]);

  return (
    <Modal visible={isOpen} transparent animationType='fade' onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View className='flex-1 justify-end bg-black/50'>
            <TouchableWithoutFeedback>
              <Animated.View
                className='bg-card rounded-t-2xl max-h-[90vh]'
                style={{ transform: [{ translateY: slideAnim }] }}
              >
                {/* Handle */}
                {showHandle && (
                  <View className='items-center py-2xs'>
                    <View className='w-10 h-1 rounded-full bg-border' />
                  </View>
                )}

                {/* Header */}
                {title && (
                  <View className='px-sm pt-xs pb-sm border-b border-card-border'>
                    <Text className='text-title-large text-foreground'>{title}</Text>
                  </View>
                )}

                {/* Content */}
                <ScrollView className='px-sm pt-lg pb-md' showsVerticalScrollIndicator={false} bounces={false}>
                  {children}
                </ScrollView>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>

        {/* Overlay for children (e.g., DatePicker) - KeyboardAvoidingView를 기준으로 화면 중앙 정렬 */}
        {childrenOverlay}
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ========================================
// DrawerHeader Component
// ========================================

export type DrawerHeaderProps = {
  title: string;
  onClose?: () => void;
  className?: string;
};

export const DrawerHeader = ({ title, onClose, className }: DrawerHeaderProps) => {
  return (
    <View className={cn('flex-row items-center justify-between pb-md', className)}>
      <Text className='text-title-large text-foreground'>{title}</Text>
      {onClose && (
        <TouchableOpacity onPress={onClose} className='p-2xs'>
          <Text className='text-body text-muted-foreground'>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ========================================
// DrawerFooter Component
// ========================================

export type DrawerFooterProps = {
  children: React.ReactNode;
  className?: string;
};

export const DrawerFooter = ({ children, className }: DrawerFooterProps) => {
  return <View className={cn('flex-row gap-sm pt-md border-t border-card-border', className)}>{children}</View>;
};
