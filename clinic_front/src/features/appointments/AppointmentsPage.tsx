import { useEffect, useState } from "react";
import { Table, Tag, Space, Button, message } from "antd";
import http from "../../api/http";

type Patient = { id:number; first_name:string; last_name:string; phone:string; };
type Appointment = {
  id:number; patient:Patient; specialty:string; date:string; status:"pending"|"confirmed"|"to_call"|"canceled";
};

export default function AppointmentsPage() {
  const [rows, setRows] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/appointments/");
      setRows(data.results || data); // pagination ou non
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const changeStatus = async (id:number, status:string) => {
    try {
      await http.patch(`/appointments/${id}/`, { status });
      message.success("Statut mis à jour");
      load();
    } catch { message.error("Échec de mise à jour"); }
  };

  return (
    <Table
      loading={loading}
      rowKey="id"
      dataSource={rows}
      columns={[
        { title: "Patient", render: (_:any, r:Appointment) => `${r.patient.last_name} ${r.patient.first_name}` },
        { title: "Spécialité", dataIndex: "specialty" },
        { title: "Date", dataIndex: "date" },
        { title: "Statut", dataIndex: "status", render: (s) => <Tag color={
          s==="confirmed"?"green":s==="to_call"?"orange":s==="canceled"?"red":"blue"
        }>{s}</Tag> },
        { title: "Actions", render: (_:any, r:Appointment) => (
          <Space>
            <Button onClick={() => changeStatus(r.id, "confirmed")}>Confirmer</Button>
            <Button onClick={() => changeStatus(r.id, "to_call")}>À rappeler</Button>
            <Button danger onClick={() => changeStatus(r.id, "canceled")}>Annuler</Button>
          </Space>
        )},
      ]}
    />
  );
}
