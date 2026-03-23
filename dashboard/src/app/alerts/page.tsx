"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_MMCP_API_URL || "http://46.225.129.246:8000";
const API_KEY = process.env.NEXT_PUBLIC_MMCP_API_KEY || "";

function severityBadge(score: number): { label: string; variant: "destructive" | "default" | "secondary" | "outline" } {
  if (score >= 75) return { label: "CRITICAL", variant: "destructive" };
  if (score >= 50) return { label: "WARNING", variant: "default" };
  if (score >= 25) return { label: "ELEVATED", variant: "secondary" };
  return { label: "LOW", variant: "outline" };
}

export default function AlertsPage() {
  const [regions, setRegions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/snapshot?detail=full`, {
          headers: { "X-MMCP-API-Key": API_KEY, Accept: "application/json" },
        });
        const data = await res.json();
        if (data?.regions) {
          setRegions(
            [...data.regions].sort((a: any, b: any) => (b.primary_outputs?.risk_score || 0) - (a.primary_outputs?.risk_score || 0))
          );
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <AlertTriangle className="h-6 w-6" /> Alerts
      </h1>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-3">
          {regions.map((r) => {
            const po = r.primary_outputs || {};
            const so = r.secondary_outputs || {};
            const sev = severityBadge(po.risk_score || 0);
            const borderColor =
              po.risk_score >= 75 ? "border-l-red-500" : po.risk_score >= 50 ? "border-l-orange-400" : po.risk_score >= 25 ? "border-l-yellow-400" : "border-l-green-400";

            return (
              <Card key={r.region_id} className={`border-l-4 ${borderColor}`}>
                <CardContent className="flex items-center justify-between py-4 flex-wrap gap-2">
                  <Link href={`/region/${r.region_id}`} className="font-medium capitalize hover:text-primary">
                    {r.region_id.replace(/_/g, " ")}
                  </Link>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="outline">{po.operational_stage}</Badge>
                    <span className="text-sm font-mono">Risk: {(po.risk_score || 0).toFixed(1)}</span>
                    {so.trend && <span className="text-xs text-muted-foreground capitalize">{so.trend.replace(/_/g, " ")}</span>}
                    <Badge variant={sev.variant}>{sev.label}</Badge>
                    {r.analyst_state?.frozen && <Badge variant="destructive">FROZEN</Badge>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
