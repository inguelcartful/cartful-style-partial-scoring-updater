import * as dayjs from 'dayjs';

export const getDate = (output: string): string => {
  const pathParts = output.split('/');
  let date = pathParts[pathParts.length - 1];

  if (!date) {
    date = dayjs().format('YYYYMMDD_HHmmss');
  } else {
    date = `${dayjs(date).format('YYYYMMDD')}_${dayjs().format('HHmmss')}`;
  }

  return date;
};
