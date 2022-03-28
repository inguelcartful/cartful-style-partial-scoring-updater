/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/camelcase */
import { SNSEvent } from 'aws-lambda';
import * as csv from 'csvtojson';

import { getLogger } from '../../shared/log4js/logger';
import { SnsSubject, SnsTransformBody } from '../../shared/types/data-pipeline';
import { createCSVStream } from './transformer/engine/v1/csv/stream';
import { s3Client } from '../../shared/utils/aws-clients';
import { transform } from './transformer';
import { loaderDictionary } from './loader';
import { ReportMetadata } from '../../shared/types/general-types';

const logger = getLogger('src/functions/etl-dispatcher/service');

const findQuestion = (questions: any[], questionId: string): any => {
  return questions.find(question => {
    return '' + question[0] === '' + questionId;
  });
};

const findAnswerByQuestionId = (answers: any[], questionId: string): any[] => {
  return answers.filter(answer => {
    return '' + answer[5] === '' + questionId;
  });
};

const findAnswer = (answers: any[], answerId: string): any => {
  return answers.find(answer => {
    return '' + answer[0] === '' + answerId;
  });
};

const getSessionData = async (output: string): Promise<any> => {
  const sessionDataStr = await s3Client
    .getObject({
      Bucket: output,
      Key: 'temp_session_data.csv',
    })
    .promise();

  if (!sessionDataStr.Body) {
    throw new Error('There is not a temp_session_data.csv file into s3 output');
  }

  return await csv({
    noheader: true,
    output: 'csv',
  }).fromString(sessionDataStr.Body.toString());
};

const getUserMetadata = async (output: string): Promise<any> => {
  const sessionDataStr = await s3Client
    .getObject({
      Bucket: output,
      Key: 'reporting_user_metadata.csv',
    })
    .promise();

  if (!sessionDataStr.Body) {
    throw new Error(
      'There is not a reporting_user_metadata.csv file into s3 output',
    );
  }

  return await csv({
    noheader: true,
    output: 'csv',
  }).fromString(sessionDataStr.Body.toString());
};

const getQuestions = async (output: string): Promise<any> => {
  const questionsStr = await s3Client
    .getObject({
      Bucket: output,
      Key: 'questions.csv',
    })
    .promise();

  if (!questionsStr.Body) {
    throw new Error('There is not a questions.csv file into s3 output');
  }

  return await csv({
    noheader: true,
    output: 'csv',
  }).fromString(questionsStr.Body.toString());
};

const getAnswers = async (output: string): Promise<any> => {
  const answersStr = await s3Client
    .getObject({
      Bucket: output,
      Key: 'answers.csv',
    })
    .promise();

  if (!answersStr.Body) {
    throw new Error('There is not a answers.csv file into s3 output');
  }

  return await csv({
    noheader: true,
    output: 'csv',
  }).fromString(answersStr.Body.toString());
};

const getProducts = async (output: string): Promise<any> => {
  const productsStr = await s3Client
    .getObject({
      Bucket: output,
      Key: 'products.csv',
    })
    .promise();

  if (!productsStr.Body) {
    throw new Error('There is not a products.csv file into s3 output');
  }

  return await csv({
    noheader: true,
    output: 'csv',
  }).fromString(productsStr.Body.toString());
};

const generateSessionQA = (
  sessionData: any[],
  questions: any[],
  answers: any[],
): any[] => {
  const sessionQA: any[] = [];

  sessionData.forEach((item: any[]) => {
    const rawOaData: string = item[18];
    let oaData: { [prop: string]: string[] } = {};

    try {
      oaData = JSON.parse(rawOaData);
    } catch (e) {
      return;
    }

    const props = Object.keys(oaData);

    if (props.length === 0 || props.some(prop => isNaN(+prop))) {
      return;
    }

    props.forEach(questionId => {
      const answers: string[] = oaData[questionId];

      if (!Array.isArray(answers)) {
        return;
      }

      answers.forEach(answerId => {
        sessionQA.push([item[1], item[2], 'QA', questionId, answerId]);
      });
    });
  });

  return sessionQA.filter(item => {
    const questionId = item[3];
    const answerId = item[4];
    const answerNumberId = +answerId;
    const question = findQuestion(questions, questionId);
    const posibleAnswers = findAnswerByQuestionId(answers, questionId);

    // custom inputs
    if (isNaN(answerNumberId) && (answerNumberId > 1 || answerId === '')) {
      return true;
    }

    const answer = findAnswer(posibleAnswers, answerId);

    // question_id: answer[5]
    if (question && answer && '' + answer[5] === '' + questionId) {
      // Normal answer
      // question_type_code: question[2]
      const answerIdLocal = +answerId;
      if (
        !(
          question[2] === 'WEIGHT' &&
          answerIdLocal >= 0 &&
          answerIdLocal <= 100
        )
      ) {
        return true;
      }
    }

    // points: ans[2]
    if (
      question &&
      posibleAnswers.length &&
      posibleAnswers.some((ans: any[]) => '' + ans[2] === '' + answerId)
    ) {
      const points = answerNumberId;
      // Weight answer
      if (question[2] === 'WEIGHT' && points >= 0 && points <= 100) {
        return true;
      }
    }

    return false;
  });
};

