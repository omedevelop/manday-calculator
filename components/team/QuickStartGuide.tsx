'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  UserPlus, 
  Upload, 
  Users, 
  Briefcase, 
  DollarSign, 
  CheckCircle,
  ArrowRight,
  FileText
} from 'lucide-react'

interface QuickStartGuideProps {
  onAddMember: () => void
  onImportCSV: () => void
}

export function QuickStartGuide({ onAddMember, onImportCSV }: QuickStartGuideProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-900">
            <Users className="h-6 w-6" />
            <span>Welcome to Team Management</span>
          </CardTitle>
          <CardDescription className="text-blue-700">
            Build your team library to efficiently manage project assignments and rates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-blue-800 mb-4">
            Team members are the foundation of your project calculations. Add your team to get started with project planning.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onAddMember} size="lg" className="flex-1">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Your First Member
            </Button>
            <Button onClick={onImportCSV} variant="outline" size="lg" className="flex-1">
              <Upload className="h-4 w-4 mr-2" />
              Import from CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Team Management Works</CardTitle>
          <CardDescription>
            Understand the key concepts and workflow for managing your team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold">1. Add Team Members</h4>
              <p className="text-sm text-muted-foreground">
                Create team member profiles with roles, levels, and default rates.
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold">2. Assign to Projects</h4>
              <p className="text-sm text-muted-foreground">
                Use team members in projects with custom rates and utilization.
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold">3. Calculate Costs</h4>
              <p className="text-sm text-muted-foreground">
                Automatically calculate project costs and profitability.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Key Features</CardTitle>
          <CardDescription>
            Everything you need to manage your team effectively.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Role-Based Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Organize team members by roles and experience levels.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Rate Card Integration</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatic rate suggestions from your rate card.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Bulk Operations</h4>
                  <p className="text-sm text-muted-foreground">
                    Import, export, and manage multiple members at once.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Project Integration</h4>
                  <p className="text-sm text-muted-foreground">
                    Seamlessly assign team members to projects.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Status Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Track active and inactive team members.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Advanced Filtering</h4>
                  <p className="text-sm text-muted-foreground">
                    Search and filter by name, role, level, and status.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sample Data */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Team Structure</CardTitle>
          <CardDescription>
            Here's an example of how you might organize your team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">John Doe</p>
                  <p className="text-sm text-muted-foreground">Senior Developer</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">SENIOR</Badge>
                <Badge variant="outline">฿3,500/day</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Jane Smith</p>
                  <p className="text-sm text-muted-foreground">Project Manager</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="default">TEAM LEAD</Badge>
                <Badge variant="outline">฿4,200/day</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Mike Johnson</p>
                  <p className="text-sm text-muted-foreground">Junior Developer</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">JUNIOR</Badge>
                <Badge variant="outline">฿2,800/day</Badge>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Start with your core team members and add more as needed. 
              You can always import additional members from CSV files.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-900">Ready to Get Started?</CardTitle>
          <CardDescription className="text-green-700">
            Choose how you'd like to add your first team member.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onAddMember} size="lg" className="flex-1 bg-green-600 hover:bg-green-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Team Member
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button onClick={onImportCSV} variant="outline" size="lg" className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              Download CSV Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
