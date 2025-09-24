import { Box, Typography } from "@mui/material";

export default function Footer() {
  return (
    <Box sx={{ p: 2, textAlign: "center" }}>
      <Typography variant="body2" color="text.secondary">
        @ {new Date().getFullYear()} Hub de Produtos
      </Typography>
    </Box>
  );
}
