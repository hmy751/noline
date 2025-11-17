import { View, Text, type ViewProps } from 'react-native';
import { cn } from '@repo/ui';
import { WifiOff, CheckCircle, Download } from 'lucide-react-native';

export type ActivationStatus = 'online' | 'ready' | 'preparing';

interface ActivationBadgeProps extends ViewProps {
  status: ActivationStatus;
  className?: string;
}

export function ActivationBadge({ status, className, ...props }: ActivationBadgeProps) {
  const config = {
    online: {
      icon: WifiOff,
      text: '온라인 전용',
      bgColor: 'bg-secondary',
      textColor: 'text-secondary-foreground',
      iconColor: '#6b7280', // secondary-foreground
    },
    ready: {
      icon: CheckCircle,
      text: '준비 완료',
      bgColor: 'bg-success/10',
      textColor: 'text-success',
      iconColor: '#22c55e', // success
    },
    preparing: {
      icon: Download,
      text: '준비 중',
      bgColor: 'bg-warning/10',
      textColor: 'text-warning',
      iconColor: '#f59e0b', // warning
    },
  };

  const { icon: Icon, text, bgColor, textColor, iconColor } = config[status];

  return (
    <View className={cn('flex-row items-center gap-xs rounded-full px-sm py-2xs', bgColor, className)} {...props}>
      <Icon size={14} color={iconColor} strokeWidth={2} />
      <Text className={cn('text-label', textColor)}>{text}</Text>
    </View>
  );
}
