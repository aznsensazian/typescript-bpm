'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Workflow, ListChecks } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function GovernancePage() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Process Governance</h1>
        </div>
        <p className="text-blue-100 text-lg">
          Define approval workflows and manage governance instances
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Link href="/governance/workflows">
          <Card className="group h-full cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex flex-col items-center p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                <Workflow className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Workflows</h3>
              <p className="mt-2 text-sm text-gray-500">
                Create and manage governance workflows with approval steps, reviews, and notifications
              </p>
              <Button variant="outline" className="mt-4">
                Manage Workflows
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/governance/instances">
          <Card className="group h-full cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex flex-col items-center p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600 group-hover:bg-green-100 transition-colors">
                <ListChecks className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Instances</h3>
              <p className="mt-2 text-sm text-gray-500">
                Track and review active governance instances, approve or reject process submissions
              </p>
              <Button variant="outline" className="mt-4">
                View Instances
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
