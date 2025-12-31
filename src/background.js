const LIST_KEY = 'domainList';
async function getDomainList() {
  const storage = await getStorage();
  const domainList = !isEmpty(storage) ? Object.values(storage[LIST_KEY]) : [];

  return domainList;
}

console.log('start watching cookies...');
chrome.cookies.onChanged.addListener(async ({ cookie, removed }) => {
  const domainList = await getDomainList();

  if (!domainList.length) return;

  // 需求更新的 cookie
  for (let item of domainList) {
    if (item.open && equalDomain(item.from, cookie.domain) && item.cookieName === cookie.name) {
      console.log('cookie changed ::::::::::: ', cookie, removed);
      if (removed) {
        removeCookie(cookie, item);
      } else {
        setCookie(cookie, item);
      }
    }
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const domainList = await getDomainList();

  const { isAuto } = await chrome.storage.local.get('isAuto');
  if (!isAuto || !domainList.length) return;

  const opens = domainList.filter((item) => item.open);
  if (opens.length && changeInfo.status === 'loading' && tab.active) {
    console.log('tabs onUpdated ===== ', tabId, changeInfo, tab);
    const tabUrl = tab.url.replace(/^http(s)?:\/\//, '');
    const config = opens.find((i) => tabUrl.startsWith(i.to));

    if (config) {
      const cookieFrom = await getCookie({
        cookieName: config.cookieName,
        url: addProtocol(config.from || 'url'),
      });
      const cookieTo = await getCookie({
        cookieName: config.cookieName,
        url: addProtocol(config.to || 'url'),
      });
      console.log('cookie is no changed ::::::::::: ', cookieFrom?.value === cookieTo?.value);
      if (cookieFrom?.value === cookieTo?.value) return;
      updateCookie(config);
    }
  }
});

function isEmpty(value) {
  if (value == null) return true;

  const type = Object.prototype.toString.call(value);

  if (type === '[object Array]') return !value.length;

  if (type === '[object Set]' || type === '[object Set]') return !value.size;

  for (let key in value) {
    if (Object.hasOwn(value, key)) return false;
  }

  return true;
}

async function getStorage(key = LIST_KEY) {
  return await chrome.storage.local.get(key);
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

function getCookie(config) {
  return chrome.cookies.get({
    name: config.cookieName,
    url: config.url,
  });
}

async function updateCookie(config) {
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

function removeCookie(cookie, config) {
  chrome.cookies.remove({
    name: cookie.name,
    url: addProtocol(config.to || 'url'),
  });
}

// 增加协议头
function addProtocol(uri) {
  return uri.startsWith('http') ? uri : `http://${uri}`;
}

// 移除协议头
function removeProtocol(uri) {
  return uri.startsWith('http') ? uri.replace('http://', '').replace('https://', '') : uri;
}

function equalDomain(domain1, domain2) {
  return addProtocol(domain1) === addProtocol(domain2);
}
