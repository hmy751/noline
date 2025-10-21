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

function Calendar({ ...props }: CalendarProps) {
  return <RNC {...props} />;
}

export { Calendar };
