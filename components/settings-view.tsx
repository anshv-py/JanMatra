'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Shield, 
  Download, 
  Key, 
  Globe,
  Database,
  Save,
  TestTube,
  CheckCircle,
  XCircle,
  Loader2,
  Plug,
  Server,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/components/providers';
import { toast } from 'sonner';
import { Sidebar } from '@/components/sidebar';

interface DatabaseConnection {
  url: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastConnected?: Date;
  connectionInfo?: {
    serverStatus: string;
    databaseConnected: boolean;
    modelsLoaded: boolean;
    availableSources?: string[];
  };
  error?: string;
}

export function SettingsView() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Database connection state
  const [dbConnection, setDbConnection] = useState<DatabaseConnection>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('db-connection');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Error parsing saved connection:', e);
        }
      }
    }
    
    return {
      url: 'http://localhost:8000',
      status: 'disconnected'
    };
  });

  // Save connection state to localStorage [web:89]
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('db-connection', JSON.stringify(dbConnection));
    }
  }, [dbConnection]);

  // Main database connection function [web:93][web:97]
  const connectToDatabase = async () => {
    if (!dbConnection.url.trim()) {
      toast.error('Please enter your API URL');
      return;
    }

    // Validate URL format
    let apiUrl: string;
    try {
      apiUrl = dbConnection.url.replace(/\/$/, '');
      new URL(apiUrl);
    } catch (error) {
      toast.error('Please enter a valid URL (e.g., http://localhost:8000)');
      return;
    }

    // Set connecting status
    setDbConnection(prev => ({
      ...prev,
      status: 'connecting',
      error: undefined
    }));

    try {
      console.log('🔌 Connecting to database API:', apiUrl);
      
      // Step 1: Test basic connectivity
      const healthResponse = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!healthResponse.ok) {
        throw new Error(`Server responded with ${healthResponse.status}`);
      }

      const healthData = await healthResponse.json();
      console.log('✅ Health check passed:', healthData);

      // Step 2: Check database connection status
      const connectionInfo = {
        serverStatus: 'running',
        databaseConnected: healthData.database?.connected || false,
        modelsLoaded: !!(healthData.models?.custom_sentiment || healthData.models?.gemini),
        availableSources: []
      };

      // Step 3: Try to get available data sources
      try {
        const sourcesResponse = await fetch(`${apiUrl}/sources`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (sourcesResponse.ok) {
          const sourcesData = await sourcesResponse.json();
          if (sourcesData.available_source_titles && Array.isArray(sourcesData.available_source_titles)) {
            connectionInfo.availableSources = sourcesData.available_source_titles;
          }
        }
      } catch (sourcesError) {
        console.warn('Could not fetch sources:', sourcesError);
      }

      // Connection successful
      setDbConnection(prev => ({
        ...prev,
        status: 'connected',
        lastConnected: new Date(),
        connectionInfo,
        error: undefined
      }));

      // Success notifications
      toast.success('🎉 Database connection established!');
      
      const statusMessages = [];
      if (connectionInfo.databaseConnected) statusMessages.push('Database Online');
      if (connectionInfo.modelsLoaded) statusMessages.push('ML Models Loaded');
      if (connectionInfo.availableSources && connectionInfo.availableSources.length > 0) {
        statusMessages.push(`${connectionInfo.availableSources.length} Data Sources`);
      }
      
      if (statusMessages.length > 0) {
        toast.info(`Connected: ${statusMessages.join(' • ')}`);
      }

    } catch (error: any) {
      console.error('❌ Database connection failed:', error);
      
      let errorMessage = 'Connection failed';
      
      // Provide specific error messages [web:50][web:103]
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        errorMessage = '🔌 Cannot reach server. Make sure your FastAPI server is running.';
      } else if (error.message.includes('CORS')) {
        errorMessage = '🚫 CORS error. Check your server CORS configuration.';
      } else if (error.message.includes('timeout')) {
        errorMessage = '⏱️ Connection timeout. Server may be slow or unreachable.';
      } else {
        errorMessage = `❌ ${error.message}`;
      }
      
      setDbConnection(prev => ({
        ...prev,
        status: 'error',
        lastConnected: new Date(),
        error: errorMessage
      }));
      
      toast.error(errorMessage);
    }
  };

  // Disconnect from database
  const disconnectFromDatabase = () => {
    setDbConnection(prev => ({
      ...prev,
      status: 'disconnected',
      connectionInfo: undefined,
      error: undefined
    }));
    toast.info('Disconnected from database');
  };

  // Update database URL
  const updateDatabaseUrl = (url: string) => {
    setDbConnection(prev => ({
      ...prev,
      url,
      status: 'disconnected',
      connectionInfo: undefined,
      error: undefined
    }));
  };

  // Get connection status styling
  const getConnectionStatus = () => {
    switch (dbConnection.status) {
      case 'connected':
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
          badge: 'bg-green-100 text-green-800',
          text: 'Connected'
        };
      case 'connecting':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
          badge: 'bg-blue-100 text-blue-800',
          text: 'Connecting...'
        };
      case 'error':
        return {
          icon: <XCircle className="h-4 w-4 text-red-500" />,
          badge: 'bg-red-100 text-red-800',
          text: 'Connection Failed'
        };
      default:
        return {
          icon: <Database className="h-4 w-4 text-gray-400" />,
          badge: 'bg-gray-100 text-gray-800',
          text: 'Disconnected'
        };
    }
  };

  const status = getConnectionStatus();

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your database connection and platform configuration</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Database Connection */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-blue-600" />
                  Database Connection
                </CardTitle>
                <CardDescription>
                  Connect to your FastAPI backend to access comment analysis and data storage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* API URL Input */}
                <div>
                  <Label htmlFor="apiUrl">Backend API URL</Label>
                  <div className="flex gap-2 mt-1">
                    <Input 
                      id="apiUrl" 
                      type="url" 
                      placeholder="http://localhost:8000"
                      value={dbConnection.url}
                      onChange={(e) => updateDatabaseUrl(e.target.value)}
                      disabled={dbConnection.status === 'connecting'}
                      className="flex-1"
                    />
                    {status.icon}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your FastAPI server URL (default: http://localhost:8000)
                  </p>
                </div>

                {/* Connection Status */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {status.icon}
                    <Badge className={status.badge}>
                      {status.text}
                    </Badge>
                  </div>
                  
                  {dbConnection.lastConnected && (
                    <span className="text-xs text-gray-500">
                      Last: {dbConnection.lastConnected.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Error Display */}
                {dbConnection.error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <div className="text-sm text-red-700">
                      {dbConnection.error}
                    </div>
                  </div>
                )}

                {/* Connection Details */}
                {dbConnection.connectionInfo && dbConnection.status === 'connected' && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Connection Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${dbConnection.connectionInfo.databaseConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                        Database: {dbConnection.connectionInfo.databaseConnected ? 'Connected' : 'Disconnected'}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${dbConnection.connectionInfo.modelsLoaded ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        Models: {dbConnection.connectionInfo.modelsLoaded ? 'Loaded' : 'Not Available'}
                      </div>
                      {dbConnection.connectionInfo.availableSources && dbConnection.connectionInfo.availableSources.length > 0 && (
                        <div className="col-span-2 text-green-700">
                          📊 {dbConnection.connectionInfo.availableSources.length} data sources available
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Connection Buttons */}
                <div className="flex gap-2 pt-2">
                  {dbConnection.status === 'connected' ? (
                    <Button 
                      onClick={disconnectFromDatabase}
                      variant="outline"
                      className="flex-1"
                    >
                      <Plug className="mr-2 h-4 w-4" />
                      Disconnect
                    </Button>
                  ) : (
                    <Button 
                      onClick={connectToDatabase}
                      disabled={!dbConnection.url.trim() || dbConnection.status === 'connecting'}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {dbConnection.status === 'connecting' ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Database className="mr-2 h-4 w-4" />
                          Connect to Database
                        </>
                      )}
                    </Button>
                  )}
                  
                  <Button 
                    onClick={() => {
                      navigator.clipboard.writeText(dbConnection.url);
                      toast.success('API URL copied to clipboard');
                    }}
                    variant="outline"
                    disabled={!dbConnection.url.trim()}
                  >
                    Copy URL
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Profile Settings - Simplified for space */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue={user?.name || ''} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={user?.email || ''} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            {/* Connection Quick Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Quick Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Server</span>
                  <Badge className={status.badge}>{status.text}</Badge>
                </div>
                
                {dbConnection.connectionInfo && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Database</span>
                      <Badge className={dbConnection.connectionInfo.databaseConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {dbConnection.connectionInfo.databaseConnected ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">ML Models</span>
                      <Badge className={dbConnection.connectionInfo.modelsLoaded ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {dbConnection.connectionInfo.modelsLoaded ? 'Ready' : 'N/A'}
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                  <Key className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
                
                <div className="text-center">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Account Verified
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Save Settings */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Database Connection Settings</p>
                <p className="text-sm text-gray-600">
                  Connection settings are automatically saved
                </p>
              </div>
              <Button 
                onClick={() => toast.success('Settings saved successfully')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
