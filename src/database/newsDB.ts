import { NewsModel } from '../models/news-model';

// untested
export const getNews = async (cryptocurrencyName: string) => {
  return NewsModel.find({ cryptocurrency: cryptocurrencyName }).then((news) => {
    if (news) return news;
    else throw new Error('Failed to load news');
  });
};
