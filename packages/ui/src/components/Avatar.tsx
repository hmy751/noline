import * as AvatarPrimitive from '@rn-primitives/avatar';
import { forwardRef } from 'react';
import { Text } from 'react-native';
import { cn } from '../lib/utils';
import { Image, type ImageProps } from './Image';

const AvatarRoot = AvatarPrimitive.Root;

const Avatar = forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <AvatarRoot
      ref={ref}
      className={cn('relative h-10 w-10 flex items-center justify-center rounded-full overflow-hidden', className)}
      {...props}
    />
  );
});

Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = forwardRef<React.ElementRef<typeof Image>, ImageProps>(({ className, ...props }, ref) => {
  return <Image ref={ref} className={cn('h-full w-full', className)} {...props} />;
});

AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, children, ...props }, ref) => {
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn('h-full w-full items-center justify-center bg-muted', className)}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text className='text-body font-medium text-foreground'>{children}</Text>
      ) : (
        children
      )}
    </AvatarPrimitive.Fallback>
  );
});

AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarFallback, AvatarImage, AvatarRoot };
