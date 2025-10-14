import { forwardRef, useState } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { cn } from '../lib/utils';

export interface SwitchProps extends Omit<PressableProps, 'onPress'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export const Switch = forwardRef<React.ElementRef<typeof Pressable>, SwitchProps>(
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

    const thumbStyle = useAnimatedStyle(() => {
      return {
        transform: [{ translateX: withSpring(checked ? 20 : 2) }],
      };
    });

    return (
      <Pressable
        ref={ref}
        onPress={handlePress}
        className={cn(
          'h-6 w-11 rounded-full',
          checked ? 'bg-primary' : 'bg-input',
          disabled && 'opacity-50',
          className,
        )}
        disabled={disabled}
        {...props}
      >
        <Animated.View style={[thumbStyle]} className='mt-[2px] h-5 w-5 rounded-full bg-background' />
      </Pressable>
    );
  },
);

Switch.displayName = 'Switch';
