import axios from "axios";
import { BASE_URL } from "../utils/system";
import type { LojaDTO } from "../models/loja";


export async function findAll(): Promise<LojaDTO[]>{

    const response = await axios.get(`${BASE_URL}/lojas`);

    return response.data;
    
}