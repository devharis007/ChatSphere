import type { ConnectionStatus } from '../hooks/useChatConnection';

interface SidebarProps {
  room: string;
  username: string;
  users: string[];
  status: ConnectionStatus;
  onLeave: () => void;
}

const statusLabel: Record<ConnectionStatus, string> = {
  connected: 'Connected',
  connecting: 'Connecting…',
  reconnecting: 'Reconnecting…',
  disconnected: 'Disconnected',
};

export function Sidebar({ room, username, users, status, onLeave }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>{room}</h2>
        <span className={`status-pill status-${status}`}>{statusLabel[status]}</span>
      </div>

      <button className="leave-button" onClick={onLeave}>
        Leave room
      </button>

      <h3 className="online-heading">Online — {users.length}</h3>
      <ul className="user-list">
        {users.map((user) => (
          <li key={user} className={user === username ? 'me' : ''}>
            <span className="dot" />
            {user}
            {user === username ? ' (you)' : ''}
          </li>
        ))}
        {users.length === 0 && <li className="empty">No one else here yet</li>}
      </ul>
    </aside>
  );
}
