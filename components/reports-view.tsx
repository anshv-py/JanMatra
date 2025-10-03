'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
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
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);

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
  const pdfRef = useRef<HTMLDivElement | null>(null);

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
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.records && data.records.length > 0) {
        const record = data.records[0];
        const sentiment = getDominantSentiment(record.sentiment_analysis?.distribution?.percentages || {});
        
        const reportData = {
          id: record._id,
          title: `Analysis Report - ${sourceTitle}`,
          sourceTitle: sourceTitle,
          date: new Date().toISOString().split('T')[0],
          summary: record?.summary?.text || 'No summary available',
          type: 'Sentiment Analysis',
          status: 'Completed',
          responses: record.metadata?.total_comments || 0,
          sentiment: sentiment,
          sentimentData: record.sentiment_analysis,
          wordcloudImage: record.wordcloud?.image_base64 ? `data:image/png;base64,${record.wordcloud?.image_base64}` : null
        };
        console.log("Report Data: ", reportData);
        return reportData;
      }
      return null;
    } catch (err) {
      console.error(`Error fetching data for ${sourceTitle}:`, err);
      return null;
    }
  };

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
      body: JSON.stringify({ summary: summary }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    const lines = text
      .split(/(?:\r?\n){2,}|\d+\.\s+\*\*/)
      .map(l => {
        return l
          .replace(/^\d+\.\s*/, '')
          .replace(/\*\*/g, '')
          .replace(/\\n/g, ' ')
          .replace(/\n/g, ' ')
          .trim();
      })
      .filter(line => {
        return line.length > 20 && 
               !line.toLowerCase().includes('here are') &&
               !line.toLowerCase().includes('suggestions:') &&
               !line.toLowerCase().includes('based on');
      })
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
  const getDominantSentiment = (percentages: any) => {
    if (!percentages) return 'Neutral';
    const entries = Object.entries(percentages);
    if (entries.length === 0) return 'Neutral';
    
    const dominant = entries.reduce((max: any, current: any) => 
      current[1] > max[1] ? current : max
    );
    return dominant[0];
  };

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

  const generatePDFReport = async (report: Report) => {
    setGeneratingPDF(report.id);
    try {
      if (!aiSuggestions || aiSuggestions.length === 0) {
        await fetchAISuggestions(report.summary);
      }

      const printable = document.createElement('div');
      printable.style.width = '1240px';
      printable.style.minHeight = '1754px';
      printable.style.padding = '48px';
      printable.style.boxSizing = 'border-box';
      printable.style.fontFamily = 'Inter, Arial, sans-serif';
      printable.style.background = 'white';
      printable.style.color = '#111827';
      printable.style.position = 'fixed';
      printable.style.left = '-20000px';
      printable.style.top = '0';

      const watermark = document.createElement('div');
      watermark.innerText = 'eVoterSaathi';
      watermark.style.opacity = '0.06';
      watermark.style.fontSize = '120px';
      watermark.style.position = 'absolute';
      watermark.style.left = '60px';
      watermark.style.top = '220px';
      watermark.style.transform = 'rotate(-30deg)';
      watermark.style.pointerEvents = 'none';
      printable.appendChild(watermark);

      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';

      const title = document.createElement('div');
      title.innerHTML = `<h1 style="margin:0;font-size:28px;letter-spacing:-0.2px">${escapeHtml(report.title)}</h1><div style="font-size:12px;color:#6B7280;margin-top:6px">Source: ${escapeHtml(report.sourceTitle)}</div>`;
      header.appendChild(title);

      const meta = document.createElement('div');
      meta.style.textAlign = 'right';
      meta.innerHTML = `<div style="font-size:12px;color:#6B7280">${format(new Date(report.date), 'PPP')}</div><div style="margin-top:6px;font-weight:600">Responses: ${report.responses}</div>`;
      header.appendChild(meta);
      printable.appendChild(header);


      // Divider
      const hr = document.createElement('div');
      hr.style.height = '1px';
      hr.style.background = 'linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.02))';
      hr.style.margin = '18px 0';
      printable.appendChild(hr);


      // Main body: left summary + AI insights, right wordcloud + sentiment bar
      const body = document.createElement('div');
      body.style.display = 'flex';
      body.style.gap = '18px';


      // Left column
      const left = document.createElement('div');
      left.style.flex = '1 1 60%';

      const summaryCard = document.createElement('div');
      summaryCard.style.padding = '14px';
      summaryCard.style.borderRadius = '8px';
      summaryCard.style.background = 'linear-gradient(180deg, #ffffff, #fbfbfd)';
      summaryCard.style.boxShadow = '0 6px 18px rgba(15,23,42,0.06)';

      const summaryTitle = document.createElement('div');
      summaryTitle.innerHTML = `<div style="font-size:18px;color:#6B7280;font-weight:600;margin-bottom:8px">SUMMARY</div>`;
      summaryCard.appendChild(summaryTitle);


      const summaryText = document.createElement('div');
      summaryText.style.fontSize = '15px';
      summaryText.style.color = '#374151';
      const trimmedSummary = truncate(report.summary || '', 300);
      summaryText.innerText = trimmedSummary;
      summaryCard.appendChild(summaryText);
      left.appendChild(summaryCard);

      const insightsCard = document.createElement('div');
      insightsCard.style.padding = '14px';
      insightsCard.style.borderRadius = '8px';
      insightsCard.style.background = '#F8FAFF';
      insightsCard.style.border = '1px solid rgba(59,130,246,0.06)';

      const insightsTitle = document.createElement('div');
      insightsTitle.innerHTML = `<div style="font-size:18px;color:#1E3A8A;font-weight:700;margin-bottom:8px">AI INSIGHTS (concise)</div>`;
      insightsCard.appendChild(insightsTitle);

      const insightsList = document.createElement('ol');
      insightsList.style.margin = '0';
      insightsList.style.padding = '0 0 0 18px';
      insightsList.style.fontSize = '15px';
      insightsList.style.color = '#0F172A';

      const useSuggestions = (aiSuggestions && aiSuggestions.length > 0) ? aiSuggestions : ['No suggestions available'];
      useSuggestions.slice(0, 4).forEach((s, i) => {
        const li = document.createElement('li');
        li.style.marginBottom = '6px';
        li.innerText = s;
        insightsList.appendChild(li);
      });

      insightsCard.appendChild(insightsList);
      left.appendChild(insightsCard);
      body.appendChild(left);

      const right = document.createElement('div');
      right.style.flex = '1 1 40%';
      right.style.display = 'flex';
      right.style.flexDirection = 'column';
      right.style.gap = '12px';

      const wcCard = document.createElement('div');
      wcCard.style.padding = '10px';
      wcCard.style.borderRadius = '8px';
      wcCard.style.background = '#fff';
      wcCard.style.boxShadow = '0 6px 12px rgba(15,23,42,0.04)';
      wcCard.style.textAlign = 'center';

      if (report.wordcloudImage) {
        const img = document.createElement('img');
        img.src = report.wordcloudImage;
        img.style.maxWidth = '100%';
        img.style.height = '200px';
        img.style.objectFit = 'contain';
        img.alt = 'wordcloud';
        wcCard.appendChild(img);
      } else {
        const noImg = document.createElement('div');
        noImg.innerText = 'Wordcloud not available';
        noImg.style.color = '#6B7280';
        noImg.style.padding = '28px 0';
        wcCard.appendChild(noImg);
      }
      right.appendChild(wcCard);

      const sentimentCard = document.createElement('div');
      sentimentCard.style.padding = '12px';
      sentimentCard.style.borderRadius = '8px';
      sentimentCard.style.background = '#fff';
      sentimentCard.style.boxShadow = '0 6px 12px rgba(15,23,42,0.04)';

      const sentimentTitle = document.createElement('div');
      sentimentTitle.style.fontSize = '12px';
      sentimentTitle.style.color = '#111827';
      sentimentTitle.style.fontWeight = '700';
      sentimentTitle.style.marginBottom = '8px';
      sentimentTitle.innerText = 'SENTIMENT BREAKDOWN';
      sentimentCard.appendChild(sentimentTitle);

      const percentages = (report.sentimentData && (report.sentimentData.percentages || report.sentimentData.distribution?.percentages)) || {};
      const barContainer = document.createElement('div');
      barContainer.style.display = 'flex';
      barContainer.style.flexDirection = 'column';
      barContainer.style.gap = '8px';

      const labels = ['Positive', 'Neutral', 'Negative', 'Suggestive'];
      labels.forEach((label) => {
        const percent = percentages[label] !== undefined ? Number(percentages[label]) : 0;
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';

        const lbl = document.createElement('div');
        lbl.style.fontSize = '11px';
        lbl.style.color = '#374151';
        lbl.innerText = `${label}`;
        row.appendChild(lbl);

        const barWrap = document.createElement('div');
        barWrap.style.flex = '1';
        barWrap.style.marginLeft = '8px';
        barWrap.style.marginRight = '8px';
        barWrap.style.height = '10px';
        barWrap.style.background = '#F3F4F6';
        barWrap.style.borderRadius = '6px';
        barWrap.style.overflow = 'hidden';

        const bar = document.createElement('div');
        bar.style.height = '100%';
        bar.style.width = `${Math.max(1, Math.min(100, percent))}%`;
        bar.style.background = getGradientForLabel(label);
        barWrap.appendChild(bar);
        row.appendChild(barWrap);

        const pct = document.createElement('div');
        pct.style.fontSize = '11px';
        pct.style.color = '#374151';
        pct.style.width = '46px';
        pct.style.textAlign = 'right';
        pct.innerText = `${percent}%`;
        row.appendChild(pct);


        barContainer.appendChild(row);
      });

      sentimentCard.appendChild(barContainer);
      right.appendChild(sentimentCard);
      body.appendChild(right);

      printable.appendChild(body);

      const footer = document.createElement('div');
      footer.style.marginTop = '18px';
      footer.style.fontSize = '10px';
      footer.style.color = '#6B7280';
      footer.innerText = 'Generated by JanMatra • Creative one-page summary • AI insights by Gemini';
      printable.appendChild(footer);

      document.body.appendChild(printable);

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);

      const canvas = await html2canvas(printable as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = (pdf as any).getImageProperties(imgData);
      const imgWidth = pageWidth;
      const imgHeight = (imgProps.height * pageWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));

      pdf.save(`${slugify(report.sourceTitle || report.title)}-report.pdf`);
      document.body.removeChild(printable);

    } catch (err) {
        console.error('Error generating PDF:', err);
        alert('Failed to generate PDF. Check console for details.');
      } finally {
        setGeneratingPDF(null);
      }
    };

    function getGradientForLabel(label: string) {
      switch (label.toLowerCase()) {
      case 'positive': return 'linear-gradient(90deg,#34D399,#10B981)';
      case 'negative': return 'linear-gradient(90deg,#FB7185,#EF4444)';
      case 'neutral': return 'linear-gradient(90deg,#FBBF24,#F59E0B)';
      case 'suggestive': return 'linear-gradient(90deg,#C084FC,#7C3AED)';
      default: return 'linear-gradient(90deg,#CBD5E1,#94A3B8)';
      }
    }

    function slugify(text: string) {
      return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    function truncate(text: string, maxWords: number) {
      if (!text) return '';
      const words = text.trim().split(/\s+/);
      if (words.length <= maxWords) return text;
      return words.slice(0, maxWords).join(' ') + '…';
    }

    function escapeHtml(unsafe: string) {
      return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    }

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

            <div className="flex-1 min-w-[180px]">
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sentiment" />
                </SelectTrigger>
                <SelectContent>
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
                          variant={report.status === 'Completed' ? 'default' : 'secondary'}
                          className={report.status === 'Completed' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {report.status}
                        </Badge>
                      </div>
                      
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
                          {report.sentiment === 'Positive' && <TrendingUp className="h-4 w-4 text-green-600" />}
                          {report.sentiment === 'Negative' && <TrendingDown className="h-4 w-4 text-red-600" />}
                          {(report.sentiment === 'Neutral' || report.sentiment === 'suggestive') && <TrendingUp className="h-4 w-4 text-yellow-600" />}
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
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); generatePDFReport(report); }} disabled={generatingPDF === report.id}>
                        {generatingPDF === report.id ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}PDF
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
                      {aiSuggestions.map((suggestion: string | { text: string }, index) => (
                        <div key={index} className="p-3 bg-purple-50 rounded-lg border-l-2 border-purple-200">
                          <div className="flex items-start gap-2">
                            <span className="text-purple-600 font-medium text-sm">{index + 1}.</span>
                            <p className="text-sm text-gray-700 flex-1">
                              {typeof suggestion === 'string' ? suggestion : suggestion.text}
                            </p>
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}