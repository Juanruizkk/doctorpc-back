import { useState } from 'react';
import { Main, Box, Typography, Button, Alert } from '@strapi/design-system';
import { useFetchClient } from '@strapi/admin/strapi-admin';

const HomePage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { post } = useFetchClient();

  const onImport = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await post('/importer/import-products', formData);
      setResult(response.data);
    } catch (err: any) {
      setError(err.message || 'Error al importar productos');
      console.error('Error importing:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Main>
      <Box padding={8}>
        <Typography variant="alpha" as="h1">
          Importar Productos
        </Typography>

        <Box paddingTop={4}>
          <Typography variant="omega">
            Subí un archivo Excel (.xlsx) con las siguientes columnas:{' '}
            <strong>name, price, stock, brand, active, categories</strong>
          </Typography>
        </Box>

        <Box paddingTop={4}>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </Box>

        <Box paddingTop={4}>
          <Button disabled={!file || loading} onClick={onImport}>
            {loading ? 'Importando...' : 'Importar Productos'}
          </Button>
        </Box>

        {error && (
          <Box paddingTop={4}>
            <Alert variant="danger" title="Error">
              {error}
            </Alert>
          </Box>
        )}

        {result && (
          <Box paddingTop={4}>
            <Alert
              variant={result.errorCount > 0 ? 'warning' : 'success'}
              title={`Importación ${result.errorCount > 0 ? 'parcial' : 'exitosa'}`}
            >
              <Typography>
                Total procesados: {result.importedCount}
                {result.createdCount !== undefined && ` | Nuevos: ${result.createdCount}`}
                {result.updatedCount !== undefined && ` | Actualizados: ${result.updatedCount}`}
                {` | Errores: ${result.errorCount}`}
              </Typography>
            </Alert>

            {result.errors && result.errors.length > 0 && (
              <Box paddingTop={2}>
                <Typography variant="omega" fontWeight="bold">
                  Errores:
                </Typography>
                <pre
                  style={{
                    background: '#f6f6f9',
                    padding: '12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    maxHeight: '300px',
                    overflow: 'auto',
                  }}
                >
                  {JSON.stringify(result.errors, null, 2)}
                </pre>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Main>
  );
};

export { HomePage };
