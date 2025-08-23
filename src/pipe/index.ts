import { DataType, EventType } from "../meta-dsl-engine";
import { genRandomString } from "../utils";

const eventName = 'AI:UI:Sense';
const eventCBName = 'AI:UI:Sense:CB';
const eventInitName = 'AI:UI:Sense:Init';

const topWindow: Window = (typeof top !== 'undefined' && Object.prototype.toString.call(top) === '[object Window]' ? top : window) as Window;

export enum PointType {
  component = 'component',
  agent = 'agent',
}

export interface PieceDataType {
  [uuid: string]: DataType;
}

export interface InitEventDataType {
  modelName: string;

  type: PointType;
}

export type CallbackFn = (value: PieceDataType) => any;

export interface TransDataType extends InitEventDataType {
  targetModelName?: string;

  data: PieceDataType;
}

export type CBEventDataType = string[];

const currentType: {
  [modelName: string]: PointType | undefined;
} = {};

const isReady: {
  [modelName: string]: boolean;
} = {};

const unmountFn: {
  [modelName: string]: () => void;
} = {};

const reservedData: {
  [modelName: string]: PieceDataType;
} = {};

function isDataType(data: PieceDataType | DataType) : boolean {
  return !!data?.agentSkillCode;
}

export function componentReady(currentSceneCode: string, watcher?: (data: PieceDataType) => void, getValueFn?: (item: string) => any): () => void {
  if (isReady[currentSceneCode]) {
    return unmountFn[currentSceneCode];
  }

  if (!currentType[currentSceneCode]) {
    currentType[currentSceneCode]  = PointType.component;
  }

  const eventNameInitListener = (e: CustomEventInit) => {
    const { modelName, type } = e.detail as InitEventDataType;
    if (modelName === currentSceneCode || type === PointType.component) {
      return;
    }

    const existData = {};
    for (const [key, value] of Object.entries(reservedData[currentSceneCode])) {
      if (key && value) {
        existData[key] = value;
      }
    }

    push(currentSceneCode, existData);
  };

  const { eventNameListener, eventNameCBListener } = listen(currentSceneCode, watcher);

  topWindow.addEventListener(eventInitName, eventNameInitListener);

  reservedData[currentSceneCode] = {};
  isReady[currentSceneCode] = true;

  if (getValueFn) {
    push(currentSceneCode, {
      agentSkillCode: 'EventTrigger',
      extendParam: {
        eventId: genRandomString(),
        eventType: EventType.getValue,
        sceneCode: currentSceneCode,
        objectData: getValueFn,
      }
    });
  }

  unmountFn[currentSceneCode] = function() {
    topWindow.removeEventListener(eventInitName, eventNameInitListener);
    topWindow.removeEventListener(eventCBName, eventNameCBListener);
    topWindow.removeEventListener(eventName, eventNameListener);
    reservedData[currentSceneCode] = {};
    delete unmountFn[currentSceneCode];
    isReady[currentSceneCode] = false;
  };

  return unmountFn[currentSceneCode];
}

export function agentReady(agentName: string, watcher?: (data: PieceDataType) => void): () => void {
  if (isReady[agentName]) {
    return unmountFn[agentName];
  }

  if (!currentType[agentName]) {
    currentType[agentName] = PointType.agent;
  }

  const { eventNameListener, eventNameCBListener } = listen(agentName, watcher);

  const e = new CustomEvent(eventInitName, {
    detail: {
      modelName: agentName,
      type: PointType.agent,
    },
  });

  topWindow.dispatchEvent(e);

  unmountFn[agentName] = function() {
    topWindow.removeEventListener(eventCBName, eventNameCBListener);
    topWindow.removeEventListener(eventName, eventNameListener);
    delete unmountFn[agentName];
    isReady[agentName] = false;
  };

  isReady[agentName] = true;
  return unmountFn[agentName];
}

export function push(modelName: string, data: PieceDataType | DataType, targetModelName?: string) {
  if (!data || isReady[modelName] !== true) {
    console.warn(`[ai-ui-sense] push data is empty or ${modelName} is not ready`);
    return;
  }

  let targetData: PieceDataType | DataType = data;

  if (isDataType(data)) {
    const uuid = genRandomString();
    targetData = {};
    targetData[uuid] = data as DataType;
    reservedData[modelName] = reservedData[modelName] || {};
    reservedData[modelName][uuid] = data as DataType;
  }

  const dispatchData: TransDataType = {
    modelName,
    type: currentType[modelName] as PointType,
    data: targetData as PieceDataType,
  }

  if (targetModelName) {
    dispatchData.targetModelName = targetModelName;
  }

  const e = new CustomEvent(eventName, {
    detail: dispatchData,
  });

  topWindow.dispatchEvent(e);
}

function listen(modelName: string, watcher?: (data: PieceDataType) => void) {
  const eventNameListener = (e: CustomEventInit) => {
    const { type, data, targetModelName } = e.detail as TransDataType;
    if (!type || type === currentType[modelName]) {
      return;
    }

    if (targetModelName && targetModelName !== modelName) {
      return;
    }

    const dealedUUID = Object.keys(data);
    const be = new CustomEvent(eventCBName, {
      detail: dealedUUID,
    });

    topWindow.dispatchEvent(be);

    watcher?.(data);
  }

  const eventNameCBListener = (e: CustomEventInit) => {
    const uuids = e.detail as CBEventDataType;
    if (uuids?.length) {
      for (const uuid of uuids) {
        if (uuid && reservedData[modelName]?.[uuid]) {
          delete reservedData[modelName][uuid];
        }
      }
    }
  };

  topWindow.addEventListener(eventCBName, eventNameCBListener);
  topWindow.addEventListener(eventName, eventNameListener);

  return {
    eventNameListener,
    eventNameCBListener
  }
}