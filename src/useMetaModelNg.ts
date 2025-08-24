import { effect, signal } from "@angular/core";
import { ChangeType, parse } from "./meta-dsl-engine";
import { metaPlugin, ModelContext, ModelOption, PluginOptions, SplitLabel } from "./types";
import { genRandomString, simpleDeepClone } from "./utils";

export interface NgMetaModelReturnType {
  modelReactive: any;

  modelContext: ModelContext;

  onMounted?: () => void;

  onBeforeUnmount?: () => void;
}

function diffModel(oldModel, newModel): [string, string][] {
  const result: [string, string][] = [];
  if (!oldModel || !newModel) {
    return result;
  }

  for (const [key, value] of Object.entries(oldModel)) {
    if (Object.prototype.hasOwnProperty.call(newModel, key) && value !== newModel[key] && typeof value !== 'object') {
      result.push([key, newModel[key]]);
    }
  }

  return result;
}

function getChangeEventCode(change: ChangeType[], key: string): { fieldName?: string; eventCode?: string } {
  for (const { fieldName, eventCode } of change) {
    if (fieldName === key) {
      return { fieldName, eventCode };
    }
  }

  return {};
}

export function useMetaModelNg(model: ModelOption, context: any, extra?: any): NgMetaModelReturnType | undefined {
  const { originModel, sceneCode, sceneData } = model || {};
  const { name, value } = originModel;
  if (!name || !value) {
    return undefined;
  }

  const modelReactive: any = signal(value);
  const changeList: { value: ChangeType[] | false } = {
    value: false,
  }

  const sessionId = genRandomString();

  const url: URL = new URL(location.href);
  
  const modelContext: ModelContext = {
    common: {
      url,
      title: document.title,
    },
    business: context,
  }

  const uuid = `${url.hash}${SplitLabel}${name}${SplitLabel}${sessionId}`;

  let option: PluginOptions | undefined = {
    sceneCode,
    sessionId,
    uuid,
    modelReactive: modelReactive(),
    rawModel: {
      value,
    },
    modelContext,
    originModel,
    extra,
  }

  const onMounted = async () => {
    if (!sceneData) {
      console.warn('[ai-ui-sense] no sceneData');
      return;
    }
    let dsl;
    try {
      dsl = await sceneData;
    } catch(e) {
      console.error('[ai-ui-sense] get sceneData api exception', (e as any).message);
      return;
    }

    (option as PluginOptions).dsl = dsl;
    const { load, change } = parse(dsl);
    changeList.value = change;
    if (load) {
      metaPlugin.onMounted.run(option as PluginOptions);
    }
  };

  const onBeforeUnmount = () => {
    metaPlugin.onBeforeUnmount.run(option as PluginOptions);
    option = undefined;
  }

  let oldValue = simpleDeepClone(modelReactive());

  effect(() => {
    const newValue = modelReactive();
    if (changeList.value === false || (!Array.isArray(changeList.value) && !(changeList.value as Array<string>).length)) {
      return;
    }

    const diffItems = diffModel(oldValue, newValue);
    for (const [key, value] of diffItems) {
      const { fieldName, eventCode } = getChangeEventCode(changeList.value, key);
      if (fieldName) {
        metaPlugin.watch.run(fieldName, eventCode as string, value, option as PluginOptions);
      }
    }
    oldValue = simpleDeepClone(newValue);
  });

  return {
    modelReactive,
    modelContext,
    onMounted,
    onBeforeUnmount,
  }
}