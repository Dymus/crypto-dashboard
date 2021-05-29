import { TrendModel } from '../models/trend-model';

// untested
export const getTrends = async () => {
  return TrendModel.find().then((trends) => {
    if (trends) return trends;
    else throw new Error('Failed to load trends');
  });
};
