import { Logger, getLogger as getLog4js, addLayout, configure } from 'log4js';
import { jsonLayout } from './layout/json';

addLayout('json', jsonLayout);

configure({
  appenders: {
    out: {
      type: 'stdout',
      layout: {
        type: 'json',
        separator: ' | ',
      },
    },
  },
  categories: {
    default: {
      appenders: ['out'],
      level: 'all',
    },
  },
} as any);

export const getLogger = (
  category?: string,
  level = process.env.LOG_LEVEL || 'ALL',
): Logger => {
  const logger = getLog4js(category);
  logger.level = level;

  return logger;
};
