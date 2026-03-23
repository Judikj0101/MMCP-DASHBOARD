"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, DollarSign, TrendingUp, TrendingDown } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_MMCP_API_URL || "http://46.225.129.246:8000";
const API_KEY = process.env.NEXT_PUBLIC_MMCP_API_KEY || "";

interface MarketItem {
  region_id: string;
  risk_score: number;
  stage: string;
  forecast: any;
  commodity: any;
}

async function fetchAPI(path: string) {
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    headers: { "X-MMCP-API-Key": API_KEY, Accept: "application/json" },
  });
  if (!res.ok) return null;
  return res.json();
}

function SignalBadge({ signal }: { signal?: string }) {
  if (!signal) return null;
  const s = signal.toLowerCase();
  const variant = s === "buy" ? "default" : s === "sell" ? "destructive" : "secondary";
  return <Badge variant={variant}>{signal.toUpperCase()}</Badge>;
}

export default function MarketsPage() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const snap = await fetchAPI("/snapshot?detail=full");
        if (!snap?.regions) return;

        // Sort by risk score (most "interesting" = highest risk + highest commodity impact)
        const sorted = [...snap.regions].sort(
          (a: any, b: any) => (b.primary_outputs?.risk_score || 0) - (a.primary_outputs?.risk_score || 0)
        );

        // Fetch price-forecast and commodity for each region in parallel
        const results = await Promise.all(
          sorted.map(async (r: any) => {
            const [forecast, commodity] = await Promise.all([
              fetchAPI(`/regions/${r.region_id}/price-forecast`),
              fetchAPI(`/regions/${r.region_id}/commodity`),
            ]);
            return {
              region_id: r.region_id,
              risk_score: r.primary_outputs?.risk_score || 0,
              stage: r.primary_outputs?.operational_stage || "STG_0",
              forecast,
              commodity,
            };
          })
        );
        setItems(results);
      } catch (err) {
        console.warn("Failed to load market data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 120000); // 2 min
    return () => clearInterval(interval);
  }, []);

  const displayed = showAll ? items : items.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Market Signals</h1>
          <p className="text-muted-foreground text-sm">Price forecasts & commodity risk from conflict analysis</p>
        </div>
      </div>

      {/* Risk strip */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {items.map((m) => {
          const color =
            m.risk_score >= 75 ? "border-red-500" : m.risk_score >= 50 ? "border-orange-400" : m.risk_score >= 25 ? "border-yellow-400" : "border-green-400";
          return (
            <div key={m.region_id} className={`flex flex-col items-center px-3 py-2 rounded-lg border bg-card min-w-[80px] ${color}`}>
              <span className="text-[10px] text-muted-foreground text-center capitalize">{m.region_id.replace(/_/g, " ").substring(0, 20)}</span>
              <span className="text-lg font-bold">{m.risk_score.toFixed(1)}</span>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading market data...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No market data available.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map((m) => (
              <Card key={m.region_id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium capitalize">{m.region_id.replace(/_/g, " ")}</CardTitle>
                    <Badge variant="outline">{m.stage}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Forecast data */}
                  {m.forecast ? (
                    <div className="space-y-2">
                      {m.forecast.commodities ? (
                        m.forecast.commodities.map((c: any, i: number) => (
                          <div key={i} className="flex items-center justify-between border-b border-border/50 pb-1.5">
                            <span className="text-sm">{c.name || c.commodity || "—"}</span>
                            <div className="flex items-center gap-2">
                              <SignalBadge signal={c.signal} />
                              {c.price_target && <span className="text-sm font-mono">${c.price_target.toFixed(2)}</span>}
                              {c.change_pct != null && (
                                <span className={`text-xs font-mono ${c.change_pct > 0 ? "text-green-400" : c.change_pct < 0 ? "text-red-400" : ""}`}>
                                  {c.change_pct > 0 ? "+" : ""}
                                  {c.change_pct.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : m.forecast.signal ? (
                        <div className="flex items-center gap-2">
                          <SignalBadge signal={m.forecast.signal} />
                          {m.forecast.price_target && <span className="font-mono">${m.forecast.price_target.toFixed(2)}</span>}
                        </div>
                      ) : (
                        Object.entries(m.forecast)
                          .filter(([k]) => !["region_id", "_meta"].includes(k))
                          .map(([k, v]) => (
                            <div key={k} className="flex justify-between text-sm">
                              <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</span>
                              <span>{String(v)}</span>
                            </div>
                          ))
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No forecast data</p>
                  )}

                  {/* Commodity risk */}
                  {m.commodity && (
                    <div className="pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground">Commodity Risk</span>
                      {m.commodity.risk_score != null ? (
                        <div className="mt-1">
                          <div className="h-1.5 bg-muted rounded-full">
                            <div
                              className={`h-full rounded-full ${
                                m.commodity.risk_score >= 75
                                  ? "bg-red-500"
                                  : m.commodity.risk_score >= 50
                                  ? "bg-orange-400"
                                  : m.commodity.risk_score >= 25
                                  ? "bg-yellow-400"
                                  : "bg-green-400"
                              }`}
                              style={{ width: `${m.commodity.risk_score}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono mt-0.5">{m.commodity.risk_score.toFixed(1)}</span>
                        </div>
                      ) : (
                        Object.entries(m.commodity)
                          .filter(([k]) => !["region_id", "_meta"].includes(k))
                          .map(([k, v]) => (
                            <div key={k} className="flex justify-between text-xs mt-0.5">
                              <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</span>
                              <span>{String(v)}</span>
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {items.length > 5 && (
            <div className="flex justify-center mt-6">
              <Button variant="outline" onClick={() => setShowAll(!showAll)}>
                {showAll ? (
                  <><ChevronUp className="h-4 w-4 mr-2" /> Show less</>
                ) : (
                  <><ChevronDown className="h-4 w-4 mr-2" /> Show all ({items.length})</>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
