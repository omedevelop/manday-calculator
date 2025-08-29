'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { projectSchema } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Save, Calculator, Users, Calendar } from 'lucide-react'
import Link from 'next/link'
import { z } from 'zod'

type ProjectFormData = z.infer<typeof projectSchema>

interface Project {
  id: string
  name: string
  client: string
  currencyCode: string
  currencySymbol: string
  hoursPerDay: number
  taxEnabled: boolean
  taxPercent?: number
  pricingMode: string
  proposedPrice?: number
  targetRoiPercent?: number
  targetMarginPercent?: number
  fxNote?: string
  executionDays: number
  bufferDays: number
  finalDays: number
  calendarMode: boolean
  startDate?: string
  endDate?: string
  workingWeek: string
  createdAt: string
  updatedAt: string
  people?: any[]
  holidays?: any[]
  summary?: any
}

const currencies = [
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
]

export default function ProjectEditPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  })

  const watchCurrency = watch('currencyCode')
  const watchTaxEnabled = watch('taxEnabled')
  const watchPricingMode = watch('pricingMode')

  useEffect(() => {
    fetchProject()
  }, [params.id])

  async function fetchProject() {
    try {
      const response = await fetch(`/api/projects/${params.id}`)
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/projects')
          return
        }
        throw new Error('Failed to fetch project')
      }
      
      const data = await response.json()
      setProject(data)
      
      // Reset form with project data
      reset({
        name: data.name,
        client: data.client,
        currencyCode: data.currencyCode,
        currencySymbol: data.currencySymbol,
        hoursPerDay: data.hoursPerDay,
        taxEnabled: data.taxEnabled,
        taxPercent: data.taxPercent || 0,
        pricingMode: data.pricingMode,
        proposedPrice: data.proposedPrice || undefined,
        targetRoiPercent: data.targetRoiPercent || undefined,
        targetMarginPercent: data.targetMarginPercent || undefined,
        fxNote: data.fxNote || '',
        executionDays: data.executionDays,
        bufferDays: data.bufferDays,
        finalDays: data.finalDays,
        calendarMode: data.calendarMode,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        workingWeek: data.workingWeek,
      })
    } catch (error) {
      console.error('Error fetching project:', error)
    } finally {
      setLoading(false)
    }
  }

  // Update currency symbol when currency code changes
  const handleCurrencyChange = (currencyCode: string) => {
    const currency = currencies.find(c => c.code === currencyCode)
    if (currency) {
      setValue('currencyCode', currencyCode)
      setValue('currencySymbol', currency.symbol)
    }
  }

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update project')
      }

      const updatedProject = await response.json()
      setProject(updatedProject)
      // You could add toast notifications here
    } catch (error) {
      console.error('Error updating project:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading project...</div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Project not found</h3>
          <p className="text-gray-600 mb-6">The project you're looking for doesn't exist.</p>
          <Link href="/projects">
            <Button>Back to Projects</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-600 mt-1">{project.client}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calculator className="w-4 h-4 mr-2" />
            Calculate
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="people">
            <Users className="w-4 h-4 mr-2" />
            People ({project.people?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="holidays">
            <Calendar className="w-4 h-4 mr-2" />
            Holidays ({project.holidays?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Project name, client, and currency settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name *</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="Enter project name"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client">Client *</Label>
                    <Input
                      id="client"
                      {...register('client')}
                      placeholder="Enter client name"
                    />
                    {errors.client && (
                      <p className="text-sm text-red-600">{errors.client.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={watchCurrency} onValueChange={handleCurrencyChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.code} - {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hoursPerDay">Hours per Day</Label>
                    <Input
                      id="hoursPerDay"
                      type="number"
                      min="1"
                      max="24"
                      {...register('hoursPerDay', { valueAsNumber: true })}
                    />
                    {errors.hoursPerDay && (
                      <p className="text-sm text-red-600">{errors.hoursPerDay.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workingWeek">Working Week</Label>
                    <Select {...register('workingWeek')} onValueChange={(value) => setValue('workingWeek', value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select working week" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MON_FRI">Monday - Friday</SelectItem>
                        <SelectItem value="MON_SAT">Monday - Saturday</SelectItem>
                        <SelectItem value="SUN_THU">Sunday - Thursday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Tax */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Tax</CardTitle>
                <CardDescription>Configure pricing mode and tax settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="pricingMode">Pricing Mode</Label>
                    <Select {...register('pricingMode')} onValueChange={(value) => setValue('pricingMode', value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pricing mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DIRECT">Direct - Set proposed price directly</SelectItem>
                        <SelectItem value="ROI">ROI - Calculate based on target return</SelectItem>
                        <SelectItem value="MARGIN">Margin - Calculate based on profit margin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {watchPricingMode === 'DIRECT' && (
                    <div className="space-y-2">
                      <Label htmlFor="proposedPrice">Proposed Price</Label>
                      <Input
                        id="proposedPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        {...register('proposedPrice', { valueAsNumber: true })}
                        placeholder="Enter proposed price"
                      />
                      {errors.proposedPrice && (
                        <p className="text-sm text-red-600">{errors.proposedPrice.message}</p>
                      )}
                    </div>
                  )}

                  {watchPricingMode === 'ROI' && (
                    <div className="space-y-2">
                      <Label htmlFor="targetRoiPercent">Target ROI (%)</Label>
                      <Input
                        id="targetRoiPercent"
                        type="number"
                        min="0"
                        step="0.1"
                        {...register('targetRoiPercent', { valueAsNumber: true })}
                        placeholder="Enter target ROI percentage"
                      />
                      {errors.targetRoiPercent && (
                        <p className="text-sm text-red-600">{errors.targetRoiPercent.message}</p>
                      )}
                    </div>
                  )}

                  {watchPricingMode === 'MARGIN' && (
                    <div className="space-y-2">
                      <Label htmlFor="targetMarginPercent">Target Margin (%)</Label>
                      <Input
                        id="targetMarginPercent"
                        type="number"
                        min="0"
                        max="99.99"
                        step="0.1"
                        {...register('targetMarginPercent', { valueAsNumber: true })}
                        placeholder="Enter target margin percentage"
                      />
                      {errors.targetMarginPercent && (
                        <p className="text-sm text-red-600">{errors.targetMarginPercent.message}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="taxEnabled"
                      {...register('taxEnabled')}
                      onCheckedChange={(checked) => setValue('taxEnabled', !!checked)}
                    />
                    <Label htmlFor="taxEnabled">Enable tax calculation</Label>
                  </div>

                  {watchTaxEnabled && (
                    <div className="space-y-2 max-w-xs">
                      <Label htmlFor="taxPercent">Tax Percentage (%)</Label>
                      <Input
                        id="taxPercent"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        {...register('taxPercent', { valueAsNumber: true })}
                        placeholder="Enter tax percentage"
                      />
                      {errors.taxPercent && (
                        <p className="text-sm text-red-600">{errors.taxPercent.message}</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
                <CardDescription>Project duration and schedule settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="executionDays">Execution Days</Label>
                    <Input
                      id="executionDays"
                      type="number"
                      min="0"
                      {...register('executionDays', { valueAsNumber: true })}
                      placeholder="Working days needed"
                    />
                    {errors.executionDays && (
                      <p className="text-sm text-red-600">{errors.executionDays.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bufferDays">Buffer Days</Label>
                    <Input
                      id="bufferDays"
                      type="number"
                      min="0"
                      {...register('bufferDays', { valueAsNumber: true })}
                      placeholder="Additional buffer days"
                    />
                    {errors.bufferDays && (
                      <p className="text-sm text-red-600">{errors.bufferDays.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="finalDays">Final Days</Label>
                    <Input
                      id="finalDays"
                      type="number"
                      min="0"
                      {...register('finalDays', { valueAsNumber: true })}
                      placeholder="Total project days"
                    />
                    {errors.finalDays && (
                      <p className="text-sm text-red-600">{errors.finalDays.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="calendarMode"
                      {...register('calendarMode')}
                      onCheckedChange={(checked) => setValue('calendarMode', !!checked)}
                    />
                    <Label htmlFor="calendarMode">Use calendar mode (with specific dates)</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fxNote">FX Note</Label>
                    <Input
                      id="fxNote"
                      {...register('fxNote')}
                      placeholder="Currency exchange notes (optional)"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="people">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage team allocation and roles for this project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Project people management coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holidays">
          <Card>
            <CardHeader>
              <CardTitle>Project Holidays</CardTitle>
              <CardDescription>Manage holidays and non-working days for this project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Project holidays management coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
