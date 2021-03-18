import { Trend, TrendModel } from "../models/trend-model";

export const getTrends = (cryptocurrencyName: string) => {

  return TrendModel.find(
    { cryptocurrency: cryptocurrencyName, scraped_at: new Date(2021, 3, 19) },
  ).then((trends) => (trends ? Promise.resolve(trends) : Promise.reject()));
};
