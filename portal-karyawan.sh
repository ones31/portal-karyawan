#!/bin/bash
# Script wrapper untuk komunikasi agent OpenClaw dengan Portal Karyawan Vercel

TOKEN="c336a103ab11951da90f92a65d07b46ea4f9d455d35dc52e381568a8a22929e2"
API_BASE="https://portal-karyawan-theta.vercel.app/api/admin"

ACTION=$1
SUB_ACTION=$2
TARGET_ID=$3

if [ "$ACTION" = "ringkasan" ]; then
  curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/ringkasan-agent"
elif [ "$ACTION" = "setujui" ] || [ "$ACTION" = "tolak" ]; then
  STATUS="setujui"
  if [ "$ACTION" = "tolak" ]; then
    STATUS="tolak"
  fi
  
  # SUB_ACTION: izin / tukar-libur
  # TARGET_ID: id dari ringkasan
  curl -s -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"id\":\"$TARGET_ID\",\"tipe\":\"$SUB_ACTION\",\"aksi\":\"$STATUS\"}" \
    "$API_BASE/agent-approval"
else
  echo '{"error":"Aksi tidak dikenal. Gunakan ringkasan, setujui <izin|tukar-libur> <id>, atau tolak <izin|tukar-libur> <id>"}'
fi
