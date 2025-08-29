'use client'

import { useState, useEffect } from 'react'
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

export default function RateCardPage() {
  const [rateCard, setRateCard] = useState<RateCardRole[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchRateCard()
  }, [])

  const fetchRateCard = async () => {
    try {
      const response = await fetch('/api/rate-card')
      if (response.ok) {
        const data = await response.json()
        setRateCard(data)
      }
    } catch (error) {
      console.error('Error fetching rate card:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateTier = (roleId: string, level: string, field: string, value: any) => {
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
  }

  const saveRateCard = async () => {
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
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
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
                              <Input
                                type="number"
                                value={tier.pricePerDay}
                                onChange={(e) => updateTier(role.id, level, 'pricePerDay', parseInt(e.target.value) || 0)}
                                className="w-24 text-center"
                                min="0"
                              />
                              <div className="flex items-center justify-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={tier.active}
                                  onChange={(e) => updateTier(role.id, level, 'active', e.target.checked)}
                                  className="rounded"
                                />
                                <span className="text-xs text-gray-500">Active</span>
                              </div>
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
