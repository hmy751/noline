import { Text } from 'react-native';
import { Badge } from '@repo/ui';
import { cn } from '@repo/ui';

interface NetworkStatusProps {
  status: 'online' | 'offline' | 'syncing';
  className?: string;
}

const statusConfig = {
  online: {
    icon: '✓',
    text: '동기됨',
    color: 'text-status-online',
  },
  offline: {
    icon: '⚡',
    text: '오프라인',
    color: 'text-status-offline',
  },
  syncing: {
    icon: '⚠️',
    text: '동기화 중',
    color: 'text-status-syncing',
  },
};

export function NetworkStatus({ status, className }: NetworkStatusProps) {
  const config = statusConfig[status];

  return (
    <Badge variant='outline' className={cn('flex-row items-center gap-3xs', className)}>
      <Text className={cn('text-label-small', config.color)}>{config.icon}</Text>
      <Text className={cn('text-label-small', config.color)}>{config.text}</Text>
    </Badge>
  );
}
