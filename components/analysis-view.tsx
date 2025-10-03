'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, TrendingUp, TrendingDown, BarChart3, PieChart, RefreshCw, Download, MessageSquare, Users, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export function AnalysisView() {
  const [sourceTitles, setSourceTitles] = useState([]);
  const [selectedSource, setSelectedSource] = useState('');
  const [sentimentData, setSentimentData] = useState([]);
  const [summary, setSummary] = useState('');
  const [wordcloudImage, setWordcloudImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  const [totalComments, setTotalComments] = useState(0);
  const [individualResults, setIndividualResults] = useState([]);

  // ✅ Fetch available source titles for dropdown
  const fetchSourceTitles = async () => {
    try {
      const res = await fetch('http://localhost:8000/sources');
      const data = await res.json();
      setSourceTitles(data.available_source_titles || []);
      // Auto-select the first source initially
      if (data.available_source_titles?.length > 0) {
        setSelectedSource(data.available_source_titles[0]);
      }
    } catch (err) {
      console.error('Failed to fetch sources:', err);
    }
  };

  // ✅ Fetch analysis data for a specific source
  const fetchAnalysisData = async (title) => {
    if (!title) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/records/${encodeURIComponent(title)}`);
      const result = await response.json();

      const data = result.records[0] && result.records.length > 0 ? result.records[0] : null;
      if (!data) {
        setError('No records found for this source');
        setLoading(false);
        return;
      }

      // Process sentiment data
      const processedSentimentData = Object.entries(data.sentiment_analysis?.distribution?.percentages).map(
        ([category, percentage]) => ({
          category,
          value: percentage,
          count: data.sentiment_analysis?.distribution?.counts[category],
          color: getSentimentColor(category),
        })
      );

      setSentimentData(processedSentimentData);
      setSummary(data?.summary?.text);
      setSourceTitle(data.SourceTitle);
      setTotalComments(data.metadata?.total_comments);
      setIndividualResults(data.individual_results);
      if (data.wordcloud?.image_base64) {
        setWordcloudImage(`data:image/png;base64,${data.wordcloud?.image_base64}`);
      }
      setError('');
    } catch (err) {
      setError('Failed to load analysis data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'bg-green-500';
      case 'negative':
        return 'bg-red-500';
      case 'neutral':
        return 'bg-yellow-500';
      case 'suggestive':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getOverallSentiment = () => {
    if (!sentimentData.length) return 'Unknown';
    const maxSentiment = sentimentData.reduce((max, current) =>
      current.value > max.value ? current : max
    );
    return maxSentiment.category;
  };

  const getOverallTrend = () => {
    const positivePercentage = sentimentData.find((s) => s.category === 'Positive')?.value || 0;
    const negativePercentage = sentimentData.find((s) => s.category === 'Negative')?.value || 0;
    return positivePercentage > negativePercentage ? 'Positive' : 'Negative';
  };

  const handleDownloadSummaryPDF = () => {
    if (!summary) return;
    const element = document.createElement('a');
    const file = new Blob([`Analysis Summary - ${sourceTitle}\n\n${summary}`], {
      type: 'text/plain',
    });
    element.href = URL.createObjectURL(file);
    element.download = 'analysis-summary.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  useEffect(() => {
    fetchSourceTitles();
  }, []);

  useEffect(() => {
    if (selectedSource) {
      fetchAnalysisData(selectedSource);
    }
  }, [selectedSource]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-center items-center min-h-96">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading analysis data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-center items-center min-h-96">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
            <p className="text-red-600">{error}</p>
            <Button onClick={() => fetchAnalysisData(selectedSource)} className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* ✅ Dropdown to select source */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analysis</h1>
          <div className="mt-2 flex items-center gap-2">
            <select
              id="source"
              className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
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
          <p className="text-sm text-gray-500 mt-2">Total Comments Analyzed: {totalComments}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchAnalysisData(selectedSource)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Analysis
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Sentiment Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of public sentiment across all {totalComments} comments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sentimentData.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.category}</span>
                    <div className="flex items-center gap-2">
                      <span>{item.value}%</span>
                      <Badge variant="outline" className="text-xs">
                        {item.count}
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${item.color}`} 
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                {getOverallTrend() === 'Positive' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="font-medium">Overall Sentiment</span>
              </div>
              <p className="text-blue-700 text-sm mt-1">
                Predominantly {getOverallSentiment()} ({sentimentData.find(s => s.category === getOverallSentiment())?.value || 0}% of responses)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Circular Pie Chart Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Sentiment Pie Chart
            </CardTitle>
            <CardDescription>
              Visual representation of sentiment distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center h-80">
              <div className="relative w-64 h-64">
                <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                  {(() => {
                    let currentAngle = 0;
                    return sentimentData.map((item, index) => {
                      const percentage = item.value;
                      const angle = (percentage / 100) * 360;
                      const largeArcFlag = angle > 180 ? 1 : 0;
                      
                      const startAngle = currentAngle;
                      const endAngle = currentAngle + angle;
                      
                      const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
                      const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
                      const x2 = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
                      const y2 = 100 + 80 * Math.sin((endAngle * Math.PI) / 180);
                      
                      currentAngle += angle;
                      
                      const pathData = [
                        `M 100 100`,
                        `L ${x1} ${y1}`,
                        `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        'Z'
                      ].join(' ');
                      
                      const colors = {
                        'bg-green-500': '#10b981',
                        'bg-red-500': '#ef4444',
                        'bg-yellow-500': '#eab308',
                        'bg-blue-500': '#3b82f6'
                      };
                      
                      return (
                        <path
                          key={index}
                          d={pathData}
                          fill={colors[item.color] || '#6b7280'}
                          stroke="white"
                          strokeWidth="2"
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{totalComments}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {sentimentData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm">{item.category}: {item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Word Cloud and Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Word Cloud */}
        <Card>
          <CardHeader>
            <CardTitle>WordCloud</CardTitle>
            <CardDescription>
              Most frequently mentioned topics in feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 h-80 flex items-center justify-center">
              {wordcloudImage ? (
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

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Analysis Summary
            </CardTitle>
            <CardDescription>
              AI-generated summary of feedback trends
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Analysis summary..."
              value={summary}
              className="min-h-[200px] resize-none"
              readOnly
            />
            <div className="flex gap-2">
              <Button onClick={handleDownloadSummaryPDF} disabled={!summary}>
                <Download className="mr-2 h-4 w-4" />
                Download Summary
              </Button>
            </div>
            {summary && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Last updated: {format(new Date(), 'PPp')}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Comments</p>
                <p className="text-2xl font-bold text-blue-600">{totalComments}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${getOverallTrend() === 'Positive' ? 'border-l-green-500' : 'border-l-red-500'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overall Sentiment</p>
                <p className={`text-2xl font-bold ${getOverallTrend() === 'Positive' ? 'text-green-600' : 'text-red-600'}`}>
                  {getOverallSentiment()}
                </p>
              </div>
              {getOverallTrend() === 'Positive' ? 
                <TrendingUp className="h-8 w-8 text-green-500" /> : 
                <TrendingDown className="h-8 w-8 text-red-500" />
              }
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Most Common</p>
                <p className="text-2xl font-bold text-purple-600">
                  {sentimentData.length > 0 ? sentimentData.reduce((max, current) => 
                    current.value > max.value ? current : max
                  ).category : 'N/A'}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Trend Direction</p>
                <p className="text-2xl font-bold text-orange-600">{getOverallTrend()}</p>
              </div>
              {getOverallTrend() === 'Positive' ? 
                <TrendingUp className="h-8 w-8 text-orange-500" /> : 
                <TrendingDown className="h-8 w-8 text-orange-500" />
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}