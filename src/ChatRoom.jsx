import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { db, realtimeDB } from "./firebase";

import { onValue, ref, set } from "firebase/database";

import { ArrowLeftOutlined, CheckOutlined, SendOutlined } from "@ant-design/icons";
import { Avatar, Button, Input, Layout, List, Typography } from "antd";

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

const formatLastSeen = (timestamp) => {
  if (!timestamp) return "Last seen recently";

  const date = new Date(timestamp);

  const hours = date.toLocaleString("en-IN", { hour: "numeric", minute: "numeric", hour12: true });
  const y = date.toLocaleDateString("en-IN");

  const today = new Date().toDateString();
  const day = date.toDateString();

  if (day === today) {
    return `Last seen at ${hours}`;
  }

  return `Last seen on ${y} at ${hours}`;
};


const ChatRoom = ({ user, otherUser, setSelectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);

  const [otherStatus, setOtherStatus] = useState("offline");
  const [lastSeen, setLastSeen] = useState(null);

  const messagesEndRef = useRef(null);

  const chatId =
    user.uid < otherUser.uid
      ? user.uid + otherUser.uid
      : otherUser.uid + user.uid;

  // ------------------ LOAD MESSAGES -----------------------
  useEffect(() => {
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);

      // Mark all messages from otherUser as seen
      msgs.forEach((msg) => {
        if (msg.sender !== user.uid && msg.seen !== true) {
          updateDoc(
            doc(db, "chats", chatId, "messages", msg.id),
            { seen: true }
          );
        }
      });
    });

    return () => unsubscribe();
  }, [chatId]);

  // ------------------ ONLINE STATUS -----------------------
  useEffect(() => {
    const statusRef = ref(realtimeDB, `/status/${otherUser.uid}`);

    onValue(statusRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      setOtherStatus(data.online ? "online" : "offline");
      setLastSeen(data.lastSeen);
    });
  }, [otherUser]);

  // ------------------ TYPING STATUS -----------------------
  useEffect(() => {
    const typingRef = ref(
      realtimeDB,
      `/typing/${chatId}/${otherUser.uid}`
    );

    onValue(typingRef, (snapshot) => {
      setOtherTyping(snapshot.val());
    });
  }, [chatId, otherUser]);

  const handleTyping = (value) => {
    setText(value);

    set(ref(realtimeDB, `/typing/${chatId}/${user.uid}`), true);

    if (isTyping) return;
    setIsTyping(true);

    setTimeout(() => {
      set(ref(realtimeDB, `/typing/${chatId}/${user.uid}`), false);
      setIsTyping(false);
    }, 1200);
  };

  // ------------------ SEND MESSAGE -------------------------
  const sendMessage = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      sender: user.uid,
      createdAt: serverTimestamp(),
      seen: false
    });

    setText("");

    set(ref(realtimeDB, `/typing/${chatId}/${user.uid}`), false);
  };

  // AUTO SCROLL
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Layout style={{ height: "100vh", background: "#f0f2f5" }}>

      {/* HEADER */}
      <Header
        style={{
          background: "#1677ff",
          display: "flex",
          alignItems: "center",
          gap: 12,
          color: "white",
          paddingLeft: 10,
        }}
      >
        <Button
          type="text"
          style={{ color: "white", marginRight: 10 }}
          onClick={() => setSelectedUser(null)}
        >
          <ArrowLeftOutlined style={{ fontSize: 20 }} />
        </Button>

        <Avatar src={otherUser.photo} />
       <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
  <Text style={{ color: "#fff", fontSize: 17, margin: 0 }}>
    {otherUser.name}
  </Text>

  <div style={{ fontSize: 12.5, marginTop: 2, color: "#dcdcdc" }}>
    {otherTyping ? (
      <span style={{ color: "#a5ffb5" }}>typing...</span>
    ) : otherStatus === "online" ? (
      <span style={{ color: "#a5ffb5" }}>Online</span>
    ) : (
      <span>{formatLastSeen(lastSeen)}</span>
    )}
  </div>
</div>

      </Header>

      {/* CHAT MESSAGES */}
      <Content
        style={{
          padding: 20,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <List
          dataSource={messages}
          renderItem={(msg) => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent:
                  msg.sender === user.uid ? "flex-end" : "flex-start",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  maxWidth: "70%",
                  padding: "10px 15px",
                  borderRadius: 15,
                  background:
                    msg.sender === user.uid ? "#1677ff" : "#ffffff",
                  color: msg.sender === user.uid ? "white" : "black",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
                  position: "relative",
                }}
              >
                {msg.text}

                {/* Seen Tick */}
                {msg.sender === user.uid && (
                  <span
                    style={{
                      fontSize: 12,
                      position: "absolute",
                      bottom: -15,
                      right: 0,
                      color: msg.seen ? "#4CAF50" : "#aaa",
                    }}
                  >
                    <CheckOutlined /> {/* single/double tick */}
                    {msg.seen && <CheckOutlined />} {/* double tick */}
                  </span>
                )}
              </div>
            </div>
          )}
        />

        <div ref={messagesEndRef} />
      </Content>

      {/* INPUT AREA */}
      <Footer
        style={{
          background: "#fff",
          padding: 10,
          display: "flex",
          gap: 10,
        }}
      >
        <Input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder="Type a message..."
          style={{
            borderRadius: 20,
            padding: "8px 16px",
          }}
        />

        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={sendMessage}
          style={{
            borderRadius: "50%",
            width: 45,
            height: 45,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        />
      </Footer>

    </Layout>
  );
};

export default ChatRoom;
