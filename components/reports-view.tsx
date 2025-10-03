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
      printable.style.padding = '60px';
      printable.style.boxSizing = 'border-box';
      printable.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      printable.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      printable.style.color = '#111827';
      printable.style.position = 'fixed';
      printable.style.left = '-20000px';
      printable.style.top = '0';

      // Decorative elements
      const decorCircle1 = document.createElement('div');
      decorCircle1.style.position = 'absolute';
      decorCircle1.style.width = '400px';
      decorCircle1.style.height = '400px';
      decorCircle1.style.borderRadius = '50%';
      decorCircle1.style.background = 'rgba(255, 255, 255, 0.1)';
      decorCircle1.style.top = '-200px';
      decorCircle1.style.right = '-200px';
      decorCircle1.style.pointerEvents = 'none';
      printable.appendChild(decorCircle1);

      const decorCircle2 = document.createElement('div');
      decorCircle2.style.position = 'absolute';
      decorCircle2.style.width = '300px';
      decorCircle2.style.height = '300px';
      decorCircle2.style.borderRadius = '50%';
      decorCircle2.style.background = 'rgba(255, 255, 255, 0.08)';
      decorCircle2.style.bottom = '-150px';
      decorCircle2.style.left = '-150px';
      decorCircle2.style.pointerEvents = 'none';
      printable.appendChild(decorCircle2);

      // Main content container
      const contentWrapper = document.createElement('div');
      contentWrapper.style.position = 'relative';
      contentWrapper.style.zIndex = '1';
      contentWrapper.style.background = 'white';
      contentWrapper.style.borderRadius = '24px';
      contentWrapper.style.padding = '48px';
      contentWrapper.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.3)';

      const headerBar = document.createElement('div');
      headerBar.style.height = '6px';
      headerBar.style.background = 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)';
      headerBar.style.borderRadius = '3px';
      headerBar.style.marginBottom = '32px';
      contentWrapper.appendChild(headerBar);

      const header = document.createElement('div');
      header.style.marginBottom = '24px';

      const titleSection = document.createElement('div');
      titleSection.innerHTML = `
        <h1 style="margin:0 0 12px 0; font-size:32px; font-weight:800; letter-spacing:-0.5px; line-height:1.2; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; word-wrap: break-word; overflow-wrap: break-word;">${escapeHtml(report.title)}</h1>
        <div style="font-size:14px; color:#6B7280; font-weight:500;">Source: <span style="color:#667eea; font-weight:600;">${escapeHtml(report.sourceTitle)}</span></div>
      `;
      header.appendChild(titleSection);

      const metaBar = document.createElement('div');
      metaBar.style.display = 'flex';
      metaBar.style.gap = '24px';
      metaBar.style.marginTop = '20px';
      metaBar.style.padding = '16px 0';

      const dateBox = document.createElement('div');
      dateBox.innerHTML = `
        <div style="font-size:11px; color:#9CA3AF; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Date</div>
        <div style="font-size:14px; color:#111827; font-weight:700;">${format(new Date(report.date), 'PPP')}</div>
      `;
      metaBar.appendChild(dateBox);

      const responsesBox = document.createElement('div');
      responsesBox.innerHTML = `
        <div style="font-size:11px; color:#9CA3AF; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Responses</div>
        <div style="font-size:14px; color:#111827; font-weight:700;">${report.responses.toLocaleString()}</div>
      `;
      metaBar.appendChild(responsesBox);

      header.appendChild(metaBar);
      contentWrapper.appendChild(header);

      // Main body layout
      const body = document.createElement('div');
      body.style.display = 'flex';
      body.style.gap = '24px';

      // Left column (Summary + AI Insights)
      const left = document.createElement('div');
      left.style.flex = '1 1 58%';
      left.style.display = 'flex';
      left.style.flexDirection = 'column';
      left.style.gap = '20px';

      // Summary card
      const summaryCard = document.createElement('div');
      summaryCard.style.padding = '24px';
      summaryCard.style.borderRadius = '16px';
      summaryCard.style.background = 'linear-gradient(135deg, #fefefe 0%, #f9fafb 100%)';
      summaryCard.style.border = '2px solid #e5e7eb';
      summaryCard.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.04)';

      const summaryHeader = document.createElement('div');
      summaryHeader.style.display = 'flex';
      summaryHeader.style.alignItems = 'center';
      summaryHeader.style.marginBottom = '16px';
      summaryHeader.innerHTML = `
        <div style="width:4px; height:24px; background:linear-gradient(180deg, #667eea 0%, #764ba2 100%); border-radius:2px; margin-right:12px;"></div>
        <div style="font-size:14px; color:#667eea; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Summary</div>
      `;
      summaryCard.appendChild(summaryHeader);

      const summaryText = document.createElement('div');
      summaryText.style.fontSize = '15px';
      summaryText.style.lineHeight = '1.7';
      summaryText.style.color = '#374151';
      summaryText.innerText = truncate(report.summary || '', 500);
      summaryCard.appendChild(summaryText);
      left.appendChild(summaryCard);
      body.appendChild(left);

      const right = document.createElement('div');
      right.style.flex = '1 1 42%';
      right.style.display = 'flex';
      right.style.flexDirection = 'column';
      right.style.gap = '20px';

      // AI Insights card
      const insightsCard = document.createElement('div');
      insightsCard.style.padding = '24px';
      insightsCard.style.borderRadius = '16px';
      insightsCard.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      insightsCard.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.25)';

      const insightsHeader = document.createElement('div');
      insightsHeader.style.display = 'flex';
      insightsHeader.style.alignItems = 'center';
      insightsHeader.style.marginBottom = '16px';
      insightsHeader.innerHTML = `
        <div style="font-size:16px; color:white; font-weight:700; text-transform:uppercase; letter-spacing:0.8px;">🤖 AI Insights</div>
      `;
      insightsCard.appendChild(insightsHeader);

      const insightsList = document.createElement('div');
      insightsList.style.display = 'flex';
      insightsList.style.flexDirection = 'column';
      insightsList.style.gap = '12px';

      const useSuggestions = (aiSuggestions && aiSuggestions.length > 0) ? aiSuggestions : ['No suggestions available'];
      useSuggestions.slice(0, 4).forEach((s, i) => {
        const insightItem = document.createElement('div');
        insightItem.style.display = 'flex';
        insightItem.style.gap = '12px';
        insightItem.style.alignItems = 'flex-start';
        
        const numberBadge = document.createElement('div');
        numberBadge.style.minWidth = '28px';
        numberBadge.style.height = '28px';
        numberBadge.style.borderRadius = '50%';
        numberBadge.style.background = 'rgba(255, 255, 255, 0.25)';
        numberBadge.style.display = 'flex';
        numberBadge.style.alignItems = 'center';
        numberBadge.style.justifyContent = 'center';
        numberBadge.style.fontSize = '13px';
        numberBadge.style.fontWeight = '700';
        numberBadge.style.color = 'white';
        numberBadge.innerText = `${i + 1}`;
        insightItem.appendChild(numberBadge);

        const text = document.createElement('div');
        text.style.fontSize = '14px';
        text.style.lineHeight = '1.6';
        text.style.color = 'white';
        text.style.fontWeight = '500';
        text.innerText = s;
        insightItem.appendChild(text);

        insightsList.appendChild(insightItem);
      });

      insightsCard.appendChild(insightsList);

      // Wordcloud card
      const wcCard = document.createElement('div');
      wcCard.style.padding = '20px';
      wcCard.style.borderRadius = '16px';
      wcCard.style.background = 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)';
      wcCard.style.border = '2px solid #e5e7eb';
      wcCard.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.04)';
      wcCard.style.textAlign = 'center';

      const wcHeader = document.createElement('div');
      wcHeader.style.fontSize = '12px';
      wcHeader.style.color = '#667eea';
      wcHeader.style.fontWeight = '700';
      wcHeader.style.textTransform = 'uppercase';
      wcHeader.style.letterSpacing = '1px';
      wcHeader.style.marginBottom = '12px';
      wcHeader.innerText = 'Word Cloud';
      wcCard.appendChild(wcHeader);

      if (report.wordcloudImage) {
        const img = document.createElement('img');
        img.src = report.wordcloudImage;
        img.style.maxWidth = '100%';
        img.style.height = '220px';
        img.style.objectFit = 'contain';
        img.alt = 'wordcloud';
        wcCard.appendChild(img);
      } else {
        const noImg = document.createElement('div');
        noImg.innerText = 'Wordcloud not available';
        noImg.style.color = '#9CA3AF';
        noImg.style.padding = '40px 0';
        noImg.style.fontSize = '14px';
        wcCard.appendChild(noImg);
      }
      right.appendChild(wcCard);

      // Sentiment card
      const sentimentCard = document.createElement('div');
      sentimentCard.style.padding = '20px';
      sentimentCard.style.borderRadius = '16px';
      sentimentCard.style.background = 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)';
      sentimentCard.style.border = '2px solid #e5e7eb';
      sentimentCard.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.04)';

      const sentimentHeader = document.createElement('div');
      sentimentHeader.style.fontSize = '12px';
      sentimentHeader.style.color = '#667eea';
      sentimentHeader.style.fontWeight = '700';
      sentimentHeader.style.textTransform = 'uppercase';
      sentimentHeader.style.letterSpacing = '1px';
      sentimentHeader.style.marginBottom = '16px';
      sentimentHeader.innerText = 'Sentiment Breakdown';
      sentimentCard.appendChild(sentimentHeader);

      const percentages = (report.sentimentData && (report.sentimentData.percentages || report.sentimentData.distribution?.percentages)) || {};
      const barContainer = document.createElement('div');
      barContainer.style.display = 'flex';
      barContainer.style.flexDirection = 'column';
      barContainer.style.gap = '14px';

      const sentimentLabels = [
        { label: 'Positive', emoji: '😊', color: 'linear-gradient(90deg, #34D399, #10B981)' },
        { label: 'Neutral', emoji: '😐', color: 'linear-gradient(90deg, #FBBF24, #F59E0B)' },
        { label: 'Negative', emoji: '😞', color: 'linear-gradient(90deg, #FB7185, #EF4444)' },
        { label: 'Suggestive', emoji: '💡', color: 'linear-gradient(90deg, #C084FC, #A855F7)' }
      ];

      sentimentLabels.forEach(({ label, emoji, color }) => {
        const percent = percentages[label] !== undefined ? Number(percentages[label]) : 0;
        
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.flexDirection = 'column';
        row.style.gap = '6px';

        const topRow = document.createElement('div');
        topRow.style.display = 'flex';
        topRow.style.justifyContent = 'space-between';
        topRow.style.alignItems = 'center';

        const lbl = document.createElement('div');
        lbl.style.fontSize = '13px';
        lbl.style.color = '#374151';
        lbl.style.fontWeight = '600';
        lbl.innerHTML = `${emoji} ${label}`;
        topRow.appendChild(lbl);

        const pct = document.createElement('div');
        pct.style.fontSize = '14px';
        pct.style.color = '#111827';
        pct.style.fontWeight = '700';
        pct.innerText = `${percent}%`;
        topRow.appendChild(pct);

        row.appendChild(topRow);

        const barWrap = document.createElement('div');
        barWrap.style.height = '12px';
        barWrap.style.background = '#F3F4F6';
        barWrap.style.borderRadius = '8px';
        barWrap.style.overflow = 'hidden';
        barWrap.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.06)';

        const bar = document.createElement('div');
        bar.style.height = '100%';
        bar.style.width = `${Math.max(1, Math.min(100, percent))}%`;
        bar.style.background = color;
        bar.style.borderRadius = '8px';
        bar.style.transition = 'width 0.3s ease';
        barWrap.appendChild(bar);

        row.appendChild(barWrap);
        barContainer.appendChild(row);
      });

      sentimentCard.appendChild(barContainer);
      right.appendChild(sentimentCard);
      right.appendChild(insightsCard);
      body.appendChild(right);

      contentWrapper.appendChild(body);

      // Footer
      const footer = document.createElement('div');
      footer.style.marginTop = '32px';
      footer.style.paddingTop = '20px';
      footer.style.borderTop = '1px solid #e5e7eb';
      footer.style.display = 'flex';
      footer.style.justifyContent = 'space-between';
      footer.style.alignItems = 'center';
      footer.style.fontSize = '11px';
      footer.style.color = '#9CA3AF';

      const footerLeft = document.createElement('div');
      footerLeft.innerHTML = 'Generated by <span style="color:#667eea; font-weight:700;">JanMatra</span> • AI insights by Gemini';
      footer.appendChild(footerLeft);

      const footerRight = document.createElement('div');
      footerRight.innerHTML = '🔒 Confidential Report';
      footer.appendChild(footerRight);

      contentWrapper.appendChild(footer);
      printable.appendChild(contentWrapper);
      document.body.appendChild(printable);

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);

      const canvas = await html2canvas(printable as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: null
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