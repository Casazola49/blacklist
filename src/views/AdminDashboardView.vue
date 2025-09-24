<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900"
  >
    <!-- Header -->
    <header
      class="border-b border-brand-primary/20 bg-black/50 backdrop-blur-sm"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-4">
            <div class="text-2xl font-bold text-brand-primary">
              <GlitchText text="CONSERJE" />
            </div>
            <div class="text-sm text-gray-400">Panel de Administración</div>
          </div>

          <div class="flex items-center space-x-4">
            <div class="text-sm text-gray-300">
              {{ authStore.userProfile?.alias }}
            </div>
            <NeonButton @click="handleLogout" variant="secondary" size="sm">
              Salir
            </NeonButton>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Navigation Tabs -->
      <div class="mb-8">
        <nav class="flex space-x-8">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'px-3 py-2 text-sm font-medium rounded-md transition-all duration-200',
              activeTab === tab.id
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25'
                : 'text-gray-400 hover:text-white hover:bg-gray-800',
            ]"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="space-y-6">
        <!-- Dashboard Overview -->
        <div v-if="activeTab === 'overview'">
          <AdminOverview />
        </div>

        <!-- User Management -->
        <div v-if="activeTab === 'users'">
          <UserManagement />
        </div>

        <!-- Contract Supervision -->
        <div v-if="activeTab === 'contracts'">
          <ContractSupervision />
        </div>

        <!-- Dispute Resolution -->
        <div v-if="activeTab === 'disputes'">
          <DisputeResolution />
        </div>

        <!-- Financial Dashboard -->
        <div v-if="activeTab === 'finances'">
          <FinancialDashboard />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import GlitchText from "../components/ui/GlitchText.vue";
import NeonButton from "../components/ui/NeonButton.vue";
import AdminOverview from "../components/admin/AdminOverview.vue";
import UserManagement from "../components/admin/UserManagement.vue";
import ContractSupervision from "../components/admin/ContractSupervision.vue";
import DisputeResolution from "../components/admin/DisputeResolution.vue";
import FinancialDashboard from "../components/admin/FinancialDashboard.vue";

const router = useRouter();
const authStore = useAuthStore();

const activeTab = ref("overview");

const tabs = [
  { id: "overview", label: "Resumen" },
  { id: "users", label: "Usuarios" },
  { id: "contracts", label: "Contratos" },
  { id: "disputes", label: "Disputas" },
  { id: "finances", label: "Finanzas" },
];

const handleLogout = async () => {
  try {
    await authStore.signOut();
    router.push("/");
  } catch (error) {
    console.error("Error logging out:", error);
  }
};

onMounted(() => {
  // Verify admin access
  if (!authStore.userProfile || authStore.userProfile.tipo !== "admin") {
    router.push("/");
  }
});
</script>
