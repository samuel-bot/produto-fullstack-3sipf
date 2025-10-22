import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CategoriaDTO } from "../../../models/categoria";
import type { LojaDTO } from "../../../models/loja";

type FormData = {
    nome: string;
    descricao: string;
    valor: number | "";
    categoriaId: number | "";
    lojasId: number[];
}

type FormErrors = {
    nome: string | null;
    descricao: string | null;
    valor: string | null;
    categoriaId: string | null;
    lojasId: string | null;
}


export default function EditarProdutoForm() {

    const { produtoId } = useParams<{ produtoId: string }>();

    const navigate = useNavigate();

    const [formData, setFormData] = useState<FormData>({
        nome: "",
        descricao: "",
        valor: "",
        categoriaId: "",
        lojasId: [],
    });

    const [categotias, setCategotias] = useState<CategoriaDTO[]>([]);
    const [lojas, setlojas] = useState<LojaDTO[]>([]);
    const [isLoading, setisLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

        const [formErrors, setFormErrors] = useState<FormErrors>({
            nome: null,
            descricao: null,
            valor: null,
            categoriaId: null,
            lojasId: null,
        });

        const [rawValor, setRawValor] = useState<string>(
            formData.valor ?  String(formData.valor) : ""
        );




    useEffect(() => {
        setisLoading(true);
        setError(null);

        const loadFormData = async () => {
            if(!produtoId) {
                setError("Nenhum ID de produto fornecido para edição.");
                return;
            }
                try{
                    const [produtoData, categoriasData, lojasData] = await Promise.all([
                        produtoService.findById(Number(produtoId)),
                        categoriaService.findAll(),
                        lojaService.findAll(),
                    ])
                }
        }
        if(produtoId){
            console.log("Carregando produto para edição");
        }
    }, [produtoId]);

    return (
        <Box sx={{ mt: 2, p: 4}}>
            <Typography variant="h4" component="h1">
                Editar Produto
            </Typography>
        </Box>
    )

}