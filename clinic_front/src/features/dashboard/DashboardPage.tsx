import { Card, Col, Row, Typography } from "antd";
import StatsPage from "../direction/StatsPage";

export default function DashboardPage() {
  return (
    <div style={{ padding: 24, display: "grid", gap: 24 }}>
      <Typography.Title level={2}>Tableau de bord</Typography.Title>

      {/* Indicateurs rapides (exemple statiques, tu pourras les remplacer par un vrai API plus tard) */}
      <Row gutter={16}>
        <Col span={8}>
          <Card title="Rendez-vous ce mois">📅 120</Card>
        </Col>
        <Col span={8}>
          <Card title="Nouvelles références">📝 35</Card>
        </Col>
        <Col span={8}>
          <Card title="Utilisateurs actifs">👥 15</Card>
        </Col>
      </Row>

      {/* Graphiques (StatsPage déjà existant) */}
      <StatsPage />
    </div>
  );
}
