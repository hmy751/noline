import * as RadioGroupPrimitive from '@rn-primitives/radio-group';
import { forwardRef } from 'react';
import { View } from 'react-native';
import { cn } from '../lib/utils';

const RadioGroupRoot = RadioGroupPrimitive.Root;

const RadioGroup = forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return <RadioGroupRoot ref={ref} className={cn('gap-2', className)} {...props} />;
});

RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'native:h-5 native:w-5 h-5 w-5 items-center justify-center rounded-full border-2 border-input',
        props.checked && 'border-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className='h-full w-full items-center justify-center'>
        <View className='h-3 w-3 rounded-full bg-primary' />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});

RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem, RadioGroupRoot };
