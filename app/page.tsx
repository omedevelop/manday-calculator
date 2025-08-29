import Link from 'next/link'
import { Plus, Calculator, Users, Settings, FileText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Manday Calculator
        </h1>
        <p className="text-lg text-gray-600">
          Calculate project costs, pricing, and team allocation
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link href="/projects/new">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">New Project</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create a new project with team allocation and pricing
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/rate-card">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                <Calculator className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Rate Card</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Manage roles, levels, and daily rates
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/team">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Team Library</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Manage team members and their default rates
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/templates">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle className="text-lg">Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Save and load project templates
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Projects */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Recent Projects</h2>
          <Link href="/projects">
            <Button variant="outline">View All Projects</Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sample project cards - these would be populated from the database */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">E-commerce Platform</CardTitle>
              <CardDescription>Client: TechCorp Inc.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-green-600 font-medium">Active</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Team:</span>
                  <span className="font-medium">5 members</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Timeline:</span>
                  <span className="font-medium">45 days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Budget:</span>
                  <span className="font-medium">฿450,000</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mobile App</CardTitle>
              <CardDescription>Client: StartupXYZ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-blue-600 font-medium">Planning</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Team:</span>
                  <span className="font-medium">3 members</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Timeline:</span>
                  <span className="font-medium">30 days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Budget:</span>
                  <span className="font-medium">฿280,000</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Website Redesign</CardTitle>
              <CardDescription>Client: MarketingPro</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-gray-600 font-medium">Completed</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Team:</span>
                  <span className="font-medium">4 members</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Timeline:</span>
                  <span className="font-medium">25 days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Budget:</span>
                  <span className="font-medium">฿320,000</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-gray-600">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">12</div>
            <p className="text-sm text-gray-500 mt-1">+2 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-gray-600">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">28</div>
            <p className="text-sm text-gray-500 mt-1">+3 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-gray-600">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">฿2.4M</div>
            <p className="text-sm text-gray-500 mt-1">+15% from last month</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
