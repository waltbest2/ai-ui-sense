declare const window;

export function simpleDeepClone(sourceObj: any): any {
  if (typeof window.structuredCone === 'function') {
    return window.structuredCone(sourceObj);
  } else {
    return JSON.parse(JSON.stringify(sourceObj)); 
  }
}

/**
 * 生成随机字符串
 * @returns 
 */
export function genRandomString(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  } else if (globalThis.crypto?.getRandomValues) {
    const length = 12;
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result: string = '';
    const values = new Uint8Array(length);
    globalThis.crypto.getRandomValues(values);

    for(let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }

    return result;
  } else {
    return `${Date.now()}`;
  }
}

export function debounce(fn: Function, delayMS: number, immediate: boolean): Function {
  let timeout: any;
  return function(this: any) {
    let args = arguments;
    if (timeout) {
      clearTimeout(timeout);
    }

    if (immediate) {
      let callNow = !timeout;
      timeout = setTimeout(() => {
        timeout = null;
      }, delayMS);
      if (callNow) {
        fn.apply(this, args);
      }
    } else {
      timeout = setTimeout(() => {
        fn.apply(this, args);
      }, delayMS);
    }
  };
}