export const extractCookies = (responseHeaders) => {
  console.log(responseHeaders)
  const cookies = {};
  responseHeaders['set-cookie'].forEach((cookie) => {
    const [name, value] = cookie.split('=');
    cookies[name] = value.split(';')[0];
  });
  return cookies;
};
