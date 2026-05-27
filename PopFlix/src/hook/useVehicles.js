import { ref } from 'vue';
import { bookingService } from '@/services/bookingService';

export function useVehicles() {
    const userVehicles = ref([]);
    const isVehicleLoading = ref(false);
    const vehicleError = ref('');

    const loadUserVehicles = async () => {
        isVehicleLoading.value = true;
        vehicleError.value = '';
        try {
            const data = await bookingService.getMyVehicles();
            userVehicles.value = data || [];
        } catch (err) {
            console.error("Failed to fetch vehicles from database:", err);
            vehicleError.value = err.response?.data?.message || 'Could not sync vehicles fleet.';
        } finally {
            isVehicleLoading.value = false;
        }
    };

    const createNewVehicle = async (vehicleFormPayload) => {
        isVehicleLoading.value = true;
        vehicleError.value = "";
        try {
            const newVehicle = await bookingService.addVehicle(vehicleFormPayload);
            userVehicles.value.push(newVehicle);
            return newVehicle;
        } catch (err) {
            console.error("Failed to store vehicle in database:", err);
            vehicleError.value = err.response?.data?.message || "Could not save new vehicles";
            throw err;
        } finally {
            isVehicleLoading.value = false;
        }
    };

    const deleteVehicleInstance = async (vehicleId, index) => {
        vehicleError.value = '';
        try {
            await bookingService.deleteVehicle(vehicleId);
            userVehicles.value.splice(index, 1);
        } catch (err) {
            console.error("Database rejected vehicle deletion loop:", err);
            vehicleError.value = err.response?.data?.message || "Failed to delete vehicle.";
            throw err;
        }
    };

    return {
        userVehicles,
        isVehicleLoading,
        vehicleError,
        loadUserVehicles,
        createNewVehicle,
        deleteVehicleInstance
    }
}