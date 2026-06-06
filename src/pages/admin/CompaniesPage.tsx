import { PermissionGuard } from '../../components/PermissionGuard';
import { CompanyManager } from '../../components/admin/CompanyManager';

export default function CompaniesPage() {
  return (
    <PermissionGuard permission="settings.manage_plans">
      <div className="space-y-6">
        <CompanyManager />
      </div>
    </PermissionGuard>
  );
}
