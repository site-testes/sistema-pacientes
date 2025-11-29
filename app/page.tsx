"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  Calendar,
  Edit,
  Trash2,
  Undo2,
  Redo2,
  LogOut,
  Plus,
  Search,
  UserPlus,
  CalendarDays,
  Settings,
} from "@/components/icons"
import { PatientForm } from "@/components/patient-form"
import { PatientFilters } from "@/components/patient-filters"
import { WeeklyTemplateManager } from "@/components/weekly-template-manager"
import { useAuth } from "@/contexts/auth-context"
import { PatientStorage, type WeeklyTemplates } from "@/lib/patient-storage"
import { useRouter } from "next/navigation"
import { InstallPrompt } from "@/components/install-prompt"
import { FadeInSection } from "@/components/fade-in-section"

// Tipo para os dados do paciente
interface Patient {
  id: string
  nome: string
  dataAtendimento: string
  tipoAtendimento: "plano" | "particular"
  nomePlano?: string
  valor: number
  statusPagamento: "pago" | "pendente"
  dataPagamento?: string
  observacoes?: string
}

interface HistoryAction {
  type: "add" | "edit" | "delete" | "clear"
  timestamp: number
  previousState: Patient[]
  currentState: Patient[]
  description: string
}

const DAYS_OF_WEEK = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
]

