"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_MMCP_API_URL || "http://46.225.129.246:8000";
const API_KEY = process.env.NEXT_PUBLIC_MMCP_API_KEY || "";

async function fetchAPI(path: string) {
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    headers: { "X-MMCP-API-Key": API_KEY, Accept: "application/json" },
  });
  if (!res.ok) return null;
  return res.json();
}

function RiskGaugeLarge({ score }: { score: number }) {
  const dashLen = (score / 100) * 267;
  const color = score >= 75 ? "#f85149" : score >= 50 ? "#db6d28" : score >= 25 ? "#d29922" : "#3fb950";
  return (
    <svg viewBox="0 0 200 120" className="w-48 h-28">
      <path d="M15 100 A85 85 0 0 1 185 100" fill="none" stroke="#333" strokeWidth="12" strokeLinecap="round" />
      <path d="M15 100 A85 85 0 0 1 185 100" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${dashLen} 267`} />
      <text x="100" y="85" textAnchor="middle" fill="#f0f6fc" fontSize="36" fontWeight="bold">{score.toFixed(1)}</text>
      <text x="100" y="108" textAnchor="middle" fill="#8b949e" fontSize="10" letterSpacing="0.1em">RISK SCORE</text>
    </svg>
  );
}

export default function RegionDetailPage() {
  const params = useParams();
  const regionId = params.regionId as string;
  const [region, setRegion] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [ml, setMl] = useState<any>(null);
  const [regime, setRegime] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [r, f, m, rg] = await Promise.all([
        fetchAPI(`/regions/${regionId}`),
        fetchAPI(`/regions/${regionId}/price-forecast`),
        fetchAPI(`/regions/${regionId}/ml`),
        fetchAPI(`/regions/${regionId}/regime-analysis`),
      ]);
      setRegion(r);
      setForecast(f);
      setMl(m);
      setRegime(rg);
      setLoading(false);
    }
    load();
  }, [regionId]);

  if (loading) return <div className="text-center py-24 text-muted-foreground">Loading...</div>;
  if (!region) return <div className="text-center py-24 text-muted-foreground">Region not found.</div>;

  const po = region.primary_outputs || {};
  const so = region.secondary_outputs || {};

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> All Regions
      </Link>

      <h1 className="text-3xl font-bold capitalize mb-6">{regionId.replace(/_/g, " ")}</h1>

      {/* Top row: gauge + meta */}
      <div className="flex flex-wrap gap-6 mb-8">
        <RiskGaugeLarge score={po.risk_score || 0} />
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <span className="text-muted-foreground">Stage</span>
          <Badge variant={po.operational_stage?.includes("5") || po.operational_stage?.includes("4") ? "destructive" : "secondary"}>
            {po.operational_stage}
          </Badge>
          <span className="text-muted-foreground">Confidence</span><span>{po.confidence || "—"}</span>
          <span className="text-muted-foreground">Coverage</span><span>{po.coverage || "—"}</span>
          <span className="text-muted-foreground">LTI</span><span>{po.latent_tension_index ?? "—"}</span>
          <span className="text-muted-foreground">Trend</span><span className="capitalize">{(so.trend || "—").replace(/_/g, " ")}</span>
          <span className="text-muted-foreground">Conflict Type</span><span className="capitalize">{(so.conflict_type?.primary || "—").replace(/_/g, " ")}</span>
          {region.analyst_state?.frozen && (
            <><span className="text-muted-foreground">Status</span><span className="text-red-500 font-bold">FROZEN</span></>
          )}
        </div>
      </div>

      {/* Layer breakdown */}
      {region.layer_breakdown && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">Layer Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(region.layer_breakdown).map(([name, layer]: [string, any]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="w-16 text-xs font-semibold uppercase">{name}</span>
                <div className="flex-1 h-2.5 bg-muted rounded-full">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(layer.score * 100).toFixed(1)}%` }} />
                </div>
                <span className="text-xs font-mono w-12 text-right">{(layer.score * 100).toFixed(1)}%</span>
                <span className="text-xs text-muted-foreground w-20">{layer.signals_count} signals</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Top signals */}
      {region.top_signals && region.top_signals.length > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">Top Signals</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase border-b border-border">
                    <th className="text-left py-2 px-2">Source</th>
                    <th className="text-left py-2 px-2">Type</th>
                    <th className="text-left py-2 px-2">Severity</th>
                    <th className="text-left py-2 px-2">Score</th>
                    <th className="text-left py-2 px-2">Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {region.top_signals.map((s: any, i: number) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2 px-2">{s.source || "—"}</td>
                      <td className="py-2 px-2">{s.signal_type || s.type || "—"}</td>
                      <td className="py-2 px-2">{s.severity || "—"}</td>
                      <td className="py-2 px-2 font-bold">{s.score || s.final_score || "—"}</td>
                      <td className="py-2 px-2 text-muted-foreground max-w-xs truncate">{s.summary || s.description || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price Forecast, ML, Regime in a grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forecast && (
          <Card>
            <CardHeader><CardTitle className="text-base">Price Forecast</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {Object.entries(forecast).filter(([k]) => !["region_id", "_meta"].includes(k)).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</span>
                  <span className="text-right">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {ml && (
          <Card>
            <CardHeader><CardTitle className="text-base">ML Escalation</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {Object.entries(ml).filter(([k]) => !["region_id", "_meta"].includes(k)).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</span>
                  <span className="text-right">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {regime && (
          <Card>
            <CardHeader><CardTitle className="text-base">Regime Analysis</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {Object.entries(regime).filter(([k]) => !["region_id", "_meta"].includes(k)).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</span>
                  <span className="text-right">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
