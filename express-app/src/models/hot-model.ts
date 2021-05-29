import { getModelForClass, prop } from '@typegoose/typegoose';

export class Hot {
  @prop({ required: true })
  public title: string;

  @prop({ required: true })
  public score: number;

  @prop({ required: true })
  public url: string;

  @prop({ required: true })
  public image: string;
}

export const HotModel = getModelForClass(Hot);
