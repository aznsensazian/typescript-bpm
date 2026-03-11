'use client';

import React from 'react';
import { Wrench, Database, Shield, Bell, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Configure platform settings and preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Globe className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">General</h3>
                <p className="text-sm text-gray-500">Platform name and branding</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Platform Name</span>
                <span className="font-medium">ProcessFlow BPM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Version</span>
                <Badge variant="outline">1.0.0</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Environment</span>
                <Badge variant="info">Development</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <Database className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Database</h3>
                <p className="text-sm text-gray-500">Database configuration</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Provider</span>
                <span className="font-medium">SQLite</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ORM</span>
                <span className="font-medium">Prisma</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <Badge variant="success">Connected</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Authentication</h3>
                <p className="text-sm text-gray-500">Auth provider settings</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Provider</span>
                <span className="font-medium">NextAuth.js</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Strategy</span>
                <span className="font-medium">JWT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Credentials</span>
                <Badge variant="success">Enabled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50">
                <Bell className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-500">Notification delivery settings</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">In-App</span>
                <Badge variant="success">Enabled</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <Badge variant="default">Not configured</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
