#!/bin/bash

INPUT_DIR="./originali"
OUTPUT_DIR="./ottimizzate"
MAX_SIZE=409600  # 400 KB in byte

# Assicurati che cwebp sia installato: brew install webp

find "$INPUT_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | while read -r file; do
  relative_path="${file#$INPUT_DIR/}"
  filename=$(basename "$relative_path")
  name="${filename%.*}"
  subfolder=$(dirname "$relative_path")
  mkdir -p "$OUTPUT_DIR/$subfolder"

  output_file="$OUTPUT_DIR/$subfolder/$name.webp"

  quality=65

  while true; do
    cwebp -quiet -q $quality -m 6 -mt -metadata none "$file" -o "$output_file"
    filesize=$(stat -f%z "$output_file") # macOS
    if [[ $filesize -le $MAX_SIZE || $quality -le 30 ]]; then
      break
    fi
    quality=$((quality - 5))
  done

  echo "✔️ $relative_path → $subfolder/$name.webp (qualità: $quality, dimensione: $((filesize / 1024)) KB)"
done

echo "🎉 Conversione completata! Tutto sotto 400 KB 🚀"

# mettere tutte le foto da ottimizzare per il web in una cartella "originali" e verà creata un'altra cartella ottimizzate.