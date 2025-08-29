'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CSVImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface ImportPreview {
  preview: boolean
  summary: {
    total: number
    valid: number
    invalid: number
    created?: number
    failed?: number
  }
  validSample?: any[]
  invalidSample?: Array<{
    row: number
    data: any
    errors: string[]
  }>
  created?: number
  errors?: Array<{
    row: number
    name: string
    error: string
  }>
  invalidRows?: Array<{
    row: number
    data: any
    errors: string[]
  }>
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete'

export function CSVImportDialog({ open, onOpenChange, onSuccess }: CSVImportDialogProps) {
  const [step, setStep] = useState<ImportStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetDialog = () => {
    setStep('upload')
    setFile(null)
    setPreview(null)
    setDragActive(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    resetDialog()
    onOpenChange(false)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (selectedFile: File) => {
    // Validate file
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      alert('Please select a CSV file')
      return
    }
    
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setFile(selectedFile)
    handlePreview(selectedFile)
  }

  const handlePreview = async (file: File) => {
    setStep('preview')
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/team/import', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data: ImportPreview = await response.json()
        setPreview(data)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to preview CSV')
        setStep('upload')
      }
    } catch (error) {
      console.error('Error previewing CSV:', error)
      alert('Failed to preview CSV')
      setStep('upload')
    }
  }

  const handleImport = async () => {
    if (!file) return

    setStep('importing')
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/team/import?commit=true', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data: ImportPreview = await response.json()
        setPreview(data)
        setStep('complete')
        onSuccess()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to import CSV')
        setStep('preview')
      }
    } catch (error) {
      console.error('Error importing CSV:', error)
      alert('Failed to import CSV')
      setStep('preview')
    }
  }

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Import Team Members</h3>
        <p className="text-muted-foreground">
          Upload a CSV file to import multiple team members at once
        </p>
      </div>

      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          dragActive ? "border-blue-500 bg-blue-50" : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm text-muted-foreground mb-4">
          Drag and drop your CSV file here, or click to browse
        </p>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          Choose File
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <h4 className="font-medium text-foreground">CSV Format Requirements:</h4>
        <ul className="space-y-1 pl-4">
          <li>• Headers: name, role, level, defaultRatePerDay, notes, status</li>
          <li>• Level: Team Lead, Senior, or Junior</li>
          <li>• Status: Active or Inactive (optional, defaults to Active)</li>
          <li>• Rate: Positive number</li>
          <li>• Maximum file size: 5MB</li>
          <li>• Maximum rows: 5,000</li>
        </ul>
      </div>
    </div>
  )

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Import Preview</h3>
        <p className="text-muted-foreground">
          Review the data before importing
        </p>
      </div>

      {preview && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{preview.summary.total}</div>
                <p className="text-sm text-muted-foreground">Total Rows</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-600">{preview.summary.valid}</div>
                <p className="text-sm text-muted-foreground">Valid Rows</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-red-600">{preview.summary.invalid}</div>
                <p className="text-sm text-muted-foreground">Invalid Rows</p>
              </CardContent>
            </Card>
          </div>

          {/* Valid Sample */}
          {preview.validSample && preview.validSample.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Valid Rows (showing first 20)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Rate/Day</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.validSample.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.roleName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.level.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell>฿{row.defaultRatePerDay.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={row.status === 'ACTIVE' ? 'success' : 'secondary'}>
                            {row.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Invalid Sample */}
          {preview.invalidSample && preview.invalidSample.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <XCircle className="h-5 w-5 mr-2" />
                  Invalid Rows (showing first 20)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {preview.invalidSample.map((row, index) => (
                    <div key={index} className="border rounded p-3 bg-red-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Row {row.row}</span>
                        <Badge variant="destructive">Invalid</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Data: {Array.isArray(row.data) ? row.data.join(', ') : JSON.stringify(row.data)}
                      </div>
                      <div className="space-y-1">
                        {row.errors.map((error, errorIndex) => (
                          <div key={errorIndex} className="text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )

  const renderImportingStep = () => (
    <div className="text-center py-8">
      <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
      <h3 className="text-lg font-semibold mb-2">Importing...</h3>
      <p className="text-muted-foreground">
        Please wait while we import your team members
      </p>
    </div>
  )

  const renderCompleteStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Import Complete!</h3>
        <p className="text-muted-foreground">
          Your team members have been imported successfully
        </p>
      </div>

      {preview && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-600">{preview.created || 0}</div>
                <p className="text-sm text-muted-foreground">Members Created</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-red-600">{(preview.errors?.length || 0) + (preview.invalidRows?.length || 0)}</div>
                <p className="text-sm text-muted-foreground">Errors</p>
              </CardContent>
            </Card>
          </div>

          {/* Errors */}
          {((preview.errors && preview.errors.length > 0) || (preview.invalidRows && preview.invalidRows.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-amber-600">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Issues Found
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {preview.errors?.map((error, index) => (
                    <div key={`error-${index}`} className="text-sm text-amber-600">
                      Row {error.row} ({error.name}): {error.error}
                    </div>
                  ))}
                  {preview.invalidRows?.map((row, index) => (
                    <div key={`invalid-${index}`} className="text-sm text-red-600">
                      Row {row.row}: {row.errors.join(', ')}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Team Members</DialogTitle>
          <DialogDescription>
            Import multiple team members from a CSV file
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && renderUploadStep()}
        {step === 'preview' && renderPreviewStep()}
        {step === 'importing' && renderImportingStep()}
        {step === 'complete' && renderCompleteStep()}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button 
                onClick={handleImport}
                disabled={!preview || preview.summary.valid === 0}
              >
                Import {preview?.summary.valid || 0} Members
              </Button>
            </>
          )}
          {step === 'complete' && (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
