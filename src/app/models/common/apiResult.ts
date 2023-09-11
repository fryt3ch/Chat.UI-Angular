export interface IApiResult {
  succeeded: boolean;
  errors: [
    IApiResultError
  ]
}

export interface IApiResultError {
  message: string;
  code: string;
}