const generateSession = (sessionData: any[]): any[] => {
  const sessionRowId: string[] = [];
  const session: any[] = [];

  sessionData.forEach((item: any[]) => {
    const rowId = item.join();

    if (sessionRowId.includes(rowId)) {
      return;
    }

    sessionRowId.push(rowId);

    session.push([
      item[0], // session_id
      item[2], // app_id
      item[3], // user_id
      item[4], // user_identifier
      item[5], // ip_address,
      item[6], // fingerprint
      item[7], // session_start_tstamp
      item[8], // session_end_tstamp
      item[9], // latitude
      item[10], // longitude
      item[11], // device_type_code
      item[12], // launch_page
      item[13], // email_address
      item[14], // pre_session
    ]);
  });

  return session;
};

const createAdditionalData = async (
  type: SnsSubject,
  body: SnsTransformBody,
): Promise<any[]> => {
  logger.debug('Create Additional Data', body);

  const sessionData = await getSessionData(body.output);
  const userMetadata = await getUserMetadata(body.output);
  const questions = await getQuestions(body.output);
  const answers = await getAnswers(body.output);
  const products = await getProducts(body.output);

  logger.debug({
    questions: questions.slice(0, 3),
    answers: answers.slice(0, 3),
    sessionData: sessionData.slice(0, 3),
    products: products.slice(0, 3),
  });

  const sessionQA = generateSessionQA(sessionData, questions, answers);
  const session = generateSession(sessionData);

  logger.trace(`Trying to create session_qa and session files`);

  logger.debug({
    sessionQA: (sessionQA || []).slice(0, 3),
    session: (session || []).slice(0, 3),
  });

  const sessionQAPromise = createCSVStream(
    { Bucket: body.output, Key: 'session_qa.csv' },
    sessionQA,
  );
  const sessionPromise = createCSVStream(
    { Bucket: body.output, Key: 'session.csv' },
    session,
  );

  logger.trace(`Waiting for session_qa and session promises`);

  await Promise.all([sessionQAPromise, sessionPromise]);

  logger.trace(
    `SessionData, SesionQA, Questions, Answers and Products all loaded`,
  );
  return [sessionData, userMetadata, sessionQA, questions, answers, products];
};

const startToLoad = async (
  body: SnsTransformBody,
  reports: ReportMetadata[],
): Promise<void> => {
  const loader = loaderDictionary[('' + body.syncMethod).trim().toLowerCase()];

  if (loader) {
    await loader(body, reports);
  }
};

export const tl = async (event: SNSEvent): Promise<void> => {
  for (const r of event.Records) {
    const subject = r.Sns.Subject;
    const message = r.Sns.Message;

    let jsonBody: SnsTransformBody;
    let type: SnsSubject;

    logger.debug({ record: r });

    try {
      logger.debug({
        message,
      });
      jsonBody = JSON.parse(message);
    } catch (error) {
      throw new Error('Message not contain a json');
    }

    try {
      const [typeMessage, pipelineId] = ('' + subject).split(':');

      type = {
        type: ('' + typeMessage).trim().toLowerCase(),
        pipelineId: ('' + pipelineId).trim(),
      };
    } catch (error) {
      throw new Error('Subject is not valid');
    }

    logger.debug({ type });

    if (type.type === 'success') {
      jsonBody.output = ('' + jsonBody.output)
        .replace(/^s3:\/\//gi, '')
        .replace(/\/$/gi, '');

      logger.debug({ body: jsonBody, version: '6' });

      const [
        sessionData,
        userMetadata,
        sessionQA,
        questions,
        answers,
        products,
      ] = await createAdditionalData(type, jsonBody);

      logger.trace(`Trying to transform all data`);

      const reports = await transform(jsonBody, [
        sessionData,
        userMetadata,
        sessionQA,
        questions,
        answers,
        products,
      ]);

      await startToLoad(jsonBody, reports);
    }
  }
};
