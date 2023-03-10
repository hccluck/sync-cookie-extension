import { cloneDeep, isEmpty } from './libs/utils.js';
import { updateStorage, getStorage, updateCookie, removeCookie, getAllCookie, LIST_KEY } from './libs/storage.js';

class Toast {
  static count = 0;

  static open(message, theme = 'info', duration = 2000) {
    const toastEl = document.createElement('div');

    toastEl.className = `toast-wrap toast-${theme}`;
    toastEl.style.top = `${50 * (this.count + 1)}px`;

    toastEl.textContent = message;

    document.body.appendChild(toastEl);

    this.count += 1;

    setTimeout(() => {
      document.body.removeChild(toastEl);
      this.count -= 1;
    }, duration);
  }

  static success(config) {
    if (config == null) return;

    if (typeof config === 'string') return this.open(config, 'success');

    if (Object.prototype.toString.call(config) === '[object Object]') {
      this.open(config.content, 'success', config.duration);
    }
  }

  static warning(config) {
    if (config == null) return;

    if (typeof config === 'string') return this.open(config, 'warning');

    if (Object.prototype.toString.call(config) === '[object Object]') {
      this.open(config.content, 'warning', config.duration);
    }
  }

  static error(config) {
    if (config == null) return;

    if (typeof config === 'string') return this.open(config, 'error');

    if (Object.prototype.toString.call(config) === '[object Object]') {
      this.open(config.content, 'error', config.duration);
    }
  }

  static info(config) {
    if (config == null) return;

    if (typeof config === 'string') return this.open(config, 'info');

    if (Object.prototype.toString.call(config) === '[object Object]') {
      this.open(config.content, 'info', config.duration);
    }
  }
}

let back = false;
const app = PetiteVue.createApp({
  dataSource: [],
  drawer: false,
  instance: {},
  domainDrawer: false,
  from: '',
  cookieList: [],

  async mounted() {
    const storage = await getStorage();
    const domainList = !isEmpty(storage) ? Object.values(storage[LIST_KEY]) : [];
    console.log(domainList);

    if (!isEmpty(domainList)) {
      this.dataSource = domainList;
    }

    if (!isEmpty(this.dataSource)) {
      updateStorage(this.dataSource);
      this.syncCookie();
    }
  },

  syncCookie() {
    console.log(this.dataSource);
    this.dataSource.forEach((item) => {
      if (item.open) {
        updateCookie({
          from: item.from,
          to: item.to,
          cookieName: item.cookieName,
        });

        Toast.success('Cookie???????????????');
      }
    });
  },

  clearCookie() {
    try {
      this.dataSource.forEach(removeCookie);
      Toast.success('???????????????????????????');
    } catch (error) {
      Toast.error('??????Cookie??????');
    }
  },

  openDrawer() {
    this.drawer = true;
    this.instance = {
      from: '',
      to: 'localhost',
      cookieName: 'SESSION',
      open: true,
      remark: '',
    };
  },

  close() {
    this.drawer = false;
    if (back) {
      this.domainDrawer = true;
      back = false;
    }
  },

  async getAllCookie() {
    if (!this.from) return Toast.warning('???????????????');
    this.cookieList = await getAllCookie(this.from);
  },

  add() {
    if (!this.instance.from) return Toast.warning('?????????From');
    if (!this.instance.to) return Toast.warning('?????????To');
    if (!this.instance.cookieName) return Toast.warning('?????????Cookie???');

    const item = cloneDeep(this.instance);
    for (let row of this.dataSource) {
      if (row.from === item.from && row.to === item.to && row.cookieName === item.cookieName) {
        return Toast.error('??????????????????');
      }
    }

    this.dataSource.push(item);
    updateStorage(this.dataSource);
    this.syncCookie();
    this.close();
  },

  /**
   * ?????????????????????cookie
   * @param {string} domain ??????
   */
  async searchByDomain(domain) {
    if (domain) {
      this.from = domain;
    } else {
      if (!this.from) {
        await chrome.tabs.query({ active: true }).then((tabs) => {
          const url = tabs[0].url;
          const { origin } = new URL(url);
          this.from = origin || '';
        });
      }
    }

    this.domainDrawer = true;
    this.getAllCookie();
  },

  toAdd(index) {
    this.instance = {
      from: this.from,
      to: 'localhost',
      cookieName: this.cookieList[index].name,
      open: true,
      remark: '',
    };
    back = true;
    this.drawer = true;
    this.domainDrawer = false;
  },

  remove(index) {
    const item = this.dataSource.splice(index, 1);
    updateStorage(this.dataSource);
    removeCookie(item);
  },

  changeStatus(index) {
    this.dataSource[index].open = !this.dataSource[index].open;
    updateStorage(this.dataSource);

    this.syncCookie();
  },

  upload() {
    this.$refs.upload.click();
  },
  uploadHandler(e) {
    const file = e.target.files[0];
    if (file.type !== 'application/json') return Toast.warning('?????????JSON??????????????????');

    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');

    reader.onload = (evt) => {
      let json;
      try {
        json = JSON.parse(evt.target.result);
      } catch (error) {
        Toast.error('????????????????????????');
      }

      const list = [];
      json.list?.forEach((row) => {
        const selfRepeat = list.some((i) => row.from === i.from && row.to === i.to && row.cookieName === i.cookieName);
        if (selfRepeat) return;

        const dataRepeat = this.dataSource.some(
          (i) => row.from === i.from && row.to === i.to && row.cookieName === i.cookieName,
        );
        if (dataRepeat) return;

        list.push(row);
      });

      if (!list.length) return Toast.warning('?????????????????????');

      this.dataSource.push(...list);
      updateStorage(this.dataSource);
      this.syncCookie();
    };
  },

  download() {
    const json = JSON.stringify({ list: this.dataSource }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const linkEl = document.createElement('a');
    linkEl.href = url;
    linkEl.setAttribute('download', 'COOKIE??????????????????');
    linkEl.style.display = 'none';
    document.body.appendChild(linkEl);
    linkEl.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(linkEl);
    }, 300);
  },
});

app.mount();
