import { useState, type ReactNode } from 'react';
import {
  useController,
  type FieldPathByValue,
  type FieldPathValue,
  type FieldValues,
  type UseFormReturn,
} from 'react-hook-form';
import { Field } from './Field';
import TimePicker from '../TimePicker/TimePicker';

type TimeFieldProps<T extends FieldValues, N extends FieldPathByValue<T, string>> = {
  form: UseFormReturn<T>;
  name: N;
  title: string;
  renderTrigger: (value: string, open: () => void) => ReactNode;
};

/** 폼의 시간 값과 picker 수명을 함께 연결한다. 확인만 값을 쓰고 닫기는 초안을 버린다. */
export function TimeField<T extends FieldValues, N extends FieldPathByValue<T, string>>({
  form,
  name,
  title,
  renderTrigger,
}: TimeFieldProps<T, N>) {
  const [visible, setVisible] = useState(false);
  const { field, fieldState } = useController({ control: form.control, name });
  const value = field.value as string;

  return (
    <Field>
      <Field.Title>{title}</Field.Title>
      <Field.ElementsBox>{renderTrigger(value, () => setVisible(true))}</Field.ElementsBox>
      {fieldState.error && <Field.Message>{fieldState.error.message}</Field.Message>}
      <TimePicker
        visible={visible}
        initialTime={value || '09:00'}
        onClose={() => setVisible(false)}
        onSelectTime={(time) => {
          // 기존 picker 확인의 검증 시점과 dirty/touched 상태를 유지한다.
          form.setValue(name, time as FieldPathValue<T, N>, { shouldValidate: true });
          setVisible(false);
        }}
      />
    </Field>
  );
}
