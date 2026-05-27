import backendClient from "@/api/backendClient";
import { API_ENDPOINTS } from "@/api/apiEndpoint";

export const getExperiencesByKey=async(key)=>{
    try{
        const response=await backendClient.get(`${API_ENDPOINTS.EXPERIENCES}/${key}`);
        return response.data;
    }catch(err){
        console.error("API ERROR:", err);
        return [];
    }
};