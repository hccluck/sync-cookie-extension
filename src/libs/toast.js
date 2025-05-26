export const Toast = (function () {
  var count = 0;

  var opts = {
    theme: 'info', // 默认主题
    duration: 3000, // 默认持续时间
    animation: 200, // 默认动画时间
  };

  function init(message, options) {
    options = options || {};
    var theme = options.theme || opts.theme;
    var duration = options.duration || opts.duration;
    var animation = options.animation || opts.animation;

    var toastEl = document.createElement('div');

    toastEl.className = 'toast-wrap toast-' + theme;
    toastEl.style.top = 50 * (count + 1) + 'px';
    toastEl.style['transition-duration'] = animation + 'ms';

    count += 1;
    toastEl.textContent = message;

    document.body.appendChild(toastEl);

    toastEl.getBoundingClientRect(); // 触发重新布局

    toastEl.classList.add('enter');

    setTimeout(function () {
      toastEl.addEventListener('transitionend', function () {
        toastEl.parentNode.removeChild(toastEl);

        count -= 1;

        var list = document.querySelectorAll('.toast-wrap');
        list.forEach(function (toast, index) {
          toast.style.top = 50 * (index + 1) + 'px';
        });

        options.onClose && options.onClose();
      });

      toastEl.classList.remove('enter');
    }, duration);
  }

  function createMethod(defaultTheme) {
    return function (message, config) {
      if (!message) return;

      if (Object.prototype.toString.call(config) === '[object Object]') {
        config.theme = config.theme || defaultTheme;
        return init(message, config);
      }

      return init(message, { theme: defaultTheme });
    };
  }

  function insertStyle(css) {
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML =
      '.toast-wrap{position:fixed;top:50px;left:50%;transform:translate(-50%,-20px);padding:8px 12px;border-radius:4px;color:#909399;border:1px solid #ebeef5;background-color:#edf2fc;box-shadow:0 2px 12px 0 rgba(0,0,0,0.25);opacity:0.3;transition-delay:10ms;transition-property:all;transition-timing-function:ease-out;transition-duration:200ms;}.toast-wrap.enter{opacity:1;transform:translate(-50%,0);}.toast-wrap.toast-success{color:#67c23a;background-color:#f0f9eb;border-color:#e1f3d8;}.toast-wrap.toast-warning{color:#e6a23c;background-color:#fdf6ec;border-color:#faecd8;}.toast-wrap.toast-error{color:#f56c6c;background-color:#fef0f0;border-color:#fde2e2;}';
    document.head.appendChild(style);
  }
  insertStyle();

  return {
    success: createMethod('success'),
    warning: createMethod('warning'),
    error: createMethod('error'),
    info: createMethod('info'),
  };
})();

// class Toast {
//   static count = 0;

//   static init(message, theme = 'info', duration = 3000, animation = 200) {
//     const toastEl = document.createElement('div');

//     toastEl.className = `toast-wrap toast-${theme}`;
//     toastEl.style.top = `${50 * (this.count + 1)}px`;
//     toastEl.style['transition-duration'] = `${animation}ms`;

//     this.count += 1;
//     toastEl.textContent = message;

//     document.body.appendChild(toastEl);

//     toastEl.getBoundingClientRect(); // 触发重新布局
//     // 设置入场动画状态
//     toastEl.classList.toggle('enter');

//     return new Promise(resolve => {
//       setTimeout(() => {
//         toastEl.addEventListener('transitionend', () => {
//           // alert('动画结束后')
//           toastEl.parentNode.removeChild(toastEl);

//           this.count -= 1;

//           const list = document.querySelectorAll('.toast-wrap')
//           list.forEach((toast, index) => {
//             // 重新设置位置
//             toast.style.top = `${50 * (index + 1)}px`;
//           })

//           resolve()
//         })

//         // 设置出场动画状态
//         toastEl.classList.toggle('enter')
//       }, duration)
//     })
//   }

//   /**
//    * 成功提示
//    * @param {string|object} config 提示内容或者Toast.config
//    * @returns {Promise} Promise
//    */
//   static success(config) {
//     if (config == null) return;

//     if (typeof config === 'string') return this.init(config, 'success');

//     if (Object.prototype.toString.call(config) === '[object Object]') {
//       return this.init(config.content, 'success', config.duration, config.animation);
//     }
//   }

//   static warning(config) {
//     if (config == null) return;

//     if (typeof config === 'string') return this.init(config, 'warning');

//     if (Object.prototype.toString.call(config) === '[object Object]') {
//       return this.init(config.content, 'warning', config.duration, config.animation);
//     }
//   }

//   static error(config) {
//     if (config == null) return;

//     if (typeof config === 'string') return this.init(config, 'error');

//     if (Object.prototype.toString.call(config) === '[object Object]') {
//       return this.init(config.content, 'error', config.duration, config.animation);
//     }
//   }

//   static info(config) {
//     if (config == null) return;

//     if (typeof config === 'string') return this.init(config, 'info');

//     if (Object.prototype.toString.call(config) === '[object Object]') {
//       return this.init(config.content, 'info', config.duration, config.animation);
//     }
//   }
// }
