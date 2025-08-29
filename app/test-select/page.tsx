'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function TestSelectPage() {
  const [value, setValue] = useState('')

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Select Component Test</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Test Select</label>
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Option 1</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
              <SelectItem value="option3">Option 3</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-4 bg-gray-100 rounded">
          <p><strong>Selected value:</strong> {value || 'None'}</p>
        </div>

        <div className="p-4 bg-blue-100 rounded">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ul className="text-sm space-y-1">
            <li>• Click on the select dropdown</li>
            <li>• Try to select different options</li>
            <li>• Check if the dropdown opens and closes properly</li>
            <li>• Verify the selected value updates</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
