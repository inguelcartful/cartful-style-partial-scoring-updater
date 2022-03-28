export enum PRODUCT_SCHEMA {
  ID = 0,
  NAME = 1,
  DESCRIPTION = 2,
  SKU = 3,
  ECOMM_ID = 4,
  ECOMM_VARIANT_ID = 5,
  PRICE = 6,
  STATUS = 7,
  EXPERIENCE_ID = 8,
}

export enum SESSION_DATA_SCHEMA {
  OA_EVENT = 'sessionDataItem[17]',
  OA_DATA = 'sessionDataItem[18]',
  SKU = 'sessionDataItem[19]',
  UNIT_PRICE = 'sessionDataItem[20]',
  QUANTITY = 'sessionDataItem[21]',
  CURRENCY = 'sessionDataItem[22]',
}

export enum QUESTION_ANSWER_SCHEMA {
  SESSION_EVENT_ID = 'sessionQAItem[0]',
  ANSWER_ID = 'answer[0]',
  NAME = 'answer[1]',
  POINTS = 'answer[2]',
  TYPE_CODE = 'answer[3]',
  QUESTION_ID = 'answer[5]',
}
