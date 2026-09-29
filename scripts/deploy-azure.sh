#!/usr/bin/env bash
# Deploys the frontend as a Container App in the existing TicketHive environment.
# Run from the frontend repo root, logged in with `az login`:
#
#   ./scripts/deploy-azure.sh
#
# Safe to re-run. It builds the image with the gateway address baked in,
# creates or updates tickethive-frontend, then allows that origin at the gateway.
set -euo pipefail

RG="TicketHive-RG"
ENVIRONMENT="tickethive-env"
ACR="tickethiveacr"
MI="tickethive-apps-mi"
APP="tickethive-frontend"
MIN_REPLICAS="${MIN_REPLICAS:-1}"
ASGARDEO_CLIENT_ID="${VITE_ASGARDEO_CLIENT_ID:-vAVPIdqvfL3f78HtKFBPMLv3Qywa}"

say() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

ACR_SERVER="$(az acr show -g "$RG" -n "$ACR" --query loginServer -o tsv)"
MI_ID="$(az identity show -g "$RG" -n "$MI" --query id -o tsv)"
DOMAIN="$(az containerapp env show -g "$RG" -n "$ENVIRONMENT" --query properties.defaultDomain -o tsv)"
GATEWAY="https://$(az containerapp show -g "$RG" -n tickethive-gateway --query properties.configuration.ingress.fqdn -o tsv)"
FRONTEND="https://${APP}.${DOMAIN}"
TAG="$(git rev-parse --short HEAD 2>/dev/null || date +%s)"
IMAGE="${ACR_SERVER}/${APP}:${TAG}"

say "Gateway:  $GATEWAY"
say "Frontend: $FRONTEND"

BUILD_ARGS=(
  --build-arg "VITE_GATEWAY_URL=$GATEWAY"
  --build-arg "VITE_IDENTITY_API_URL=$GATEWAY"
  --build-arg "VITE_CATALOG_API_URL=$GATEWAY"
  --build-arg "VITE_INVENTORY_API_URL=$GATEWAY"
  --build-arg "VITE_WAITING_ROOM_API_URL=$GATEWAY"
  --build-arg "VITE_BOOKING_API_URL=$GATEWAY"
  --build-arg "VITE_PAYMENT_API_URL=$GATEWAY"
  --build-arg "VITE_NOTIFICATION_API_URL=$GATEWAY"
  --build-arg "VITE_ASGARDEO_CLIENT_ID=$ASGARDEO_CLIENT_ID"
)

say "Build and push $IMAGE"
if docker info >/dev/null 2>&1; then
  az acr login -n "$ACR" -o none
  docker build "${BUILD_ARGS[@]}" -t "$IMAGE" .
  docker push "$IMAGE"
else
  # No local Docker: build inside ACR. (Some student subscriptions block ACR Tasks.)
  az acr build -r "$ACR" -t "${APP}:${TAG}" "${BUILD_ARGS[@]}" .
fi

say "Container App"
if az containerapp show -g "$RG" -n "$APP" -o none 2>/dev/null; then
  az containerapp update -g "$RG" -n "$APP" --image "$IMAGE" \
    --min-replicas "$MIN_REPLICAS" -o none
else
  az containerapp create -g "$RG" -n "$APP" \
    --environment "$ENVIRONMENT" \
    --image "$IMAGE" \
    --user-assigned "$MI_ID" \
    --registry-server "$ACR_SERVER" --registry-identity "$MI_ID" \
    --ingress external --target-port 80 \
    --cpu 0.25 --memory 0.5Gi \
    --min-replicas "$MIN_REPLICAS" --max-replicas 2 -o none
fi

say "Allow the frontend at the gateway and in Payment's PayHere URLs"
az containerapp update -g "$RG" -n tickethive-gateway \
  --set-env-vars "Cors__AllowedOrigins=${FRONTEND},http://localhost:5173" -o none
az containerapp update -g "$RG" -n tickethive-payment \
  --set-env-vars "PayHere__ReturnUrl=${FRONTEND}/checkout" "PayHere__CancelUrl=${FRONTEND}/checkout" -o none

say "Check"
printf 'frontend   %s\n' "$(curl -s -o /dev/null -w '%{http_code}' --max-time 60 "$FRONTEND/")"
printf 'deep link  %s\n' "$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$FRONTEND/checkout/x")"
printf 'gateway    %s\n' "$(curl -s -o /dev/null -w '%{http_code}' --max-time 90 "$GATEWAY/health/ready")"
printf 'CORS       %s\n' "$(curl -s -o /dev/null -D - --max-time 60 -X OPTIONS "$GATEWAY/api/catalog/events" \
  -H "Origin: $FRONTEND" -H 'Access-Control-Request-Method: GET' | grep -i '^access-control-allow-origin' || echo 'MISSING')"

cat <<MSG

Still to do by hand (console changes, cannot be scripted from here):
  Asgardeo  -> app ${ASGARDEO_CLIENT_ID}: add ${FRONTEND} to Authorized redirect URLs
               and Allowed origins (and as the logout redirect).
  PayHere   -> sandbox: add the domain ${APP}.${DOMAIN}.
               NotifyUrl is already ${GATEWAY}/api/payment/notify (set by 02-container-apps.sh).
Then open ${FRONTEND}
MSG
