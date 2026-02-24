import React, { useState, useEffect } from "react";
import Login from "./Login";
import UsersList from "./UsersList";
import ChatRoom from "./ChatRoom";
import { realtimeDB } from "./firebase";
import { ref, onDisconnect, set } from "firebase/database";

const App = () => {
  // Stores currently authenticated user
  const [user, setUser] = useState(null);

  // Stores selected user for active chat
  const [selectedUser, setSelectedUser] = useState(null);

  // ------------------------------------
  // BACK BUTTON HANDLER
  // Handles browser back button navigation
  // ------------------------------------
  useEffect(() => {
    if (selectedUser) {
      // Push new state when chat opens
      window.history.pushState({ page: "chat" }, "");
    }
  }, [selectedUser]);

  useEffect(() => {
    const handleBackButton = () => {
      if (selectedUser) {
        // If inside chat, go back to users list
        setSelectedUser(null);
        return;
      }
    };

    window.onpopstate = handleBackButton;

    // Cleanup event listener
    return () => (window.onpopstate = null);
  }, [selectedUser]);

  // ------------------------------------
  // REALTIME USER PRESENCE
  // Tracks online/offline status in Firebase Realtime DB
  // ------------------------------------
  useEffect(() => {
    if (!user) return;

    const userRef = ref(realtimeDB, `/status/${user.uid}`);

    // Mark user as online immediately after login
    set(userRef, {
      online: true,
      lastSeen: Date.now(),
    });

    // Keep updating lastSeen timestamp every 20 seconds
    const interval = setInterval(() => {
      set(userRef, {
        online: true,
        lastSeen: Date.now(),
      });
    }, 20000);

    // Automatically mark user offline when connection drops
    onDisconnect(userRef).set({
      online: false,
      lastSeen: Date.now(),
    });

    // Cleanup interval on logout or component unmount
    return () => clearInterval(interval);
  }, [user]);

  // ------------------------------------
  // CONDITIONAL RENDERING
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