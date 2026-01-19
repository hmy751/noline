import { View, StyleSheet } from 'react-native';
import { Crosshair, Loader2 } from 'lucide-react-native';
import { Pressable } from '@repo/ui';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useEffect } from 'react';

interface MyLocationButtonProps {
  onPress: () => void;
  isLoading?: boolean;
  style?: any;
}

export function MyLocationButton({ onPress, isLoading, style }: MyLocationButtonProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isLoading) {
      rotation.value = withRepeat(withTiming(360, { duration: 1000, easing: Easing.linear }), -1);
    } else {
      rotation.value = 0;
    }
  }, [isLoading]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <View style={[styles.container, style]}>
      <Pressable
        onPress={onPress}
        disabled={isLoading}
        variant='ghost'
        size='icon'
        className='w-12 h-12 bg-white rounded-full items-center justify-center active:bg-gray-100'
        style={styles.button}
      >
        {isLoading ? (
          <Animated.View style={animatedStyle}>
            <Loader2 size={24} color='#228B22' />
          </Animated.View>
        ) : (
          <Crosshair size={24} color='#333' />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24, // 카드 UI 고려하여 배치 (필요시 조정)
    right: 24,
    zIndex: 10,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
