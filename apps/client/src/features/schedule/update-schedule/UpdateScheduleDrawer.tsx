import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Drawer } from '@repo/ui';
import { Pressable } from '@repo/ui';
import { Calendar, Clock } from 'lucide-react-native';
import { Field } from '@/shared/components/Form';

export type UpdateScheduleDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  scheduleData?: {
    id: string;
    title: string;
    date: string;
    time: string;
  } | null;
};

/**
 * 일정 수정 드로어 컴포넌트
 * 제목, 날짜와 시간을 수정할 수 있는 UI (비즈니스 로직 제외)
 */
export const UpdateScheduleDrawer = ({ isOpen, onClose, scheduleData }: UpdateScheduleDrawerProps) => {
  const [title, setTitle] = useState(scheduleData?.title || '');

  // scheduleData가 변경되면 title state 업데이트
  useEffect(() => {
    if (scheduleData?.title) {
      setTitle(scheduleData.title);
    }
  }, [scheduleData?.title]);

  if (!scheduleData) return null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title='일정 수정'>
      <View className='gap-md'>
        {/* 설명 */}
        <Text className='text-body text-muted-foreground'>{scheduleData.title}의 날짜와 시간을 수정합니다</Text>

        {/* 제목 필드 */}
        <Field>
          <Field.Title>제목</Field.Title>
          <Field.ElementsBox>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder='제목을 입력하세요'
              className='h-11 rounded-md border border-input bg-background px-sm text-body text-foreground'
              placeholderTextColor='#808080'
            />
          </Field.ElementsBox>
        </Field>

        {/* 날짜 필드 */}
        <Field>
          <Field.Title>날짜</Field.Title>
          <Field.ElementsBox>
            <TouchableOpacity
              className='h-11 flex-row items-center rounded-md border border-input bg-background px-sm'
              onPress={() => {
                // TODO: 날짜 선택 모달 열기
                console.log('날짜 선택');
              }}
            >
              <Calendar size={16} color='#808080' />
              <Text className='text-body text-foreground ml-xs'>{scheduleData.date}</Text>
            </TouchableOpacity>
          </Field.ElementsBox>
        </Field>

        {/* 시간 필드 */}
        <Field>
          <Field.Title>시간</Field.Title>
          <Field.ElementsBox>
            <TouchableOpacity
              className='h-11 flex-row items-center rounded-md border border-input bg-background px-sm'
              onPress={() => {
                // TODO: 시간 선택 모달 열기
                console.log('시간 선택');
              }}
            >
              <Clock size={16} color='#808080' />
              <Text className='text-body text-foreground ml-xs'>{scheduleData.time}</Text>
            </TouchableOpacity>
          </Field.ElementsBox>
        </Field>

        {/* 버튼 영역 */}
        <View className='flex-row gap-sm mt-md'>
          <View className='flex-1'>
            <Pressable
              variant='default'
              onPress={() => {
                // TODO: 저장 로직
                console.log('저장', { ...scheduleData, title });
                onClose();
              }}
            >
              저장
            </Pressable>
          </View>
          <View className='flex-1'>
            <Pressable variant='outline' onPress={onClose}>
              취소
            </Pressable>
          </View>
        </View>
      </View>
    </Drawer>
  );
};
