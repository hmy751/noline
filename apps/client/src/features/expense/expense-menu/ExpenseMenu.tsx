import { DropdownMenu, DropdownMenuItem, type DropdownMenuPosition } from '@repo/ui';
import { Edit2, Trash2 } from 'lucide-react-native';

export type ExpenseMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  buttonPosition?: DropdownMenuPosition;
};

/**
 * 경비 편집/삭제를 위한 드롭다운 메뉴
 */
export const ExpenseMenu = ({ isOpen, onClose, onEdit, onDelete, buttonPosition }: ExpenseMenuProps) => {
  const handleEdit = () => {
    onEdit();
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  return (
    <DropdownMenu isOpen={isOpen} onClose={onClose} position={buttonPosition}>
      <DropdownMenuItem
        onPress={handleEdit}
        icon={<Edit2 size={20} color='hsl(0, 0%, 12%)' strokeWidth={2} />}
        label='수정'
      />

      <DropdownMenuItem
        onPress={handleDelete}
        icon={<Trash2 size={20} color='hsl(0, 75%, 50%)' strokeWidth={2} />}
        label='삭제'
        variant='destructive'
        showBorder={false}
      />
    </DropdownMenu>
  );
};
