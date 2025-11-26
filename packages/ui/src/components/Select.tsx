import { forwardRef, createContext, useContext, useState, useCallback } from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

/**
 * Select Context
 */
interface SelectContextValue {
  value?: { value: string; label: string };
  onValueChange?: (value: { value: string; label: string } | undefined) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextValue | undefined>(undefined);

function useSelectContext() {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within Select.Root');
  }
  return context;
}

/**
 * Select Root - Provides context and manages state
 */
interface SelectRootProps {
  value?: { value: string; label: string };
  onValueChange?: (value: { value: string; label: string } | undefined) => void;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const SelectRoot = ({ value, onValueChange, onOpenChange, children }: SelectRootProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen: handleOpenChange }}>
      {children}
    </SelectContext.Provider>
  );
};

/**
 * Select Trigger - Button that opens the select
 */
const selectTriggerVariants = cva(
  'flex-row items-center justify-between rounded-xl border bg-background active:bg-muted',
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

export interface SelectTriggerProps extends VariantProps<typeof selectTriggerVariants> {
  className?: string;
  children?: React.ReactNode;
}

const SelectTrigger = forwardRef<View, SelectTriggerProps>(({ className, variant, size, children }, ref) => {
  const { setIsOpen } = useSelectContext();

  return (
    <Pressable onPress={() => setIsOpen(true)} className={cn(selectTriggerVariants({ variant, size, className }))}>
      {children}
    </Pressable>
  );
});

SelectTrigger.displayName = 'Select.Trigger';

/**
 * Select Value - Displays the selected value
 */
interface SelectValueProps {
  className?: string;
  placeholder?: string;
}

const SelectValue = forwardRef<View, SelectValueProps>(({ className, placeholder }, ref) => {
  const { value } = useSelectContext();

  return (
    <View ref={ref}>
      <Text className={cn('text-body text-foreground', className)}>{value?.label || placeholder || '선택하세요'}</Text>
    </View>
  );
});

SelectValue.displayName = 'Select.Value';

/**
 * Select Portal - Modal wrapper (Drawer style - bottom sheet)
 */
interface SelectPortalProps {
  children: React.ReactNode;
}

const SelectPortal = ({ children }: SelectPortalProps) => {
  const { isOpen, setIsOpen } = useSelectContext();

  return (
    <Modal visible={isOpen} transparent animationType='slide' onRequestClose={() => setIsOpen(false)} statusBarTranslucent>
      {children}
    </Modal>
  );
};

/**
 * Select Overlay - Background overlay (Drawer style)
 */
interface SelectOverlayProps {
  className?: string;
  children?: React.ReactNode;
}

const SelectOverlay = forwardRef<View, SelectOverlayProps>(({ className, children }, ref) => {
  const { setIsOpen } = useSelectContext();

  return (
    <View ref={ref} style={StyleSheet.absoluteFill} className={cn('justify-end', className)}>
      {/* Background overlay - closes modal on press */}
      <Pressable style={StyleSheet.absoluteFill} className='bg-black/50' onPress={() => setIsOpen(false)} />

      {/* Content - doesn't close modal */}
      {children}
    </View>
  );
});

SelectOverlay.displayName = 'Select.Overlay';

/**
 * Select Content - Container for select items (Drawer style)
 */
interface SelectContentProps {
  className?: string;
  children?: React.ReactNode;
  title?: string;
}

const SelectContent = forwardRef<View, SelectContentProps>(({ className, children, title }, ref) => {
  return (
    <View ref={ref} className={cn('bg-card rounded-t-2xl w-full max-h-[70vh]', className)}>
      {/* Handle */}
      <View className='items-center py-2xs'>
        <View className='w-10 h-1 rounded-full bg-border' />
      </View>

      {/* Header */}
      {title && (
        <View className='px-sm pt-xs pb-sm border-b border-card-border'>
          <Text className='text-title-large text-foreground'>{title}</Text>
        </View>
      )}

      {children}
    </View>
  );
});

SelectContent.displayName = 'Select.Content';

/**
 * Select Viewport - Scrollable area containing items
 */
interface SelectViewportProps {
  className?: string;
  children?: React.ReactNode;
}

const SelectViewport = forwardRef<ScrollView, SelectViewportProps>(({ className, children }, ref) => {
  return (
    <ScrollView
      ref={ref}
      className={cn('py-sm px-sm', className)}
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 0, paddingBottom: 24 }}
      bounces={false}
    >
      {children}
    </ScrollView>
  );
});

SelectViewport.displayName = 'Select.Viewport';

/**
 * Select Item - Individual select option
 */
interface SelectItemProps {
  value: string;
  label: string;
  className?: string;
  children?: React.ReactNode;
}

const SelectItem = forwardRef<View, SelectItemProps>(({ value, label, className, children }, ref) => {
  const { value: selectedValue, onValueChange, setIsOpen } = useSelectContext();
  const isSelected = selectedValue?.value === value;

  const handlePress = () => {
    onValueChange?.({ value, label });
    setIsOpen(false);
  };

  return (
    <Pressable onPress={handlePress}>
      <View
        ref={ref}
        className={cn(
          'w-full flex-row items-center px-md py-sm rounded-xl',
          isSelected && 'bg-muted',
          className,
        )}
      >
        {children}
      </View>
    </Pressable>
  );
});

SelectItem.displayName = 'Select.Item';

/**
 * Select Item Text - Text content of an item
 */
interface SelectItemTextProps {
  className?: string;
  children?: React.ReactNode;
}

const SelectItemText = forwardRef<Text, SelectItemTextProps>(({ className, children }, ref) => {
  return (
    <Text ref={ref} className={cn('text-body text-foreground', className)}>
      {children}
    </Text>
  );
});

SelectItemText.displayName = 'Select.ItemText';

/**
 * Select Item Indicator - Shows selected state
 */
interface SelectItemIndicatorProps {
  className?: string;
  children?: React.ReactNode;
}

const SelectItemIndicator = forwardRef<View, SelectItemIndicatorProps>(({ className, children }, ref) => {
  return (
    <View ref={ref} className={cn('ml-auto', className)}>
      {children}
    </View>
  );
});

SelectItemIndicator.displayName = 'Select.ItemIndicator';

/**
 * Select Group - Groups related items
 */
interface SelectGroupProps {
  className?: string;
  children?: React.ReactNode;
}

const SelectGroup = forwardRef<View, SelectGroupProps>(({ className, children }, ref) => {
  return (
    <View ref={ref} className={cn('py-xs', className)}>
      {children}
    </View>
  );
});

SelectGroup.displayName = 'Select.Group';

/**
 * Select Label - Label for a group
 */
interface SelectLabelProps {
  className?: string;
  children?: React.ReactNode;
}

const SelectLabel = forwardRef<Text, SelectLabelProps>(({ className, children }, ref) => {
  return (
    <Text ref={ref} className={cn('px-sm py-xs text-label text-muted-foreground', className)}>
      {children}
    </Text>
  );
});

SelectLabel.displayName = 'Select.Label';

/**
 * Select Separator - Visual separator between items
 */
interface SelectSeparatorProps {
  className?: string;
}

const SelectSeparator = forwardRef<View, SelectSeparatorProps>(({ className }, ref) => {
  return <View ref={ref} className={cn('h-px bg-border my-xs', className)} />;
});

SelectSeparator.displayName = 'Select.Separator';

/**
 * Select - Compound Component
 *
 * Pure React Native implementation without external dependencies.
 *
 * @example
 * <Select value={{ value: 'apple', label: 'Apple' }} onValueChange={handleChange}>
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
