import { ValidationError } from 'express-validator';

export class RequestError extends Error {
  constructor(public status: number, public title: string, public message: string, public errors?: string[] | ValidationError[]) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}
