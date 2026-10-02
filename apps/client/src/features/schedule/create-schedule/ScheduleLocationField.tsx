import { View, Text, TextInput } from 'react-native';
import { Controller, type Control } from 'react-hook-form';
import { Pressable } from '@repo/ui';
import { Field } from '@/shared/components/Form';
import type { CreateScheduleFormData } from './schema';
import type { Location } from './types';
import type { OperationPolicy } from '@/shared/policy';
import { PolicyErrorDisplay } from '@/shared/components/ErrorBoundary/PolicyErrorDisplay';

export type ScheduleLocationFieldProps = {
  control: Control<CreateScheduleFormData>;
  selectedLocation: Location | null;
  searchAccess: OperationPolicy;
  onSearch: () => void;
  onEditLocationManually: () => void;
  isPending: boolean;
};

/** 장소 표시·직접 입력·검색 제한 안내를 같은 영역에서 책임진다. */
export function ScheduleLocationField({
  control,
  selectedLocation,
  searchAccess,
  onSearch,
  onEditLocationManually,
  isPending,
}: ScheduleLocationFieldProps) {
  return (
    <View className='gap-sm rounded-lg border border-card-border bg-muted/20 p-md'>
      <View className='flex-row items-center justify-between'>
        <Text className='text-title-medium text-foreground'>장소</Text>
        <Pressable
          variant='outline'
          size='sm'
          onPress={onSearch}
          disabled={!searchAccess.allowed || isPending}
          accessibilityRole='button'
        >
          {selectedLocation ? '장소 변경' : '장소 검색'}
        </Pressable>
      </View>
      {!searchAccess.allowed && <PolicyErrorDisplay policy={searchAccess} variant='inline' />}
      {selectedLocation ? (
        <View className='gap-xs'>
          <Text className='text-body text-foreground'>{selectedLocation.name}</Text>
          <Text className='text-small text-muted-foreground'>{selectedLocation.address}</Text>
          <Pressable variant='outline' size='sm' onPress={onEditLocationManually} disabled={isPending}>
            장소 직접 수정
          </Pressable>
          <Text className='text-small text-muted-foreground'>
            직접 수정하면 검색으로 지정한 지도 위치는 해제됩니다.
          </Text>
        </View>
      ) : (
        <>
          <Controller
            control={control}
            name='location'
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <Field>
                <Field.Title>장소 이름 *</Field.Title>
                <Field.ElementsBox>
                  <TextInput
                    accessibilityLabel='장소 이름'
                    value={value}
                    onChangeText={onChange}
                    placeholder='예: 에펠탑'
                    className='h-11 rounded-md border border-input bg-background px-sm text-body text-foreground'
                  />
                </Field.ElementsBox>
                {error && <Field.Message>{error.message}</Field.Message>}
              </Field>
            )}
          />
          <Controller
            control={control}
            name='address'
            render={({ field: { value, onChange } }) => (
              <Field>
                <Field.Title>주소 (선택)</Field.Title>
                <Field.ElementsBox>
                  <TextInput
                    accessibilityLabel='장소 주소'
                    value={value}
                    onChangeText={onChange}
                    placeholder='예: 파리 7구'
                    className='h-11 rounded-md border border-input bg-background px-sm text-body text-foreground'
                  />
                </Field.ElementsBox>
              </Field>
            )}
          />
        </>
      )}
    </View>
  );
}