export default function Home() {
  const { user, logout, loading } = useAuth()
  const router = useRouter()

  const [patients, setPatients] = useState<Patient[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean
    patientId: string
    patientName: string
  }>({
    show: false,
    patientId: "",
    patientName: "",
  })
  const [bulkDeleteConfirmation, setBulkDeleteConfirmation] = useState<{
    show: boolean
    month: string
    count: number
  }>({
    show: false,
    month: "",
    count: 0,
  })
  const [bulkPaymentDialog, setBulkPaymentDialog] = useState({
    show: false,
    selectedPlan: "",
    selectedMonth: "",
  })
  const [filters, setFilters] = useState({
    mes: "todos",
    statusPagamento: "todos",
    tipoAtendimento: "todos",
    tipoData: "atendimento" as "atendimento" | "pagamento",
  })

  const [history, setHistory] = useState<HistoryAction[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [patientsLoading, setPatientsLoading] = useState(true)

  const [showTemplateManager, setShowTemplateManager] = useState(false)
  const [weeklyTemplates, setWeeklyTemplates] = useState<WeeklyTemplates>({})

  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth")
    }
  }, [user, loading, router])

  useEffect(() => {
    const loadPatientData = async () => {
      if (user) {
        setPatientsLoading(true)
        try {
          const timeoutPromise = new Promise<Patient[]>((_, reject) => {
            setTimeout(() => reject(new Error("Page load timeout")), 15000)
          })

          const loadPromise = PatientStorage.loadPatients(user.id)
          const userPatients = await Promise.race([loadPromise, timeoutPromise])

          setPatients(userPatients)

          const templates = await PatientStorage.loadWeeklyTemplates(user.id)
          setWeeklyTemplates(templates)
        } catch (error) {
          console.error("Error loading patient data:", error)
          setPatients([])
        } finally {
          setPatientsLoading(false)
        }
      }
    }

    loadPatientData()
  }, [user])

  useEffect(() => {
    if (user && !patientsLoading && patients.length >= 0) {
      PatientStorage.savePatients(user.id, patients)
    }
  }, [patients, user, patientsLoading])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const savePatients = async (newPatients: Patient[]) => {
    if (user) {
      setPatients(newPatients)
      try {
        await PatientStorage.syncPatients(user.id, newPatients)
      } catch (error) {
        console.error("Erro ao salvar pacientes:", error)
      }
    }
  }

  const addToHistory = (
    type: HistoryAction["type"],
    previousState: Patient[],
    currentState: Patient[],
    description: string,
  ) => {
    const newAction: HistoryAction = {
      type,
      timestamp: Date.now(),
      previousState: [...previousState],
      currentState: [...currentState],
      description,
    }

    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newAction)

    if (newHistory.length > 50) {
      newHistory.shift()
    }

    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const handleUndo = () => {
    if (historyIndex >= 0) {
      const action = history[historyIndex]
      savePatients(action.previousState)
      setHistoryIndex(historyIndex - 1)
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const action = history[historyIndex + 1]
      savePatients(action.currentState)
      setHistoryIndex(historyIndex + 1)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/auth")
  }

  const handleAddPatient = (patientData: Omit<Patient, "id">) => {
    const newPatient: Patient = {
      ...patientData,
      id: Date.now().toString(),
    }

    const previousState = [...patients]

    // Atualizar nomePlano de todos os pacientes com o mesmo nome
    let updatedPatients = [...patients]
    if (patientData.tipoAtendimento === "plano" && patientData.nomePlano) {
      updatedPatients = patients.map((p) => {
        if (p.nome.toLowerCase() === patientData.nome.toLowerCase() && p.tipoAtendimento === "plano") {
          return { ...p, nomePlano: patientData.nomePlano }
        }
        return p
      })
    }

    const newPatients = [...updatedPatients, newPatient]

    addToHistory("add", previousState, newPatients, `Paciente ${newPatient.nome} adicionado`)
    savePatients(newPatients)
    setShowForm(false)
  }

  const handleEditPatient = (patientData: Patient) => {
    const previousState = [...patients]

    // Atualizar nomePlano de todos os pacientes com o mesmo nome
    const updatedPatients = patients.map((p) => {
      if (p.id === patientData.id) {
        return patientData
      }
      // Se mudou o plano, atualizar outros registros do mesmo paciente
      if (
        patientData.tipoAtendimento === "plano" &&
        patientData.nomePlano &&
        p.nome.toLowerCase() === patientData.nome.toLowerCase() &&
        p.tipoAtendimento === "plano"
      ) {
        return { ...p, nomePlano: patientData.nomePlano }
      }
      return p
    })

    addToHistory("edit", previousState, updatedPatients, `Paciente ${patientData.nome} editado`)
    savePatients(updatedPatients)
    setShowForm(false)
    setEditingPatient(null)
  }

  const requestDeletePatient = (id: string, name: string) => {
    setDeleteConfirmation({
      show: true,
      patientId: id,
      patientName: name,
    })
  }

  const confirmDeletePatient = () => {
    const previousState = [...patients]
    const patientToDelete = patients.find((p) => p.id === deleteConfirmation.patientId)
    const newPatients = patients.filter((p) => p.id !== deleteConfirmation.patientId)

    if (patientToDelete) {
      addToHistory("delete", previousState, newPatients, `Paciente ${patientToDelete.nome} removido`)
    }

    savePatients(newPatients)
    setDeleteConfirmation({ show: false, patientId: "", patientName: "" })
  }

  const cancelDeletePatient = () => {
    setDeleteConfirmation({ show: false, patientId: "", patientName: "" })
  }

  const handleTogglePayment = (id: string) => {
    const previousState = [...patients]
    const patient = patients.find((p) => p.id === id)

    const newPatients = patients.map((p) => {
      if (p.id === id) {
        const newStatus: "pago" | "pendente" = p.statusPagamento === "pago" ? "pendente" : "pago"
        return {
          ...p,
          statusPagamento: newStatus,
          dataPagamento: newStatus === "pago" ? new Date().toISOString().split("T")[0] : undefined,
        }
      }
      return p
    })

    if (patient) {
      const newStatus = patient.statusPagamento === "pago" ? "pendente" : "pago"
      addToHistory("edit", previousState, newPatients, `Status de ${patient.nome} alterado para ${newStatus}`)
    }

    savePatients(newPatients)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00")
    return date.toLocaleDateString("pt-BR")
  }

  const filteredPatients = patients.filter((patient) => {
    // Filtro de busca por nome
    if (searchTerm && !patient.nome.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // Filtro por mês
    if (filters.mes !== "todos") {
      const dateToFilter =
        filters.tipoData === "pagamento" && patient.dataPagamento ? patient.dataPagamento : patient.dataAtendimento
      if (!dateToFilter.startsWith(filters.mes)) {
        return false
      }
    }

    // Filtro por status
    if (filters.statusPagamento !== "todos" && patient.statusPagamento !== filters.statusPagamento) {
      return false
    }

    // Filtro por tipo
    if (filters.tipoAtendimento !== "todos" && patient.tipoAtendimento !== filters.tipoAtendimento) {
      return false
    }

    return true
  })

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    return new Date(b.dataAtendimento).getTime() - new Date(a.dataAtendimento).getTime()
  })

  const totalPacientes = filteredPatients.length
  const valorTotal = filteredPatients.reduce((sum, p) => sum + p.valor, 0)
  const valorPago = filteredPatients.filter((p) => p.statusPagamento === "pago").reduce((sum, p) => sum + p.valor, 0)
  const valorPendente = filteredPatients
    .filter((p) => p.statusPagamento === "pendente")
    .reduce((sum, p) => sum + p.valor, 0)

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1)
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  }

  const valorRecebidoMes =
    filters.mes !== "todos"
      ? patients
        .filter((p) => p.statusPagamento === "pago" && p.dataPagamento?.startsWith(filters.mes))
        .reduce((sum, p) => sum + p.valor, 0)
      : patients.filter((p) => p.statusPagamento === "pago").reduce((sum, p) => sum + p.valor, 0)

  const getRecebidoTitle = () => {
    if (filters.mes !== "todos") {
      return `Recebido em ${getMonthName(filters.mes)}`
    }
    return "Total Recebido"
  }

  const getUniquePatientNames = () => {
    const names = new Set<string>()
    patients.forEach((p) => names.add(p.nome))
    return Array.from(names).sort()
  }

  const patientSuggestions = searchTerm
    ? getUniquePatientNames().filter((name) => name.toLowerCase().includes(searchTerm.toLowerCase()))
    : []

  const handleDeleteMonth = () => {
    if (filters.mes === "todos") return

    const previousState = [...patients]
    const newPatients = patients.filter((p) => !p.dataAtendimento.startsWith(filters.mes))

    const deletedCount = previousState.length - newPatients.length
    addToHistory(
      "clear",
      previousState,
      newPatients,
      `${deletedCount} pacientes do mês ${getMonthName(filters.mes)} removidos`,
    )
    savePatients(newPatients)
  }

  const showBulkDeleteConfirmation = () => {
    if (filters.mes === "todos") return

    const count = patients.filter((p) => p.dataAtendimento.startsWith(filters.mes)).length
    setBulkDeleteConfirmation({
      show: true,
      month: filters.mes,
      count,
    })
  }

  const confirmBulkDelete = () => {
    handleDeleteMonth()
    setBulkDeleteConfirmation({ show: false, month: "", count: 0 })
  }

  const cancelBulkDelete = () => {
    setBulkDeleteConfirmation({ show: false, month: "", count: 0 })
  }

  const getUniquePlans = () => {
    const plans = new Set<string>()
    patients.forEach((patient) => {
      if (patient.tipoAtendimento === "plano" && patient.nomePlano) {
        plans.add(patient.nomePlano)
      }
    })
    return Array.from(plans).sort()
  }

  const handleBulkPayment = () => {
    if (!bulkPaymentDialog.selectedPlan || !bulkPaymentDialog.selectedMonth) {
      return
    }

    const today = new Date().toISOString().split("T")[0]

    const updatedPatients = patients.map((patient) => {
      // Verifica se o paciente é do plano selecionado e do mês selecionado
      const isMatchingPlan = patient.nomePlano === bulkPaymentDialog.selectedPlan
      const isMatchingMonth = patient.dataAtendimento.startsWith(bulkPaymentDialog.selectedMonth)
      const isPending = patient.statusPagamento === "pendente"

      if (isMatchingPlan && isMatchingMonth && isPending) {
        return {
          ...patient,
          statusPagamento: "pago" as const,
          dataPagamento: today,
        }
      }
      return patient
    })

    const updatedCount = updatedPatients.filter(
      (p, i) => p.statusPagamento === "pago" && patients[i].statusPagamento === "pendente",
    ).length

    addToHistory(
      "edit",
      patients,
      updatedPatients,
      `${updatedCount} pacientes do plano ${bulkPaymentDialog.selectedPlan} marcados como pagos`,
    )
    setPatients(updatedPatients)
    setBulkPaymentDialog({ show: false, selectedPlan: "", selectedMonth: "" })
  }

  const getPendingCountForPlan = () => {
    if (!bulkPaymentDialog.selectedPlan || !bulkPaymentDialog.selectedMonth) {
      return 0
    }

    return patients.filter(
      (patient) =>
        patient.nomePlano === bulkPaymentDialog.selectedPlan &&
        patient.dataAtendimento.startsWith(bulkPaymentDialog.selectedMonth) &&
        patient.statusPagamento === "pendente",
    ).length
  }

  const handleAddTodayAppointments = async () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const todayTemplates = weeklyTemplates[dayOfWeek] || []

    if (todayTemplates.length === 0) {
      alert(`Nenhum paciente configurado para ${DAYS_OF_WEEK[dayOfWeek]}. Configure os templates primeiro.`)
      return
    }

    const todayDate = today.toISOString().split("T")[0]
    const previousState = [...patients]

    const newPatients: Patient[] = todayTemplates.map((template) => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      nome: template.nome,
      dataAtendimento: todayDate,
      tipoAtendimento: template.tipoAtendimento,
      nomePlano: template.nomePlano,
      valor: template.valor,
      statusPagamento: "pendente" as const,
      observacoes: template.observacoes,
    }))

    const allPatients = [...patients, ...newPatients]

    addToHistory(
      "add",
      previousState,
      allPatients,
      `${newPatients.length} pacientes de ${DAYS_OF_WEEK[dayOfWeek]} adicionados`,
    )
    savePatients(allPatients)
  }

  const getTodayTemplateCount = () => {
    const dayOfWeek = new Date().getDay()
    return (weeklyTemplates[dayOfWeek] || []).length
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <InstallPrompt />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        {/* Header */}
        <FadeInSection>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between bg-card p-6 rounded-xl border shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Sistema de Pacientes</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Bem-vindo, {user.name}</span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <span>{patients.length} pacientes cadastrados</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndo}
                  disabled={historyIndex < 0}
                  className="h-8 w-8 p-0"
                  title="Desfazer"
                >
                  <Undo2 className="w-4 h-4" />
                </Button>
                <div className="w-px h-4 bg-border" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="h-8 w-8 p-0"
                  title="Refazer"
                >
                  <Redo2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="h-8 w-px bg-border mx-2 hidden md:block" />

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplateManager(true)}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Templates</span>
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </FadeInSection>

        {/* Filtros */}
        <FadeInSection delay={100}>
          <PatientFilters filters={filters} onFiltersChange={setFilters} patients={patients} />
        </FadeInSection>

        <FadeInSection delay={150}>
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardContent className="pt-6">
              <div className="relative" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <Input
                  type="text"
                  placeholder="Buscar paciente por nome..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary"
                />

                {showSuggestions && searchTerm && patientSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                    {patientSuggestions.map((name, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setSearchTerm(name)
                          setShowSuggestions(false)
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors duration-150 first:rounded-t-md last:rounded-b-md"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {searchTerm && (
                <p className="text-xs text-muted-foreground mt-2">
                  {filteredPatients.length} paciente(s) encontrado(s)
                </p>
              )}
            </CardContent>
          </Card>
        </FadeInSection>

        {/* Cards de Métricas */}

        {/* Cards de Métricas */}
        <FadeInSection delay={200}>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-card hover:bg-accent/5 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Pacientes</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPacientes}</div>
                <p className="text-xs text-muted-foreground mt-1">Cadastrados no sistema</p>
              </CardContent>
            </Card>

            <Card className="bg-card hover:bg-accent/5 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Valor Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(valorTotal)}</div>
                <p className="text-xs text-muted-foreground mt-1">Potencial de receita</p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Recebido</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">{formatCurrency(valorPago)}</div>
                <div className="w-full bg-green-200 dark:bg-green-900/50 h-1 mt-2 rounded-full overflow-hidden">
                  <div
                    className="bg-green-500 h-full"
                    style={{ width: `${valorTotal > 0 ? (valorPago / valorTotal) * 100 : 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">Pendente</CardTitle>
                <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">{formatCurrency(valorPendente)}</div>
                <div className="w-full bg-orange-200 dark:bg-orange-900/50 h-1 mt-2 rounded-full overflow-hidden">
                  <div
                    className="bg-orange-500 h-full"
                    style={{ width: `${valorTotal > 0 ? (valorPendente / valorTotal) * 100 : 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  {filters.mes !== "todos" ? getMonthName(filters.mes) : "Mês Atual"}
                </CardTitle>
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{formatCurrency(valorRecebidoMes)}</div>
                <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">Receita do período</p>
              </CardContent>
            </Card>
          </div>
        </FadeInSection>

        {/* Lista de Atendimentos */}
        <FadeInSection delay={300}>
          <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold">Lista de Atendimentos</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gerencie seus pacientes e atendimentos
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBulkPaymentDialog({ show: true, selectedPlan: "", selectedMonth: "" })}
                    className="w-full sm:w-auto"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Pagar em Massa
                  </Button>
                  {filters.mes !== "todos" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={showBulkDeleteConfirmation}
                      className="w-full sm:w-auto"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Limpar Mês
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className="w-full sm:w-auto">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingPatient(null)
                          setShowForm(true)
                        }}
                        className="cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Cadastrar Novo
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleAddTodayAppointments} className="cursor-pointer">
                        <CalendarDays className="w-4 h-4 mr-2" />
                        <div className="flex flex-col">
                          <span>Adicionar do Template</span>
                          <span className="text-xs text-muted-foreground">
                            {getTodayTemplateCount()} pacientes para hoje
                          </span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {sortedPatients.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Nenhum paciente encontrado com os filtros atuais.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {sortedPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="p-4 sm:p-6 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${patient.statusPagamento === "pago"
                          ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                          }`}>
                          {patient.statusPagamento === "pago" ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <Clock className="w-5 h-5" />
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-foreground">{patient.nome}</h3>
                            <Badge variant="outline" className="text-xs font-normal">
                              {patient.tipoAtendimento === "plano" ? patient.nomePlano : "Particular"}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{formatDate(patient.dataAtendimento)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5" />
                              <span className={patient.statusPagamento === "pago" ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}>
                                {formatCurrency(patient.valor)}
                              </span>
                            </div>
                          </div>

                          {patient.observacoes && (
                            <p className="text-xs text-muted-foreground italic max-w-md">
                              "{patient.observacoes}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTogglePayment(patient.id)}
                          title={patient.statusPagamento === "pago" ? "Marcar como pendente" : "Marcar como pago"}
                          className={patient.statusPagamento === "pago" ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-orange-600 hover:text-orange-700 hover:bg-orange-50"}
                        >
                          <DollarSign className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingPatient(patient)
                            setShowForm(true)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => requestDeletePatient(patient.id, patient.nome)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeInSection>

        {/* Botão flutuante mobile com menu simples */}
        <div className="md:hidden">
          {/* Overlay para fechar menu */}
          {showMobileMenu && <div className="fixed inset-0 z-30" onClick={() => setShowMobileMenu(false)} />}

          {/* Menu de opções */}
          {showMobileMenu && (
            <div className="fixed bottom-24 right-6 z-40 bg-background border rounded-lg shadow-lg p-2 w-56 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button
                onClick={() => {
                  setEditingPatient(null)
                  setShowForm(true)
                  setShowMobileMenu(false)
                }}
                className="flex items-center w-full px-3 py-3 rounded-md hover:bg-accent text-left"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Cadastrar Novo Paciente
              </button>
              <button
                onClick={() => {
                  handleAddTodayAppointments()
                  setShowMobileMenu(false)
                }}
                className="flex items-center w-full px-3 py-3 rounded-md hover:bg-accent text-left"
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                <div className="flex flex-col">
                  <span>Atendimentos de Hoje</span>
                  <span className="text-xs text-muted-foreground">
                    {DAYS_OF_WEEK[new Date().getDay()]} ({getTodayTemplateCount()} pacientes)
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* Botão flutuante */}
          <Button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40 flex items-center justify-center"
            size="icon"
            title="Adicionar Paciente"
          >
            <Plus className={`w-6 h-6 transition-transform duration-200 ${showMobileMenu ? "rotate-45" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Formulário de Paciente */}
      <PatientForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={(data) => {
          if (editingPatient) {
            handleEditPatient({ ...data, id: editingPatient.id })
          } else {
            handleAddPatient(data as any)
          }
        }}
        patient={editingPatient}
        existingPatients={patients}
        savedPlans={getUniquePlans()}
      />

      <WeeklyTemplateManager
        open={showTemplateManager}
        onOpenChange={setShowTemplateManager}
        userId={user.id}
        existingPatients={patients}
        savedPlans={getUniquePlans()}
      />

      {/* Dialog de confirmação de exclusão individual */}
      <AlertDialog open={deleteConfirmation.show} onOpenChange={(open: boolean) => !open && cancelDeletePatient()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o atendimento de{" "}
              <span className="font-semibold">{deleteConfirmation.patientName}</span>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeletePatient}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePatient}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação de exclusão em massa */}
      <AlertDialog open={bulkDeleteConfirmation.show} onOpenChange={(open: boolean) => !open && cancelBulkDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão em Massa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <span className="font-semibold">{bulkDeleteConfirmation.count}</span>{" "}
              atendimentos do mês de{" "}
              <span className="font-semibold">
                {bulkDeleteConfirmation.month && getMonthName(bulkDeleteConfirmation.month)}
              </span>
              ? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelBulkDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de pagamento em massa */}
      <Dialog
        open={bulkPaymentDialog.show}
        onOpenChange={(open: boolean) => !open && setBulkPaymentDialog({ ...bulkPaymentDialog, show: false })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar Plano em Massa</DialogTitle>
            <DialogDescription>
              Selecione o plano e o mês para marcar todos os atendimentos pendentes como pagos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Plano</Label>
              <Select
                value={bulkPaymentDialog.selectedPlan}
                onValueChange={(value) => setBulkPaymentDialog((prev) => ({ ...prev, selectedPlan: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  {getUniquePlans().map((plan) => (
                    <SelectItem key={plan} value={plan}>
                      {plan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mês</Label>
              <Select
                value={bulkPaymentDialog.selectedMonth}
                onValueChange={(value) => setBulkPaymentDialog((prev) => ({ ...prev, selectedMonth: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set(patients.map((p) => p.dataAtendimento.substring(0, 7))))
                    .sort()
                    .reverse()
                    .map((month) => (
                      <SelectItem key={month} value={month}>
                        {getMonthName(month)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {bulkPaymentDialog.selectedPlan && bulkPaymentDialog.selectedMonth && (
              <p className="text-sm text-muted-foreground">
                {getPendingCountForPlan()} atendimento(s) pendente(s) será(ão) marcado(s) como pago(s).
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkPaymentDialog({ show: false, selectedPlan: "", selectedMonth: "" })}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleBulkPayment}
              disabled={
                !bulkPaymentDialog.selectedPlan || !bulkPaymentDialog.selectedMonth || getPendingCountForPlan() === 0
              }
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  )
}
