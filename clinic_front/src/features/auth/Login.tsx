// src/features/auth/Login.tsx
import { useState } from "react";
import { Card, Form, Input, Select, Button, Typography } from "antd";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

type Role = "DIRECTION" | "SECRETAIRE" | "MEDECIN";

export default function Login() {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const nav = useNavigate();

  const [role, setRole] = useState<Role>("SECRETAIRE");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onFinish = async (vals: any) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // IMPORTANT : ne jamais trimmer le mot de passe
      const payload: any = { username: (vals.username ?? "").trim(), role };
      if (role === "MEDECIN") {
        payload.code_personnel = vals.code_personnel;
      } else {
        payload.password = vals.password;
      }

      await login(payload);

      if (role === "MEDECIN") nav("/referrals/new");
      else if (role === "DIRECTION") nav("/dashboard");
      else nav("/appointments");
    } catch (e: any) {
      console.error("❌ Erreur d’authentification :", e?.response?.data || e?.message);
      setErrorMsg(t("auth_error_message"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8f9fa",
        display: "grid",
        placeItems: "center",
        padding: "16px",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 420,            // ✅ responsive
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        {/* Logo + titre */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          
          <Typography.Title level={4} style={{ margin: 0 }}>
            Clinique Riviera
          </Typography.Title>
          <Typography.Text type="secondary">{t("system_title")}</Typography.Text>
          <br />
          <Typography.Text type="secondary">Casablanca, Maroc</Typography.Text>
        </div>

        {/* Welcome */}
        <Typography.Title level={5} style={{ textAlign: "center", marginBottom: 12 }}>
          {t("welcome")}
        </Typography.Title>
        <Typography.Paragraph style={{ textAlign: "center", color: "#666", marginBottom: 24 }}>
          {t("welcome_subtitle")}
        </Typography.Paragraph>

        {/* Erreur */}
        {errorMsg && (
          <div
            style={{
              marginBottom: 20,
              padding: "14px 18px",
              borderRadius: 10,
              backgroundColor: "#fff2f0",
              border: "1px solid #ff4d4f",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ color: "#ff4d4f", fontSize: 20, fontWeight: "bold" }}>⚠️</span>
            <span style={{ color: "#d93025", fontWeight: 600, fontSize: 15 }}>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <Form layout="vertical" onFinish={onFinish} autoComplete="on">
          <Form.Item name="role" label={t("role")} initialValue="SECRETAIRE">
            <Select
              options={[
                { value: "DIRECTION", label: t("roles.direction") },
                { value: "SECRETAIRE", label: t("roles.secretaire") },
                { value: "MEDECIN", label: t("roles.medecin") },
              ]}
              onChange={(v) => setRole(v as Role)}
            />
          </Form.Item>

          <Form.Item
            name="username"
            label={t("username")}
            rules={[{ required: true, message: t("required") }]}
          >
            <Input
              placeholder="votre.email@example.com"
              // Mobile-safe
              type="email"
              inputMode="email"
              autoComplete="username email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              style={{ fontSize: 16 }} // ✅ évite le zoom iOS
            />
          </Form.Item>

          {role !== "MEDECIN" && (
            <Form.Item
              name="password"
              label={t("password")}
              rules={[{ required: true, message: t("required") }]}
            >
              <Input.Password
                placeholder="••••••••"
                // Mobile-safe
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                style={{ fontSize: 16 }} // ✅ évite le zoom iOS
                visibilityToggle
              />
            </Form.Item>
          )}

          {role === "MEDECIN" && (
            <Form.Item
              name="code_personnel"
              label={t("code")}
              rules={[{ required: true, message: t("required") }]}
            >
              <Input
                placeholder="Code personnel"
                // si c'est un code numérique: inputMode="numeric" pattern pour claviers mobiles
                inputMode="text"
                autoComplete="one-time-code"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                style={{ fontSize: 16 }} // ✅ évite le zoom iOS
              />
            </Form.Item>
          )}

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            style={{ marginTop: 8 }}
          >
            {t("login_btn")}
          </Button>
        </Form>

        {/* Bloc SSL sécurisé */}
        <div
          style={{
            marginTop: 20,
            textAlign: "center",
            border: "1px solid #eaeaea",
            padding: 12,
            borderRadius: 8,
          }}
        >
          <Typography.Text strong style={{ display: "block" }}>
            {t("secure_connection")}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ display: "block", fontSize: 13 }}>
            {t("encryption")}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ display: "block", fontSize: 13 }}>
            {t("hipaa")}
          </Typography.Text>
        </div>

        {/* Langue */}
        <div style={{ textAlign: "center", marginTop: 12 }}>
          🌐 {t("language")}{" "}
          <Button type="link" size="small" onClick={() => i18n.changeLanguage("fr")}>
            FR
          </Button>
          |
          <Button type="link" size="small" onClick={() => i18n.changeLanguage("en")}>
            EN
          </Button>
        </div>
      </Card>
    </div>
  );
}
