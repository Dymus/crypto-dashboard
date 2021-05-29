import { getModelForClass, prop } from '@typegoose/typegoose';

export class Trend {
  @prop({ required: true })
  public cryptocurrency: string;

  @prop({ required: true })
  public scraped_at: Date;

  @prop({ required: true })
  public count: number;
}

export const TrendModel = getModelForClass(Trend);
