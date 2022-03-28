import { SnsTransformBody } from './data-pipeline';

export type JSONRawValue = string | number | boolean | null;
export type JSONValue =
  | JSONRawValue
  | JSONRawValue[]
  | JSONObject
  | JSONObject[];

export interface PlainJSONObject {
  [key: string]: JSONRawValue | JSONRawValue[];
}

export interface JSONObject {
  [key: string]: JSONValue;
}

export interface QuestionAnswer {
  answer?: any;
  sessionQAItem?: any;
}

export interface SessionGroupByExperienceGroupCollection {
  qa: QuestionAnswer[];
  sessionDataItem: any;
}

export interface SessionGroupByExperienceGroup {
  sessionId: any;
  group: SessionGroupByExperienceGroupCollection[];
}

export interface SessionGroupByExperience {
  experienceId: any;
  group: SessionGroupByExperienceGroup[];
}

export interface GenerateRowConfigFilter {
  type?: 'mingo' | 'linq';
  where: any;
}

export interface GenerateRowConfigOutput {
  ext: string;
  delimiter?: string;
  quoteColumns?: boolean;
  timeout?: number;
}

export interface GenerateRowConfigOrderBy {
  // [pro: string]: number;
  prop: string;
  order?: 'ASC' | 'DESC';
}

export interface GenerateRowConfig {
  output?: GenerateRowConfigOutput;
  engineType?: string;
  experiences: string[];
  filePrefix: string;
  headers: string[];
  columnConfig: ColumnConfig[];
  filter?: GenerateRowConfigFilter;
  orderBy?: GenerateRowConfigOrderBy[];
  groupBy?: string[];
  limit?: number;
  metadata?: any;
}

export type ColumnConfigType =
  | 'userId'
  | 'empty'
  | 'sessionId'
  | 'notempty'
  | 'first'
  | 'last'
  | 'answer'
  | 'fix'
  | 'question'
  | 'qa'
  | 'null'
  | 'custom-input'
  | 'product-request:name'
  | 'product-request:sku'
  | 'product-request:ecomm_id'
  | 'product-request:ecomm_variant_id'
  | 'quiz'
  | 'profile'
  | 'path'
  | 'add_to_cart'
  | 'add_to_cart:name'
  | 'add_to_cart:sku'
  | 'add_to_cart:ecomm_id'
  | 'add_to_cart:ecomm_variant_id'
  | 'selected_products'
  | 'recommendations'
  | 'conditional'
  | 'reachstep_session_ga_style'
  | 'reachstep_ga_style'
  | 'question_ga_style';

export interface ColumnConfig {
  type: ColumnConfigType;
  path?: string;
  productId?: string;
  forceProductId?: boolean;
  condition?: {
    valueToCompare?: string;
    pathToCompare?: string;
    comparisonOperator?: 'equals' | 'contains' | 'exist' | 'regex';
    type: ColumnConfigType;
    path?: string;
    dataType?: string;
    format?: string;
    value?: string;
  }[];
  defaultCondition?: {
    type: ColumnConfigType;
    path?: string;
    dataType?: string;
    format?: string;
    value?: string;
  };
  dataType?: string;
  format?: string;
  names?: string[][];
  value?: any;
  size?: number;
  rank?: number;
  emptyAnswerMode?: 'normal' | 'blank';
  emptyValue?: any;
  requiredMode?: 'unique' | 'group';
  productRequestSingleMode?: boolean;
  productRequestSingleModeSeparator?: string;
  groupByOperator?: 'sum' | 'avg' | 'min' | 'max' | 'first' | 'last';
  filter?: string[];
}

export interface RenderConfig {
  columnConfig: ColumnConfig[];
  item: SessionGroupByExperienceGroup;
  group: SessionGroupByExperience;
  headers: string[];
  questions: any[][];
  products: any[][];
  userMetadata: any[][];
  engineType: string;
  version: string;
}

export interface RenderConfigItem {
  columnConfig: ColumnConfig;
  entry?: SessionGroupByExperienceGroupCollection;
  item: SessionGroupByExperienceGroup;
  group: SessionGroupByExperience;
  headers: string[];
  questions: any[][];
  products: any[][];
  userMetadata: any[][];
  engineType: string;
  version: string;
}

export interface StreamWritableConfig {
  engineType: string;
  version: string;
  s3Options: {
    Bucket: string;
    Key: string;
  };
  headers?: string[];
  output?: GenerateRowConfigOutput;
}

export interface JSONQuizResponse {
  question: string;
  answers: string[];
}

export interface JSONQuiz {
  response: JSONQuizResponse[];
}

export interface ReportMetadata {
  output: string;
  name: string;
  reportConfig: GenerateRowConfig;
}

export type LoaderFn = (
  body: SnsTransformBody,
  reports: ReportMetadata[],
) => Promise<void>;
