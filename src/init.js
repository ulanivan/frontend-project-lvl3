import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import i18next from 'i18next';
import onChange from 'on-change';
import * as yup from 'yup';
import parseData from './parser';
import crossProxy from './crossProxy';
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
const validateRssUrl = (watchedState) => {
  try {
    schema.test(
      'check if already loaded',
      i18next.t('errorsMessages.linkLoaded'),
      (url) => !watchedState.loadedLinks.includes(url),
    ).validateSync(watchedState.form.value);
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
};

const app = () => {
  const state = {
    form: {
      value: '',
      validationErrors: [],
    },
    loadedFeeds: [],
    processStatus: 'filling',
    validationErrors: [],
    loadedLinks: [],
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
      default:
        break;
    }
  });

  htmlNodes.input.addEventListener('input', (e) => {
    watchedState.form.value = e.target.value;
  });

  htmlNodes.form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.validationErrors = validateRssUrl(state);
    watchedState.processStatus = 'loading';
    if (watchedState.validationErrors.length > 0) {
      watchedState.processStatus = 'failed';
      return;
    }
    const url = `${crossProxy}${watchedState.form.value}`;
    axios.get(url).then((res) => {
      watchedState.loadedLinks.push(watchedState.form.value);
      watchedState.form.value = '';
      const data = parseData(res.data);
      watchedState.loadedFeeds = [...watchedState.loadedFeeds, data];
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
