
import { useGetDashboardMetricsQuery } from "@/state/api";
import { TrendingDown, TrendingUp } from "lucide-react";
import numeral from "numeral";
import React from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CardPurchaseSummary = () => {
  const { data, isLoading } = useGetDashboardMetricsQuery();
  const purchaseData = data?.purchaseSummary || [];

  const lastDataPoint = purchaseData[purchaseData.length - 1] || null;
  const previousDataPoint = purchaseData[purchaseData.length - 2] || null;
  
  // Calculate percentage change if we have both current and previous data
  const calculateChangePercentage = () => {
    if (!lastDataPoint || !previousDataPoint) return 0;
    return ((lastDataPoint.totalPurchased - previousDataPoint.totalPurchased) / previousDataPoint.totalPurchased) * 100;
  };
  
  const changePercentage = lastDataPoint?.changePercentage || calculateChangePercentage();

  return (
    <div className="flex flex-col h-full row-span-2 xl:row-span-3 col-span-1 md:col-span-2 xl:col-span-1 bg-white shadow-md rounded-2xl overflow-hidden">
      {isLoading ? (
        <div className="m-5">Loading...</div>
      ) : (
        <>
          {/* HEADER */}
          <div className="flex-shrink-0">
            <h2 className="text-lg font-semibold mb-2 px-7 pt-5">
              Purchase Summary
            </h2>
            <hr />
          </div>

          {/* BODY */}
          <div className="flex flex-col flex-1 min-h-0">
            {/* BODY HEADER */}
            <div className="flex-shrink-0 mb-4 mt-7 px-7">
              <p className="text-sm text-gray-500 font-medium">Total Purchased</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-gray-900">
                  {lastDataPoint
                    ? numeral(lastDataPoint.totalPurchased).format("$0.00a")
                    : "$0.00"}
                </p>
                <div
                  className={`flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                    changePercentage >= 0
                      ? "text-green-700 bg-green-100"
                      : "text-red-700 bg-red-100"
                  }`}
                >
                  {changePercentage >= 0 ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {Math.abs(changePercentage).toFixed(1)}%
                </div>
              </div>
            </div>
            {/* CHART */}
            <div className="flex-1 px-5 pb-5 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={purchaseData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="purchaseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tick={false} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tickLine={false} 
                    tick={false} 
                    axisLine={false}
                    domain={['dataMin - 1000', 'dataMax + 1000']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: number) => [
                      numeral(value).format('$0,0.00'),
                      'Purchased'
                    ]}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalPurchased"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#purchaseGradient)"
                    dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CardPurchaseSummary;
