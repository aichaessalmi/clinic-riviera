import { useEffect, useState } from "react";
import { Table, Tag } from "antd";
import http from "../../api/http";

type Ref = { id:number; patient_name:string; intervention:string; insurance:string; status:string; room_number?:string; created_at:string; };

export default function MyReferrals() {
  const [rows, setRows] = useState<Ref[]>([]);
  const load = async () => {
    const { data } = await http.get("/referrals/");
    setRows(data.results || data);
  };
  useEffect(() => { load(); }, []);
  return (
    <Table
      rowKey="id"
      dataSource={rows}
      columns={[
        { title:"Patient", dataIndex:"patient_name" },
        { title:"Intervention", dataIndex:"intervention" },
        { title:"Assurance", dataIndex:"insurance" },
        { title:"Statut", dataIndex:"status", render:(s, r)=> <Tag color={s==="arrived"?"green":"blue"}>{s}{r.room_number?` (ch. ${r.room_number})`: ""}</Tag> },
        { title:"Créé le", dataIndex:"created_at" },
      ]}
    />
  );
}
