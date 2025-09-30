'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Search, 
  Filter, 
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Eye,
  Plus,
  Server
} from 'lucide-react';
import { format } from 'date-fns';

type Report = {
  id: string;
  title: string;
  sourceTitle: string;
  date: string;
  summary: string;
  type: string;
  status: string;
  responses: number;
  sentiment: string;
  sentimentData?: any;
  wordcloudImage?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ReportsView() {
  const [reports, setReports] = useState<Report[]>([]);
  const [sourceTitles, setSourceTitles] = useState<string[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingAISuggestions, setLoadingAISuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('az');
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [backendConnected, setBackendConnected] = useState(true);

  // Check backend connection
  const checkBackendConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        setBackendConnected(true);
        return true;
      } else {
        setBackendConnected(false);
        return false;
      }
    } catch (err) {
      setBackendConnected(false);
      return false;
    }
  };

  // Fetch available source titles
  const fetchSourceTitles = async () => {
    try {
      const isConnected = await checkBackendConnection();
      if (!isConnected) {
        setError('Backend server is not running. Please start the FastAPI server on port 8000.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/sources`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSourceTitles(data.available_source_titles || []);
      setError('');
    } catch (err) {
      console.error('Error fetching source titles:', err);
      setError('Failed to load source titles. Make sure the backend server is running.');
      setBackendConnected(false);
    }
  };

  // Fetch report data for a specific source title
  const fetchReportData = async (sourceTitle: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/records/${encodeURIComponent(sourceTitle)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No records for this source
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.records && data.records.length > 0) {
        const record = data.records[0];
        const sentiment = getDominantSentiment(record.sentiment_analysis?.percentages || {});
        
        return {
          id: record._id,
          title: `Analysis Report - ${sourceTitle}`,
          sourceTitle: sourceTitle,
          date: new Date().toISOString().split('T')[0],
          summary: record.summary || 'No summary available',
          type: 'Sentiment Analysis',
          status: 'completed',
          responses: record.sentiment_analysis?.total_comments || 0,
          sentiment: sentiment,
          sentimentData: record.sentiment_analysis,
          wordcloudImage: record.wordcloud_base64 ? `data:image/png;base64,${record.wordcloud_base64}` : null
        };
      }
      return null;
    } catch (err) {
      console.error(`Error fetching data for ${sourceTitle}:`, err);
      return null;
    }
  };

  // Fetch AI suggestions for a selected report
  const fetchAISuggestions = async (summary: string) => {
    if (!summary || summary.trim() === '' || summary === 'No summary available') {
      setAiSuggestions(['No summary available to generate suggestions']);
      return;
    }

    setLoadingAISuggestions(true);
    try {
      const response = await fetch(`${API_BASE_URL}/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: summary,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      
      // Parse the suggestions from the response
      const lines = text
        .split(/\n+/)
        .map(l => l.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0 && !line.toLowerCase().includes('suggestions:'))
        .slice(0, 4);
      
      if (lines.length === 0) {
        setAiSuggestions(['No actionable suggestions could be generated from this summary']);
      } else {
        setAiSuggestions(lines);
      }
    } catch (err) {
      console.error('Error fetching AI suggestions:', err);
      setAiSuggestions(['Failed to generate suggestions. Please try again later.']);
    } finally {
      setLoadingAISuggestions(false);
    }
  };

  // Get dominant sentiment
  const getDominantSentiment = (percentages: any) => {
    if (!percentages) return 'neutral';
    const entries = Object.entries(percentages);
    if (entries.length === 0) return 'neutral';
    
    const dominant = entries.reduce((max: any, current: any) => 
      current[1] > max[1] ? current : max
    );
    return dominant[0].toLowerCase();
  };

  // Load reports for all source titles
  const loadReports = async () => {
    if (sourceTitles.length === 0) return;
    setLoading(true);
    setError('');
    
    try {
      const reportPromises = sourceTitles.map(fetchReportData);
      const reportResults = await Promise.all(reportPromises);
      const validReports = reportResults.filter(report => report !== null) as Report[];
      setReports(validReports);
      
      if (validReports.length === 0) {
        setError('No reports found for any source titles');
      }
    } catch (err) {
      setError('Failed to load reports');
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReportClick = (report: Report) => {
    setSelectedReportId(report.id);
    setSelectedReport(report);
    setAiSuggestions([]);
    fetchAISuggestions(report.summary);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return '#27AE60';
      case 'negative': return '#E74C3C';
      case 'neutral': return '#F39C12';
      case 'suggestive': return '#8E44AD';
      default: return '#95A5A6';
    }
  };

  const retryConnection = async () => {
    setError('');
    setLoading(true);
    await fetchSourceTitles();
    setLoading(false);
  };

  useEffect(() => {
    fetchSourceTitles();
  }, []);

  useEffect(() => {
    if (sourceTitles.length > 0) {
      loadReports();
    }
  }, [sourceTitles]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-center items-center min-h-96">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-center items-center min-h-96">
          <div className="text-center max-w-md">
            <div className="mb-4">
              {!backendConnected ? (
                <Server className="h-8 w-8 mx-auto mb-4 text-red-600" />
              ) : (
                <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {!backendConnected ? 'Backend Server Not Running' : 'Error Loading Reports'}
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            {!backendConnected && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm text-gray-700">
                <p className="mb-2">To fix this issue:</p>
                <ol className="list-decimal list-inside space-y-1 text-left">
                  <li>Navigate to your FastAPI project directory</li>
                  <li>Run: <code className="bg-gray-200 px-1 rounded">python main.py</code></li>
                  <li>Or run: <code className="bg-gray-200 px-1 rounded">uvicorn main:app --host 0.0.0.0 --port 8000</code></li>
                  <li>Make sure the server starts on port 8000</li>
                </ol>
              </div>
            )}
            <Button onClick={retryConnection}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Connection
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Filter + Sort
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.sourceTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || report.sentiment === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const sortedReports = [...filteredReports].sort((a, b) => {
    switch (sortBy) {
      case 'az': return a.title.localeCompare(b.title);
      case 'za': return b.title.localeCompare(a.title);
      case 'date-new-old': return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'date-old-new': return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'responses-high-low': return b.responses - a.responses;
      case 'responses-low-high': return a.responses - b.responses;
      default: return 0;
    }
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">
            Comprehensive analysis reports and insights ({reports.length} available)
            {!backendConnected && (
              <span className="text-red-500 ml-2">[Backend Disconnected]</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={retryConnection} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Connection
          </Button>
          <Button onClick={loadReports}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Reports
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-row flex-wrap gap-4 items-center w-full">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="flex-1 min-w-[180px]">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="az">Alphabetical Order (A-Z)</SelectItem>
                  <SelectItem value="za">Alphabetical Order (Z-A)</SelectItem>
                  <SelectItem value="date-new-old">Date (New-Old)</SelectItem>
                  <SelectItem value="date-old-new">Date (Old-New)</SelectItem>
                  <SelectItem value="responses-high-low">Responses (High-Low)</SelectItem>
                  <SelectItem value="responses-low-high">Responses (Low-High)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sentiment Filter */}
            <div className="flex-1 min-w-[180px]">
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sentiment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sentiment</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="suggestive">Suggestive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedFilter('all');
                setSortBy('az');
                setSearchQuery('');
              }}
            >
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="lg:col-span-2 space-y-4">
          {sortedReports.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
                <p className="text-gray-500">
                  {reports.length === 0 
                    ? "No reports are available. Try analyzing some comments first." 
                    : "Try adjusting your search or filter criteria"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            sortedReports.map((report) => (
              <Card
                key={report.id}
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  selectedReportId === report.id 
                    ? 'ring-2 ring-blue-500 border-blue-500' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleReportClick(report)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {report.title}
                        </h3>
                        <Badge 
                          variant={report.status === 'completed' ? 'default' : 'secondary'}
                          className={report.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {report.status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-500 mb-2">Source: {report.sourceTitle}</p>
                      <p className="text-gray-600 mb-3">
                        {report.summary.length > 150 
                          ? `${report.summary.substring(0, 150)}...` 
                          : report.summary
                        }
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(report.date), 'PP')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {report.responses} responses
                        </div>
                        <div className="flex items-center gap-1">
                          {report.sentiment === 'positive' && <TrendingUp className="h-4 w-4 text-green-600" />}
                          {report.sentiment === 'negative' && <TrendingDown className="h-4 w-4 text-red-600" />}
                          {(report.sentiment === 'neutral' || report.sentiment === 'suggestive') && <TrendingUp className="h-4 w-4 text-yellow-600" />}
                          <span className="capitalize" style={{ color: getSentimentColor(report.sentiment) }}>
                            {report.sentiment}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: implement generatePDFReport here if needed
                          console.log('Generate PDF for report:', report.id);
                        }}
                        disabled={generatingPDF === report.id}
                      >
                        {generatingPDF === report.id ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* AI Suggestions Panel */}
        <div className="space-y-6">
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                AI Insights
              </CardTitle>
              <CardDescription>
                {selectedReportId ? 'Actionable suggestions for the selected report' : 'Click on a report to view AI insights'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedReportId ? (
                  loadingAISuggestions ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-purple-600" />
                        <p className="text-sm text-gray-500">Generating AI insights...</p>
                      </div>
                    </div>
                  ) : aiSuggestions.length > 0 ? (
                    <>
                      {selectedReport && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Analyzing report:</p>
                          <p className="text-sm font-medium text-gray-700">{selectedReport.sourceTitle}</p>
                        </div>
                      )}
                      {aiSuggestions.map((suggestion, index) => (
                        <div key={index} className="p-3 bg-purple-50 rounded-lg border-l-2 border-purple-200">
                          <div className="flex items-start gap-2">
                            <span className="text-purple-600 font-medium text-sm">{index + 1}.</span>
                            <p className="text-sm text-gray-700 flex-1">{suggestion}</p>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm">No suggestions could be generated</p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500 text-sm">Select a report to view AI-powered insights and actionable recommendations</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Report Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Reports</span>
                  <span className="font-semibold">{reports.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Responses</span>
                  <span className="font-semibold">{reports.reduce((sum, r) => sum + r.responses, 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Positive Sentiment</span>
                  <span className="font-semibold text-green-600">
                    {reports.filter(r => r.sentiment === 'positive').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Negative Sentiment</span>
                  <span className="font-semibold text-red-600">
                    {reports.filter(r => r.sentiment === 'negative').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Neutral Sentiment</span>
                  <span className="font-semibold text-yellow-600">
                    {reports.filter(r => r.sentiment === 'neutral').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Suggestive Sentiment</span>
                  <span className="font-semibold text-purple-600">
                    {reports.filter(r => r.sentiment === 'suggestive').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}