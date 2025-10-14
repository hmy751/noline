import * as SwitchPrimitive from '@rn-primitives/switch';
import { forwardRef } from 'react';
import { cn } from '../lib/utils';

const SwitchRoot = SwitchPrimitive.Root;

const Switch = forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <SwitchRoot
      ref={ref}
      className={cn(
        'native:h-8 h-6 w-11 rounded-full border-2 border-input transition-colors',
        props.checked ? 'bg-primary' : 'bg-input',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'native:h-7 native:w-7 pointer-events-none h-5 w-5 rounded-full bg-background shadow-md transition-transform',
          props.checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </SwitchRoot>
  );
});

Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch, SwitchRoot };
