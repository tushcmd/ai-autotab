const debounce = (func, wait) => {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
};

const getCompletion = (text, completion) => {
  const response = fetch("http:localhost:3000/api/completion");
};
