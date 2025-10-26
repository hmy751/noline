import React from 'react';
import { Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Edit2, Trash2 } from 'lucide-react-native';

export type ExpenseMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  buttonPosition?: { x: number; y: number; width: number; height: number };
};

/**
 * 경비 편집/삭제를 위한 드롭다운 메뉴
 */
export const ExpenseMenu = ({ isOpen, onClose, onEdit, onDelete, buttonPosition }: ExpenseMenuProps) => {
  return (
    <Modal visible={isOpen} transparent animationType='fade' onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className='flex-1'>
          <TouchableWithoutFeedback>
            <View
              className='absolute bg-card rounded-lg w-48 overflow-hidden shadow-lg border border-card-border'
              style={{
                top: buttonPosition?.y ? buttonPosition.y + 40 : 200,
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
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
