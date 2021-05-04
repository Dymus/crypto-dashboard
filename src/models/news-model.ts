import { getModelForClass, prop } from '@typegoose/typegoose';

export class News {
  @prop({ required: true })
  public cryptocurrency: string;

  @prop({ required: false })
  public scraped_at: Date;

  @prop({ required: true })
  public top: number;

  @prop({ required: true })
  public subreddit: string;

  @prop({ required: true })
  public url: string;

  @prop({ required: true })
  public title: string;

  @prop({ required: true })
  public image: string;
}

export const NewsModel = getModelForClass(News);
