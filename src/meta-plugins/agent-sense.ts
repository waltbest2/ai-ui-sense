
import { EventType } from "../meta-dsl-engine";
import { componentReady, PieceDataType, push } from "../pipe";
import { Plugin, PluginOptions } from '../types';
import { debounce } from '../utils';

export const key = 'agent-sense';

function defaultWatcher(value: PieceDataType, modelReactive: any) {
  for (const [, rawData] of Object.entries(value)) {
    const { extendParam } =  rawData || {};
    const { objectData, eventType } = extendParam || {};
    if (eventType === EventType.attributeModify) {
      for (const [prop, newValue] of Object.entries(objectData)) {
        if (Object.prototype.hasOwnProperty.call(modelReactive, prop)) {
          modelReactive[prop] = newValue as string;
        }
      }
    }
  }
}

export default function(): Plugin {
  const debounceMgr = {};
  return {
    watch: (key: string, eventCode: string, rawNv: any, optoins: PluginOptions) => {
      const { uuid, sceneCode } =  optoins;
      debounceMgr[sceneCode] = debounceMgr[sceneCode] || {};
      let debounceFn = debounceMgr[sceneCode][key];
      if (!debounceFn) {
        debounceFn = debounceMgr[sceneCode][key] = debounce(
          ({sceneCode, uuid, eventCode, rawNv, key}) => {
            push(sceneCode, {
              agentSkillCode: 'EventTrigger',
              extendParam: {
                eventId: uuid,
                eventType: EventType.attributeChange,
                eventCode,
                sceneCode,
                objectData: rawNv,
                changeField: [key],
              },
            });
          },
          1000,
          false,
        );
      }

      debounceFn({sceneCode, uuid, eventCode, rawNv, key});
    },
    onMounted: (options: PluginOptions) => {
      const { uuid, extra, modelReactive, sceneCode, rawModel } = options;
      function defaultModifyWatcher(value: PieceDataType) {
        return defaultWatcher(value, modelReactive);
      }

      const { cb } = extra?.[key] || {};
      options.unmountFn = componentReady(sceneCode, cb || defaultModifyWatcher);

      push(sceneCode, {
        agentSkillCode: 'EventTrigger',
        extendParam: {
          eventId: uuid,
          eventCode: EventType.pageLoad,
          eventType: EventType.pageLoad,
          sceneCode,
          objectData: rawModel,
        },
      });
    },
    onBeforeUnmount: (options: PluginOptions) => {
      if (typeof options.unmountFn === 'function') {
        options.unmountFn();
        delete options.unmountFn;
      }

      const { rawModel, sceneCode, modelReactive } = options;
      if (rawModel?.value) {
        delete rawModel.value;
      }
      if (modelReactive) {
        delete options.modelReactive;
      }
      if (debounceMgr[sceneCode]) {
        delete debounceMgr[sceneCode];
      }
    }
  }
}