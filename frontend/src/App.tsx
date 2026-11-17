import { useCallback, useState } from 'react';
import './App.css';
import { JoinScreen } from './components/JoinScreen';
import { ChatScreen } from './components/ChatScreen';
import { useChatConnection } from './hooks/useChatConnection';

interface Identity {
  username: string;
  room: string;
}

function App() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [joining, setJoining] = useState(false);
  const { status, messages, users, typingUsers, error, joinRoom, leaveRoom, sendMessage, setTyping } =
    useChatConnection();

  const handleJoin = useCallback(
    async (username: string, room: string) => {
      setJoining(true);
      try {
        await joinRoom(username, room);
        setIdentity({ username, room });
      } catch {
        // Error state is already surfaced by the hook.
      } finally {
        setJoining(false);
      }
    },
    [joinRoom],
  );

  const handleLeave = useCallback(async () => {
    await leaveRoom();
    setIdentity(null);
  }, [leaveRoom]);

  if (!identity) {
    return <JoinScreen onJoin={handleJoin} connecting={joining} error={error} />;
  }

  return (
    <ChatScreen
      username={identity.username}
      room={identity.room}
      messages={messages}
      users={users}
      typingUsers={typingUsers}
      status={status}
      error={error}
      onSendMessage={sendMessage}
      onTyping={setTyping}
      onLeave={handleLeave}
    />
  );
}

export default App;
