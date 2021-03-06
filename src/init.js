import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import i18next from 'i18next';
import onChange from 'on-change';
import * as yup from 'yup';
import parseData from './parser';
import proxy from './proxy';
import updatePosts from './updatePosts';
import { renderForm, renderFormFeedback, renderListFeeds } from './view';
import resources from './locales';

const htmlNodes = {
  form: document.querySelector('form.rss-form'),
  input: document.querySelector('input.form-control'),
  submitButton: document.querySelector('button[aria-label="add"]'),
  feedbackContainer: document.querySelector('div.feedback'),
  feedsListContainer: document.querySelector('div.feeds'),
};

const schema = yup
  .string()
  .url(i18next.t('errorsMessages.invalidUrl'))
  .required(i18next.t('errorsMessages.rssLinkIsRequired'));

const validateRssUrl = ({ loadedLinks, value }) => {
  try {
    schema
      .notOneOf(loadedLinks, i18next.t('errorsMessages.linkLoaded'))
      .validateSync(value);
    return [];
  } catch ({ errors }) {
    return errors;
  }
};

const dispatchProcessStatuts = {
  filling: () => '',
  loading: (s, nodes) => {
    renderForm(s, nodes);
    renderFormFeedback(s, nodes);
  },
  loaded: (s, nodes) => {
    renderForm(s, nodes);
    renderFormFeedback(s, nodes);
    renderListFeeds(s, nodes);
  },
  failed: (s, nodes) => {
    renderForm(s, nodes);
    renderFormFeedback(s, nodes);
  },
  updated: (s, nodes) => {
    renderListFeeds(s, nodes);
  },
  updating: () => '',
};

const app = () => {
  const state = {
    form: {
      value: '',
    },
    loadedFeeds: [],
    feedsItems: {},
    processStatus: 'filling',
    validationErrors: [],
    updateTime: 5000,
  };

  const watchedState = onChange(state, (path, newValue) => {
    switch (path) {
      case 'validationErrors':
        if (newValue.length > 0) {
          renderForm(watchedState, htmlNodes);
          renderFormFeedback(watchedState, htmlNodes);
        }
        break;
      case 'processStatus':
        dispatchProcessStatuts[newValue](state, htmlNodes);
        break;
      case 'loadedFeeds':
        if (newValue.length > 0) {
          updatePosts(watchedState);
        }
        break;
      case 'feedsItems':
        break;
      case 'form.value':
        break;
      default:
        throw new Error(`Unknown state change: '${path}'!`);
    }
  });

  htmlNodes.input.addEventListener('input', (e) => {
    watchedState.form.value = e.target.value;
  });

  htmlNodes.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const validateParams = {
      loadedLinks: watchedState.loadedFeeds.map((feed) => feed.link),
      value: watchedState.form.value,
    };
    watchedState.validationErrors = validateRssUrl(validateParams);
    watchedState.processStatus = 'loading';
    if (watchedState.validationErrors.length > 0) {
      watchedState.processStatus = 'failed';
      return;
    }
    const url = `${proxy}${watchedState.form.value}`;
    axios.get(url).then((res) => {
      const { id, feedTitle, feedItems } = parseData(res.data);
      const loadedFeedWithLink = { id, feedTitle, link: watchedState.form.value };
      watchedState.loadedFeeds.push(loadedFeedWithLink);
      watchedState.feedsItems = { ...watchedState.feedItems, [id]: { items: feedItems } };
      watchedState.form.value = '';
      watchedState.processStatus = 'loaded';
    });
  });
};

export default () => {
  i18next.init(({
    lng: 'en',
    debug: false,
    resources,
  })).then(() => {
    app();
  });
};
