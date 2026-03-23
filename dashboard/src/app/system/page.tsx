"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_MMCP_API_URL || "http://46.225.129.246:8000";
const API_KEY = process.env.NEXT_PUBLIC_MMCP_API_KEY || "";

async function fetchAPI(path: string) {
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    headers: { "X-MMCP-API-Key": API_KEY, Accept: "application/json" },
  });
  if (!res.ok) return null;
  return res.json();
}

export default function SystemPage() {
  const [health, setHealth] = useState<any>(null);
  const [sources, setSources] = useState<any>(null);
  const [latestRun, setLatestRun] = useState<any>(null);
  const [version, setVersion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [h, s, r, v] = await Promise.all([
        fetchAPI("/health"),
        fetchAPI("/health/sources"),
        fetchAPI("/runs/latest"),
        fetchAPI("/meta/version"),
      ]);
      setHealth(h);
      setSources(s);
      setLatestRun(r);
      setVersion(v);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="text-center py-24 text-muted-foreground">Loading...</div>;

  const sourceList = sources?.sources || (sources && typeof sources === "object" ? Object.entries(sources).filter(([k]) => k !== "_meta") : []);

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">System Health</h1>
        {health && (
          <Badge variant={health.system_status === "HEALTHY" ? "default" : "destructive"}>
            {health.system_status || "UNKNOWN"}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Version */}
        {version && (
          <Card>
            <CardHeader><CardTitle className="text-base">Version</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {Object.entries(version).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</span>
                  <span>{String(v)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Latest Run */}
        {latestRun && (
          <Card>
            <CardHeader><CardTitle className="text-base">Latest Run</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {Object.entries(latestRun).filter(([k]) => k !== "_meta").map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</span>
                  <span className="text-right max-w-[200px] truncate">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Data Sources table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Data Sources</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase border-b border-border">
                  <th className="text-left py-2 px-2">Source</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Last Fetch</th>
                  <th className="text-left py-2 px-2">Failures</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(sourceList) ? (
                  sourceList.map((s: any, i: number) => {
                    // Handle both array of objects and Object.entries format
                    const name = s.name || s.source || (Array.isArray(s) ? s[0] : `source-${i}`);
                    const data = Array.isArray(s) ? s[1] : s;
                    const status = typeof data === "object" ? data.status : data;
                    const statusColor =
                      status === "ok" || status === "healthy" ? "text-green-400" : status === "degraded" ? "text-yellow-400" : "text-red-400";
                    return (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2 px-2">{name}</td>
                        <td className={`py-2 px-2 font-medium ${statusColor}`}>{status || "—"}</td>
                        <td className="py-2 px-2 text-muted-foreground">{typeof data === "object" ? data.last_fetch || data.last_success || "—" : "—"}</td>
                        <td className="py-2 px-2">{typeof data === "object" ? data.failure_count || data.failures || 0 : "—"}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No source data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
