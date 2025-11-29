"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { User, UserPlus, Calendar, CreditCard, DollarSign, Clock, CheckCircle } from "lucide-react"

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

interface PatientFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient?: Patient | null
  onSubmit: (patient: Omit<Patient, "id">) => void
  existingPatients?: Patient[]
  savedPlans?: string[]
}

export function PatientForm({
  open,
  onOpenChange,
  patient,
  onSubmit,
  existingPatients = [],
  savedPlans = [],
}: PatientFormProps) {
  const [formData, setFormData] = useState({
    nome: "",
    dataAtendimento: "",
    tipoAtendimento: "plano" as "plano" | "particular",
    nomePlano: "",
    valor: "",
    statusPagamento: "pendente" as "pago" | "pendente",
    dataPagamento: "",
    observacoes: "",
  })

  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showPlanSuggestions, setShowPlanSuggestions] = useState(false)

  useEffect(() => {
    if (patient) {
      setFormData({
        nome: patient.nome,
        dataAtendimento: patient.dataAtendimento,
        tipoAtendimento: patient.tipoAtendimento,
        nomePlano: patient.nomePlano || "",
        valor: patient.valor.toString(),
        statusPagamento: patient.statusPagamento,
        dataPagamento: patient.dataPagamento || "",
        observacoes: patient.observacoes || "",
      })
    } else {
      setFormData({
        nome: "",
        dataAtendimento: "",
        tipoAtendimento: "plano",
        nomePlano: "",
        valor: "",
        statusPagamento: "pendente",
        dataPagamento: "",
        observacoes: "",
      })
    }
  }, [patient, open])

  const getUniquePatientNames = () => {
    const uniqueNames = new Set<string>()
    const uniquePatients: Patient[] = []

    existingPatients.forEach((p) => {
      if (!uniqueNames.has(p.nome.toLowerCase())) {
        uniqueNames.add(p.nome.toLowerCase())
        uniquePatients.push(p)
      }
    })

    return uniquePatients.sort((a, b) => a.nome.localeCompare(b.nome))
  }

  const getUniquePlanNames = () => {
    const uniquePlans = new Set<string>(savedPlans)
    existingPatients.forEach((p) => {
      if (p.nomePlano && p.tipoAtendimento === "plano") {
        uniquePlans.add(p.nomePlano)
      }
    })
    return Array.from(uniquePlans).sort()
  }

  const filteredPatients = getUniquePatientNames().filter(
    (p) => p.nome.toLowerCase().includes(formData.nome.toLowerCase()) && formData.nome.length > 0,
  )

  const filteredPlans = getUniquePlanNames().filter(
    (plan) => plan.toLowerCase().includes(formData.nomePlano.toLowerCase()) && formData.nomePlano.length > 0,
  )

  const getDisplayedPlans = () => {
    if (formData.nomePlano.length === 0) {
      return getUniquePlanNames()
    }
    return filteredPlans
  }

  const handleSelectPatient = (selectedPatient: Patient) => {
    const patientRecords = existingPatients.filter((p) => p.nome.toLowerCase() === selectedPatient.nome.toLowerCase())
    const mostRecentRecord = patientRecords.sort(
      (a, b) => new Date(b.dataAtendimento).getTime() - new Date(a.dataAtendimento).getTime(),
    )[0]

    setFormData((prev) => ({
      ...prev,
      nome: selectedPatient.nome,
      tipoAtendimento: mostRecentRecord.tipoAtendimento,
      nomePlano: mostRecentRecord.nomePlano || "",
      valor: mostRecentRecord.valor.toString(),
    }))
    setShowSuggestions(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const patientData: Omit<Patient, "id"> = {
      nome: formData.nome,
      dataAtendimento: formData.dataAtendimento,
      tipoAtendimento: formData.tipoAtendimento,
      nomePlano: formData.tipoAtendimento === "plano" ? formData.nomePlano || undefined : undefined,
      valor: Number.parseFloat(formData.valor),
      statusPagamento: formData.statusPagamento,
      dataPagamento: formData.dataPagamento || undefined,
      observacoes: formData.observacoes || undefined,
    }

    onSubmit(patientData)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleNameChange = (value: string) => {
    handleInputChange("nome", value)
    setShowSuggestions(value.length > 0 && filteredPatients.length > 0)
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-0 gap-0 bg-card border-border shadow-lg">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            {patient ? (
              <>
                <div className="bg-primary/10 p-2 rounded-full text-primary">
                  <User className="w-5 h-5" />
                </div>
                Editar Paciente
              </>
            ) : (
              <>
                <div className="bg-primary/10 p-2 rounded-full text-primary">
                  <UserPlus className="w-5 h-5" />
                </div>
                Cadastrar Novo Paciente
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2 relative">
              <Label htmlFor="nome" className="text-sm font-medium flex items-center gap-2">
                Nome do Paciente <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="nome"
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onFocus={() => setShowSuggestions(formData.nome.length > 0 && filteredPatients.length > 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Digite o nome completo"
                  className="pl-9 w-full"
                  required
                />
              </div>

              {showSuggestions && filteredPatients.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                  <div className="p-2 text-xs text-muted-foreground border-b bg-muted/30">Pacientes existentes:</div>
                  {filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleSelectPatient(p)
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-muted/50 border-b border-border last:border-b-0 transition-colors"
                    >
                      <div className="font-medium text-sm">{p.nome}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] h-4 px-1">
                          {p.tipoAtendimento === "plano" ? "Plano" : "Particular"}
                        </Badge>
                        <span>R$ {p.valor.toFixed(2)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dataAtendimento" className="text-sm font-medium flex items-center gap-2">
                  Data do Atendimento <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="dataAtendimento"
                    type="date"
                    value={formData.dataAtendimento}
                    onChange={(e) => handleInputChange("dataAtendimento", e.target.value)}
                    className="pl-9 w-full"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo de Atendimento</Label>
                <Select
                  value={formData.tipoAtendimento}
                  onValueChange={(value) => handleInputChange("tipoAtendimento", value)}
                >
                  <SelectTrigger className="w-full pl-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plano">Plano de Saúde</SelectItem>
                    <SelectItem value="particular">Particular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.tipoAtendimento === "plano" && (
              <div className="space-y-2 relative animate-in fade-in slide-in-from-top-2 duration-200">
                <Label htmlFor="nomePlano" className="text-sm font-medium">
                  Nome do Plano
                </Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="nomePlano"
                    type="text"
                    value={formData.nomePlano}
                    onChange={(e) => {
                      handleInputChange("nomePlano", e.target.value)
                      const displayedPlans = e.target.value.length === 0 ? getUniquePlanNames() : filteredPlans
                      setShowPlanSuggestions(displayedPlans.length > 0)
                    }}
                    onFocus={() => {
                      const displayedPlans = getDisplayedPlans()
                      setShowPlanSuggestions(displayedPlans.length > 0)
                    }}
                    onBlur={() => setTimeout(() => setShowPlanSuggestions(false), 200)}
                    placeholder="Ex: Unimed, Amil, Bradesco Saúde..."
                    className="pl-9 w-full"
                  />
                </div>

                {showPlanSuggestions && getDisplayedPlans().length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-popover border border-border rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                    <div className="p-2 text-xs text-muted-foreground border-b bg-muted/30">
                      {formData.nomePlano.length === 0 ? "Planos cadastrados:" : "Sugestões:"}
                    </div>
                    {getDisplayedPlans().map((plan, index) => (
                      <button
                        key={index}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          handleInputChange("nomePlano", plan)
                          setShowPlanSuggestions(false)
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-muted/50 border-b border-border last:border-b-0 text-sm transition-colors"
                      >
                        {plan}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="valor" className="text-sm font-medium flex items-center gap-2">
                  Valor (R$) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor}
                    onChange={(e) => handleInputChange("valor", e.target.value)}
                    placeholder="0,00"
                    className="pl-9 w-full"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Status de Pagamento</Label>
                <Select
                  value={formData.statusPagamento}
                  onValueChange={(value) => handleInputChange("statusPagamento", value)}
                >
                  <SelectTrigger className={`w-full ${formData.statusPagamento === 'pago' ? 'text-green-600 border-green-200 bg-green-50/50' : 'text-orange-600 border-orange-200 bg-orange-50/50'}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente" className="text-orange-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Pendente
                      </div>
                    </SelectItem>
                    <SelectItem value="pago" className="text-green-600">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Pago
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.statusPagamento === "pago" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <Label htmlFor="dataPagamento" className="text-sm font-medium">
                  Data do Pagamento
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="dataPagamento"
                    type="date"
                    value={formData.dataPagamento}
                    onChange={(e) => handleInputChange("dataPagamento", e.target.value)}
                    className="pl-9 w-full max-w-xs"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="observacoes" className="text-sm font-medium">
                Observações
              </Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleInputChange("observacoes", e.target.value)}
                placeholder="Observações sobre o paciente ou atendimento..."
                rows={3}
                className="w-full resize-none"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="w-full sm:flex-1 order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:flex-1 order-1 sm:order-2">
              {patient ? "Salvar Alterações" : "Cadastrar Paciente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
