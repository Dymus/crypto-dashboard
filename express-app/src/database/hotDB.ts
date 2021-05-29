import { HotModel } from '../models/hot-model';

// untested
export const getHots = async () => {
  return HotModel.find().then((hots) => {
    if (hots) return hots;
    else throw new Error('Failed to load hots');
  });
};
