import { Layout, Menu, Button, Space } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "react-i18next";

const { Header, Content } = Layout;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { role, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const nav = useNavigate();

  const items = [
    ...(role !== "MEDECIN" ? [
      { key: "appointments", label: <Link to="/appointments">{t("appointments")}</Link> },
      { key: "calendar", label: <Link to="/calendar">{t("calendar")}</Link> },
    ] : []),
    ...(role === "MEDECIN" ? [
      { key: "new_ref", label: <Link to="/referrals/new">{t("new_referral")}</Link> },
      { key: "my_refs", label: <Link to="/referrals/mine">{t("my_referrals")}</Link> },
    ] : []),
    ...(role === "DIRECTION" ? [
      { key: "stats", label: <Link to="/stats">{t("stats")}</Link> },
    ] : []),
  ];

  return (
    <Layout className="min-h-screen">
      <Header style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ color: "white", fontWeight: 700 }}>Clinique Admin</div>
        <Menu theme="dark" mode="horizontal" selectable={false} items={items} style={{ flex: 1 }} />
        <Space>
          <Button onClick={() => i18n.changeLanguage(i18n.language === "fr" ? "en" : "fr")}>
            {i18n.language.toUpperCase()}
          </Button>
          <Button onClick={() => { logout(); nav("/login"); }}>
            {t("logout")}
          </Button>
        </Space>
      </Header>
      <Content style={{ padding: 24 }}>{children}</Content>
    </Layout>
  );
}
