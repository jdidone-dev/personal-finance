#!/usr/bin/env bash
# Deploy para AWS S3 Static Website
# Pré-requisitos: AWS CLI configurado (aws configure), jq instalado
# Uso: ./deploy/deploy-aws.sh [BUCKET_NAME] [REGION]

set -euo pipefail

BUCKET="${1:-personal-finance-app-$(date +%s)}"
REGION="${2:-us-east-1}"
DIST_DIR="$(dirname "$0")/../dist"

echo "==> [1/5] Verificando build..."
if [ ! -d "$DIST_DIR" ]; then
  echo "  Pasta /dist não encontrada. Executando build..."
  cd "$(dirname "$0")/.." && npm run build
fi

echo "==> [2/5] Criando bucket S3: s3://${BUCKET}"
aws s3api create-bucket \
  --bucket "$BUCKET" \
  --region "$REGION" \
  $([ "$REGION" != "us-east-1" ] && echo "--create-bucket-configuration LocationConstraint=$REGION") \
  --no-cli-pager

echo "==> [3/5] Desabilitando Block Public Access..."
aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

echo "==> [4/5] Aplicando política de leitura pública..."
aws s3api put-bucket-policy \
  --bucket "$BUCKET" \
  --policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
      \"Sid\": \"PublicReadGetObject\",
      \"Effect\": \"Allow\",
      \"Principal\": \"*\",
      \"Action\": \"s3:GetObject\",
      \"Resource\": \"arn:aws:s3:::${BUCKET}/*\"
    }]
  }"

echo "==> [5/5] Ativando Static Website Hosting..."
aws s3api put-bucket-website \
  --bucket "$BUCKET" \
  --website-configuration '{
    "IndexDocument": {"Suffix": "index.html"},
    "ErrorDocument": {"Key": "index.html"}
  }'

echo ""
echo "==> Sincronizando arquivos do /dist..."
# Cache-Control: sem cache para index.html, 1 ano para assets com hash
aws s3 sync "$DIST_DIR" "s3://${BUCKET}/" \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

aws s3 cp "$DIST_DIR/index.html" "s3://${BUCKET}/index.html" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html; charset=utf-8"

WEBSITE_URL="http://${BUCKET}.s3-website-${REGION}.amazonaws.com"
echo ""
echo "✓ Deploy concluído!"
echo "  URL: ${WEBSITE_URL}"
echo ""
echo "  Opcional — CloudFront para HTTPS:"
echo "  aws cloudfront create-distribution \\"
echo "    --origin-domain-name ${BUCKET}.s3.${REGION}.amazonaws.com \\"
echo "    --default-root-object index.html"
