export interface Room {
  name: string;
  description: string;
  onlineCount: number;
}

export interface ChatMessage {
  id: string;
  room: string;
  user: string;
  text: string;
  timestamp: string;
  isSystem: boolean;
}
