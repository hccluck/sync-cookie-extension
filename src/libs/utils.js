const PrimitiveRE = /^\[object (Number|BigInt|Boolean|String|Null|Undefined|Symbol|Function)\]$/;
const CtrRE = /^\[object (Date|RegExp|Error)\]$/;

/**
 * 深拷贝
 * @param {any} obj 要深拷贝的变量
 * @param {*} memory 弱引用缓存，解决循环引用
 * @returns target like obj
 */
export function cloneDeep(obj, memory = new WeakMap()) {
  let target;

  // if (!memory) memory = new WeakMap();

  const type = Object.prototype.toString.call(obj);

  if (PrimitiveRE.test(type)) {
    target = obj;
  } else if (CtrRE.test(type)) {
    target = new obj.constructor(obj);
  } else if (type === '[object Array]') {
    target = [];
    for (const value of obj) target.push(cloneDeep(value, memory));
  } else if (type === '[object Set]') {
    target = new Set();
    for (const value of obj) target.add(cloneDeep(value, memory));
  } else if (type === '[object Map]') {
    target = new Map();
    for (const [key, value] of obj) target.set(key, cloneDeep(value, memory));
  } else {
    if (memory.has(obj)) {
      target = memory.get(obj);
    } else {
      target = Object.create(null);
      memory.set(obj, target);
      for (let key in obj) target[key] = cloneDeep(obj[key], memory);
    }
  }

  return target;
}

/**
 * 仅执行一次的函数
 * @param {function} func 要执行的函数
 * @returns 
 */
export function once(func) {
  let once = true;

  return () => {
    if (!once) return;
    once = false;

    if (typeof func === 'function') func();
  };
}

/**
 * Object.hasOwn
 * @param {object} obj 对象
 * @param {string} key 键值
 * @returns {boolean}
 */
export function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * 判断是否为空、空对象、空数组等
 * @param {any} value 要判断的值
 * @returns {boolean}
 */
export function isEmpty(value) {
  if (value == null) return true;

  const type = Object.prototype.toString.call(value);

  if (type === '[object Array]') return !value.length;

  if (type === '[object Set]' || type === '[object Set]') return !value.size;

  for (let key in value) {
    if (hasOwn(value, key)) return false;
  }

  return true;
}
