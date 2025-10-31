import React, { useState, useEffect, useCallback } from 'react';
import {
  makeStyles,
  Card,
  Text,
  CardFooter,
  Button,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import { useMainLayoutContext } from '../layouts/MainLayout';
import EmpresaDialog, { EmpresaFormData } from '../components/dialogs/EmpresaDialog';
import ConfirmationDialog from '../components/dialogs/ConfirmationDialog';
import { EmpresaRecord } from '../../../shared/types';
import { useEmpresaManagement } from '../hooks/useEmpresaManagement';
import { EmpresaTable } from '../components/empresa-management/EmpresaTable';
import { EmpresaManagementHeader } from '../components/empresa-management/EmpresaManagementHeader';
import { SearchBoxChangeEvent, InputOnChangeData } from '@fluentui/react-components';
import { SpinnerCustom } from '../components/ui/SpinnerCustom';
import { PagoDialog } from '../components/dialogs/PagoDialog';

const useStyles = makeStyles({
  root: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '8px',
    height: '100%',
  },
  card: {
    width: '100%',
    padding: '0px',
    gap: '0px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  tableContainer: {
    flexGrow: 1,
    overflowY: 'auto',
    height: '100%',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderTop: '1px solid var(--colorNeutralStroke1)',
  },
});

export default function EmpresaManagementPage() {
  const styles = useStyles();
  const { setHeaderContent, setHeaderText, isMobile } = useMainLayoutContext();

  const [isEmpresaDialogOpen, setEmpresaDialogOpen] = useState(false);
  const [empresaToEdit, setEmpresaToEdit] = useState<EmpresaFormData | null>(null);
  const [empresaToToggleStatus, setEmpresaToToggleStatus] = useState<EmpresaRecord | null>(null);
  const [empresaToRegisterPayment, setEmpresaToRegisterPayment] = useState<EmpresaRecord | null>(null);

  const handleCloseEmpresaDialog = useCallback(() => {
    setEmpresaDialogOpen(false);
    setEmpresaToEdit(null);
  }, []);

  const {
    empresas,
    totalPages,
    isLoadingEmpresas,
    empresasError,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    handleEmpresaSubmit,
    updateEmpresaMutation, // Usaremos updateMutation para el borrado lógico
    isAnyMutationPending,
    canManageEmpresas,
  } = useEmpresaManagement(handleCloseEmpresaDialog); // Pass the close function here

  // --- Handlers ---

  const handleSearchChange = useCallback(
    (_: SearchBoxChangeEvent, data: InputOnChangeData) => {
      setSearchQuery(data.value);
      setPage(1);
    },
    [setSearchQuery, setPage],
  );

  const handleCreateEmpresaClick = useCallback(() => {
    setEmpresaToEdit(null);
    setEmpresaDialogOpen(true);
  }, []);

  const handleEditEmpresa = useCallback((empresa: EmpresaRecord) => {
    // Map EmpresaRecord to EmpresaFormData
    setEmpresaToEdit({
      idEmpresa: empresa.idEmpresa,
      razonSocial: empresa.razonSocial,
      nombreFantasia: empresa.nombreFantasia,
      cuit: empresa.cuit,
      direccion: empresa.direccion,
      ciudad: empresa.ciudad,
      provincia: empresa.provincia,
      pais: empresa.pais,
      telefono: empresa.telefono || '',
      email: empresa.email || '',
      sitioWeb: empresa.sitioWeb,
      sector: empresa.sector,
      logoUrl: empresa.logoUrl,
      activo: empresa.activo,
      frecuenciaPago: empresa.frecuenciaPago,
    });
    setEmpresaDialogOpen(true);
  }, []);

  // NEW HANDLER
  const handleRegisterPayment = useCallback((empresa: EmpresaRecord) => {
    setEmpresaToRegisterPayment(empresa);
  }, []);

  // Cambiamos handleConfirmDelete para manejar el toggle de estado
  const handleConfirmToggleStatus = useCallback((empresa: EmpresaRecord) => {
    setEmpresaToToggleStatus(empresa);
  }, []);

  const confirmToggleStatus = useCallback(() => {
    if (empresaToToggleStatus) {
      const newStatus = !empresaToToggleStatus.activo;
      // Usamos la mutación de actualización para cambiar el estado 'activo'
      updateEmpresaMutation.mutate({
        idEmpresa: empresaToToggleStatus.idEmpresa,
        payload: { activo: newStatus },
      });
    }
  }, [empresaToToggleStatus, updateEmpresaMutation]);

  // --- Effects ---

  useEffect(() => {
    setHeaderText('Gestión de Empresas');
    const header = (
      <EmpresaManagementHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onCreateEmpresaClick={handleCreateEmpresaClick}
        isMobile={isMobile}
      />
    );
    setHeaderContent(header);

    return () => {
      setHeaderText(null);
      setHeaderContent(null);
    };
  }, [
    setHeaderText,
    setHeaderContent,
    searchQuery,
    handleSearchChange,
    handleCreateEmpresaClick,
    isMobile,
  ]);

  // --- Render Logic ---

  if (!canManageEmpresas) {
    // Redirigir o mostrar error si el usuario no es admin
    return (
      <MessageBar intent="error" className={styles.root}>
        <MessageBarBody>
          <Text>Acceso denegado. Solo los administradores pueden gestionar empresas.</Text>
        </MessageBarBody>
      </MessageBar>
    );
  }

  if (isLoadingEmpresas) {
    return <SpinnerCustom text="Cargando empresas" />;
  }

  if (empresasError) {
    return <Text color="danger">Error: {(empresasError as Error).message}</Text>;
  }

  return (
    <div className={styles.root}>
      <Card className={styles.card}>
        <div className={styles.tableContainer}>
          <EmpresaTable
            empresas={empresas}
            onEditEmpresa={handleEditEmpresa}
            onConfirmDelete={handleConfirmToggleStatus} // Usar el handler de toggle
            onRegisterPayment={handleRegisterPayment}
            isAnyMutationPending={isAnyMutationPending}
          />
        </div>
        <CardFooter className={styles.footer}>
          <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <Text>
            Página {page} de {totalPages}
          </Text>
          <Button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
            Siguiente
          </Button>
        </CardFooter>
      </Card>

      <EmpresaDialog
        open={isEmpresaDialogOpen}
        onOpenChange={handleCloseEmpresaDialog} // Use the new close handler
        onSubmit={handleEmpresaSubmit}
        isSubmitting={isAnyMutationPending}
        empresaToEdit={empresaToEdit}
      />

      {empresaToToggleStatus && (
        <ConfirmationDialog
          open={!!empresaToToggleStatus}
          onOpenChange={() => setEmpresaToToggleStatus(null)}
          onConfirm={confirmToggleStatus}
          title={`Confirmar ${empresaToToggleStatus.activo ? 'Desactivación' : 'Reactivación'} de Empresa`}
          message={`¿Estás seguro de que quieres ${empresaToToggleStatus.activo ? 'desactivar' : 'reactivar'} la empresa "${empresaToToggleStatus.razonSocial}" (CUIT: ${empresaToToggleStatus.cuit})?`}
          message2={
            empresaToToggleStatus.activo
              ? "La empresa pasará a estado 'Inactiva' y sus usuarios no podrán iniciar sesión."
              : "La empresa pasará a estado 'Activa' y sus usuarios podrán iniciar sesión."
          }
          isDestructive={empresaToToggleStatus.activo}
        />
      )}
      
      {empresaToRegisterPayment && (
        <PagoDialog
          open={!!empresaToRegisterPayment}
          onOpenChange={() => setEmpresaToRegisterPayment(null)}
          idEmpresa={empresaToRegisterPayment.idEmpresa}
          razonSocial={empresaToRegisterPayment.razonSocial}
          frecuenciaPago={empresaToRegisterPayment.frecuenciaPago}
        />
      )}
    </div>
  );
}