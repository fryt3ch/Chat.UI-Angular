export interface ApiResult {
  succeeded: boolean;
  error?: ApiResultError;

  message: string;
}

export interface ApiResultWithData<T> extends ApiResult {
  data: T;
}

export interface ApiResultError {
  message: string;
  code: string;
}

export class ApiError extends Error {
  apiResult: ApiResult;

  constructor(apiResult: ApiResult) {
    super(apiResult.message);
    this.apiResult = apiResult;
  }
}

export function isApiResultError(obj: any): obj is ApiResultError {
  return typeof obj.message === "string" && typeof obj.code === "string";
}

export function isApiResult(obj: any): obj is ApiResult {
  return typeof obj.succeeded === "boolean" &&
    obj.error && isApiResultError(obj.error);
}
