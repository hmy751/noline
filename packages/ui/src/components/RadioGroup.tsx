import { forwardRef, createContext, useContext } from 'react';
import { View, Pressable, type ViewProps, type PressableProps } from 'react-native';
import { cn } from '../lib/utils';

// Radio Group Context
interface RadioGroupContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue>({});

// Radio Group Root Component
export interface RadioGroupProps extends ViewProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export const RadioGroup = forwardRef<React.ElementRef<typeof View>, RadioGroupProps>(
  ({ value, onValueChange, disabled, className, children, ...props }, ref) => {
    return (
      <RadioGroupContext.Provider value={{ value, onValueChange, disabled }}>
        <View ref={ref} className={cn('gap-2', className)} {...props}>
          {children}
        </View>
      </RadioGroupContext.Provider>
    );
  },
);

RadioGroup.displayName = 'RadioGroup';

// Radio Group Item Component
export interface RadioGroupItemProps extends Omit<PressableProps, 'onPress'> {
  value: string;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export const RadioGroupItem = forwardRef<React.ElementRef<typeof Pressable>, RadioGroupItemProps>(
  ({ value, className, disabled: itemDisabled, ...props }, ref) => {
    const context = useContext(RadioGroupContext);
    const disabled = itemDisabled || context.disabled;
    const checked = context.value === value;

    const handlePress = () => {
      if (disabled) return;
      context.onValueChange?.(value);
    };

    return (
      <Pressable
        ref={ref}
        onPress={handlePress}
        className={cn(
          'h-5 w-5 items-center justify-center rounded-full border-2 border-input',
          checked && 'border-primary',
          disabled && 'opacity-50',
          className,
        )}
        disabled={disabled}
        {...props}
      >
        {checked && <View className='h-3 w-3 rounded-full bg-primary' />}
      </Pressable>
    );
  },
);

RadioGroupItem.displayName = 'RadioGroupItem';
