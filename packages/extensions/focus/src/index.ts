/* eslint-disable @typescript-eslint/no-explicit-any */
'use strict';

const hideElement = (className: string) => {
  const userTaglineRatings = document.getElementsByClassName(className);
  for (const userTaglineRating of userTaglineRatings) {
    (userTaglineRating as HTMLElement).style.display = 'none';
  }
};

const hideRatings = () => {
  hideElement('live-game-start-component');
  hideElement('live-game-over-component');
  hideElement('user-tagline-username');
  hideElement('user-tagline-rating');
  hideElement('user-rating');
};

const observeDOM = (() => {
  const MutationObserver =
    window.MutationObserver || (window as any).WebKitMutationObserver;

  return (obj: any, callback: any) => {
    // define new observer
    const obs = new MutationObserver((mutations) => {
      if (mutations[0].addedNodes.length || mutations[0].removedNodes.length) {
        callback();
      }
    });
    // let the observer observe DOM obj for changes in children
    obs.observe(obj, { childList: true, subtree: true });
  };
})();

// Observe DOM for change to update replacement
observeDOM(document, hideRatings);
