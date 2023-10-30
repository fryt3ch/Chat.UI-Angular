import {ChatMessage} from "../../models/chat/chat-message";

const Padding = 12 * 2;
const NameHeight = 21 * 0;
const DateHeight = 15;
const MessageMarginTop = 8;
const MessageRowHeight = 24;
const MessageRowCharCount = 25;

export const chatMessageHeightPredictor = (m: ChatMessage) => {

  var totalHeight = Padding + NameHeight + DateHeight + MessageMarginTop;

  const textHeight =
    Math.ceil(m.content.length / MessageRowCharCount) * MessageRowHeight;

  totalHeight += textHeight;

  return totalHeight;
};
