import { uniqueId } from 'lodash';

export default (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'application/xml');
  const feed = doc.querySelector('channel');
  const feedTitle = feed.querySelector('title').textContent;
  const items = feed.querySelectorAll('item');
  const id = uniqueId();
  const feedItems = [...items].map((item) => {
    const title = item.querySelector('title').textContent;
    const link = item.querySelector('link').textContent;
    const publicDate = new Date(item.querySelector('pubDate').textContent);
    return { title, link, publicDate };
  });
  return { feedTitle, feedItems, id };
};
