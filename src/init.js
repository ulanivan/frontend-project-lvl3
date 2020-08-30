import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import onChange from 'on-change';
import * as yup from 'yup';
import parseData from './parser';
import { renderForm, renderFormFeedback, renderListFeeds } from './view';

export default () => {
  const schema = yup
    .string()
    .url('this must be a valid URL')
    .required('rss url is required');

  const htmlNodes = {
    form: document.querySelector('form.rss-form'),
    input: document.querySelector('input.form-control'),
    submitButton: document.querySelector('button[aria-label="add"]'),
    feedbackContainer: document.querySelector('div.feedback'),
    feedsListContainer: document.querySelector('div.feeds'),
  };

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

  const validateRssUrl = (watchedState) => {
    try {
      schema.test(
        'check if already loaded',
        'this link is already loaded',
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

  const updateStateOnFeedLoading = (res) => {
    watchedState.loadedLinks.push(watchedState.form.value);
    watchedState.form.value = '';
    const data = parseData(res.data);
    watchedState.loadedFeeds = [...watchedState.loadedFeeds, data];
    watchedState.processStatus = 'loaded';
  };

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
    const crossProxy = 'http://cors-anywhere.herokuapp.com/';
    const url = `${crossProxy}${watchedState.form.value}`;
    axios.get(url).then((res) => {
      updateStateOnFeedLoading(res);
    });
  });
};
