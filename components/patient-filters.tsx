"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PatientFiltersProps {
  filters: {
    mes: string
    statusPagamento: string
    tipoAtendimento: string
    tipoData: "atendimento" | "pagamento"
  }
  onFiltersChange: (filters: any) => void
  patients: Array<{
    id: string
    nome: string
    dataAtendimento: string
    tipoAtendimento: "plano" | "particular"
    valor: number
    statusPagamento: "pago" | "pendente"
    dataPagamento?: string
    observacoes?: string
  }>
}

export function PatientFilters({ filters, onFiltersChange, patients }: PatientFiltersProps) {
  const updateFilter = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const getAvailableMonths = () => {
    const months = new Set<string>()
    patients.forEach((patient) => {
      if (filters.tipoData === "pagamento") {
        if (patient.dataPagamento) {
          const date = new Date(patient.dataPagamento)
          const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
          months.add(monthYear)
        }
      } else {
        const date = new Date(patient.dataAtendimento)
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        months.add(monthYear)
      }
    })
    return Array.from(months).sort((a, b) => {
      const [yearA, monthA] = a.split("-").map(Number)
      const [yearB, monthB] = b.split("-").map(Number)
      if (yearA !== yearB) return yearB - yearA
      return monthB - monthA
    })
  }

  const getMonthName = (monthYear: string) => {
    const [year, month] = monthYear.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1)
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  }

  const availableMonths = getAvailableMonths()

  return (
    <div className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
      <div className="flex flex-col md:flex-row gap-6 justify-between">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Período e Tipo</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex bg-muted/50 p-1 rounded-lg">
              <Button
                variant={filters.tipoData === "atendimento" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => updateFilter("tipoData", "atendimento")}
                className="flex-1"
              >
                Atendimento
              </Button>
              <Button
                variant={filters.tipoData === "pagamento" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => updateFilter("tipoData", "pagamento")}
                className="flex-1"
              >
                Pagamento
              </Button>
            </div>

            <Select
              value={filters.mes}
              onValueChange={(value) => updateFilter("mes", value)}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os meses</SelectItem>
                {availableMonths.map((monthYear) => (
                  <SelectItem key={monthYear} value={monthYear}>
                    {getMonthName(monthYear)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Status e Categoria</h3>
          <div className="flex flex-wrap gap-2">
            {filters.tipoData === "atendimento" && (
              <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-dashed">
                <Button
                  variant={filters.statusPagamento === "todos" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => updateFilter("statusPagamento", "todos")}
                  className="h-7 px-3 text-xs"
                >
                  Todos
                </Button>
                <Button
                  variant={filters.statusPagamento === "pago" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => updateFilter("statusPagamento", "pago")}
                  className={`h-7 px-3 text-xs ${filters.statusPagamento === "pago" ? "text-green-600 bg-green-50 dark:bg-green-900/20" : "hover:text-green-600"}`}
                >
                  Pagos
                </Button>
                <Button
                  variant={filters.statusPagamento === "pendente" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => updateFilter("statusPagamento", "pendente")}
                  className={`h-7 px-3 text-xs ${filters.statusPagamento === "pendente" ? "text-orange-600 bg-orange-50 dark:bg-orange-900/20" : "hover:text-orange-600"}`}
                >
                  Pendentes
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-dashed">
              <Button
                variant={filters.tipoAtendimento === "todos" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => updateFilter("tipoAtendimento", "todos")}
                className="h-7 px-3 text-xs"
              >
                Todos
              </Button>
              <Button
                variant={filters.tipoAtendimento === "plano" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => updateFilter("tipoAtendimento", "plano")}
                className="h-7 px-3 text-xs"
              >
                Plano
              </Button>
              <Button
                variant={filters.tipoAtendimento === "particular" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => updateFilter("tipoAtendimento", "particular")}
                className="h-7 px-3 text-xs"
              >
                Particular
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
