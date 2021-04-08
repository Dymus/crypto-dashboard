import { HotModel } from '../models/hot-model';

export const getHots = () => {
  return HotModel.find({
  }).then((hots) => (hots ? Promise.resolve(hots) : Promise.reject()));
};
