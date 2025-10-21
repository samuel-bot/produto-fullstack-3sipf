import axios from "axios";
import type { ProdutoDTO } from "../models/produto";
import { BASE_URL } from "../utils/system";


export async function findAll(): Promise<ProdutoDTO[]> {
    
    const response = await axios.get(`${BASE_URL}/produtos`);

    return response.data;
}

export async function deleteById(id: number) {
    
    await axios.delete(`${BASE_URL}/produtos/${id}`);
}