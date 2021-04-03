import { getModelForClass, prop } from '@typegoose/typegoose';

export class HotTrend {
  @prop({ required: true })
  public title: string;

  @prop({ required: true })
  public score: number;

  @prop({ required: true })
  public url: string;

  @prop({ required: true })
  public image: string;
}

export const HotTrendModel = getModelForClass(HotTrend);
