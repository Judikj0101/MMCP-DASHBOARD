"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SparklesCore } from "@/components/ui/sparkles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_MMCP_API_URL || "http://46.225.129.246:8000";
const API_KEY = process.env.NEXT_PUBLIC_MMCP_API_KEY || "";

interface RegionData {
  region_id: string;
  primary_outputs: {
    risk_score: number;
    operational_stage: string;
    confidence: string;
    coverage: string;
    latent_tension_index?: number;
  };
  secondary_outputs?: {
    trend?: string;
    conflict_type?: { primary: string };
  };
  analyst_state?: {
    frozen: boolean;
  };
}

function riskBorder(score: number) {
  if (score >= 75) return "border-red-500/30";
  if (score >= 50) return "border-orange-400/30";
  if (score >= 25) return "border-yellow-400/30";
  return "border-green-400/30";
}

function stageBadgeColor(stage: string): "destructive" | "default" | "secondary" {
  if (stage.includes("5") || stage.includes("4")) return "destructive";
  if (stage.includes("3")) return "default";
  return "secondary";
}

function TrendIcon({ trend }: { trend?: string }) {
  if (!trend) return <Minus className="h-4 w-4 text-muted-foreground" />;
  if (trend.includes("up")) return <TrendingUp className="h-4 w-4 text-red-400" />;
  if (trend.includes("down")) return <TrendingDown className="h-4 w-4 text-green-400" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function RiskGauge({ score }: { score: number }) {
  const dashLen = (score / 100) * 157;
  const color = score >= 75 ? "#f85149" : score >= 50 ? "#db6d28" : score >= 25 ? "#d29922" : "#3fb950";
  return (
    <svg viewBox="0 0 120 70" className="w-28 h-16">
      <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="#333" strokeWidth="8" strokeLinecap="round" />
      <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${dashLen} 157`} />
      <text x="60" y="52" textAnchor="middle" fill="#f0f6fc" fontSize="20" fontWeight="bold">{score.toFixed(1)}</text>
      <text x="60" y="66" textAnchor="middle" fill="#8b949e" fontSize="8" letterSpacing="0.1em">RISK</text>
    </svg>
  );
}

export default function OverviewPage() {
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [health, setHealth] = useState<{ system_status?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const headers: Record<string, string> = { "X-MMCP-API-Key": API_KEY, Accept: "application/json" };
        const [snap, h] = await Promise.all([
          fetch(`${API_BASE}/api/v1/snapshot?detail=full`, { headers }).then((r) => r.json()),
          fetch(`${API_BASE}/api/v1/health`, { headers }).then((r) => r.json()).catch(() => null),
        ]);
        if (snap?.regions) {
          const sorted = [...snap.regions].sort(
            (a: RegionData, b: RegionData) => (b.primary_outputs?.risk_score || 0) - (a.primary_outputs?.risk_score || 0)
          );
          setRegions(sorted);
        }
        setHealth(h);
      } catch (err) {
        console.warn("Failed to load snapshot:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 300000);
    return () => clearInterval(interval);
  }, []);

  const displayed = showAll ? regions : regions.slice(0, 5);

  return (
    <div className="flex flex-col">
      {/* Hero Section with Sparkles */}
      <div className="h-[20rem] w-full bg-black flex flex-col items-center justify-center overflow-hidden relative">
        <div className="w-full absolute inset-0 h-full">
          <SparklesCore
            id="tsparticlesfullpage"
            background="transparent"
            minSize={0.6}
            maxSize={1.4}
            particleDensity={100}
            className="w-full h-full"
            particleColor="#FFFFFF"
            speed={1}
          />
        </div>
        <h1 className="md:text-7xl text-3xl lg:text-8xl font-bold text-center text-white relative z-20">
          MMCP
        </h1>
        <p className="text-lg md:text-xl text-neutral-300 relative z-20 mt-2">
          Conflict Monitor Dashboard
        </p>
        {health && (
          <Badge
            variant={health.system_status === "HEALTHY" ? "default" : "destructive"}
            className="relative z-20 mt-3"
          >
            {health.system_status || "UNKNOWN"}
          </Badge>
        )}
      </div>

      {/* Region Grid — Top 5 by default */}
      <div className="max-w-7xl mx-auto w-full p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            Top Risk Regions
            {!showAll && regions.length > 5 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (showing 5 of {regions.length})
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading regions...</div>
        ) : regions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Unable to load region data. Check API connection.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {displayed.map((r) => (
                <Link key={r.region_id} href={`/region/${r.region_id}`}>
                  <Card className={`hover:border-primary/50 transition-colors cursor-pointer relative ${riskBorder(r.primary_outputs.risk_score)}`}>
                    {r.analyst_state?.frozen && (
                      <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-md rounded-tr-md">
                        FROZEN
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium capitalize">
                          {r.region_id.replace(/_/g, " ")}
                        </CardTitle>
                        <Badge variant={stageBadgeColor(r.primary_outputs.operational_stage)}>
                          {r.primary_outputs.operational_stage}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-2">
                      <RiskGauge score={r.primary_outputs.risk_score} />
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{r.primary_outputs.confidence}</span>
                        <span>{r.primary_outputs.coverage}</span>
                        <TrendIcon trend={r.secondary_outputs?.trend} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {regions.length > 5 && (
              <div className="flex justify-center mt-6">
                <Button variant="outline" onClick={() => setShowAll(!showAll)}>
                  {showAll ? (
                    <><ChevronUp className="h-4 w-4 mr-2" /> Show less</>
                  ) : (
                    <><ChevronDown className="h-4 w-4 mr-2" /> Show all ({regions.length})</>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
