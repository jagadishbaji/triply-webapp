"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


export default function AgentDashboardPage() {
  return (
    <>
   
            <div className="space-y-6">
      {/* Welcome header */}
      <h2 className="text-2xl font-bold">Welcome, Agent 👋</h2>
      <p className="text-muted-foreground">
        Here’s a quick overview of your activity.
      </p>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Shipments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">128</p>
            <p className="text-sm text-muted-foreground">+12 this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">8</p>
            <p className="text-sm text-muted-foreground">3 are urgent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">$2,450</p>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex justify-between">
              <span>Shipment #1023</span>
              <span className="text-muted-foreground">Delivered</span>
            </li>
            <li className="flex justify-between">
              <span>Shipment #1024</span>
              <span className="text-muted-foreground">In Transit</span>
            </li>
            <li className="flex justify-between">
              <span>Shipment #1025</span>
              <span className="text-muted-foreground">Pending</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
   
    </>
    
  );
}
