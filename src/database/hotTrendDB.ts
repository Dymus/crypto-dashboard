import { HotTrendModel } from '../models/hotTrend-model';

export const getHotTrends = () => {
  return HotTrendModel.find({
  }).then((hotTrends) => (hotTrends ? Promise.resolve(hotTrends) : Promise.reject()));
};
