watchCookieChange();

function watchCookieChange() {
  console.log('start watchCookieChange');
  chrome.cookies.onChanged.addListener(async ({ cookie, removed }) => {
    const storage = await chrome.storage.local.get(['domainList']);

    if (Object.keys(storage).length === 0) return;
    const domainList = Object.values(storage['domainList']);

    // 需求更新的 cookie
    for (let item of domainList) {
      if (item.open && equalDomain(item.from, cookie.domain) && item.cookieName === cookie.name) {
        if (removed) {
          removeCookie(cookie, item);
        } else {
          setCookie(cookie, item);
        }
      }
    }
  });
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
