import { LoggingEvent } from 'log4js';
import { isObject, isEmpty } from 'lodash';
import {
  JSONLayoutConfiguration,
  JSONLayoutResponse,
} from '../../types/log4js';
import { JSONObject } from '../../types/general-types';

const defaultConfig = {
  separator: '|',
  props: {
    level: 'level',
    category: 'category',
    message: 'message',
    data: 'data',
  },
};

const transform = (
  config: JSONLayoutConfiguration,
  items: any[],
): JSONLayoutResponse => {
  const messages: string[] = [];
  const data: JSONObject = {};
  const overlay: JSONLayoutResponse = {};

  items
    .filter(item => !!item)
    .forEach(item => {
      if (isObject(item)) {
        try {
          const result = item instanceof Error ? { error: item } : item;
          Object.assign(data, JSON.parse(JSON.stringify(result)));
        } catch (e) {}
      } else {
        messages.push('' + item);
      }
    });

  if (!isEmpty(data)) {
    overlay[config.props.data] = data;
  }

  if (!isEmpty(messages)) {
    overlay[config.props.message] = messages.join(config.separator);
  }

  return overlay;
};

const formatter = (
  event: LoggingEvent,
  config: JSONLayoutConfiguration,
): JSONLayoutResponse => {
  const output = {
    [config.props.level]: event.level.levelStr,
  };

  if (event.categoryName !== 'default') {
    output[config.props.category] = event.categoryName;
  }

  return (Object.assign(
    transform(config, event.data),
    output,
  ) as unknown) as JSONLayoutResponse;
};

export const jsonLayout = (
  config: JSONLayoutConfiguration,
): ((e: LoggingEvent) => string) => {
  const options = Object.assign(defaultConfig, config);

  return (event: LoggingEvent): string => {
    const result = formatter(event, options);

    try {
      return JSON.stringify(result);
    } catch (e) {
      console.error('Logger is failing', e);

      return '';
    }
  };
};
