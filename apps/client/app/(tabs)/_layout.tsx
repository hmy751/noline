/* eslint-disable react/no-unstable-nested-components */
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#228B22',
        tabBarInactiveTintColor: '#808080',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          lineHeight: 14,
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: '홈',
          tabBarIcon: ({ size }) => (
            <View className='items-center justify-center' style={{ width: size, height: size }}>
              <Text className='text-title-medium'>🏠</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name='schedule'
        options={{
          title: '일정',
          tabBarIcon: ({ size }) => (
            <View className='items-center justify-center' style={{ width: size, height: size }}>
              <Text className='text-title-medium'>📅</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name='expenses'
        options={{
          title: '경비',
          tabBarIcon: ({ size }) => (
            <View className='items-center justify-center' style={{ width: size, height: size }}>
              <Text className='text-title-medium'>💶</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: '프로필',
          tabBarIcon: ({ size }) => (
            <View className='items-center justify-center' style={{ width: size, height: size }}>
              <Text className='text-title-medium'>👤</Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
