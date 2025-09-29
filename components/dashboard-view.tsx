'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Users, FileText, ChartBar as BarChart3, MessageSquare, ArrowRight, Calendar, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function DashboardView() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
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
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Feedback
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">2,847</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600">+12.5% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Positive Sentiment
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">67.3%</div>
            <Progress value={67.3} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Negative Sentiment
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">9.7%</div>
            <Progress value={9.7} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Regulations
            </CardTitle>
            <FileText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">24</div>
            <div className="flex items-center mt-2">
              <Badge variant="secondary" className="text-xs">3 pending review</Badge>
            </div>
          </CardContent>
        </Card>
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Positive</span>
                </div>
                <span className="text-sm font-bold">67.3%</span>
              </div>
              <Progress value={57.3} className="bg-green-100" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium">Neutral</span>
                </div>
                <span className="text-sm font-bold">18.0%</span>
              </div>
              <Progress value={18} className="bg-yellow-100" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">Negative</span>
                </div>
                <span className="text-sm font-bold">9.7%</span>
              </div>
              <Progress value={9.7} className="bg-red-100" />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
                  <span className="text-sm font-medium">Suggestive</span>
                </div>
                <span className="text-sm font-bold">15.0%</span>
              </div>
              <Progress value={15} className="bg-blue-100" />
            </div>
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
              <div className="text-center space-y-4">
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    { text: 'Healthcare', size: 'text-2xl', color: 'text-blue-600' },
                    { text: 'Education', size: 'text-xl', color: 'text-green-600' },
                    { text: 'Infrastructure', size: 'text-lg', color: 'text-purple-600' },
                    { text: 'Environment', size: 'text-xl', color: 'text-teal-600' },
                    { text: 'Safety', size: 'text-lg', color: 'text-red-600' },
                    { text: 'Economy', size: 'text-2xl', color: 'text-orange-600' }
                  ].map((word, index) => (
                    <span key={index} className={`${word.size} ${word.color} font-semibold`}>
                      {word.text}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-500">Interactive word cloud visualization</p>
              </div>
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