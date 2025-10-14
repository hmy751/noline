import { forwardRef } from 'react';
import { View, Text, type ViewProps } from 'react-native';
import { cn } from '../lib/utils';
import { Image, type ImageProps } from './Image';

// Avatar Root Component
export interface AvatarProps extends ViewProps {
  className?: string;
}

export const Avatar = forwardRef<React.ElementRef<typeof View>, AvatarProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <View ref={ref} className={cn('relative h-10 w-10 overflow-hidden rounded-full', className)} {...props}>
        {children}
      </View>
    );
  },
);

Avatar.displayName = 'Avatar';

// Avatar Image Component
export interface AvatarImageProps extends ImageProps {
  className?: string;
}

export const AvatarImage = forwardRef<React.ElementRef<typeof Image>, AvatarImageProps>(
  ({ className, ...props }, ref) => {
    return <Image ref={ref} className={cn('h-full w-full', className)} {...props} />;
  },
);

AvatarImage.displayName = 'AvatarImage';

// Avatar Fallback Component
export interface AvatarFallbackProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

export const AvatarFallback = forwardRef<React.ElementRef<typeof View>, AvatarFallbackProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <View ref={ref} className={cn('h-full w-full items-center justify-center bg-muted', className)} {...props}>
        {typeof children === 'string' ? (
          <Text className='text-body font-medium text-foreground'>{children}</Text>
        ) : (
          children
        )}
      </View>
    );
  },
);

AvatarFallback.displayName = 'AvatarFallback';
