
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import React, { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { LojaDTO } from "../../../models/loja";
import type { CategoriaDTO } from "../../../models/categoria";

import * as categoriaService from "../../../services/categoria-service";
import * as lojasService from "../../../services/loja-service";
import * as produtoService from "../../../services/produto-service";
import axios from "axios";
import { formatToBRL, unmaskCurrency } from "../../../utils/formatter";
import type { ProdutoCreateDTO } from "../../../models/produto";

// Reutilizando os tipos do formulário de Editar Produto
type FormData = {
  nome: string;
  descricao: string;
  valor: number | ""; // '' permite que o campo comece vazio
  categoriaId: number | "";
  lojasId: number[]; // lista de IDs para as lojas selecionadas
};

type FormErrors = {
  nome: string | null;
  descricao: string | null;
  valor: string | null;
  categoriaId: string | null;
  lojasId: string | null;
};

export default function NovoProdutoForm() {
  
  const navigate = useNavigate();

  // State para o Formulário
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    descricao: "",
    valor: "",
    categoriaId: "",
    lojasId: [],
  });

  // States para Dropdowns
  const [categorias, setCategorias] = useState<CategoriaDTO[]>([]);
  const [lojas, setLojas] = useState<LojaDTO[]>([]);

  // States de UI e Status
  const [isLoading, setIsLoading] = useState(true); // Controla o carregamento INICIAL de dependências
  const [isSubmitting, setIsSubmitting] = useState(false); // Controla o estado de envio do formulário
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // State de erros de validação por campo
  const [formErrors, setFormErrors] = useState<FormErrors>({
    nome: null,
    descricao: null,
    valor: null,
    categoriaId: null,
    lojasId: null,
  });

  // State auxiliar para o campo Valor (string formatada)
  const [rawValor, setRawValor] = useState<string>(
    formData.valor ? String(formData.valor) : ""
  );

  // --- Functions de manipulação de formulário ---

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;

    // 1. Lógica para o Campo VALOR (usa o state auxiliar rawValor)
    if (name === "valor") {
      const rawInput = value.replace(/[^\d,.]/g, "");
      setRawValor(rawInput);
      return;
    }
    // 2. Lógica para o Select de Categoria
    else if (name === "categoriaId") {
      const selectValue = value === "" ? "" : Number(value);
      setFormData((prevData) => ({
        ...prevData,
        [name]: selectValue,
      }));
    }
    // 3. Lógica para o Multi-Select de Lojas
    else if (name === "lojasId") {
      let newLojasId: number[] = [];
      const selectedValues = Array.isArray(value) ? value : [value];

      newLojasId = selectedValues
        .map((id) => Number(id))
        .filter((id) => !isNaN(id));
      setFormData((prevData) => ({
        ...prevData,
        [name]: newLojasId,
      }));
    }
    // 4. Lógica para os demais campos de texto (nome, descricao)
    else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleBlurValor = () => {
    
    const valorDigitado = rawValor;

    if (!valorDigitado) {
      setRawValor("");
      setFormData((prevData) => ({ ...prevData, valor: "" }));
      return;
    }
    const numericValue = unmaskCurrency(valorDigitado);

    const finalValue = numericValue === 0 ? "" : numericValue;

    let stringFormatada: string;
    if (finalValue !== "") {
      stringFormatada = formatToBRL(finalValue);
    } else {
      stringFormatada = "";
    }
    setRawValor(stringFormatada);
    setFormData((prevData) => ({
      ...prevData,
      valor: finalValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 1. Limpeza de Status e Ativação do Loading de SUBMISSÃO
    setError(null);
    setSuccess(null);
    setIsSubmitting(true); // <--- Usa o isSubmitting para desabilitar o botão

    // 2. Limpa todos os erros de campo antes de começar o novo submit
    setFormErrors({
      nome: null,
      descricao: null,
      valor: null,
      categoriaId: null,
      lojasId: null,
    });

    try {
      const dataToSend = { ...formData };
      // Objeto para pegar erros de Frontend
      const validationErrors: Partial<FormErrors> = {};
      let hasFrontendError = false;
      // Limpa espaços em branco para validação de tamanho/vazio
      const nomeTrim = dataToSend.nome.trim();
      const descricaoTrim = dataToSend.descricao.trim();

      // --- INÍCIO DA VALIDAÇÃO DO FRONTEND ---

      // Validação: Nome
      if (nomeTrim.length === 0) {
        validationErrors.nome = "O campo Nome é obrigatório";
        hasFrontendError = true;
      } else if (nomeTrim.length < 3 || nomeTrim.length > 100) {
        validationErrors.nome =
          "O campo Nome deve ter entre 3 e 100 caracteres";
        hasFrontendError = true;
      }

      // Validação: Descrição
      if (descricaoTrim.length === 0) {
        validationErrors.descricao = "O campo Descrição é obrigatório";
        hasFrontendError = true;
      } else if (descricaoTrim.length < 10) {
        validationErrors.descricao =
          "O campo Descrição deve ter no mínimo 10 caracteres";
        hasFrontendError = true;
      }

      // Validação: Valor
      const valorNumber = Number(dataToSend.valor);
      if (dataToSend.valor === "" || isNaN(valorNumber)) {
        validationErrors.valor =
          "O campo Valor é obrigatório e deve ser um número.";
        hasFrontendError = true;
      } else if (valorNumber <= 0) {
        validationErrors.valor =
          "O campo Valor deve ser um número positivo maior que zero.";
        hasFrontendError = true;
      }

      // Validação: Categoria
      if (dataToSend.categoriaId === "") {
        validationErrors.categoriaId = "Selecione uma Categoria";
        hasFrontendError = true;
      }

      // Validação: Lojas (Array)
      if (dataToSend.lojasId.length === 0) {
        validationErrors.lojasId = "Selecione pelo menos uma Loja";
        hasFrontendError = true;
      }

      // --- FIM DA VALIDAÇÃO DO FRONTEND ---

      // ------------------------------------------------------------------
      // Se houver qualquer erro de validação de frontend, exibe e interrompe o envio
      if (hasFrontendError) {
        setFormErrors((prev) => ({
          ...prev,
          ...validationErrors,
        }));
        // IMPORTANTE: Não precisamos chamar setIsSubmitting(false) aqui se o 'finally' for chamado.
        // No entanto, para garantir que o botão seja reabilitado imediatamente na validação local:
        setIsSubmitting(false);
        return; // Interrompe o submit aqui!
      }

      // 4. MONTAGEM DO DTO FINAL PARA A API (Se a validação local passou)
      const categoriaDTO = { id: Number(dataToSend.categoriaId) };
      const lojasDTO = dataToSend.lojasId.map((id) => ({ id: Number(id) }));

      const createDTO: ProdutoCreateDTO = {
        nome: nomeTrim,
        descricao: descricaoTrim,
        valor: valorNumber,
        categoria: categoriaDTO,
        lojas: lojasDTO,
      };

      // 5. Chamada do Serviço (API) - ONDE O SALVAMENTO OCORRE
      await produtoService.createProduto(createDTO);

      // 6. Sucesso
      setSuccess("Produto cadastrado com sucesso!");

      // Limpa o formulário após o sucesso (opcional)
      setFormData({
        nome: "",
        descricao: "",
        valor: "",
        categoriaId: "",
        lojasId: [],
      });
      setRawValor("");

      setTimeout(() => {
        navigate("/produtos");
      }, 3000);
    } catch (error: unknown) {
      // 7. Tratamento de Erro do Backend
      let msg = "Erro ao cadastrar o Produto. Tente novamente.";

      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data;

        // Tratamento de Erro de Validação de Campo do Backend (Status 422)
        if (
          errorData.status === 422 &&
          errorData.errors &&
          Array.isArray(errorData.errors)
        ) {
          const newErrors: Partial<FormErrors> = {};
          errorData.errors.forEach(
            (err: { field: string; message: string }) => {
              let fieldName = err.field;
              // Mapeamento de campos aninhados do Spring para o estado do Formulário
              if (fieldName.includes("categoria")) {
                fieldName = "categoriaId";
              } else if (fieldName.includes("lojas")) {
                fieldName = "lojasId";
              }

              newErrors[fieldName as keyof FormErrors] = err.message;
              msg = errorData.message || msg;
            }
          );
          setFormErrors((prev) => ({
            ...prev,
            ...newErrors,
          }));
        } else {
          // Tratamento de Erros Gerais (404, 400, etc.)
          msg = errorData.message || errorData.error || msg;
        }
      } else if (error instanceof Error) {
        msg = error.message;
      }

      setError(msg);
      setTimeout(() => setError(null), 4000);
    } finally {
      // 8. FINALIZAÇÃO: Desabilita o estado de submissão
      setIsSubmitting(false);
    }
  };

  // --- useeffect para carregar Categorias e Lojas (Corrigido) ---
  useEffect(() => {
    // Function para carregar as Listas (Definida DENTRO do useEffect)
    const loadDependenciesList = async () => {
      setIsLoading(true); // INICIA o loading de dependências
      setError(null);

      try {
        // Buscas paralelas
        const [categoriaData, lojasData] = await Promise.all([
          categoriaService.findAll(),
          lojasService.findAll(),
        ]);

        setCategorias(categoriaData);
        setLojas(lojasData);
      } catch (error: unknown) {
        let msg = "Erro ao carregar listas de Categorias e Lojas";
        if (axios.isAxiosError(error) && error.response) {
          msg = error.response.data.error || msg;
        }
        // Em caso de erro fatal no carregamento
        setError(msg);
        setTimeout(() => {
          navigate("/produtos", {
            // <--- CORRIGIDO: Adicionado a barra '/'
            state: { globalError: msg },
          });
        }, 3000);
      } finally {
        setIsLoading(false); // FINALIZA o loading (sucesso ou falha)
      }
    };

    // CHAMA A FUNÇÃO para que ela execute na montagem do componente
    loadDependenciesList();
  }, [navigate]);

  // --- RENDERIZAÇÃO (JSX) ---
  return (
    <Box sx={{ mt: 2, p: 4 }}>
      {/* MENSAGENS GLOBAIS DE SUCESSO/ERRO (Backend/Geral) */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Typography variant="h4" component="h1">
        Cadastrar Produto
      </Typography>

      {/* 1. EXIBIÇÃO DE LOADING INICIAL */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        // 2. EXIBIÇÃO DO FORMULÁRIO (Somente se não houver erro inicial)
        !error && (
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 1 }}
          >
            {/* 1. CAMPO NOME*/}
            <TextField
              margin="normal"
              required
              fullWidth
              id="nome"
              label="Nome do Produto"
              name="nome"
              autoFocus
              value={formData.nome}
              onChange={handleChange}
              // onBlur para trimar espaços (boa prática)
              onBlur={() => {
                const nomeAtual = formData.nome;
                const nomeTrimado = nomeAtual.trim();
                if (nomeAtual !== nomeTrimado) {
                  setFormData((prevData) => ({
                    ...prevData,
                    nome: nomeTrimado,
                  }));
                }
              }}
              error={!!formErrors.nome}
              helperText={formErrors.nome}
              disabled={isSubmitting}
              sx={{ mb: 2 }}
            />

            {/* 2. CAMPO DESCRIÇÃO */}
            <TextField
              margin="normal"
              required
              fullWidth
              multiline
              rows={3}
              id="descricao"
              label="Descrição do Produto"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              onBlur={() => {
                const descricaoAtual = formData.descricao;
                const descricaoTrimado = descricaoAtual.trim();
                if (descricaoAtual !== descricaoTrimado) {
                  setFormData((prevData) => ({
                    ...prevData,
                    descricao: descricaoTrimado,
                  }));
                }
              }}
              error={!!formErrors.descricao}
              helperText={formErrors.descricao}
              disabled={isSubmitting}
              sx={{ mb: 2 }}
            />

            {/* 3. CAMPO VALOR */}
            <TextField
              margin="normal"
              required
              fullWidth
              id="valor"
              label="Valor do Produto"
              name="valor"
              value={rawValor} // <<< USA O ESTADO DE STRING AUXILIAR
              onChange={handleChange}
              onBlur={handleBlurValor} // <<< CHAMA A LIMPEZA E SALVAMENTO FINAL
              error={!!formErrors.valor}
              helperText={formErrors.valor}
              disabled={isSubmitting}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">R$</InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            {/* 4. Select para Categoria */}
            <FormControl
              fullWidth
              margin="normal"
              required
              sx={{ mb: 2 }}
              error={!!formErrors.categoriaId}
              disabled={isSubmitting}
            >
              <InputLabel id="categoria-label">Categoria</InputLabel>
              <Select
                labelId="categoria-label"
                id="categoriaId"
                name="categoriaId"
                value={
                  formData.categoriaId === ""
                    ? ""
                    : String(formData.categoriaId)
                }
                label="Categoria"
                onChange={handleChange}
              >
                <MenuItem value="">
                  <em>Selecione uma Categoria</em>
                </MenuItem>
                {categorias.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.nome}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.categoriaId && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ ml: 2, mt: 0.5 }}
                >
                  {formErrors.categoriaId}
                </Typography>
              )}
            </FormControl>

            {/* 5. Multi-Select para Lojas */}
            <FormControl
              fullWidth
              margin="normal"
              required
              sx={{ mb: 2 }}
              error={!!formErrors.lojasId}
              disabled={isSubmitting}
            >
              <InputLabel id="lojas">Lojas</InputLabel>
              <Select
                labelId="lojas"
                id="lojas-multiple-chip"
                multiple
                name="lojasId"
                value={formData.lojasId}
                // Usamos uma função anônima para garantir a tipagem correta
                onChange={(event) => handleChange(event as SelectChangeEvent)}
                label="Lojas"
                renderValue={(selectedIds: number[]) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selectedIds.map((id) => {
                      const loja = lojas.find((l) => l.id === id);
                      return (
                        <Chip key={id} label={loja ? loja.nome : `ID ${id}`} />
                      );
                    })}
                  </Box>
                )}
              >
                {lojas.map((loja) => (
                  <MenuItem key={loja.id} value={loja.id}>
                    {loja.nome}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.lojasId && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ ml: 2, mt: 0.5 }}
                >
                  {formErrors.lojasId}
                </Typography>
              )}
            </FormControl>

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
                mt: 3,
              }}
            >
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate("/produtos")}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="large"
                variant="contained"
                disabled={isSubmitting} // Desabilita o botão durante o submit
              >
                {isSubmitting ? <CircularProgress size={24} /> : "Salvar"}
              </Button>
            </Box>
          </Box>
        )
      )}
    </Box>
  );
}
