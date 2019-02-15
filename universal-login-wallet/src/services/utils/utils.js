function debounce(func, waitTime = 0) {
  let timeout;
  return function() {
    const args = arguments;
    const later = function() {
      timeout = null;
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, waitTime);
  };
};

export {debounce, sleep}
