"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Users, Calendar } from "lucide-react"
import { PatientStorage, type WeeklyTemplates, type WeeklyTemplatePatient, type Patient } from "@/lib/patient-storage"

interface WeeklyTemplateManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  existingPatients: Patient[]
  savedPlans: string[]
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
]

export function WeeklyTemplateManager({
  open,
  onOpenChange,
  userId,
  existingPatients,
  savedPlans,
}: WeeklyTemplateManagerProps) {
  const [templates, setTemplates] = useState<WeeklyTemplates>({})
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [newPatient, setNewPatient] = useState<Partial<WeeklyTemplatePatient>>({
    nome: "",
    tipoAtendimento: "particular",
    valor: 0,
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showPlanSuggestions, setShowPlanSuggestions] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const nameInputRef = useRef<HTMLDivElement>(null)
  const planInputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && userId) {
      loadTemplates()
    }
  }, [open, userId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (nameInputRef.current && !nameInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
      if (planInputRef.current && !planInputRef.current.contains(event.target as Node)) {
        setShowPlanSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const loadedTemplates = await PatientStorage.loadWeeklyTemplates(userId)
      const validTemplates = loadedTemplates && typeof loadedTemplates === "object" ? loadedTemplates : {}
      setTemplates(validTemplates)
    } catch (error) {
      console.error("Error loading templates:", error)
      setTemplates({})
    } finally {
      setLoading(false)
    }
  }

  const saveTemplates = async (newTemplates: WeeklyTemplates): Promise<boolean> => {
    setSaving(true)
    try {
      await PatientStorage.saveWeeklyTemplates(userId, newTemplates)
      return true
    } catch (error) {
      console.error("Error saving templates:", error)
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleAddPatientToTemplate = async () => {
    if (!newPatient.nome || !newPatient.valor) {
      return
    }

    // Criar paciente com ID único (timestamp + random)
    const patient: WeeklyTemplatePatient = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      nome: newPatient.nome,
      tipoAtendimento: newPatient.tipoAtendimento || "particular",
      nomePlano: newPatient.tipoAtendimento === "plano" ? newPatient.nomePlano : undefined,
      valor: newPatient.valor,
      observacoes: newPatient.observacoes,
    }

    const dayTemplates = templates[selectedDay] || []
    const newTemplates = {
      ...templates,
      [selectedDay]: [...dayTemplates, patient],
    }

    // Otimistic update - atualiza a UI imediatamente
    setTemplates(newTemplates)

    // Limpa o formulário imediatamente
    setNewPatient({
      nome: "",
      tipoAtendimento: "particular",
      valor: 0,
      nomePlano: undefined,
      observacoes: undefined,
    })

    // Mostra feedback de sucesso
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)

    // Salva no backend em background
    const success = await saveTemplates(newTemplates)

    // Se falhou, reverte a UI
    if (!success) {
      setTemplates(templates)
      alert("Erro ao salvar. Tente novamente.")
    }
  }

  const handleRemovePatientFromTemplate = async (patientId: string) => {
    const dayTemplates = templates[selectedDay] || []
    const newTemplates = {
      ...templates,
      [selectedDay]: dayTemplates.filter((p) => p.id !== patientId),
    }

    // Otimistic update
    setTemplates(newTemplates)

    const success = await saveTemplates(newTemplates)
    if (!success) {
      // Reverte se falhou
      setTemplates(templates)
    }
  }

  const getUniquePatientNames = () => {
    const names = new Set<string>()
    existingPatients.forEach((p) => names.add(p.nome))
    return Array.from(names).sort()
  }

  const patientSuggestions = newPatient.nome
    ? getUniquePatientNames().filter((name) => name.toLowerCase().includes(newPatient.nome!.toLowerCase()))
    : getUniquePatientNames()

  const planSuggestions = newPatient.nomePlano
    ? savedPlans.filter((plan) => plan.toLowerCase().includes(newPatient.nomePlano!.toLowerCase()))
    : savedPlans

  const selectPatientFromSuggestion = (name: string) => {
    const existingPatient = existingPatients.find((p) => p.nome === name)
    if (existingPatient) {
      setNewPatient({
        nome: existingPatient.nome,
        tipoAtendimento: existingPatient.tipoAtendimento,
        nomePlano: existingPatient.nomePlano,
        valor: existingPatient.valor,
        observacoes: existingPatient.observacoes,
      })
    } else {
      setNewPatient((prev) => ({ ...prev, nome: name }))
    }
    setShowSuggestions(false)
  }

  const currentDayTemplates = templates[selectedDay] || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Gerenciar Templates Semanais
          </DialogTitle>
          <DialogDescription>
            Configure pacientes que você atende regularmente em cada dia da semana. Use "Atendimentos de Hoje" para
            adicionar todos de uma vez.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {saveSuccess && (
              <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-2 rounded-md text-sm text-center">
                Paciente adicionado com sucesso!
              </div>
            )}

            {/* Seletor de dia da semana */}
            <div className="space-y-2">
              <Label>Dia da Semana</Label>
              <Select value={selectedDay.toString()} onValueChange={(value) => setSelectedDay(Number.parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label} ({(templates[day.value] || []).length} pacientes)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lista de pacientes do dia selecionado - MOVIDO PARA CIMA */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">
                Pacientes de {DAYS_OF_WEEK[selectedDay].label} ({currentDayTemplates.length})
              </h4>
              {currentDayTemplates.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhum paciente configurado para este dia.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {currentDayTemplates.map((patient, index) => (
                    <div key={patient.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">#{index + 1}</span>
                          <span className="font-medium text-sm">{patient.nome}</span>
                          <Badge variant={patient.tipoAtendimento === "plano" ? "default" : "secondary"}>
                            {patient.tipoAtendimento === "plano" ? patient.nomePlano : "Particular"}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">R$ {patient.valor.toFixed(2)}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePatientFromTemplate(patient.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formulário para adicionar paciente ao template */}
            <Card>
              <CardContent className="pt-4 space-y-4">
                <h4 className="font-medium text-sm">Adicionar Paciente ao Template</h4>

                {/* Nome do paciente com autocomplete */}
                <div className="space-y-2" ref={nameInputRef}>
                  <Label>Nome do Paciente</Label>
                  <div className="relative">
                    <Input
                      value={newPatient.nome || ""}
                      onChange={(e) => {
                        setNewPatient((prev) => ({ ...prev, nome: e.target.value }))
                        setShowSuggestions(true)
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="Digite o nome do paciente"
                    />
                    {showSuggestions && patientSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-40 overflow-auto">
                        {patientSuggestions.slice(0, 5).map((name, index) => {
                          const patient = existingPatients.find((p) => p.nome === name)
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => selectPatientFromSuggestion(name)}
                              className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Users className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-sm">{name}</span>
                                </div>
                                {patient && (
                                  <span className="text-xs text-muted-foreground">
                                    {patient.tipoAtendimento === "plano" ? patient.nomePlano : "Particular"} - R${" "}
                                    {patient.valor}
                                  </span>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tipo de atendimento */}
                <div className="space-y-2">
                  <Label>Tipo de Atendimento</Label>
                  <Select
                    value={newPatient.tipoAtendimento}
                    onValueChange={(value: "plano" | "particular") =>
                      setNewPatient((prev) => ({ ...prev, tipoAtendimento: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="particular">Particular</SelectItem>
                      <SelectItem value="plano">Plano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Nome do plano (se for plano) */}
                {newPatient.tipoAtendimento === "plano" && (
                  <div className="space-y-2" ref={planInputRef}>
                    <Label>Nome do Plano</Label>
                    <div className="relative">
                      <Input
                        value={newPatient.nomePlano || ""}
                        onChange={(e) => {
                          setNewPatient((prev) => ({ ...prev, nomePlano: e.target.value }))
                          setShowPlanSuggestions(true)
                        }}
                        onFocus={() => setShowPlanSuggestions(true)}
                        placeholder="Digite o nome do plano"
                      />
                      {showPlanSuggestions && planSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-40 overflow-auto">
                          {planSuggestions.map((plan, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                setNewPatient((prev) => ({ ...prev, nomePlano: plan }))
                                setShowPlanSuggestions(false)
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
                            >
                              {plan}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Valor */}
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    value={newPatient.valor || ""}
                    onChange={(e) =>
                      setNewPatient((prev) => ({ ...prev, valor: Number.parseFloat(e.target.value) || 0 }))
                    }
                    placeholder="0.00"
                  />
                </div>

                {/* Observações */}
                <div className="space-y-2">
                  <Label>Observações (opcional)</Label>
                  <Input
                    value={newPatient.observacoes || ""}
                    onChange={(e) => setNewPatient((prev) => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Observações adicionais"
                  />
                </div>

                <Button
                  onClick={handleAddPatientToTemplate}
                  disabled={!newPatient.nome || !newPatient.valor || saving}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar ao {DAYS_OF_WEEK[selectedDay].label}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Resumo dos dias */}
            <div className="pt-4 border-t">
              <h4 className="font-medium text-sm mb-2">Resumo Semanal</h4>
              <div className="grid grid-cols-7 gap-1">
                {DAYS_OF_WEEK.map((day) => (
                  <div
                    key={day.value}
                    className={`text-center p-2 rounded text-xs cursor-pointer transition-colors ${selectedDay === day.value ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                      }`}
                    onClick={() => setSelectedDay(day.value)}
                  >
                    <div className="font-medium">{day.label.slice(0, 3)}</div>
                    <div>{(templates[day.value] || []).length}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
