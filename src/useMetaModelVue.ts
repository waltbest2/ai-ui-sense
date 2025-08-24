import { onBeforeUnmount, onMounted, onUnmounted, ref, Ref, shallowReactive, toRaw, watch } from "vue";
import { MetaModelReturnType, metaPlugin, ModelContext, ModelOption, PluginOptions, SplitLabel } from "./types";
import { genRandomString } from "./utils";
import { parse } from "./meta-dsl-engine";

export function useMetaModelVue(model: ModelOption, context: any, extra?: any): MetaModelReturnType | undefined {
  const { originModel, sceneCode, sceneData } = model || {};
  const {name, value} = originModel || {};

  if (!name || !value) {
    return undefined;
  }

  const modelReactive: { [key: string]: string | number | boolean } = shallowReactive(value);

  const sessionId = genRandomString();

  const domRef: Ref = ref();

  const url: URL = new URL(location.href);
  const modelContext: ModelContext = {
    common: {
      url,
      title: document.title,
    },
    business: context,
  };

  const uuid = `${url.hash}${SplitLabel}${name}${SplitLabel}${sessionId}`;

  let option: PluginOptions | undefined = {
    sceneCode,
    sessionId,
    uuid,
    modelReactive,
    rawModel: {
      value: toRaw(modelReactive),
    },
    modelContext,
    originModel,
    extra,
  };

  onMounted(async () => {
    if (!sceneData) {
      console.warn('[ai-ui-sense] no sceneData');
      return;
    }

    let dsl;
    try {
      dsl = await sceneData;
    } catch(e) {
      console.error('[ai-ui-sense] get sceneData api excepiton', (e as any).message);
      return;
    }

    (option as PluginOptions).domRef = domRef.value;
    (option as PluginOptions).dsl = dsl;
    (option as PluginOptions).modelContext.common.domRef = domRef;
    const { load, change } = parse(dsl);
    if (load) {
      metaPlugin.onMounted.run(option as PluginOptions);
    }

    if (Array.isArray(change)) {
      for (const { eventCode, fieldName } of change) {
        watch(
          () => modelReactive[fieldName],
          nv => {
            metaPlugin.watch.run(fieldName, eventCode, toRaw(nv), option as PluginOptions);
          },
          { immediate: true }
        );
      }
    }
  });

  onBeforeUnmount(() => {
    metaPlugin.onBeforeUnmount.run(option as PluginOptions);
  });

  onUnmounted(() => {
    metaPlugin.onUnmounted.run(option as PluginOptions);
    option = undefined;
  });

  return {
    modelReactive,
    domRef,
    modelContext,
  }

}