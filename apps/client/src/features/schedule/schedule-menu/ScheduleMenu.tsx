import React, { useRef } from 'react';
import { Modal, Text, TouchableOpacity, Pressable } from 'react-native';
import { Edit2, Trash2 } from 'lucide-react-native';

export type ScheduleMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  buttonPosition?: { x: number; y: number; width: number; height: number };
};

/**
 * 일정 편집/삭제를 위한 드롭다운 메뉴
 */
export const ScheduleMenu = ({ isOpen, onClose, onEdit, onDelete, buttonPosition }: ScheduleMenuProps) => {
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
