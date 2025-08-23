export enum EventType {
  attributeChange = 'attribute_change',
  pageLoad = 'page_load',
  attributeModify = 'attribute_modify',
  getValue = 'get_value',
}

export const EventMap = {
  attribute_change: 'watch',
  page_load: 'onMounted',
}

export enum OperateType {
  view = 'VIEW',
  edit = 'EDIT',
}

export enum ActionType {
  agent = 'agent',
}

export enum CallToolType {
  default = 'default_callback',
  attributeModify = 'attribute_modify',
}

export interface DataType {
  agentSkillCode: 'EventTrigger',
  extendParam: {
    eventId: string; 
    eventCode?: string;
    eventType: EventType;
    sceneCode: string;
    objectData: any;
    changeField?: string[];
  };
}

interface Action {
  type: ActionType;
  invoke: {
    question: string;
  }
}

interface Event {
  eventCode: string;
  eventType: EventType;
  extendInfo?: {
    fieldName: string;
  }
  codition: string;
  actions: Action[];
}

interface DSLUIComponent {
  cardCode: string;
  params: {
    operateType: OperateType;
    [key: string]: string;
  };
  events: Event[];
}

export interface DSL {
  uiComponent: DSLUIComponent;
}

export type ChangeType = {
  eventCode: string;
  fieldName: string;
}

export interface ParseResult {
  load: boolean;
  change: ChangeType[] | false;
}

export function parse(dsl: DSL): ParseResult {
  const result: ParseResult = {
    load: false,
    change: false,
  };

  const events = dsl?.uiComponent?.events;
  if (events) {
    for (const event of events) {
      const { eventCode, eventType, extendInfo } = event;
      if (eventType === EventType.pageLoad) {
        result.load = true;
      } else if (eventType === EventType.attributeChange && extendInfo?.fieldName) {
        result.change = result.change || [];
        result.change.push({
          fieldName: extendInfo?.fieldName,
          eventCode,
        });
      }
    }
  }

  return result;
}