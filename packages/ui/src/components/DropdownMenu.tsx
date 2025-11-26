import { forwardRef, useRef } from 'react';
import { Modal, Text, Pressable as RNPressable, type ViewStyle } from 'react-native';
import { cn } from '../lib/utils';

export type DropdownMenuPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DropdownMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: DropdownMenuPosition;
  className?: string;
};

/**
 * 드롭다운 메뉴 컨테이너
 * - 바깥 영역 터치 시 닫힘
 * - position 기반 위치 지정
 * - fade 애니메이션
 */
export const DropdownMenu = forwardRef<React.ElementRef<typeof Modal>, DropdownMenuProps>(
  ({ isOpen, onClose, children, position, className }, ref) => {
    const lastPositionRef = useRef(position);

    if (position) {
      lastPositionRef.current = position;
    }

    const currentPosition = position ?? lastPositionRef.current;

    const menuStyle: ViewStyle = {
      position: 'absolute',
      top: currentPosition?.y ? currentPosition.y + 40 : 200,
      right: 16,
    };

    return (
      <Modal ref={ref} visible={isOpen} transparent animationType='fade' onRequestClose={onClose}>
        <RNPressable className='flex-1' onPress={onClose}>
          <RNPressable
            className={cn(
              'absolute bg-card rounded-lg w-48 overflow-hidden shadow-lg border border-card-border',
              className,
            )}
            style={menuStyle}
          >
            {children}
          </RNPressable>
        </RNPressable>
      </Modal>
    );
  },
);

DropdownMenu.displayName = 'DropdownMenu';

export type DropdownMenuItemProps = {
  onPress: () => void;
  icon?: React.ReactNode;
  label: string;
  variant?: 'default' | 'destructive';
  showBorder?: boolean;
  className?: string;
};

/**
 * 드롭다운 메뉴 아이템
 */
export const DropdownMenuItem = forwardRef<React.ElementRef<typeof RNPressable>, DropdownMenuItemProps>(
  ({ onPress, icon, label, variant = 'default', showBorder = true, className }, ref) => {
    return (
      <RNPressable
        ref={ref}
        className={cn(
          'flex-row items-center gap-sm p-md active:bg-muted',
          showBorder && 'border-b border-card-border',
          className,
        )}
        onPress={onPress}
      >
        {icon}
        <Text className={cn('text-body', variant === 'destructive' ? 'text-destructive' : 'text-foreground')}>
          {label}
        </Text>
      </RNPressable>
    );
  },
);

DropdownMenuItem.displayName = 'DropdownMenuItem';
