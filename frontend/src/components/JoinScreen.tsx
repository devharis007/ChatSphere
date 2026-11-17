import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ROOMS_URL } from '../config';
import type { Room } from '../types';

interface JoinScreenProps {
  onJoin: (username: string, room: string) => void;
  connecting: boolean;
  error: string | null;
}

const FALLBACK_ROOMS: Room[] = [
  { name: 'General', description: 'Casual conversation for anyone dropping by', onlineCount: 0 },
];

export function JoinScreen({ onJoin, connecting, error }: JoinScreenProps) {
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');
  const [rooms, setRooms] = useState<Room[]>(FALLBACK_ROOMS);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(ROOMS_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json() as Promise<Room[]>;
      })
      .then((data) => {
        if (cancelled || data.length === 0) return;
        setRooms(data);
        setRoom((current) => current || data[0].name);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not reach the API to load rooms — showing a default room. Is the backend running on http://localhost:5082?');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!room && rooms.length > 0) {
      setRoom(rooms[0].name);
    }
  }, [rooms, room]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    const selectedRoom = room || rooms[0]?.name;

    if (!trimmedUsername) {
      setValidationError('Please enter a username.');
      return;
    }
    if (!selectedRoom) {
      setValidationError('Please choose a room.');
      return;
    }
    setValidationError(null);
    onJoin(trimmedUsername, selectedRoom);
  };

  return (
    <div className="join-screen">
      <div className="join-card">
        <h1>ChatSphere</h1>
        <p className="tagline">Real-time chat, built with ASP.NET Core SignalR &amp; React</p>

        <form onSubmit={handleSubmit} className="join-form">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            placeholder="e.g. Alex"
            value={username}
            maxLength={30}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />

          <label htmlFor="room">Room</label>
          <select id="room" value={room} onChange={(e) => setRoom(e.target.value)}>
            {rooms.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name} {r.onlineCount > 0 ? `(${r.onlineCount} online)` : ''}
              </option>
            ))}
          </select>

          {room && rooms.find((r) => r.name === room)?.description && (
            <p className="room-description">{rooms.find((r) => r.name === room)?.description}</p>
          )}

          {(validationError || error) && <p className="form-error">{validationError ?? error}</p>}
          {loadError && <p className="form-warning">{loadError}</p>}

          <button type="submit" disabled={connecting}>
            {connecting ? 'Connecting…' : 'Join Room'}
          </button>
        </form>
      </div>
    </div>
  );
}
