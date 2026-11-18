// RNTL 14 + jest-expo 54 동작 확인용 최소 테스트(Work 012 Ticket 02).
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

function Counter() {
  const [n, setN] = useState(0);
  const [name, setName] = useState('');
  return (
    <View>
      <Text>count {n}</Text>
      <Pressable accessibilityRole='button' onPress={() => setN((v) => v + 1)}>
        <Text>plus</Text>
      </Pressable>
      <TextInput placeholder='name' value={name} onChangeText={setName} />
      <Text>hello {name}</Text>
    </View>
  );
}

test('render·press·type이 RNTL 14의 비동기 API로 동작한다', async () => {
  await render(<Counter />);
  await fireEvent.press(screen.getByRole('button'));
  expect(screen.getByText('count 1')).toBeTruthy();
  await fireEvent.changeText(screen.getByPlaceholderText('name'), 'noline');
  await waitFor(() => expect(screen.getByText('hello noline')).toBeTruthy());
});
