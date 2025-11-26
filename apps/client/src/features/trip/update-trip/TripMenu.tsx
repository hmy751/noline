import { DropdownMenu, DropdownMenuItem, type DropdownMenuPosition } from '@repo/ui';
import { Edit2, Trash2, Download, WifiOff } from 'lucide-react-native';

export type TripMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
  isActivated?: boolean;
  buttonPosition?: DropdownMenuPosition;
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
  const handleEdit = () => {
    onEdit();
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  const handleActivate = () => {
    onActivate?.();
    onClose();
  };

  const handleDeactivate = () => {
    onDeactivate?.();
    onClose();
  };

  return (
    <DropdownMenu isOpen={isOpen} onClose={onClose} position={buttonPosition}>
      {onActivate && !isActivated && (
        <DropdownMenuItem
          onPress={handleActivate}
          icon={<Download size={20} color='hsl(120, 61%, 34%)' strokeWidth={2} />}
          label='오프라인 활성화'
        />
      )}

      {onDeactivate && isActivated && (
        <DropdownMenuItem
          onPress={handleDeactivate}
          icon={<WifiOff size={20} color='hsl(25, 95%, 53%)' strokeWidth={2} />}
          label='오프라인 해제'
          className='text-orange-600'
        />
      )}

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
