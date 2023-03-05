export const LIST_KEY = 'domainList';
// 增加协议头
function addProtocol(uri) {
  return uri.startsWith('http') ? uri : `http://${uri}`;
}
// 移除协议头
function removeProtocol(uri) {
  return uri.startsWith('http') ? uri.replace('http://', '').replace('https://', '') : uri;
}
export async function updateStorage(list) {
  await chrome.storage.local.set({ [LIST_KEY]: list });
}

export async function getStorage(key = LIST_KEY) {
  return await chrome.storage.local.get(key);
}

export async function updateCookie(config) {
  try {
    const cookie = await chrome.cookies.get({
      name: config.cookieName || 'name',
      url: addProtocol(config.from || 'url'),
    });

    return cookie ? await setCookie(cookie, config) : null;
  } catch (error) {
    console.error('error: ', error);
  }
}

function setCookie(cookie, config) {
  return chrome.cookies.set({
    name: cookie.name,
    value: cookie.value,
    url: addProtocol(config.to || 'url'),
    domain: removeProtocol(config.to || 'url'),
    path: '/',
  });
}

export function removeCookie(config) {
  return chrome.cookies.remove({
    name: config.cookieName,
    url: addProtocol(config.to || 'url'),
  });
}

export function getAllCookie(url) {
  return chrome.cookies.getAll({
    url: addProtocol(url || 'url'),
    domain: removeProtocol(url || 'url'),
    path: '/',
  });
}
