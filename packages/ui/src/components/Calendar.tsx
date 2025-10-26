import { Calendar as RNC, CalendarProps as RNCProps, LocaleConfig } from 'react-native-calendars';

LocaleConfig.locales.ko = {
  monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  dayNames: ['일', '월', '화', '수', '목', '금', '토'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘',
};

LocaleConfig.defaultLocale = 'ko';

export type CalendarProps = RNCProps;

const defaultTheme = {
  backgroundColor: 'transparent',
  calendarBackground: 'transparent',
  textSectionTitleColor: '#71717a', // zinc-500
  selectedDayBackgroundColor: '#228B22',
  selectedDayTextColor: '#ffffff',
  todayTextColor: '#228B22',
  dayTextColor: '#18181b', // zinc-900
  textDisabledColor: '#d4d4d8', // zinc-300
  dotColor: '#228B22',
  selectedDotColor: '#ffffff',
  arrowColor: '#228B22',
  monthTextColor: '#18181b', // zinc-900
  indicatorColor: '#228B22',
  textDayFontWeight: '400' as const,
  textMonthFontWeight: '600' as const,
  textDayHeaderFontWeight: '500' as const,
  textDayFontSize: 15,
  textMonthFontSize: 17,
  textDayHeaderFontSize: 13,
};

function Calendar({ theme, ...props }: CalendarProps) {
  return <RNC theme={{ ...defaultTheme, ...theme }} style={{ borderRadius: 8 }} hideExtraDays={true} {...props} />;
}

export { Calendar };
