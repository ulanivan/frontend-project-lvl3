import axios from 'axios';
import { differenceWith, isEqual } from 'lodash';
import proxy from './proxy';
import parseData from './parser';

const updatePosts = (state) => {
  const watchedState = state;
  Promise.all(watchedState.loadedFeeds.map((feed) => {
    const url = `${proxy}${feed.link}`;
    return axios.get(url).then((res) => ({
      updatedData: parseData(res.data),
      feedId: feed.id,
    }));
  }))
    .then((res) => {
      res.forEach(({ updatedData, feedId }) => {
        const [currentFeed] = watchedState.loadedFeeds.filter((f) => f.id === feedId);
        const diff = differenceWith(
          updatedData.feedItems,
          currentFeed.feedItems,
          isEqual,
        );
        currentFeed.feedItems = diff;
        watchedState.processStatus = 'updated';
      });
    })
    .finally(setTimeout(() => {
      watchedState.processStatus = 'updating';
      updatePosts(watchedState);
    }, state.updateTime));
};

export default updatePosts;
