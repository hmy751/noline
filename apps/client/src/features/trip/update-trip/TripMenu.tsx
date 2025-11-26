import React, { useRef } from 'react';
import { Modal, Text, TouchableOpacity, Pressable } from 'react-native';
import { Edit2, Trash2, Download, WifiOff } from 'lucide-react-native';

export type TripMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
  isActivated?: boolean;
  buttonPosition?: { x: number; y: number; width: number; height: number };
};

/**
 * 여행 편집/삭제 및 활성화를 위한 드롭다운 메뉴
 */
export const TripMenu = ({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  isActivated,
  buttonPosition,
}: TripMenuProps) => {
  const lastPositionRef = useRef(buttonPosition);

  if (buttonPosition) {
    lastPositionRef.current = buttonPosition;
  }

  const position = buttonPosition ?? lastPositionRef.current;

  return (
    <Modal visible={isOpen} transparent animationType='fade' onRequestClose={onClose}>
      <Pressable className='flex-1' onPress={onClose}>
        <Pressable
          className='absolute bg-card rounded-lg w-48 overflow-hidden shadow-lg border border-card-border'
          style={{
            top: position?.y ? position.y + 40 : 200,
            right: 16,
          }}
        >
          {/* 활성화/비활성화 버튼 */}
          {onActivate && !isActivated && (
            <TouchableOpacity
              className='flex-row items-center gap-sm p-md border-b border-card-border active:bg-muted'
              onPress={() => {
                onActivate();
                onClose();
              }}
            >
              <Download size={20} color='hsl(120, 61%, 34%)' strokeWidth={2} />
              <Text className='text-body text-foreground'>오프라인 활성화</Text>
            </TouchableOpacity>
          )}

          {onDeactivate && isActivated && (
            <TouchableOpacity
              className='flex-row items-center gap-sm p-md border-b border-card-border active:bg-muted'
              onPress={() => {
                onDeactivate();
                onClose();
              }}
            >
              <WifiOff size={20} color='hsl(25, 95%, 53%)' strokeWidth={2} />
              <Text className='text-body text-orange-600'>오프라인 해제</Text>
            </TouchableOpacity>
          )}

          {/* 수정 버튼 */}
          <TouchableOpacity
            className='flex-row items-center gap-sm p-md border-b border-card-border active:bg-muted'
            onPress={() => {
              onEdit();
              onClose();
            }}
          >
            <Edit2 size={20} color='hsl(0, 0%, 12%)' strokeWidth={2} />
            <Text className='text-body text-foreground'>수정</Text>
          </TouchableOpacity>

          {/* 삭제 버튼 */}
          <TouchableOpacity
            className='flex-row items-center gap-sm p-md active:bg-muted'
            onPress={() => {
              onDelete();
              onClose();
            }}
          >
            <Trash2 size={20} color='hsl(0, 75%, 50%)' strokeWidth={2} />
            <Text className='text-body text-destructive'>삭제</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
