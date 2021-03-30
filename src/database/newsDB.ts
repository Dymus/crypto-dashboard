import { NewsModel } from '../models/news-model';

export const getNews = (cryptocurrencyName: string, subredditName: string) => {
  return NewsModel.find({
    cryptocurrency: cryptocurrencyName,
    subreddit: subredditName,
  }).then((news) => (news ? Promise.resolve(news) : Promise.reject()));
};
