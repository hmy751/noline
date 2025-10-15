import * as RNPSelect from '@rn-primitives/select';
import { forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

/**
 * Select Root - Provides context and manages state
 */
const SelectRoot = RNPSelect.Root;

/**
 * Select Trigger - Button that opens the select
 */
const selectTriggerVariants = cva(
  'flex-row items-center justify-between rounded-xl border bg-background active:bg-muted transition-colors',
  {
    variants: {
      variant: {
        default: 'border-input',
        outline: 'border-input',
      },
      size: {
        sm: 'px-xs py-xs',
        md: 'px-sm py-sm',
        lg: 'px-md py-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof RNPSelect.Trigger>,
    VariantProps<typeof selectTriggerVariants> {}

const SelectTrigger = forwardRef<React.ElementRef<typeof RNPSelect.Trigger>, SelectTriggerProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <RNPSelect.Trigger ref={ref} className={cn(selectTriggerVariants({ variant, size, className }))} {...props} />
    );
  },
);

SelectTrigger.displayName = 'Select.Trigger';

/**
 * Select Value - Displays the selected value
 */
const SelectValue = forwardRef<
  React.ElementRef<typeof RNPSelect.Value>,
  React.ComponentPropsWithoutRef<typeof RNPSelect.Value>
>(({ className, ...props }, ref) => {
  return <RNPSelect.Value ref={ref} className={cn('text-body text-foreground', className)} {...props} />;
});

SelectValue.displayName = 'Select.Value';

/**
 * Select Portal - Renders content in a portal
 */
const SelectPortal = RNPSelect.Portal;

/**
 * Select Overlay - Background overlay
 */
const SelectOverlay: React.ForwardRefExoticComponent<
  React.ComponentPropsWithoutRef<typeof RNPSelect.Overlay> &
    React.RefAttributes<React.ElementRef<typeof RNPSelect.Overlay>>
> = forwardRef<React.ElementRef<typeof RNPSelect.Overlay>, React.ComponentPropsWithoutRef<typeof RNPSelect.Overlay>>(
  ({ className, ...props }, ref) => {
    return (
      <RNPSelect.Overlay
        ref={ref}
        style={StyleSheet.absoluteFill}
        className={cn('bg-black/50', className)}
        {...props}
      />
    );
  },
);

SelectOverlay.displayName = 'Select.Overlay';

/**
 * Select Content - Container for select items
 */
const SelectContent: React.ForwardRefExoticComponent<
  React.ComponentPropsWithoutRef<typeof RNPSelect.Content> &
    React.RefAttributes<React.ElementRef<typeof RNPSelect.Content>>
> = forwardRef<React.ElementRef<typeof RNPSelect.Content>, React.ComponentPropsWithoutRef<typeof RNPSelect.Content>>(
  ({ className, children, ...props }, ref) => {
    return (
      <RNPSelect.Content ref={ref} className={cn('bg-card rounded-lg p-xs', className)} {...props}>
        {children}
      </RNPSelect.Content>
    );
  },
);

SelectContent.displayName = 'Select.Content';

/**
 * Select Viewport - Scrollable area containing items
 */
const SelectViewport = RNPSelect.Viewport;

/**
 * Select Item - Individual select option
 */
const SelectItem = forwardRef<
  React.ElementRef<typeof RNPSelect.Item>,
  React.ComponentPropsWithoutRef<typeof RNPSelect.Item>
>(({ className, ...props }, ref) => {
  return <RNPSelect.Item ref={ref} className={cn('w-full flex-row items-center px-sm py-xs', className)} {...props} />;
});

SelectItem.displayName = 'Select.Item';

/**
 * Select Item Text - Text content of an item
 */
const SelectItemText = RNPSelect.ItemText;

/**
 * Select Item Indicator - Shows selected state
 */
const SelectItemIndicator: React.ForwardRefExoticComponent<
  React.ComponentPropsWithoutRef<typeof RNPSelect.ItemIndicator> &
    React.RefAttributes<React.ElementRef<typeof RNPSelect.ItemIndicator>>
> = forwardRef<
  React.ElementRef<typeof RNPSelect.ItemIndicator>,
  React.ComponentPropsWithoutRef<typeof RNPSelect.ItemIndicator>
>(({ className, ...props }, ref) => {
  return <RNPSelect.ItemIndicator ref={ref} className={cn('ml-auto', className)} {...props} />;
});

SelectItemIndicator.displayName = 'Select.ItemIndicator';

/**
 * Select Group - Groups related items
 */
const SelectGroup = RNPSelect.Group;

/**
 * Select Label - Label for a group
 */
const SelectLabel = forwardRef<
  React.ElementRef<typeof RNPSelect.Label>,
  React.ComponentPropsWithoutRef<typeof RNPSelect.Label>
>(({ className, ...props }, ref) => {
  return (
    <RNPSelect.Label ref={ref} className={cn('px-sm py-xs text-label text-muted-foreground', className)} {...props} />
  );
});

SelectLabel.displayName = 'Select.Label';

/**
 * Select Separator - Visual separator between items
 */
const SelectSeparator = forwardRef<
  React.ElementRef<typeof RNPSelect.Separator>,
  React.ComponentPropsWithoutRef<typeof RNPSelect.Separator>
>(({ className, ...props }, ref) => {
  return <RNPSelect.Separator ref={ref} className={cn('h-px bg-border', className)} {...props} />;
});

SelectSeparator.displayName = 'Select.Separator';

/**
 * Select - Compound Component
 *
 * Based on @rn-primitives/select with custom styling.
 *
 * @example
 * <Select defaultValue={{ value: 'apple', label: 'Apple' }}>
 *   <Select.Trigger>
 *     <Select.Value placeholder='Select...' />
 *   </Select.Trigger>
 *   <Select.Portal>
 *     <Select.Overlay>
 *       <Select.Content>
 *         <Select.Viewport>
 *           <Select.Item value='apple' label='Apple'>
 *             <Select.ItemText>Apple</Select.ItemText>
 *           </Select.Item>
 *         </Select.Viewport>
 *       </Select.Content>
 *     </Select.Overlay>
 *   </Select.Portal>
 * </Select>
 */
const Select = Object.assign(SelectRoot, {
  Trigger: SelectTrigger,
  Value: SelectValue,
  Portal: SelectPortal,
  Overlay: SelectOverlay,
  Content: SelectContent,
  Viewport: SelectViewport,
  Item: SelectItem,
  ItemText: SelectItemText,
  ItemIndicator: SelectItemIndicator,
  Group: SelectGroup,
  Label: SelectLabel,
  Separator: SelectSeparator,
}) as typeof SelectRoot & {
  Trigger: typeof SelectTrigger;
  Value: typeof SelectValue;
  Portal: typeof SelectPortal;
  Overlay: typeof SelectOverlay;
  Content: typeof SelectContent;
  Viewport: typeof SelectViewport;
  Item: typeof SelectItem;
  ItemText: typeof SelectItemText;
  ItemIndicator: typeof SelectItemIndicator;
  Group: typeof SelectGroup;
  Label: typeof SelectLabel;
  Separator: typeof SelectSeparator;
};

export { Select };
