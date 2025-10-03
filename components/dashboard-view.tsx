'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Users, FileText, BarChart3, MessageSquare, ArrowRight, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

export function DashboardView() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [sourceTitles, setSourceTitles] = useState<string[]>([]);
  const [sentimentData, setSentimentData] = useState<any[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [loadingSentiment, setLoadingSentiment] = useState(true);
  const [topComments, setTopComments] = useState<string[]>([]);

  const SENTIMENT_COLORS: { [key: string]: string } = {
    'Positive': '#22c55e',
    'Neutral': '#facc15',
    'Negative': '#ef4444',
    'Suggestive': '#3b82f6'
  };

  const fetchGlobalSentimentData = async () => {
    setLoadingSentiment(true);
    try {
      const sourcesRes = await fetch('http://localhost:8000/sources/');
      const sourcesData = await sourcesRes.json();
      const titles: string[] = sourcesData.available_source_titles || [];

      let aggregatedCounts = { Positive: 0, Neutral: 0, Negative: 0, Suggestive: 0 };
      let total = 0;
      let allComments: Array<{ comment: string; confidence: number }> = [];

      for (const title of titles) {
        const recordsRes = await fetch(`http://localhost:8000/records/${encodeURIComponent(title)}`);
        if (!recordsRes.ok) continue;
        const data = await recordsRes.json();

        const records = data.records || [];
        for (const record of records) {
          const individualResults = record?.sentiment_analysis?.individual_results || [];
          for (const result of individualResults) {
            if (result?.sentiment) {
              const sentiment = result.sentiment;
              if (aggregatedCounts[sentiment as keyof typeof aggregatedCounts] !== undefined) {
                aggregatedCounts[sentiment as keyof typeof aggregatedCounts] += 1;
                total += 1;
              }
            }
            
            if (result?.comment && typeof result.comment === 'string' && result?.confidence) {
              allComments.push({
                comment: result.comment,
                confidence: result.confidence
              });
            }
          }
        }
      }

      const processedData = Object.entries(aggregatedCounts).map(([category, value]) => ({
        name: category,
        value: Number(value),
      }));

      setSentimentData(processedData);
      setTotalComments(total);
      
      const sortedComments = allComments
        .sort((a, b) => b.confidence - a.confidence)
        .map(item => item.comment);
      
      const uniqueComments = Array.from(new Set(sortedComments)).filter(c => c.trim().length > 0);
      setTopComments(uniqueComments.slice(0, 5));
      
      console.log("✅ Sentiment Data:", processedData);
      console.log("✅ Total Comments:", total);
    } catch (err) {
      console.error('❌ Failed to fetch sentiment data:', err);
    } finally {
      setLoadingSentiment(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    async function fetchSources() {
      try {
        const res = await fetch('http://localhost:8000/sources');
        const data = await res.json();
        setSourceTitles(data.available_source_titles || []);
      } catch (error) {
        console.error('Failed to fetch source titles:', error);
      }
    }
    fetchSources();
  }, []);

  useEffect(() => {
    fetchGlobalSentimentData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Sentiment Analysis and User Voices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Analysis Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Overall Sentiment Analysis
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Real-time
              </Badge>
            </CardTitle>
            <CardDescription>
              Aggregated sentiment distribution across all public feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSentiment ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-72 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      dataKey="value"
                      cx="50%"
                      cy="45%"
                      outerRadius={100}
                      innerRadius={60}
                      label={false}
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name] || '#gray-400'} />
                      ))}
                    </Pie>

                    <Tooltip />
                    <Legend
                      verticalAlign="bottom"
                      height={50}
                      iconType="circle"
                      formatter={(value, entry: any) => (
                        <span className="text-sm">
                          <span className="font-semibold">{value}</span>: {entry.payload.value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none" style={{ paddingBottom: '72px' }}>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{totalComments}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Voices */}
        <Card>
          <CardHeader>
            <CardTitle>User Voices</CardTitle>
            <CardDescription>Real user comments from public feedback</CardDescription>
          </CardHeader>
          <CardContent>
            {topComments.length === 0 ? (
              <div className="flex items-center justify-center h-72 text-gray-500 italic">
                <MessageSquare className="h-12 w-12 opacity-50 mr-3" />
                <p>No comments available yet.</p>
              </div>
            ) : (
              <ul className="space-y-4 h-72 overflow-y-auto">
                {topComments.map((comment, idx) => (
                  <li
                    key={`comment-${idx}-${comment.substring(0, 20)}`}
                    className="italic text-gray-700 border-l-4 border-blue-500 pl-4 text-sm"
                  >
                    "{comment}"
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest feedback and analysis updates</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                title: 'New regulation feedback received',
                description: 'Healthcare Policy Reform - 47 new responses',
                time: '2 minutes ago',
                icon: MessageSquare,
              },
              {
                title: 'Analysis report generated',
                description: 'Environmental Protection Guidelines - Sentiment Analysis',
                time: '15 minutes ago',
                icon: BarChart3,
              },
              {
                title: 'Weekly summary available',
                description: 'Public Transport Regulations - Week 12 Summary',
                time: '1 hour ago',
                icon: FileText,
              },
              {
                title: 'Positive feedback surge',
                description: 'Digital India Initiative - 89% positive sentiment increase',
                time: '2 hours ago',
                icon: TrendingUp,
              },
              {
                title: 'Trend alert triggered',
                description: 'Negative sentiment spike detected in Education Policy',
                time: '3 hours ago',
                icon: TrendingDown,
              },
            ].map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                    <div className="flex items-center mt-1">
                      <Clock className="h-3 w-3 text-gray-400 mr-1" />
                      <span className="text-xs text-gray-400">{activity.time}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <footer className="text-center py-6 mt-8 border-t">
        <p className="text-sm text-gray-600">©️ JanMatra 2025</p>
      </footer>
    </div>
  );
}