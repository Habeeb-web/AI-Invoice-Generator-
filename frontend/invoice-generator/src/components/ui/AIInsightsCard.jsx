import { useState, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
const AIInsightsCard = () => {
  const [insights, setInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.AI.GET_DASHBOARD_SUMMARY);
        setInsights(response.data.insights || []);
      } catch (error) {
        console.error("Failed to fetch AI insights", error);
        setInsights([]); // Set empty array on error
      } finally {
        setIsLoading(false);
      }
    };
    fetchInsights();
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <Lightbulb className="w-6 h-6 text-yellow-500" />
        <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </div>
      ) : (
        <ul className="space-y-3">
          {insights.length > 0 ? (
            insights.map((insight, index) => (
              <li 
                key={index} 
                className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500"
              >
                {insight}
              </li>
            ))
          ) : (
            <li className="text-sm text-gray-500 text-center py-4">
              No insights available
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default AIInsightsCard;