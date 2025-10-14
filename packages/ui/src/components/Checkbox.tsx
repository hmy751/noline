import * as CheckboxPrimitive from '@rn-primitives/checkbox';
import { forwardRef } from 'react';
import { View } from 'react-native';
import { cn } from '../lib/utils';

const CheckboxRoot = CheckboxPrimitive.Root;

const CheckboxIndicator = forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Indicator>
>(({ className, ...props }, ref) => {
  return (
    <CheckboxPrimitive.Indicator ref={ref} className={cn('h-full w-full', className)} {...props}>
      <View className='h-3 w-3 items-center justify-center'>
        <View className='h-[2px] w-3 rotate-45 translate-x-[1px] translate-y-[2px] bg-primary-foreground' />
        <View className='h-[2px] w-[6px] -rotate-45 -translate-x-[3px] translate-y-[1px] bg-primary-foreground' />
      </View>
    </CheckboxPrimitive.Indicator>
  );
});

CheckboxIndicator.displayName = 'CheckboxIndicator';

const Checkbox = forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <CheckboxRoot
      ref={ref}
      className={cn(
        'native:h-5 native:w-5 web:peer h-5 w-5 shrink-0 items-center justify-center rounded-sm border-2 border-input disabled:cursor-not-allowed disabled:opacity-50',
        props.checked && 'border-primary bg-primary',
        className,
      )}
      {...props}
    >
      <CheckboxIndicator />
    </CheckboxRoot>
  );
});

Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox, CheckboxIndicator, CheckboxRoot };
