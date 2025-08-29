import { useEffect, useState } from "react";
import http from "../../api/http";
import { Card } from "antd";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function StatsPage() {
  const [byDoctor, setByDoctor] = useState<any[]>([]);
  const [byInterv, setByInterv] = useState<any[]>([]);
  const load = async () => {
    const { data } = await http.get("/referrals/stats/");
    setByDoctor(data.by_doctor.map((d:any)=>({ name:d.doctor__username, count:d.count })));
    setByInterv(data.by_intervention.map((d:any)=>({ name:d.intervention, count:d.count })));
  };
  useEffect(()=>{ load(); }, []);

  return (
    <div style={{ display:"grid", gap:16 }}>
      <Card title="Références par médecin">
        <div style={{ width:"100%", height:300 }}>
          <ResponsiveContainer>
            <BarChart data={byDoctor}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="count" /></BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card title="Références par intervention">
        <div style={{ width:"100%", height:300 }}>
          <ResponsiveContainer>
            <BarChart data={byInterv}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="count" /></BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
