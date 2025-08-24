import { parse } from "./meta-dsl-engine";
import { metaPlugin, ModelContext, ModelOption, PluginOptions, SplitLabel } from "./types";
import { genRandomString } from "./utils";

export interface RawMetaModelReturnType {
  onMounted?: () => void;

  onBeforeUnmount?: () => void;
}

export function useMetaModelRaw(model: ModelOption, context: any, extra?: any): RawMetaModelReturnType | undefined {
  const { originModel, sceneCode, sceneData } = model || {};
  const { name, value } = originModel || {};
  if (!name || !value) {
    return undefined;
  }

  const modelReactive: any = value;
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
      modelReactive,
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
      const { load } = parse(dsl);

      if (load) {
        metaPlugin.onMounted.run(option as PluginOptions);
      }
    };

    const onBeforeUnmount = () => {
      metaPlugin.onBeforeUnmount.run(option as PluginOptions);
      option = undefined;
    };

    return {
      onMounted,
      onBeforeUnmount,
    }
}