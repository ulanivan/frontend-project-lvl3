import i18next from 'i18next';

const renderForm = (state, nodes) => {
  const { input, submitButton } = nodes;
  const formIsValid = state.validationErrors.length === 0;
  const classListMethod = formIsValid ? 'remove' : 'add';
  input.classList[classListMethod]('is-invalid');
  input.value = state.form.value;
  submitButton.disabled = state.processStatus === 'loading';
};

const getFeedbackContent = (state) => {
  const dispatch = {
    failed: state.validationErrors[0],
    loading: i18next.t('successfulMessages.feedLoading'),
    loaded: i18next.t('successfulMessages.feedLoaded'),
  };
  return dispatch[state.processStatus];
};

const renderFormFeedback = (state, nodes) => {
  const sccess = 'text-success';
  const danger = 'text-danger';
  const { feedbackContainer } = nodes;
  const feedbackContent = getFeedbackContent(state);
  const styleText = state.validationErrors.length === 0 ? sccess : danger;
  feedbackContainer.classList.remove(sccess, danger);
  feedbackContainer.classList.add(styleText);
  feedbackContainer.innerHTML = feedbackContent;
};

const renderListFeeds = (state, nodes) => {
  const { feedsListContainer } = nodes;
  feedsListContainer.innerHTML = '';
  state.loadedFeeds.forEach(({ feedTitle, id }) => {
    const titleTag = document.createElement('h2');
    titleTag.textContent = feedTitle;
    feedsListContainer.append(titleTag);
    const feedItems = state.feedsItems[id].items;
    feedItems.forEach(({ title, link }) => {
      const feedListItem = document.createElement('div');
      const htmlLink = document.createElement('a');
      htmlLink.href = link;
      htmlLink.innerHTML = title;
      feedListItem.append(htmlLink);
      feedsListContainer.append(feedListItem);
    });
  });
};

export { renderForm, renderFormFeedback, renderListFeeds };
