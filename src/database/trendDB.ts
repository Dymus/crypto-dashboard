import { Trend, TrendModel } from "../models/trend-model";

export const getTrends = (cryptocurrencyName: string, scrapedAfter: string) => {

  return TrendModel.find(
    { cryptocurrency: cryptocurrencyName, scraped_at: {$gt: new Date(scrapedAfter)}  },
  ).then((trends) => (trends ? Promise.resolve(trends) : Promise.reject()));
};
