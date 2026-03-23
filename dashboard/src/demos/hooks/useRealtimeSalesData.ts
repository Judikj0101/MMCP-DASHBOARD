"use client";
import { useState, useEffect, useCallback, useRef } from 'react';

export interface SaleDataPoint {
  time: string;
  sales: number;
}

export interface LatestPayment {
  id: string;
  amount: number;
  product: string;
  customer: string;
  time: string;
}

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
    conflict_type?: { primary: string; type_confidence: number };
    de_escalation_pressure?: number;
  };
  analyst_state?: {
    frozen: boolean;
    last_decision?: string;
  };
}

interface SnapshotResponse {
  regions: RegionData[];
}

const API_BASE = process.env.NEXT_PUBLIC_MMCP_API_URL || 'http://46.225.129.246:8000';
const API_KEY = process.env.NEXT_PUBLIC_MMCP_API_KEY || '';

async function fetchAPI(path: string) {
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    headers: {
      'X-MMCP-API-Key': API_KEY,
      'Accept': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export function useRealtimeSalesData() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [averageSale, setAverageSale] = useState(0);
  const [salesChartData, setSalesChartData] = useState<SaleDataPoint[]>([]);
  const [cumulativeRevenueData, setCumulativeRevenueData] = useState<SaleDataPoint[]>([]);
  const [latestPayments, setLatestPayments] = useState<LatestPayment[]>([]);
  const cumulativeRef = useRef(0);

  const fetchSnapshot = useCallback(async () => {
    try {
      const data: SnapshotResponse = await fetchAPI('/snapshot?detail=full');
      if (!data?.regions) return;

      const regions = data.regions;
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS

      // Total "revenue" = sum of all risk scores (metaphor: risk = cost exposure)
      const totalRisk = regions.reduce((sum, r) => sum + (r.primary_outputs?.risk_score || 0), 0);
      setTotalRevenue(totalRisk);

      // Sales count = number of active regions
      setSalesCount(regions.length);

      // Average sale = average risk score
      setAverageSale(regions.length > 0 ? totalRisk / regions.length : 0);

      // Sales chart: current total risk as a data point
      setSalesChartData(prev => {
        const next = [...prev, { time: timeStr, sales: totalRisk }];
        return next.slice(-60); // Keep last 60 data points
      });

      // Cumulative revenue
      cumulativeRef.current += totalRisk;
      setCumulativeRevenueData(prev => {
        const next = [...prev, { time: timeStr, sales: cumulativeRef.current }];
        return next.slice(-60);
      });

      // Latest payments = top regions sorted by risk (most recent "transactions")
      const payments: LatestPayment[] = regions
        .sort((a, b) => (b.primary_outputs?.risk_score || 0) - (a.primary_outputs?.risk_score || 0))
        .slice(0, 10)
        .map((r, i) => ({
          id: `${r.region_id}-${Date.now()}-${i}`,
          amount: r.primary_outputs?.risk_score || 0,
          product: r.primary_outputs?.operational_stage || 'STG_0',
          customer: r.region_id.replace(/_/g, ' '),
          time: timeStr,
        }));
      setLatestPayments(payments);
    } catch (err) {
      console.warn('Failed to fetch MMCP snapshot:', err);
    }
  }, []);

  useEffect(() => {
    fetchSnapshot();
    const interval = setInterval(fetchSnapshot, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchSnapshot]);

  return {
    totalRevenue,
    cumulativeRevenueData,
    salesCount,
    averageSale,
    salesChartData,
    latestPayments,
  };
}
