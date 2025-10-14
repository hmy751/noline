import { forwardRef, useState } from 'react';
import { Pressable, View, type PressableProps } from 'react-native';
import { cn } from '../lib/utils';

export interface CheckboxProps extends Omit<PressableProps, 'onPress'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export const Checkbox = forwardRef<React.ElementRef<typeof Pressable>, CheckboxProps>(
  ({ checked: controlledChecked, onCheckedChange, className, disabled, ...props }, ref) => {
    const [uncontrolledChecked, setUncontrolledChecked] = useState(false);

    const isControlled = controlledChecked !== undefined;
    const checked = isControlled ? controlledChecked : uncontrolledChecked;

    const handlePress = () => {
      if (disabled) return;

      const newChecked = !checked;

      if (!isControlled) {
        setUncontrolledChecked(newChecked);
      }

      onCheckedChange?.(newChecked);
    };

    return (
      <Pressable
        ref={ref}
        onPress={handlePress}
        className={cn(
          'h-5 w-5 items-center justify-center rounded-sm border-2 border-input',
          checked && 'border-primary bg-primary',
          disabled && 'opacity-50',
          className,
        )}
        disabled={disabled}
        {...props}
      >
        {checked && (
          <View className='h-3 w-3 items-center justify-center'>
            {/* Simple check mark using View */}
            <View className='h-[2px] w-3 rotate-45 translate-x-[1px] translate-y-[2px] bg-primary-foreground' />
            <View className='h-[2px] w-[6px] -rotate-45 -translate-x-[3px] translate-y-[1px] bg-primary-foreground' />
          </View>
        )}
      </Pressable>
    );
  },
);

Checkbox.displayName = 'Checkbox';
