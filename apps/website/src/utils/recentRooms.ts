export interface RecentRoom {
  name: string;
  lastVisited: number;
}

const RECENT_ROOMS_KEY = 'ducktunnel-recent-rooms';
const MAX_RECENT_ROOMS = 3;

export function saveRoomToRecent(roomName: string): RecentRoom[] {
  try {
    // Get existing rooms from localStorage
    const savedRooms = localStorage.getItem(RECENT_ROOMS_KEY);
    let existingRooms: RecentRoom[] = [];
    
    if (savedRooms) {
      existingRooms = JSON.parse(savedRooms) as RecentRoom[];
    }

    const newRoom: RecentRoom = {
      name: roomName,
      lastVisited: Date.now()
    };

    // Filter out the current room if it exists
    const filteredRooms = existingRooms.filter(room => room.name !== roomName);
    
    // Add new room to the beginning and limit to MAX_RECENT_ROOMS
    const updatedRooms = [newRoom, ...filteredRooms].slice(0, MAX_RECENT_ROOMS);
    
    // Save to localStorage
    localStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(updatedRooms));
    
    return updatedRooms;
  } catch (error) {
    console.error('Error saving room to recent:', error);
    return [];
  }
}

export function getRecentRooms(): RecentRoom[] {
  try {
    const savedRooms = localStorage.getItem(RECENT_ROOMS_KEY);
    if (savedRooms) {
      const rooms = JSON.parse(savedRooms) as RecentRoom[];
      // Sort by last visited (most recent first) and limit
      return rooms
        .sort((a, b) => b.lastVisited - a.lastVisited)
        .slice(0, MAX_RECENT_ROOMS);
    }
    return [];
  } catch (error) {
    console.error('Error loading recent rooms:', error);
    return [];
  }
}
