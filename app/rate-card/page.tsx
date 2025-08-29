'use client'

import React, { useState, useEffect, useRef, useCallback, memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, Plus, Trash2 } from 'lucide-react'
import { getRoleLevelColor } from '@/lib/utils'

interface RateCardTier {
  id: string
  roleId: string
  level: 'TEAM_LEAD' | 'SENIOR' | 'JUNIOR'
  pricePerDay: number
  active: boolean
}

interface RateCardRole {
  id: string
  name: string
  tiers: RateCardTier[]
}

// Optimized input components with local state to reduce parent re-renders
const PriceInput = memo(function PriceInput({
  initialValue,
  onSave,
  disabled = false
}: {
  initialValue: number
  onSave: (value: number) => void
  disabled?: boolean
}) {
  const [value, setValue] = useState(initialValue)
  const debounceRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || 0
    setValue(newValue)
    
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSave(newValue)
    }, 300)
  }, [onSave])

  return (
    <Input
      type="number"
      value={value}
      onChange={handleChange}
      className="w-24 text-center"
      min="0"
      disabled={disabled}
    />
  )
})

const ActiveCheckbox = memo(function ActiveCheckbox({
  initialChecked,
  onToggle,
  disabled = false
}: {
  initialChecked: boolean
  onToggle: (checked: boolean) => void
  disabled?: boolean
}) {
  const [checked, setChecked] = useState(initialChecked)

  useEffect(() => {
    setChecked(initialChecked)
  }, [initialChecked])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked
    setChecked(newChecked)
    onToggle(newChecked)
  }, [onToggle])

  return (
    <div className="flex items-center justify-center space-x-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        className="rounded"
        disabled={disabled}
      />
      <span className="text-xs text-gray-500">Active</span>
    </div>
  )
})

export default function RateCardPage() {
  const [rateCard, setRateCard] = useState<RateCardRole[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRateCard()
  }, [])

  const fetchRateCard = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const response = await fetch('/api/rate-card', { signal: controller.signal })
      clearTimeout(timeout)
      if (response.ok) {
        const data = await response.json()
        setRateCard(data)
        setError(null)
      } else {
        setError('Failed to load rate card')
      }
    } catch (error) {
      console.error('Error fetching rate card:', error)
      setError('Unable to reach the server')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateTier = useCallback((roleId: string, level: string, field: string, value: any) => {
    setRateCard(prev => prev.map(role => {
      if (role.id === roleId) {
        return {
          ...role,
          tiers: role.tiers.map(tier => {
            if (tier.level === level) {
              return { ...tier, [field]: value }
            }
            return tier
          })
        }
      }
      return role
    }))
  }, [])

  const saveRateCard = useCallback(async () => {
    setSaving(true)
    try {
      const allTiers = rateCard.flatMap(role => role.tiers)
      const response = await fetch('/api/rate-card', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allTiers),
      })

      if (response.ok) {
        alert('Rate card saved successfully!')
      } else {
        alert('Failed to save rate card')
      }
    } catch (error) {
      console.error('Error saving rate card:', error)
      alert('Failed to save rate card')
    } finally {
      setSaving(false)
    }
  }, [rateCard])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">{error}</div>
        <div className="text-center text-sm text-gray-500 mt-2">Please check your database config and try again.</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Rate Card</h1>
        <p className="text-lg text-gray-600">
          Manage roles, levels, and daily rates for your team
        </p>
      </div>

      {/* Rate Card Table */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daily Rates by Role & Level</CardTitle>
              <CardDescription>
                Set daily rates for different roles and experience levels
              </CardDescription>
            </div>
            <Button onClick={saveRateCard} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Role</th>
                  <th className="text-center py-3 px-4 font-semibold">Team Lead</th>
                  <th className="text-center py-3 px-4 font-semibold">Senior</th>
                  <th className="text-center py-3 px-4 font-semibold">Junior</th>
                </tr>
              </thead>
              <tbody>
                {rateCard.map((role) => (
                  <tr key={role.id} className="border-b">
                    <td className="py-4 px-4 font-medium">{role.name}</td>
                    {['TEAM_LEAD', 'SENIOR', 'JUNIOR'].map((level) => {
                      const tier = role.tiers.find(t => t.level === level)
                      return (
                        <td key={level} className="py-4 px-4 text-center">
                          {tier ? (
                            <div className="space-y-2">
                                <PriceInput
                                  initialValue={tier.pricePerDay}
                                  onSave={(value) => updateTier(role.id, level, 'pricePerDay', value)}
                                  disabled={saving}
                                />
                                <ActiveCheckbox
                                  initialChecked={tier.active}
                                  onToggle={(checked) => updateTier(role.id, level, 'active', checked)}
                                  disabled={saving}
                                />
                              </div>
                            ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Rate Card Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Rate Card Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getRoleLevelColor('TEAM_LEAD')}`}></div>
              <span className="text-sm">Team Lead: Project management & technical leadership</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getRoleLevelColor('SENIOR')}`}></div>
              <span className="text-sm">Senior: Independent contributor with 3+ years experience</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getRoleLevelColor('JUNIOR')}`}></div>
              <span className="text-sm">Junior: Entry-level with supervision needed</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Currency & Billing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Base Currency:</span>
              <span className="font-medium">Thai Baht (THB)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Billing Unit:</span>
              <span className="font-medium">Per Day (8 hours)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Rate Range:</span>
              <span className="font-medium">฿2,500 - ฿4,500</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
