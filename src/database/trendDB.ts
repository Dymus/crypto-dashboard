import { TrendModel } from '../models/trend-model';

export const getTrends = () => {
  return TrendModel.find({
  }).then((trends) => (trends ? Promise.resolve(trends) : Promise.reject()));
};
