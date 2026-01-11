/**
 * Dashboard API Client
 * Uses centralized API configuration from api.ts
 */
import { getAuthHeaders, getApiBaseUrl } from "./api";

// =============================================================================
// API URL Helper
// =============================================================================

const getApiUrl = (): string => {
  try {
    return getApiBaseUrl();
  } catch {
    if (typeof window === 'undefined') return '';
    throw new Error('NEXT_PUBLIC_API_URL is not configured');
  }
};

// =============================================================================
// Type Definitions
// =============================================================================

export interface AIInsight {
  id: string;
  type: "alert" | "success" | "info" | "warning";
  title: string;
  message: string;
  timestamp?: string;
}

export interface SalesDataPoint {
  date: string;
  actual: number;
  predicted: number;
}

// =============================================================================
// AI Insights API
// =============================================================================

export async function getAIInsights(): Promise<AIInsight[]> {
  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/api/v1/analytics/ai/daily-strategy`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch AI insights");
    }

    const data = await response.json();
    const insights: AIInsight[] = [];

    // Add fraud alerts
    try {
      const fraudResponse = await fetch(`${apiUrl}/api/v1/analytics/ai/fraud-check`, {
        headers: getAuthHeaders(),
      });
      if (fraudResponse.ok) {
        const fraudData = await fraudResponse.json();
        if (fraudData?.length > 0) {
          insights.push({
            id: "fraud-alert",
            type: "alert",
            title: "AI Alert: Suspicious Activity Detected",
            message: `${fraudData.length} suspicious transactions detected today.`,
          });
        }
      }
    } catch {
      // Ignore optional endpoint errors
    }

    // Add stock alerts
    try {
      const stockResponse = await fetch(`${apiUrl}/api/v1/analytics/ai/stock-alerts`, {
        headers: getAuthHeaders(),
      });
      if (stockResponse.ok) {
        const stockData = await stockResponse.json();
        if (stockData?.length > 0) {
          const restockedCount = stockData.filter((item: any) => item.status === "restocked").length;
          if (restockedCount > 0) {
            insights.push({
              id: "stock-restocked",
              type: "success",
              title: "Inventory: Auto-Restocked",
              message: `${restockedCount} items automatically re-stocked.`,
            });
          }

          const lowStockCount = stockData.filter((item: any) => item.status === "low_stock").length;
          if (lowStockCount > 0) {
            insights.push({
              id: "stock-low",
              type: "warning",
              title: "Inventory: Low Stock Alert",
              message: `${lowStockCount} items running low.`,
            });
          }
        }
      }
    } catch {
      // Ignore optional endpoint errors
    }

    // Add daily strategy insights
    if (data?.recommendations) {
      insights.push({
        id: "daily-strategy",
        type: "info",
        title: "Today's AI Strategy",
        message: data.recommendations[0] || "Review your daily strategy.",
      });
    }

    return insights.slice(0, 8);
  } catch (error) {
    console.error("Error fetching AI insights:", error);
    return getMockInsights();
  }
}

function getMockInsights(): AIInsight[] {
  return [
    {
      id: "mock-1",
      type: "alert",
      title: "🔴 AI Alert: Suspicious Refunds",
      message: "3 suspicious refunds detected today.",
    },
    {
      id: "mock-2",
      type: "success",
      title: "🟢 Inventory: Auto-Restocked",
      message: "5 items automatically re-stocked.",
    },
  ];
}

// =============================================================================
// Sales Data API
// =============================================================================

export async function getSalesData(days: number = 30): Promise<SalesDataPoint[]> {
  try {
    const apiUrl = getApiUrl();
    const salesResponse = await fetch(
      `${apiUrl}/api/v1/v2/sales?skip=0&limit=1000`,
      { headers: getAuthHeaders() }
    );

    if (!salesResponse.ok) {
      throw new Error("Failed to fetch sales data");
    }

    const salesData = await salesResponse.json();
    
    // Group sales by date
    const salesByDate: Record<string, number> = {};
    
    if (Array.isArray(salesData)) {
      salesData.forEach((sale: any) => {
        const date = new Date(sale.created_at).toISOString().split("T")[0];
        salesByDate[date] = (salesByDate[date] || 0) + (sale.total_amount || 0);
      });
    }

    // Generate date range
    const dates = generateDateRange(days);

    // Create chart data with predictions
    return dates.map((date) => {
      const actual = salesByDate[date] || 0;
      const predicted = actual * 1.05; // Simple 5% growth prediction
      
      return {
        date: formatDate(date),
        actual,
        predicted,
      };
    });
  } catch (error) {
    console.error("Error fetching sales data:", error);
    return getMockSalesData();
  }
}

function generateDateRange(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric" 
  });
}

function getMockSalesData(): SalesDataPoint[] {
  return generateDateRange(30).map((date) => ({
    date: formatDate(date),
    actual: 5000000 + Math.random() * 2000000,
    predicted: 5200000 + Math.random() * 2000000,
  }));
}
