import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuotes } from '@/hooks/useQuotes';
import { QuoteStatus } from '@/types/digital-catalog';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, 
  Search, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  DollarSign,
  Package,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function QuotesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');
  
  const { quotes, stats, loading, updateStatus } = useQuotes({
    status: statusFilter === 'all' ? undefined : statusFilter,
    autoLoad: true,
  });

  // Filtrado local por búsqueda
  const filteredQuotes = quotes.filter(quote => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      quote.customer_name.toLowerCase().includes(query) ||
      quote.customer_email.toLowerCase().includes(query) ||
      quote.customer_company?.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: QuoteStatus) => {
    const config = {
      pending: {
        label: 'Pendiente',
        color: 'text-yellow-600 bg-yellow-50'
      },
      accepted: {
        label: 'Aceptada',
        color: 'text-green-600 bg-green-50'
      },
      rejected: {
        label: 'Rechazada',
        color: 'text-red-600 bg-red-50'
      }
    };

    const { label, color } = config[status];
    
    return (
      <Badge className={color}>
        {label}
      </Badge>
    );
  };

  // Actions para el header
  const actions = (
    <div className="flex items-center gap-2 w-full md:w-auto">
      {/* Móvil: Solo búsqueda */}
      <div className="md:hidden flex items-center gap-2 w-full">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-10 text-sm"
          />
        </div>
      </div>

      {/* Desktop: Búsqueda y filtro */}
      <div className="hidden md:flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por cliente, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="accepted">Aceptadas</SelectItem>
            <SelectItem value="rejected">Rechazadas</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout
          title="Cotizaciones"
          subtitle="Gestiona las solicitudes de cotización de tus clientes"
          actions={actions}
        >
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout
        title="Cotizaciones"
        subtitle="Gestiona las solicitudes de cotización de tus clientes"
        actions={actions}
      >
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pendientes</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Aceptadas</p>
                <p className="text-2xl font-bold">{stats.accepted}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Monto Aceptado</p>
                <p className="text-2xl font-bold">
                  ${(stats.total_amount_accepted / 100).toLocaleString('es-MX')}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs por estado */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Todas ({stats.total})</TabsTrigger>
          <TabsTrigger value="pending">Pendientes ({stats.pending})</TabsTrigger>
          <TabsTrigger value="accepted">Aceptadas ({stats.accepted})</TabsTrigger>
          <TabsTrigger value="rejected">Rechazadas ({stats.rejected})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Lista de cotizaciones */}
      {filteredQuotes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">No hay cotizaciones</p>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? 'No se encontraron cotizaciones con ese criterio'
                : 'Las cotizaciones aparecerán aquí cuando los clientes las soliciten'
              }
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Limpiar búsqueda
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuotes.map((quote) => (
            <Card key={quote.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{quote.customer_name}</h3>
                        <p className="text-sm text-muted-foreground">{quote.customer_email}</p>
                        {quote.customer_company && (
                          <p className="text-sm text-muted-foreground">{quote.customer_company}</p>
                        )}
                      </div>
                      {getStatusBadge(quote.status)}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-3">
                      <span className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {quote.items_count} {quote.items_count === 1 ? 'producto' : 'productos'}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        ${(quote.total_amount / 100).toLocaleString('es-MX')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {format(new Date(quote.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                      </span>
                    </div>

                    {quote.notes && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        <strong>Nota:</strong> {quote.notes}
                      </p>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex sm:flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/quotes/${quote.id}`)}
                      className="flex-1 sm:flex-none"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver detalle
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
