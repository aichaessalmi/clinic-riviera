import { useState } from "react";
import { Card, Form, Input, Button, Steps, Select, DatePicker, Row, Col, message } from "antd";
import { UserOutlined, MedicineBoxOutlined, SafetyOutlined } from "@ant-design/icons";
import http from "../../api/http";



const { Step } = Steps;
const { Option } = Select;

export default function NewReferral() {
  const [form] = Form.useForm();
  const [current, setCurrent] = useState(0);

  const onFinish = async (vals: any) => {
    try {
      await http.post("/referrals/", vals);
      message.success("✅ Référence créée avec succès");
      form.resetFields();
      setCurrent(0);
    } catch {
      message.error("❌ Une erreur est survenue");
    }
  };

  const next = () => setCurrent(current + 1);
  const prev = () => setCurrent(current - 1);

  return (
    <div style={{ padding: "24px" }}>
      <Card
        title="Nouvelle Référence Patient"
        extra={<span>Remplissez le formulaire pour référer un patient à la Clinique Riviera</span>}
      >
        {/* Progression */}
        <Steps current={current} style={{ marginBottom: "32px" }}>
          <Step title="Informations Patient" icon={<UserOutlined />} />
          <Step title="Détails Médicaux" icon={<MedicineBoxOutlined />} />
          <Step title="Assurance" icon={<SafetyOutlined />} />
        </Steps>

        <Form layout="vertical" form={form} onFinish={onFinish}>
          {/* Étape 1 : Patient */}
          {current === 0 && (
            <>
              <h3>Informations du Patient</h3>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="first_name" label="Prénom" rules={[{ required: true }]}>
                    <Input placeholder="Entrez le prénom" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="last_name" label="Nom de famille" rules={[{ required: true }]}>
                    <Input placeholder="Entrez le nom de famille" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="birth_date" label="Date de naissance" rules={[{ required: true }]}>
                    <DatePicker style={{ width: "100%" }} placeholder="jj/mm/aaaa" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="gender" label="Genre" rules={[{ required: true }]}>
                    <Select placeholder="Sélectionnez le genre">
                      <Option value="male">Homme</Option>
                      <Option value="female">Femme</Option>
                      <Option value="other">Autre</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="phone" label="Numéro de téléphone" rules={[{ required: true }]}>
                    <Input placeholder="+212 6XX XXX XXX" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="email" label="Email">
                    <Input placeholder="patient@example.com" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="address" label="Adresse">
                <Input placeholder="Adresse complète" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="city" label="Ville">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="postal_code" label="Code postal">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {/* Étape 2 : Médical */}
          {current === 1 && (
            <>
              <h3>Détails Médicaux</h3>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="intervention_type" label="Type d'intervention" rules={[{ required: true }]}>
                    <Select placeholder="Sélectionnez la spécialité">
                      <Option value="cardio">Cardiologie</Option>
                      <Option value="neuro">Neurologie</Option>
                      <Option value="ortho">Orthopédie</Option>
                      <Option value="derma">Dermatologie</Option>
                      <Option value="ophtal">Ophtalmologie</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="urgency_level" label="Niveau d'urgence" rules={[{ required: true }]}>
                    <Select placeholder="Sélectionnez l'urgence">
                      <Option value="low">Faible</Option>
                      <Option value="medium">Moyen</Option>
                      <Option value="high">Élevé</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="consultation_reason" label="Motif de consultation" rules={[{ required: true }]}>
                <Input.TextArea rows={3} placeholder="Décrivez le motif et les symptômes observés..." />
              </Form.Item>
              <Form.Item name="medical_history" label="Antécédents médicaux">
                <Input.TextArea rows={3} placeholder="Allergies, traitements, antécédents…" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="referring_doctor" label="Médecin référent">
                    <Input placeholder="Dr. Nom du médecin référent" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="establishment" label="Établissement">
                    <Input placeholder="Nom de l'établissement" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {/* Étape 3 : Assurance */}
          {current === 2 && (
            <>
              <h3>Informations d'Assurance</h3>
              <Form.Item name="insurance_provider" label="Fournisseur d'assurance" rules={[{ required: true }]}>
                <Select placeholder="Sélectionnez le fournisseur">
                  <Option value="cnss">CNSS</Option>
                  <Option value="cnops">CNOPS</Option>
                  <Option value="axa">AXA</Option>
                  <Option value="saham">Saham</Option>
                </Select>
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="insurance_policy_number" label="Numéro de police" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="coverage_type" label="Type de couverture">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="expiration_date" label="Date d'expiration">
                    <DatePicker style={{ width: "100%" }} placeholder="jj/mm/aaaa" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="holder_name" label="Nom du titulaire">
                    <Input placeholder="Si différent du patient" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="insurance_notes" label="Notes sur l'assurance">
                <Input.TextArea rows={2} placeholder="Informations supplémentaires sur la couverture, restrictions, etc." />
              </Form.Item>
            </>
          )}

          {/* Boutons navigation */}
          <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
            {current > 0 && (
              <Button onClick={prev} style={{ marginRight: 8 }}>
                Retour
              </Button>
            )}
            {current < 2 && (
              <Button type="primary" onClick={next}>
                Suivant
              </Button>
            )}
            {current === 2 && (
              <>
                <Button style={{ marginRight: 8 }}>Annuler</Button>
                <Button style={{ marginRight: 8 }}>Sauvegarder brouillon</Button>
                <Button type="primary" htmlType="submit">
                  Soumettre référence
                </Button>
              </>
            )}
          </div>
        </Form>
      </Card>
    </div>
  );
}
