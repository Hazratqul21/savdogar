"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, Info, TrendingUp, Package, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface AIInsight {
  id: string;
  type: "alert" | "success" | "info" | "warning";
  title: string;
  message: string;
  icon?: React.ReactNode;
  timestamp?: string;
}

interface AIInsightCardsProps {
  insights: AIInsight[];
  className?: string;
}

export function AIInsightCards({ insights, className }: AIInsightCardsProps) {
  if (insights.length === 0) {
    return null;
  }

  const getIcon = (type: AIInsight["type"]) => {
    switch (type) {
      case "alert":
        return <ShieldAlert className="h-5 w-5" />;
      case "success":
        return <CheckCircle className="h-5 w-5" />;
      case "warning":
        return <AlertCircle className="h-5 w-5" />;
      case "info":
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getTypeStyles = (type: AIInsight["type"]) => {
    switch (type) {
      case "alert":
        return "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400";
      case "success":
        return "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400";
      case "warning":
        return "border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400";
      case "info":
      default:
        return "border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400";
    }
  };

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", className)}>
      {insights.map((insight, index) => (
        <motion.div
          key={insight.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className={cn("border-2 h-full hover:shadow-lg transition-shadow", getTypeStyles(insight.type))}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn("flex-shrink-0 mt-0.5", getTypeStyles(insight.type))}>
                  {insight.icon || getIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-1">{insight.title}</h3>
                  <p className="text-xs opacity-90 line-clamp-2">{insight.message}</p>
                  {insight.timestamp && (
                    <p className="text-xs opacity-60 mt-2">{insight.timestamp}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}




