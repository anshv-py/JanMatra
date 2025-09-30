'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Users, FileText, ChartBar as BarChart3, MessageSquare, ArrowRight, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function DashboardView() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [sourceTitles, setSourceTitles] = useState([]);
  const [selectedSource, setSelectedSource] = useState('');
  const [sentimentData, setSentimentData] = useState<any[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [loadingSentiment, setLoadingSentiment] = useState(true);
  const [wordcloudImage, setWordcloudImage] = useState('');
  const [loadingWordcloud, setLoadingWordcloud] = useState(false);


  const getSentimentColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'positive': return 'bg-green-500';
    case 'neutral': return 'bg-yellow-500';
    case 'negative': return 'bg-red-500';
    case 'suggestive': return 'bg-blue-500';
    default: return 'bg-gray-500';
  }
};

const fetchSentimentData = async (source: string) => {
  setLoadingSentiment(true);
  try {
    const url = source 
      ? `http://localhost:8000/records/${encodeURIComponent(source)}`
      : `http://localhost:8000/records/all`; // adjust if your API differs
    const res = await fetch(url);
    const data = await res.json();

    const record = data.records?.[0] || {
      sentiment_analysis: {
        counts: { Positive: 0, Neutral: 0, Negative: 0, Suggestive: 0 },
        percentages: { Positive: 0, Neutral: 0, Negative: 0, Suggestive: 0 },
        total_comments: 0
      }
    };

    const processedData = Object.entries(record.sentiment_analysis.percentages).map(
      ([category, value]) => ({
        category,
        value: Number(value),
        count: record.sentiment_analysis.counts[category],
        color: getSentimentColor(category)
      })
    );

    setSentimentData(processedData);
    setTotalComments(record.sentiment_analysis.total_comments);
  } catch (err) {
    console.error('Failed to fetch sentiment data:', err);
  } finally {
    setLoadingSentiment(false);
  }
};


  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // ✅ Fetch list of sources from FastAPI
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
  fetchSentimentData(selectedSource);
}, [selectedSource]);



  useEffect(() => {
  if (sourceTitles.length > 0 && !selectedSource) {
    setSelectedSource(sourceTitles[0]);
  }
}, [sourceTitles]);

  useEffect(() => {
  async function fetchWordcloud(source: string) {
    if (!source) return;
    setLoadingWordcloud(true);
    try {
      const res = await fetch(`http://localhost:8000/records/${encodeURIComponent(source)}`);
      const data = await res.json();
      const record = data.records && data.records.length > 0 ? data.records[0] : null;
      if (record?.wordcloud_base64) {
        setWordcloudImage(`data:image/png;base64,${record.wordcloud_base64}`);
      } else {
        setWordcloudImage('');
      }
    } catch (err) {
      console.error('Failed to fetch wordcloud:', err);
      setWordcloudImage('');
    } finally {
      setLoadingWordcloud(false);
    }
  }

  if (selectedSource) {
    fetchWordcloud(selectedSource);
  }
}, [selectedSource]);


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
      {/* ✅ Dropdown filter */}
      <div className="flex items-center justify-between mb-4">
        {/*<h2 className="text-lg font-semibold text-gray-800">Dashboard Overview</h2> */}
        <div className="flex items-center justify-start mb-4">
          <select
            id="source-select"
            className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
          >
            {sourceTitles.map((title, idx) => (
              <option key={idx} value={title}>
                {title}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> 
      
        {/* Sentiment Analysis Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Sentiment Analysis Overview
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Real-time
              </Badge>
            </CardTitle>
            <CardDescription>
              Public sentiment distribution across all active regulations
            </CardDescription>
          </CardHeader>
            <CardContent>
            {loadingSentiment ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="space-y-4">
                {sentimentData.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                        <span className="text-sm font-medium">{item.category}</span>
                      </div>
                      <span className="text-sm font-bold">{item.value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-gray-500 mt-1">
                  Total Comments Analyzed: {totalComments}
                </p>
              </div>
            )}
          </CardContent>

        </Card>

        {/* Word Cloud Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Key Topics & Themes</CardTitle>
            <CardDescription>
              Most frequently mentioned topics in public feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 h-64 flex items-center justify-center">
              {loadingWordcloud ? (
                <Skeleton className="h-48 w-full" />
              ) : wordcloudImage ? (
                <img 
                  src={wordcloudImage} 
                  alt="Word Cloud" 
                  className="max-w-full max-h-full object-contain rounded"
                />
              ) : (
                <div className="text-center text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Word cloud not available</p>
                </div>
              )}
            </div>
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
                type: 'feedback',
                icon: MessageSquare
              },
              {
                title: 'Analysis report generated',
                description: 'Environmental Protection Guidelines - Sentiment Analysis',
                time: '15 minutes ago',
                type: 'report',
                icon: BarChart3
              },
              {
                title: 'Weekly summary available',
                description: 'Public Transport Regulations - Week 12 Summary',
                time: '1 hour ago',
                type: 'summary',
                icon: FileText
              },
              {
                title: 'Trend alert triggered',
                description: 'Negative sentiment spike detected in Education Policy',
                time: '3 hours ago',
                type: 'alert',
                icon: TrendingDown
              }
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-4 text-blue-600" />
            <h3 className="font-semibold text-gray-900 mb-2">Generate Report</h3>
            <p className="text-sm text-gray-600 mb-4">Create comprehensive analysis reports</p>
            <Button size="sm" className="w-full" onClick={() => router.push('/reports')}>
              Create Report
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-4 text-green-600" />
            <h3 className="font-semibold text-gray-900 mb-2">View Analysis</h3>
            <p className="text-sm text-gray-600 mb-4">Explore detailed sentiment analysis</p>
            <Button size="sm" variant="outline" className="w-full" onClick={() => router.push('/analysis')}>
              View Analysis
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-4 text-purple-600" />
            <h3 className="font-semibold text-gray-900 mb-2">Manage Settings</h3>
            <p className="text-sm text-gray-600 mb-4">Configure platform preferences</p>
            <Button size="sm" variant="outline" className="w-full" onClick={() => router.push('/settings')}>
              Open Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}