export type EventTypeId = "dam-ngo" | "an-hoi" | "dinh-hon" | "vu-quy" | "thanh-hon";

export interface EventType {
  id: EventTypeId;
  label: string;
  /** Tiêu đề lớn hiển thị trên video */
  title: string;
  description: string;
  defaultMessage: string;
}

export const EVENT_TYPES: Record<EventTypeId, EventType> = {
  "dam-ngo": {
    id: "dam-ngo",
    label: "Dạm ngõ",
    title: "Lễ Dạm Ngõ",
    description: "Buổi gặp mặt đầu tiên của hai gia đình",
    defaultMessage:
      "Gia đình chúng tôi xin chân thành cảm ơn quý vị đại diện hai họ đã dành thời gian đến chung vui trong buổi lễ dạm ngõ hôm nay.",
  },
  "an-hoi": {
    id: "an-hoi",
    label: "Ăn hỏi",
    title: "Lễ Ăn Hỏi",
    description: "Nhà trai mang lễ vật sang hỏi cưới",
    defaultMessage:
      "Xin trân trọng cảm ơn hai họ nội ngoại cùng quý vị khách quý đã đến chung vui và chứng kiến lễ ăn hỏi của hai con chúng tôi.",
  },
  "dinh-hon": {
    id: "dinh-hon",
    label: "Đính hôn",
    title: "Lễ Đính Hôn",
    description: "Chính thức hứa hôn trước hai gia đình",
    defaultMessage:
      "Cảm ơn quý vị đã đến chứng giám lời hứa hôn của hai con. Sự hiện diện của quý vị là niềm vinh hạnh cho hai gia đình.",
  },
  "vu-quy": {
    id: "vu-quy",
    label: "Vu quy",
    title: "Lễ Vu Quy",
    description: "Lễ tiễn con gái về nhà chồng",
    defaultMessage:
      "Gia đình nhà gái xin chân thành cảm ơn quý vị đã đến chung vui, tiễn con gái chúng tôi về nhà chồng.",
  },
  "thanh-hon": {
    id: "thanh-hon",
    label: "Thành hôn",
    title: "Lễ Thành Hôn",
    description: "Lễ cưới chính thức",
    defaultMessage:
      "Sự hiện diện của quý vị là niềm vinh hạnh lớn lao cho gia đình chúng tôi. Xin chân thành cảm ơn!",
  },
};

export const EVENT_LIST = Object.values(EVENT_TYPES);

export function isEventType(v: unknown): v is EventTypeId {
  return typeof v === "string" && v in EVENT_TYPES;
}
