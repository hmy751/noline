import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { cn } from '../lib/utils';

// ========================================
// Drawer Types
// ========================================

export type DrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showHandle?: boolean;
};

// ========================================
// Drawer Component
// ========================================

/**
 * Drawer (Bottom Sheet) 컴포넌트
 * 화면 하단에서 올라오는 모달 형태의 컴포넌트
 */
export const Drawer = ({ isOpen, onClose, children, title, showHandle = true }: DrawerProps) => {
  return (
    <Modal visible={isOpen} transparent animationType='slide' onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className='flex-1'>
        <TouchableWithoutFeedback onPress={onClose}>
          <View className='flex-1 justify-end bg-black/50'>
            <TouchableWithoutFeedback>
              <View className='bg-card rounded-t-2xl max-h-[90vh]'>
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
                <ScrollView className='px-sm py-md' showsVerticalScrollIndicator={false} bounces={false}>
                  {children}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
