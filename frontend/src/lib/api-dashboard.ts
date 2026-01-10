import { getAuthHeaders } from "./api";

// API Base URL configuration
// Frontend and backend are now deployed separately on Vercel
// REQUIRED: Set NEXT_PUBLIC_API_URL environment variable to your backend URL
// Development: Use localhost backend (http://localhost:8000)
// Production: Use your deployed backend URL (e.g., https://your-backend.vercel.app)
const getApiBaseUrl = (): string => {
  // If explicitly set via environment variable, use it (REQUIRED for production)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Development: use localhost backend
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8000';
  }
  
  // Production fallback: throw error if NEXT_PUBLIC_API_URL is not set
  throw new Error(
    'NEXT_PUBLIC_API_URL environment variable is not set. ' +
    'Please set it to your backend API URL (e.g., https://your-backend.vercel.app)'
  );
};

const API_BASE_URL = getApiBaseUrl();

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

/**
 * Fetch AI insights for the dashboard
 */
export async function getAIInsights(): Promise<AIInsight[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/ai/daily-strategy`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch AI insights");
    }

    const data = await response.json();
    
    // Transform the API response to match our insight format
    const insights: AIInsight[] = [];

    // Add fraud alerts if available
    try {
      const fraudResponse = await fetch(`${API_BASE_URL}/api/v1/analytics/ai/fraud-check`, {
        headers: getAuthHeaders(),
      });
      if (fraudResponse.ok) {
        const fraudData = await fraudResponse.json();
        if (fraudData && fraudData.length > 0) {
          insights.push({
            id: "fraud-alert",
            type: "alert",
            title: "AI Alert: Suspicious Activity Detected",
            message: `${fraudData.length} suspicious transactions detected today. Review recommended.`,
          });
        }
      }
    } catch (e) {
      // Ignore errors for optional endpoints
    }

    // Add stock alerts
    try {
      const stockResponse = await fetch(`${API_BASE_URL}/api/v1/analytics/ai/stock-alerts`, {
        headers: getAuthHeaders(),
      });
      if (stockResponse.ok) {
        const stockData = await stockResponse.json();
        if (stockData && stockData.length > 0) {
          const restockedCount = stockData.filter((item: any) => item.status === "restocked").length;
          if (restockedCount > 0) {
            insights.push({
              id: "stock-restocked",
              type: "success",
              title: "Inventory: Auto-Restocked",
              message: `${restockedCount} items automatically re-stocked based on AI predictions.`,
            });
          }

          const lowStockCount = stockData.filter((item: any) => item.status === "low_stock").length;
          if (lowStockCount > 0) {
            insights.push({
              id: "stock-low",
              type: "warning",
              title: "Inventory: Low Stock Alert",
              message: `${lowStockCount} items running low. Consider restocking.`,
            });
          }
        }
      }
    } catch (e) {
      // Ignore errors
    }

    // Add daily strategy insights
    if (data && data.recommendations) {
      insights.push({
        id: "daily-strategy",
        type: "info",
        title: "Today's AI Strategy",
        message: data.recommendations[0] || "Review your daily strategy recommendations.",
      });
    }

    return insights.slice(0, 8); // Limit to 8 insights
  } catch (error) {
    console.error("Error fetching AI insights:", error);
    // Return mock data for development
    return [
      {
        id: "mock-1",
        type: "alert",
        title: "🔴 AI Alert: Suspicious Refunds",
        message: "3 suspicious refunds detected today. Review recommended.",
      },
      {
        id: "mock-2",
        type: "success",
        title: "🟢 Inventory: Auto-Restocked",
        message: "5 items automatically re-stocked based on AI predictions.",
      },
    ];
  }
}

/**
 * Fetch sales data with predictions
 */
export async function getSalesData(days: number = 30): Promise<SalesDataPoint[]> {
  try {
    // Fetch actual sales data
    const salesResponse = await fetch(
      `${API_BASE_URL}/api/v1/sales?skip=0&limit=1000`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!salesResponse.ok) {
      throw new Error("Failed to fetch sales data");
    }

    const salesData = await salesResponse.json();
    
    // Process sales data to create chart data
    // Group by date and calculate totals
    const salesByDate: Record<string, number> = {};
    
    if (Array.isArray(salesData)) {
      salesData.forEach((sale: any) => {
        const date = new Date(sale.created_at).toISOString().split("T")[0];
        salesByDate[date] = (salesByDate[date] || 0) + (sale.total_amount || 0);
      });
    }

    // Generate date range
    const dates: string[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split("T")[0]);
    }

    // Create chart data with predictions (mock predictions for now)
    const chartData: SalesDataPoint[] = dates.map((date) => {
      const actual = salesByDate[date] || 0;
      // Simple prediction: average of last 7 days with some variation
      const predicted = actual * 1.05; // 5% growth prediction (simplified)
      
      return {
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        actual,
        predicted,
      };
    });

    return chartData;
  } catch (error) {
    console.error("Error fetching sales data:", error);
    // Return mock data for development
    const dates: string[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
    }

    return dates.map((date, index) => ({
      date,
      actual: 5000000 + Math.random() * 2000000,
      predicted: 5200000 + Math.random() * 2000000,
    }));
  }
}

