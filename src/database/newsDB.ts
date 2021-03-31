import { NewsModel } from '../models/news-model';

export const getNews = (cryptocurrencyName: string) => {
  return NewsModel.find({
    cryptocurrency: cryptocurrencyName,
  }).then((news) => (news ? Promise.resolve(news) : Promise.reject()));
};
