import React, { useState, useEffect } from "react";
import Login from "./Login";
import UsersList from "./UsersList";
import ChatRoom from "./ChatRoom";
import { realtimeDB } from "./firebase";
import { ref, onDisconnect, set } from "firebase/database";

const App = () => {
  const [user, setUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // ------------------------------------
  // BACK BUTTON HANDLER
  // ------------------------------------
  useEffect(() => {
    if (selectedUser) {
      window.history.pushState({ page: "chat" }, "");
    }
  }, [selectedUser]);

  useEffect(() => {
    const handleBackButton = () => {
      if (selectedUser) {
        setSelectedUser(null);
        return;
      }
    };

    window.onpopstate = handleBackButton;
    return () => (window.onpopstate = null);
  }, [selectedUser]);

  // ------------------------------------
  // REALTIME USER PRESENCE (ONLY ONE EFFECT)
  // ------------------------------------
  useEffect(() => {
    if (!user) return;

    const userRef = ref(realtimeDB, `/status/${user.uid}`);

    // Mark online immediately
    set(userRef, {
      online: true,
      lastSeen: Date.now(),
    });

    // Update last seen every 20 seconds
    const interval = setInterval(() => {
      set(userRef, {
        online: true,
        lastSeen: Date.now(),
      });
    }, 20000);

    // When user disconnects (browser close/tab close)
    onDisconnect(userRef).set({
      online: false,
      lastSeen: Date.now(),
    });

    return () => clearInterval(interval);
  }, [user]);

  // ------------------------------------
  // RENDER UI
  // ------------------------------------
  if (!user) return <Login setUser={setUser} />;

  if (!selectedUser)
    return <UsersList user={user} setSelectedUser={setSelectedUser} />;

  return (
    <ChatRoom
      user={user}
      otherUser={selectedUser}
      setSelectedUser={setSelectedUser}
    />
  );
};

export default App;
