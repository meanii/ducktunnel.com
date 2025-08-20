import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';

export function generateRoomName(): string {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: '-',
    style: 'lowerCase',
  });
}
