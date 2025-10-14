import * as LabelPrimitive from '@rn-primitives/label';
import { forwardRef } from 'react';
import { cn } from '../lib/utils';

const Label = forwardRef<
  React.ElementRef<typeof LabelPrimitive.Text>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Text>
>(({ className, ...props }, ref) => {
  return (
    <LabelPrimitive.Text
      ref={ref}
      className={cn('native:text-base text-label font-medium leading-none text-foreground', className)}
      {...props}
    />
  );
});

Label.displayName = LabelPrimitive.Text.displayName;

export { Label };
