import React, { useEffect, useState } from "react";
import { db, realtimeDB } from "./firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { ref, onValue, off } from "firebase/database";
import { List, Avatar, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import "./UsersList.css";

const { Title } = Typography;

// Format last seen
const formatLastSeen = (timestamp) => {
  if (!timestamp) return "Last seen recently";

  const date = new Date(timestamp);

  const time = date.toLocaleString("en-IN", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  const today = new Date().toDateString();
  const day = date.toDateString();

  if (today === day) {
    return `Last seen at ${time}`;
  }

  return `Last seen on ${date.toLocaleDateString("en-IN")} at ${time}`;
};

const UsersList = ({ user, setSelectedUser }) => {
  const [users, setUsers] = useState([]);
  const [statusMap, setStatusMap] = useState({});

  useEffect(() => {
    if (!user) return;

    const statusRefs = []; // store refs for cleanup

    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const list = snapshot.docs.map((doc) => doc.data());
      const filteredUsers = list.filter((u) => u.uid !== user.uid);
      setUsers(filteredUsers);

      filteredUsers.forEach((u) => {
        const statusRef = ref(realtimeDB, `/status/${u.uid}`);
        statusRefs.push(statusRef);

        onValue(statusRef, (snap) => {
          setStatusMap((prev) => ({
            ...prev,
            [u.uid]: snap.val() || { online: false },
          }));
        });
      });
    });

    // Cleanup to prevent memory leaks
    return () => {
      unsub();
      statusRefs.forEach((statusRef) => off(statusRef));
    };
  }, [user]);

  return (
    <div className="users-container">
      <div className="users-header">
        <Title level={3} style={{ color: "white", margin: 0 }}>
          ChatSphere
        </Title>
      </div>

      <List
        itemLayout="horizontal"
        dataSource={users}
        className="users-list"
        locale={{ emptyText: "No users available" }}
        renderItem={(item) => {
          const status = statusMap[item.uid];

          return (
            <List.Item
              className="user-card"
              onClick={() => item && setSelectedUser(item)}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    src={item.photo}
                    icon={<UserOutlined />}
                    className="user-avatar"
                  />
                }
                title={<span className="user-name">{item.name}</span>}
                description={
                  status?.online ? (
                    <span className="user-online">Online</span>
                  ) : (
                    <span className="user-lastseen">
                      {formatLastSeen(status?.lastSeen)}
                    </span>
                  )
                }
              />

              <div
                className={
                  status?.online
                    ? "online-dot online"
                    : "online-dot offline"
                }
              ></div>
            </List.Item>
          );
        }}
      />
    </div>
  );
};

export default UsersList;