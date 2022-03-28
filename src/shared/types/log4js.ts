import { JSONObject } from './general-types';

export interface JSONLayoutConfiguration {
  separator: string;
  props: {
    level: string;
    category: string;
    message: string;
    data: string;
  };
}

export interface JSONLayoutResponse {
  level?: string;
  category?: string;
  message?: string;
  data?: JSONObject;
  error?: JSONObject & {
    name?: string;
    stack?: string;
    message?: string;
  };
}
