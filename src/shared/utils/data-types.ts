export const getBoolean = (input: any): boolean => {
  const inputStr = input ? ('' + input).toLowerCase() : input;

  if (
    input &&
    (input === 1 || inputStr === '1' || inputStr === 't' || inputStr === 'true')
  ) {
    return true;
  }

  return false;
};
