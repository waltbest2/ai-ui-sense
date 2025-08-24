import { DSL } from "./meta-dsl-engine";
import { key } from "./meta-plugins/agent-sense";

export const SplitLabel = '$$';

export interface ModelContext {
  common: {
    url: URL;

    title: string;

    domRef?: any;
  };

  business?: {
    [key: string]: string;
  }
}

export interface MetaModel {
  name: string;

  description?: string;

  value: {
    [key: string]: any;
  }
}

export interface MetaModelReturnType {
  modelReactive: { [key: string]: string | number | boolean };

  domRef: any;

  modelContext: ModelContext;
}

export interface RawModelType {
  value?: { [key: string]: string | number | boolean };
}

export interface ModelOption {
  originModel: MetaModel;

  sceneCode: string;

  sceneData?: Promise<any>;
}

export interface PluginOptions {
  sceneCode: string;

  modelReactive: { [key: string]: string | number | boolean };

  rawModel: RawModelType;

  originModel: any;

  sessionId: string;

  uuid: string;

  modelContext: ModelContext;

  dsl?: DSL;

  domRef?: HTMLElement;

  extra?: {
    [key]: any;
  }

  unmountFn?: Function;
}

type OnMountedFn = (option: PluginOptions) => void;
type OnMountedTapFn = (pluginFn: OnMountedFn) => void;
type WatchFn = (key: string, eventCode: string, nv: any, option: PluginOptions) => void;
type WatchTapFn = (pluginFn: WatchFn) => void;
type OnBeforeUnmountFn = (option: PluginOptions) => void;
type OnBeforeUnmountTapFn = (pluginFn: OnBeforeUnmountFn) => void;
type OnUnmountedFn = (option: PluginOptions) => void;
type OnUnmountedTapFn = (pluginFn: OnBeforeUnmountFn) => void;

export interface PluginLifecycle {
  onMounted: {
    run: OnMountedFn;
    tap: OnMountedTapFn;
    fn: OnMountedFn[];
  };

  watch: {
    run: WatchFn;
    tap: WatchTapFn;
    fn: WatchFn[];
  };

  onBeforeUnmount: {
    run: OnBeforeUnmountFn;
    tap: OnBeforeUnmountTapFn;
    fn: OnBeforeUnmountFn[];
  };

  onUnmounted: {
    run: OnUnmountedFn;
    tap: OnUnmountedTapFn;
    fn: OnUnmountedFn[];
  }
}

export interface Plugin {
  onMounted?: OnMountedFn;

  watch?: WatchFn;

  onBeforeUnmount?: OnBeforeUnmountFn;

  onUnmounted?: OnUnmountedFn;
}

export const metaPlugin: PluginLifecycle = {
  onMounted: {
    run(option: PluginOptions) {
      const fns: OnMountedFn[] = (this as any).fn;
      for (const fn of fns) {
        fn(option);
      }
    },
    tap(pluginFn: OnMountedFn) {
      this.fn.push(pluginFn);
    },
    fn: [],
  },
  watch: {
    run(key: string, eventCode: string, rawNv: any, option: PluginOptions) {
      const fns: WatchFn[] = (this as any).fn;
      for (const fn of fns) {
        fn(key, eventCode, rawNv, option);
      }
    },
    tap(pluginFn: WatchFn) {
      this.fn.push(pluginFn);
    },
    fn: [],
  },
  onBeforeUnmount: {
    run(option: PluginOptions) {
      const fns: OnBeforeUnmountFn[] = (this as any).fn;
      for (const fn of fns) {
        fn(option);
      }
    },
    tap(pluginFn: OnBeforeUnmountFn) {
      this.fn.push(pluginFn);
    },
    fn: [],
  },
  onUnmounted: {
    run(option: PluginOptions) {
      const fns: OnUnmountedFn[] = (this as any).fn;
      for (const fn of fns) {
        fn(option);
      }
    },
    tap(pluginFn: OnUnmountedFn) {
      this.fn.push(pluginFn);
    },
    fn: [],
  }
}