#!/usr/bin/env bash
# Deploy para Azure Storage Account (Static Website)
# Pré-requisitos: Azure CLI (az login já executado)
# Uso: ./deploy/deploy-azure.sh [RESOURCE_GROUP] [STORAGE_ACCOUNT] [LOCATION]

set -euo pipefail

RESOURCE_GROUP="${1:-personal-finance-rg}"
STORAGE_ACCOUNT="${2:-personalfinance$(date +%s | tail -c 8)}"
LOCATION="${3:-brazilsouth}"
DIST_DIR="$(dirname "$0")/../dist"

echo "==> [1/5] Verificando build..."
if [ ! -d "$DIST_DIR" ]; then
  echo "  Pasta /dist não encontrada. Executando build..."
  cd "$(dirname "$0")/.." && npm run build
fi

echo "==> [2/5] Criando Resource Group: ${RESOURCE_GROUP}"
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output none

echo "==> [3/5] Criando Storage Account: ${STORAGE_ACCOUNT}"
az storage account create \
  --name "$STORAGE_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku Standard_LRS \
  --kind StorageV2 \
  --allow-blob-public-access true \
  --output none

echo "==> [4/5] Ativando Static Website no contêiner \$web..."
az storage blob service-properties update \
  --account-name "$STORAGE_ACCOUNT" \
  --static-website \
  --index-document "index.html" \
  --404-document "index.html" \
  --output none

echo "==> [5/5] Fazendo upload dos arquivos para o contêiner \$web..."
az storage blob upload-batch \
  --account-name "$STORAGE_ACCOUNT" \
  --source "$DIST_DIR" \
  --destination "\$web" \
  --overwrite true \
  --output none

# index.html sem cache
az storage blob upload \
  --account-name "$STORAGE_ACCOUNT" \
  --container-name "\$web" \
  --name "index.html" \
  --file "$DIST_DIR/index.html" \
  --content-cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html; charset=utf-8" \
  --overwrite true \
  --output none

WEBSITE_URL=$(az storage account show \
  --name "$STORAGE_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --query "primaryEndpoints.web" \
  --output tsv)

echo ""
echo "✓ Deploy concluído!"
echo "  URL: ${WEBSITE_URL}"
echo ""
echo "  Opcional — Azure CDN para domínio customizado e HTTPS:"
echo "  az cdn profile create --resource-group ${RESOURCE_GROUP} \\"
echo "    --name personal-finance-cdn --sku Standard_Microsoft"
echo "  az cdn endpoint create --resource-group ${RESOURCE_GROUP} \\"
echo "    --profile-name personal-finance-cdn \\"
echo "    --name personal-finance-endpoint \\"
echo "    --origin ${STORAGE_ACCOUNT}.z13.web.core.windows.net \\"
echo "    --origin-host-header ${STORAGE_ACCOUNT}.z13.web.core.windows.net"
