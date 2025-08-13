// ===================================================
// src/modules/auth/permission-key.enum.ts
// ===================================================
export const enum PermissionKey {
    // Permisos de Usuario
    ViewOwnUser = 'ViewOwnUser',
    ViewAnyUser = 'ViewAnyUser',
    ViewTenantUser = 'ViewTenantUser',
    CreateAnyUser = 'CreateAnyUser',
    CreateTenantUser = 'CreateTenantUser',
    UpdateOwnUser = 'UpdateOwnUser',
    UpdateTenantUser = 'UpdateTenantUser',
    UpdateAnyUser = 'UpdateAnyUser',
    DeleteTenantUser = 'DeleteTenantUser',
    DeleteAnyUser = 'DeleteAnyUser',

    // Permisos de Tenant
    ViewTenant = 'ViewTenant',
    CreateTenant = 'CreateTenant',
    UpdateTenant = 'UpdateTenant',
    DeleteTenant = 'DeleteTenant',

    // Permisos de Rol
    ViewRole = 'ViewRole',
    CreateRole = 'CreateRole',
    UpdateRole = 'UpdateRole',
    DeleteRole = 'DeleteRole',

    // Permisos de Auditoría
    ViewAudit = 'ViewAudit',
    CreateAudit = 'CreateAudit',
    UpdateAudit = 'UpdateAudit',
    DeleteAudit = 'DeleteAudit',

    // ===================================================
    // PERMISOS DE E-CARDS (LO IMPORTANTE)
    // ===================================================

    // Crear Tarjetas
    CreateCard = 'CreateCard',

    // Ver Tarjetas
    ViewOwnCard = 'ViewOwnCard', // Solo mis tarjetas
    ViewTenantCard = 'ViewTenantCard', // 🆕 Tarjetas de mi tenant
    ViewAnyCard = 'ViewAnyCard', // Todas las tarjetas (solo super admin)

    // Actualizar Tarjetas
    UpdateOwnCard = 'UpdateOwnCard', // Solo mis tarjetas
    UpdateTenantCard = 'UpdateTenantCard', // 🆕 Tarjetas de mi tenant
    UpdateAnyCard = 'UpdateAnyCard', // Todas las tarjetas (solo super admin)

    // Eliminar Tarjetas
    DeleteOwnCard = 'DeleteOwnCard', // Solo mis tarjetas
    DeleteTenantCard = 'DeleteTenantCard', // 🆕 Tarjetas de mi tenant
    DeleteAnyCard = 'DeleteAnyCard', // Todas las tarjetas (solo super admin)

    // Funciones Especiales
    DuplicateCard = 'DuplicateCard', // Duplicar tarjetas
    ViewCardStats = 'ViewCardStats', // Ver estadísticas
    ViewCardAnalytics = 'ViewCardAnalytics', // Analytics avanzados
    ExportCardData = 'ExportCardData', // Exportar datos
    ManageCardStyles = 'ManageCardStyles', // Gestionar estilos/plantillas
}
