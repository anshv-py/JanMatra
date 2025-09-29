'use client';

import { useState } from 'react';
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
  Save
} from 'lucide-react';
import { useAuth } from '@/components/providers';
import { toast } from 'sonner';
import { Sidebar } from '@/components/sidebar';

export function SettingsView() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleSaveSettings = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 p-6 space-y-6 overflow-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and platform configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Settings
              </CardTitle>
              <CardDescription>
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue={user?.name || ''} />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="" />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue={user?.email || ''} />
              </div>
              
              <div>
                <Label htmlFor="department">Department</Label>
                <Select defaultValue="policy">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="policy">Policy Analysis</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="communications">Communications</SelectItem>
                    <SelectItem value="admin">Administration</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea 
                  id="bio" 
                  placeholder="Brief description of your role..."
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>


        </div>

        {/* Quick Settings Sidebar */}
        <div className="space-y-6">

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
              
              <Button variant="outline" className="w-full">
                <Shield className="mr-2 h-4 w-4" />
                Two-Factor Auth
              </Button>
              
              <div className="text-center">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Account Verified
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
              
              <Button variant="outline" className="w-full">
                <Globe className="mr-2 h-4 w-4" />
                Privacy Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Settings */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Save Changes</p>
              <p className="text-sm text-gray-600">
                Make sure to save your changes before leaving this page
              </p>
            </div>
            <Button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700">
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