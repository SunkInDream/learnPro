import axios from 'axios';

const request = axios.create({
  baseURL: 'http://127.0.0.1:5000',
  timeout: 5000
});

request.interceptors.request.use(
  config => {
    if (config.method.toLowerCase() === 'get') {
      if (config.headers.common && config.headers.common['Content-Type']) {
        delete config.headers.common['Content-Type'];
      }
      if (config.headers['Content-Type']) {
        delete config.headers['Content-Type'];
      }
    }
    return config;
  },
  error => Promise.reject(error)
);

export default request;