import { cloneDeep, isEmpty } from './libs/utils.js';
import { updateStorage, getStorage, updateCookie, removeCookie, getAllCookie, LIST_KEY } from './libs/storage.js';
import { Toast } from './libs/toast.js';

let back = false;
const app = PetiteVue.createApp({
  dataSource: [],
  drawer: false,
  instance: {},
  domainDrawer: false,
  from: '',
  cookieList: [],

  ip: '',

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

    fetch('https://myip.ipip.net')
      .then((res) => res.text())
      .then((text) => (this.ip = text));
  },

  syncCookie() {
    console.log(this.dataSource);
    const list = [];
    this.dataSource.forEach((item) => {
      if (item.open) {
        list.push({
          from: item.from,
          to: item.to,
          cookieName: item.cookieName,
        });
      }
    });

    if (list.length) {
      Promise.all(list.map((i) => updateCookie(i)))
        .then(() => {
          Toast.success('Cookie同步成功！');
        })
        .catch(() => {
          Toast.error('Cookie同步异常！');
        });
    } else {
      this.clearCookie();
    }
  },

  clearCookie() {
    try {
      this.dataSource.forEach(removeCookie);
      Toast.warning('已清空，请刷新页面');
    } catch (error) {
      Toast.error('清空Cookie异常');
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
    if (!this.from) return Toast.info('请输入域名');
    this.cookieList = await getAllCookie(this.from);
  },

  add() {
    if (!this.instance.from) return Toast.info('请输入From');
    if (!this.instance.to) return Toast.info('请输入To');
    if (!this.instance.cookieName) return Toast.info('请输入Cookie名');

    const item = cloneDeep(this.instance);
    for (let row of this.dataSource) {
      if (row.from === item.from && row.to === item.to && row.cookieName === item.cookieName) {
        return Toast.error('不可重复添加');
      }
    }

    this.dataSource.push(item);
    updateStorage(this.dataSource);
    this.syncCookie();
    this.close();
  },

  /**
   * 查询域名下可用cookie
   * @param {string} domain 域名
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
    const res = confirm('确认删除？');
    if (!res) return;
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
    if (file.type !== 'application/json') return Toast.warning('仅支持JSON格式文件导入');

    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');

    reader.onload = (evt) => {
      let json;
      try {
        json = JSON.parse(evt.target.result);
      } catch (error) {
        Toast.error('配置文件解析异常');
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

      if (!list.length) return Toast.warning('无可用数据导入');

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
    linkEl.setAttribute('download', 'COOKIE跨域同步配置');
    linkEl.style.display = 'none';
    document.body.appendChild(linkEl);
    linkEl.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(linkEl);
    }, 300);
  },

  copyIP() {
    const ip = /((\d{1,3}.){3}\d{1,3})/.exec(this.ip)[1];
    navigator.clipboard.writeText(ip);
    Toast.success('复制成功');
  },
});

app.mount();
