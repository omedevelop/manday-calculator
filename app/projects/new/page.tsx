'use client'

import { useState } from 'react'
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
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { z } from 'zod'

type ProjectFormData = z.infer<typeof projectSchema>

const currencies = [
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
]

export default function NewProjectPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      currencyCode: 'THB',
      currencySymbol: '฿',
      hoursPerDay: 7,
      taxEnabled: false,
      taxPercent: 0,
      pricingMode: 'DIRECT',
      executionDays: 0,
      bufferDays: 0,
      finalDays: 0,
      calendarMode: false,
      workingWeek: 'MON_FRI',
    }
  })

  const watchCurrency = watch('currencyCode')
  const watchTaxEnabled = watch('taxEnabled')
  const watchPricingMode = watch('pricingMode')
  const watchWorkingWeek = watch('workingWeek')

  // Update currency symbol when currency code changes
  const handleCurrencyChange = (currencyCode: string) => {
    console.log('Currency changed to:', currencyCode) // Debug log
    const currency = currencies.find(c => c.code === currencyCode)
    if (currency) {
      setValue('currencyCode', currencyCode)
      setValue('currencySymbol', currency.symbol)
    }
  }

  const handlePricingModeChange = (value: string) => {
    console.log('Pricing mode changed to:', value) // Debug log
    setValue('pricingMode', value as any, { shouldDirty: true })
  }

  const handleWorkingWeekChange = (value: string) => {
    console.log('Working week changed to:', value) // Debug log
    setValue('workingWeek', value as any, { shouldDirty: true })
  }

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create project')
      }

      const project = await response.json()
      router.push(`/projects/${project.id}`)
    } catch (error) {
      console.error('Error creating project:', error)
      // You could add toast notifications here
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Debug Information */}
      <div className="mb-4 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <p>Currency: {watchCurrency}</p>
        <p>Pricing Mode: {watchPricingMode}</p>
        <p>Working Week: {watchWorkingWeek}</p>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Project</h1>
          <p className="text-gray-600 mt-1">Create a new project for cost calculation</p>
        </div>
      </div>

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
                  <SelectTrigger id="currency">
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
                <Select value={watchWorkingWeek} onValueChange={handleWorkingWeekChange}>
                  <SelectTrigger id="workingWeek">
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
                <Select value={watchPricingMode} onValueChange={handlePricingModeChange}>
                  <SelectTrigger id="pricingMode">
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
                  checked={watchTaxEnabled}
                  onCheckedChange={(checked) => setValue('taxEnabled', checked, { shouldDirty: true })}
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
                  checked={!!watch('calendarMode')}
                  onCheckedChange={(checked) => setValue('calendarMode', checked, { shouldDirty: true })}
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
          <Link href="/projects">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>Creating...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Project
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}


