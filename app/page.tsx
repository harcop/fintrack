"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Menu, X, Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Copy, Eye, Edit, Trash2, Download, Filter, Calendar, DollarSign, Users, TrendingUp, Loader2, AlertCircle, FileX } from 'lucide-react'

// Types
interface Transaction {
  _id: string
  name: string
  amount: number
  address: string
}

interface ApiResponse {
  total: number
  page: number
  totalPages: number
  transactions: Transaction[]
}

type SortField = "name" | "amount" | "_id"
type SortDirection = "asc" | "desc"

export default function FinTrackDashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // API pagination state
  const [apiData, setApiData] = useState<ApiResponse | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(25)
  
  // Local filtering state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)
  const [amountMin, setAmountMin] = useState("")
  const [amountMax, setAmountMax] = useState("")
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  // Export state
  const [isExporting, setIsExporting] = useState(false)
  const [isStreamExporting, setIsStreamExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [streamExportProgress, setStreamExportProgress] = useState(0)

  // Load data from API
  const loadData = useCallback(async (page: number = 1) => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:4500/transactions?page=${page}&limit=${recordsPerPage}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: ApiResponse = await response.json()
      
      setApiData(data)
      setTransactions(data.transactions)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
      setError("Failed to load transactions. Please ensure the API server is running on localhost:4500")
      setApiData(null)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [recordsPerPage])

  // Load data on component mount and when page/recordsPerPage changes
  useEffect(() => {
    loadData(currentPage)
  }, [loadData, currentPage])

  // Debounced search
  useEffect(() => {
    if (searchQuery) {
      setSearchLoading(true)
      const timer = setTimeout(() => {
        setSearchLoading(false)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setSearchLoading(false)
    }
  }, [searchQuery])

  // Filter and sort transactions (client-side filtering on current page)
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t._id.toLowerCase().includes(query) ||
          t.address.toLowerCase().includes(query) ||
          t.amount.toString().includes(query)
      )
    }

    // Amount filter
    if (amountMin) {
      filtered = filtered.filter(t => t.amount >= parseFloat(amountMin))
    }
    if (amountMax) {
      filtered = filtered.filter(t => t.amount <= parseFloat(amountMax))
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]
      
      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [transactions, searchQuery, amountMin, amountMax, sortField, sortDirection])

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  // Handle records per page change
  const handleRecordsPerPageChange = (newRecordsPerPage: number) => {
    setRecordsPerPage(newRecordsPerPage)
    setCurrentPage(1) // Reset to first page
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Regular export data function
  const exportData = async () => {
    setIsExporting(true)
    setExportProgress(0)
    
    try {
      // Simulate export progress
      const progressSteps = [20, 40, 60, 80, 100]
      
      for (let i = 0; i < progressSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 300))
        setExportProgress(progressSteps[i])
      }
      
      // Call the no-stream export API
      const response = await fetch('http://localhost:4500/export-csv-no-stream')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Get the CSV data
      const csvData = await response.text()
      
      // Create and download file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `users_transaction_no_stream_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setTimeout(() => {
        setIsExporting(false)
        setExportProgress(0)
      }, 500)
    }
  }

  // Stream export data function
  const exportStreamData = async () => {
    setIsStreamExporting(true)
    setStreamExportProgress(0)
    
    try {
      // Simulate progress for stream export
      const progressInterval = setInterval(() => {
        setStreamExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90 // Keep at 90% until download completes
          }
          return prev + 10
        })
      }, 200)
      
      // Create a link to trigger the stream download
      const link = document.createElement('a')
      link.href = 'http://localhost:4500/export-csv'
      link.download = `users_transaction_stream_${new Date().toISOString().split('T')[0]}.csv`
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Complete the progress after a delay
      setTimeout(() => {
        clearInterval(progressInterval)
        setStreamExportProgress(100)
      }, 2000)
      
    } catch (error) {
      console.error('Stream export failed:', error)
    } finally {
      setTimeout(() => {
        setIsStreamExporting(false)
        setStreamExportProgress(0)
      }, 3000)
    }
  }

  // Skeleton loader component
  const SkeletonRow = () => (
    <TableRow>
      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-24" /></TableCell>
      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-32" /></TableCell>
      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-20" /></TableCell>
      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-40" /></TableCell>
      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-12" /></TableCell>
    </TableRow>
  )

  // Calculate pagination info
  const totalRecords = apiData?.total || 0
  const totalPages = apiData?.totalPages || 0
  const currentPageFromApi = apiData?.page || 1

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] pointer-events-none" />

      {/* Header */}
      <header className="relative z-50 border-b border-gray-200 backdrop-blur-xl bg-white/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">FinTrack</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#dashboard" className="text-teal-600 font-medium">
                Dashboard
              </a>
              <a href="#users" className="text-gray-600 hover:text-teal-600 transition-colors">
                Users
              </a>
              <a href="#transactions" className="text-gray-600 hover:text-teal-600 transition-colors">
                Transactions
              </a>
              <a href="#reports" className="text-gray-600 hover:text-teal-600 transition-colors">
                Reports
              </a>
              <a href="#settings" className="text-gray-600 hover:text-teal-600 transition-colors">
                Settings
              </a>
            </nav>

            <div className="hidden md:block">
              <Button className="bg-teal-600 text-white hover:bg-teal-700 font-medium">
                New Transaction
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 p-4">
              <nav className="flex flex-col space-y-4">
                <a href="#dashboard" className="text-teal-600 font-medium">
                  Dashboard
                </a>
                <a href="#users" className="text-gray-600 hover:text-teal-600 transition-colors">
                  Users
                </a>
                <a href="#transactions" className="text-gray-600 hover:text-teal-600 transition-colors">
                  Transactions
                </a>
                <a href="#reports" className="text-gray-600 hover:text-teal-600 transition-colors">
                  Reports
                </a>
                <a href="#settings" className="text-gray-600 hover:text-teal-600 transition-colors">
                  Settings
                </a>
                <Button className="bg-teal-600 text-white hover:bg-teal-700 font-medium w-full">
                  New Transaction
                </Button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative py-8">
        <div className="container mx-auto px-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/70 backdrop-blur-xl border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{totalRecords.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-xl border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Current Page</p>
                    <p className="text-2xl font-bold text-gray-900">{currentPageFromApi}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-xl border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Pages</p>
                    <p className="text-2xl font-bold text-gray-900">{totalPages.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-xl border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Records Per Page</p>
                    <p className="text-2xl font-bold text-gray-900">{recordsPerPage}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions Table */}
          <Card className="bg-white/70 backdrop-blur-xl border-gray-200 shadow-sm">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <CardTitle className="text-xl font-semibold text-gray-900">User Transactions</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={exportData}
                    disabled={isExporting || isStreamExporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? 'Exporting...' : 'Export CSV'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={exportStreamData}
                    disabled={isExporting || isStreamExporting}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    {isStreamExporting ? 'Streaming...' : 'Stream Export'}
                  </Button>
                  <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by name, ID, address, or amount..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-teal-500"
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 text-teal-600 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Input
                    placeholder="Min amount"
                    value={amountMin}
                    onChange={(e) => setAmountMin(e.target.value)}
                    className="w-32 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    type="number"
                  />
                  <Input
                    placeholder="Max amount"
                    value={amountMax}
                    onChange={(e) => setAmountMax(e.target.value)}
                    className="w-32 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    type="number"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={() => loadData(currentPage)} className="bg-teal-600 text-white hover:bg-teal-700">
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-200">
                          <TableHead className="text-gray-700">Transaction ID</TableHead>
                          <TableHead className="text-gray-700">
                            <button
                              onClick={() => handleSort("name")}
                              className="flex items-center space-x-1 hover:text-teal-600 transition-colors"
                            >
                              <span>Name</span>
                              {sortField === "name" && (
                                sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                              )}
                            </button>
                          </TableHead>
                          <TableHead className="text-gray-700">
                            <button
                              onClick={() => handleSort("amount")}
                              className="flex items-center space-x-1 hover:text-teal-600 transition-colors"
                            >
                              <span>Amount</span>
                              {sortField === "amount" && (
                                sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                              )}
                            </button>
                          </TableHead>
                          <TableHead className="text-gray-700">Address</TableHead>
                          <TableHead className="text-gray-700">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          Array.from({ length: recordsPerPage }, (_, i) => <SkeletonRow key={i} />)
                        ) : filteredAndSortedTransactions.length > 0 ? (
                          filteredAndSortedTransactions.map((transaction) => (
                            <TableRow key={transaction._id} className="border-gray-200 hover:bg-gray-50 transition-colors group">
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <span className="font-mono text-sm text-gray-700 truncate max-w-[120px]" title={transaction._id}>
                                    {transaction._id}
                                  </span>
                                  <button
                                    onClick={() => copyToClipboard(transaction._id)}
                                    className="text-gray-400 hover:text-teal-600 transition-colors"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="font-medium text-gray-900">{transaction.name}</span>
                              </TableCell>
                              <TableCell>
                                <span className="font-semibold text-teal-600">
                                  ${transaction.amount.toFixed(2)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-700 truncate max-w-[200px]" title={transaction.address}>
                                    {transaction.address}
                                  </span>
                                  <button
                                    onClick={() => copyToClipboard(transaction.address)}
                                    className="text-gray-400 hover:text-teal-600 transition-colors"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button className="text-gray-400 hover:text-teal-600 transition-colors">
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button className="text-gray-400 hover:text-blue-600 transition-colors">
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button className="text-gray-400 hover:text-red-600 transition-colors">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-12">
                              <div className="flex flex-col items-center">
                                <FileX className="h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
                                <p className="text-gray-600">Try adjusting your search or filters</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {!loading && totalRecords > 0 && (
                    <div className="flex flex-col md:flex-row justify-between items-center mt-6 space-y-4 md:space-y-0">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Show</span>
                          <Select value={recordsPerPage.toString()} onValueChange={(value) => handleRecordsPerPageChange(parseInt(value))}>
                            <SelectTrigger className="w-20 bg-white border-gray-300 text-gray-900">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-300">
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="25">25</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-sm text-gray-600">per page</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          Page {currentPageFromApi} of {totalPages.toLocaleString()} ({totalRecords.toLocaleString()} total records)
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1 || loading}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Prev
                        </Button>

                        {/* Page numbers */}
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum
                            if (totalPages <= 5) {
                              pageNum = i + 1
                            } else if (currentPage <= 3) {
                              pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i
                            } else {
                              pageNum = currentPage - 2 + i
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                                disabled={loading}
                                className={
                                  currentPage === pageNum
                                    ? "bg-teal-600 text-white hover:bg-teal-700"
                                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                }
                              >
                                {pageNum}
                              </Button>
                            )
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages || loading}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Regular Export Modal */}
      {isExporting && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="h-8 w-8 text-teal-600 animate-bounce" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Exporting Data</h3>
              <p className="text-gray-600 mb-6">
                Preparing all transactions for export...
              </p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{exportProgress}% complete</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stream Export Modal */}
      {isStreamExporting && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-blue-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Streaming Export</h3>
              <p className="text-gray-600 mb-6">
                Streaming all transactions directly to your download...
              </p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${streamExportProgress}%` }}
                />
              </div>
              
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{streamExportProgress}% complete</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Large datasets are streamed for better performance
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
