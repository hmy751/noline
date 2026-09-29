import { View, Text, ActivityIndicator } from 'react-native';
import { Pressable } from '@repo/ui';

type Props = { status: 'loading' } | { status: 'error'; retry: () => void };

export function ExpenseQueryFeedback(props: Props) {
  return (
    <View className='flex-1 items-center justify-center px-lg' accessibilityState={{ busy: props.status !== 'error' }}>
      {props.status !== 'error' ? (
        <>
          <ActivityIndicator color='hsl(120, 61%, 34%)' />
          <Text className='text-body text-muted-foreground text-center m-xs'>경비를 불러오고 있어요.</Text>
        </>
      ) : (
        <>
          <Text className='text-body text-muted-foreground text-center mb-sm'>경비를 불러오지 못했어요.</Text>
          <Pressable variant='outline' size='md' accessibilityRole='button' onPress={props.retry}>
            다시 불러오기
          </Pressable>
        </>
      )}
    </View>
  );
}

export function ExpenseRefreshError({ retry }: { retry?: () => void }) {
  return (
    <View className='flex-row items-center justify-between gap-sm px-md py-sm'>
      <Text className='flex-1 text-body text-muted-foreground'>
        경비를 갱신하지 못했어요. 이전 내용을 표시하고 있어요.
      </Text>
      {retry && (
        <Pressable variant='outline' size='sm' accessibilityRole='button' onPress={retry}>
          다시 불러오기
        </Pressable>
      )}
    </View>
  );
}
