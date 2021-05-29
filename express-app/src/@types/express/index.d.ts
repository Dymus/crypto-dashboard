import { DocumentType } from '@typegoose/typegoose';
import { User } from '../../models/user-model';

export {};

declare global {
  namespace Express {
    interface Request {
      user: DocumentType<User>;
      geminiSecret: string;
    }
  }
}
