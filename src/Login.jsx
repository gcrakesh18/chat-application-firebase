import React from "react";
import { Card, Button, Typography } from "antd";
import { GoogleOutlined } from "@ant-design/icons";
import { loginWithGoogle, saveUserToDB } from "./firebase";
import "./Login.css";

const { Title, Text } = Typography;

const Login = ({ setUser }) => {

  const login = async () => {
    try {
      const res = await loginWithGoogle();
      await saveUserToDB(res.user);
      setUser(res.user);
    } catch (err) {
      console.log("LOGIN ERROR:", err);
    }
  };

  return (
    <div className="login-container">

      <Card className="login-card">
        <Title level={2} style={{ color: "white", marginBottom: 10 }}>
          QuickChat
        </Title>

        <Text style={{ color: "rgba(255,255,255,0.85)" }}>
          Connect • Chat • Vibe
        </Text>

        <Button
          type="primary"
          icon={<GoogleOutlined />}
          onClick={login}
          className="google-btn"
        >
          Continue with Google
        </Button>
      </Card>

    </div>
  );
};

export default Login;
