import { forwardRef } from 'react';
import { Image as RNImage, type ImageProps as RNImageProps } from 'react-native';
import { cn } from '../lib/utils';

export interface ImageProps extends RNImageProps {
  className?: string;
}

/**
 * Image Component
 */
export const Image = forwardRef<React.ElementRef<typeof RNImage>, ImageProps>(
  ({ className, resizeMode = 'cover', ...props }, ref) => {
    return <RNImage ref={ref} className={cn(className)} resizeMode={resizeMode} {...props} />;
  },
);

Image.displayName = 'Image';
