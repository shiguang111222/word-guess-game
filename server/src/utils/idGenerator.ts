// Exclude ambiguous characters: 0, O, I, L, 1
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export function generatePlayerId(): string {
  return `p_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
