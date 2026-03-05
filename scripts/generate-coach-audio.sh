#!/bin/zsh
# =============================================================================
# Generate pre-recorded coach audio using Botnoi TTS API
# Each coach has unique phrasing matching their personality
#
# ♀ Aiko     (speaker 26)  — ขี้เล่น น่ารัก ลงท้าย ค่ะ~ คะ~ นะคะ~
# ♀ Nadia    (speaker 9)   — จริงจัง มุ่งมั่น ลงท้าย ค่ะ คะ นะคะ
# ♂ Nattakan (speaker 543) — ขี้เล่น เป็นกันเอง ลงท้าย ครับ นะครับ
# ♂ MrBread  (speaker 31)  — ดุ ห้าวหาญ ลงท้าย ครับ หรือไม่ลงท้าย
# ♂ PhuyaiLee (speaker 37) — จิตใจดี เฟรนลี่ สำเนียงสุพรรณ ลงท้าย ครับผม จ้า เอ้า
# =============================================================================

BOTNOI_TOKEN="2XtOvwLar6vW5Pu2uGNQ1qZEVH72ZMad"
BOTNOI_URL="https://api-voice.botnoi.ai/openapi/v1/generate_audio"
BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)/public/assets"

# zsh associative arrays
typeset -A SPEAKERS FOLDERS
SPEAKERS=(aiko 26 nadia 9 nattakan 543 bread 31 phuyailee 37)
FOLDERS=(aiko ไอโกะ nadia นาเดียร์ nattakan ณัฐกานต์ bread นายเบรด phuyailee ผู้ใหญ่ลี)

TOTAL=0
SUCCESS=0
FAIL=0

generate_audio() {
  local coach="$1"
  local file_num="$2"
  local filename="$3"
  local text="$4"

  local speaker="${SPEAKERS[$coach]}"
  local folder="${FOLDERS[$coach]}"
  local output_dir="${BASE_DIR}/${folder}"
  local output_file="${output_dir}/${file_num}-${filename}.wav"

  if [[ -f "$output_file" ]]; then
    echo "  ⏭️  SKIP (exists): ${file_num}-${filename}"
    return 0
  fi

  TOTAL=$((TOTAL + 1))
  echo "  🎙️  [${coach}] #${file_num} ${filename}: \"${text}\""

  local response
  response=$(curl -s -X POST "$BOTNOI_URL" \
    -H "botnoi-token: ${BOTNOI_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"text\": \"${text}\",
      \"speaker\": \"${speaker}\",
      \"volume\": 1,
      \"speed\": 1,
      \"type_media\": \"mp3\",
      \"save_file\": \"true\",
      \"language\": \"th\",
      \"page\": \"user\"
    }" 2>/dev/null)

  local audio_url
  audio_url=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('audio_url',''))" 2>/dev/null)

  if [[ -z "$audio_url" ]]; then
    echo "  ❌ FAILED: No audio_url. Response: ${response:0:200}"
    FAIL=$((FAIL + 1))
    return 1
  fi

  local http_code
  http_code=$(curl -s -o "$output_file" -w "%{http_code}" "$audio_url" 2>/dev/null)

  if [[ "$http_code" = "200" ]] && [[ -s "$output_file" ]]; then
    local size=$(wc -c < "$output_file" | tr -d ' ')
    echo "  ✅ OK (${size} bytes) → ${file_num}-${filename}.wav"
    SUCCESS=$((SUCCESS + 1))
  else
    echo "  ❌ FAILED: Download error (HTTP ${http_code})"
    rm -f "$output_file"
    FAIL=$((FAIL + 1))
    return 1
  fi

  sleep 1.2
}

# =============================================================================
generate_for_coach() {
  local coach="$1"
  local folder="${FOLDERS[$coach]}"

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🎤 Coach: ${coach} (${folder}) | Speaker: ${SPEAKERS[$coach]}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  mkdir -p "${BASE_DIR}/${folder}"

  # ═══════════════════════════════════════════════════════════
  # GROUP A: Countdown (1 combined sentence)
  # ═══════════════════════════════════════════════════════════
  case "$coach" in
    aiko)     generate_audio "$coach" 21 "นับถอยหลัง" "สาม สอง หนึ่ง เริ่มเลยค่ะ!" ;;
    nadia)    generate_audio "$coach" 21 "นับถอยหลัง" "สาม สอง หนึ่ง เริ่มค่ะ" ;;
    nattakan) generate_audio "$coach" 21 "นับถอยหลัง" "สาม สอง หนึ่ง เริ่มเลยครับ!" ;;
    bread)    generate_audio "$coach" 21 "นับถอยหลัง" "สาม สอง หนึ่ง ลุยเลยครับ!" ;;
    phuyailee) generate_audio "$coach" 21 "นับถอยหลัง" "สาม สอง หนึ่ง เริ่มเลยจ้า!" ;;
  esac

  # ═══════════════════════════════════════════════════════════
  # GROUP B: Beat Count (4 files) — same for all coaches
  # ═══════════════════════════════════════════════════════════
  generate_audio "$coach" 22 "นับหนึ่ง" "หนึ่ง"
  generate_audio "$coach" 23 "นับสอง" "สอง"
  generate_audio "$coach" 24 "นับสาม" "สาม"
  generate_audio "$coach" 25 "นับสี่" "สี่"

  # ═══════════════════════════════════════════════════════════
  # GROUP C: Rep Milestones (4 files)
  # ═══════════════════════════════════════════════════════════
  case "$coach" in
    aiko)
      generate_audio "$coach" 26 "ครั้งที่หนึ่ง" "หนึ่ง! เริ่มต้นดีค่ะ!"
      generate_audio "$coach" 27 "ครั้งที่ห้า" "ห้า! ครึ่งทางแล้วนะคะ สู้ๆ ค่ะ!"
      generate_audio "$coach" 28 "ครั้งที่เก้า" "เก้า! อีกครั้งเดียวค่ะ เกือบเสร็จแล้ว!"
      generate_audio "$coach" 29 "ครั้งที่สิบ" "สิบ! เสร็จแล้วค่ะ เก่งมากเลย!"
      ;;
    nadia)
      generate_audio "$coach" 26 "ครั้งที่หนึ่ง" "หนึ่ง เริ่มต้นดีค่ะ"
      generate_audio "$coach" 27 "ครั้งที่ห้า" "ห้า ครึ่งทางแล้วค่ะ ทำต่อไป"
      generate_audio "$coach" 28 "ครั้งที่เก้า" "เก้า อีกครั้งสุดท้ายค่ะ"
      generate_audio "$coach" 29 "ครั้งที่สิบ" "สิบ จบท่านี้แล้วค่ะ เก่งมาก"
      ;;
    nattakan)
      generate_audio "$coach" 26 "ครั้งที่หนึ่ง" "หนึ่ง! เริ่มต้นดีครับ!"
      generate_audio "$coach" 27 "ครั้งที่ห้า" "ห้า! ครึ่งทางแล้วครับ สู้ๆ!"
      generate_audio "$coach" 28 "ครั้งที่เก้า" "เก้า! อีกครั้งสุดท้ายแล้วครับ!"
      generate_audio "$coach" 29 "ครั้งที่สิบ" "สิบ! เสร็จท่านี้แล้ว เก่งมากครับ!"
      ;;
    bread)
      generate_audio "$coach" 26 "ครั้งที่หนึ่ง" "หนึ่ง! เอาให้สุดเลยครับ!"
      generate_audio "$coach" 27 "ครั้งที่ห้า" "ห้า! ครึ่งทางแล้ว ห้ามหยุดนะครับ!"
      generate_audio "$coach" 28 "ครั้งที่เก้า" "เก้า! อีกครั้งเดียว สู้ครับ!"
      generate_audio "$coach" 29 "ครั้งที่สิบ" "สิบ! จบครับ! ทำได้ดีมาก!"
      ;;
    phuyailee)
      generate_audio "$coach" 26 "ครั้งที่หนึ่ง" "หนึ่ง! เริ่มต้นดีครับผม!"
      generate_audio "$coach" 27 "ครั้งที่ห้า" "ห้า! ครึ่งทางแล้วจ้า สู้ๆ นะครับ!"
      generate_audio "$coach" 28 "ครั้งที่เก้า" "เก้า! อีกครั้งเดียวจ้า เกือบเสร็จแล้ว!"
      generate_audio "$coach" 29 "ครั้งที่สิบ" "สิบ! เสร็จแล้วครับผม เก่งมากเลยจ้า!"
      ;;
  esac

  # ═══════════════════════════════════════════════════════════
  # GROUP D: Start Exercise (12 files)
  # ═══════════════════════════════════════════════════════════
  case "$coach" in
    # ─── Aiko ♀ ขี้เล่นน่ารัก ────────────────────────────
    aiko)
      generate_audio "$coach" 30 "เริ่มยกแขน" "มาเริ่มท่ายกแขนขึ้นลงกันเถอะค่ะ"
      generate_audio "$coach" 31 "เริ่มบิดลำตัว" "มาบิดลำตัวกันค่ะ สนุกแน่นอน!"
      generate_audio "$coach" 32 "เริ่มยกเข่า" "เริ่มท่ายกเข่าสลับนะคะ ได้เลยค่ะ!"
      generate_audio "$coach" 33 "เริ่มสควอตยกแขน" "ท่าสควอตพร้อมยกแขนค่ะ ทำตามได้เลย!"
      generate_audio "$coach" 34 "เริ่มวิดพื้น" "มาวิดพื้นกันค่ะ แข็งแรงขึ้นแน่นอนเลย!"
      generate_audio "$coach" 35 "เริ่มลันจ์" "ท่าลันจ์ยืนค่ะ ทำช้าๆ ได้เลยนะคะ!"
      generate_audio "$coach" 36 "เริ่มกระโดดสควอต" "กระโดดสควอตกันเถอะค่ะ สนุกมากเลย!"
      generate_audio "$coach" 37 "เริ่มแพลงค์" "มาทำแพลงค์กันค่ะ ค้างไว้ให้นานที่สุดนะ!"
      generate_audio "$coach" 38 "เริ่มปีนเขา" "ท่าปีนเขาค่ะ เร็วๆ ได้เลยนะคะ!"
      generate_audio "$coach" 39 "เริ่มสควอตขาเดียว" "ท่าสควอตขาเดียวค่ะ ท้าทายมากเลย!"
      generate_audio "$coach" 40 "เริ่มวิดพื้นแตะไหล่" "วิดพื้นแล้วแตะไหล่กันค่ะ เก่งมาก!"
      generate_audio "$coach" 41 "เริ่มเบอร์พี" "ท่าเบอร์พีค่ะ สุดยอดมากเลย!"
      ;;
    # ─── Nadia ♀ จริงจัง ────────────────────────────
    nadia)
      generate_audio "$coach" 30 "เริ่มยกแขน" "เริ่มท่ายกแขนขึ้นลงค่ะ ตั้งใจทำให้ดี"
      generate_audio "$coach" 31 "เริ่มบิดลำตัว" "ท่าบิดลำตัวค่ะ เน้นฟอร์มให้ถูกต้อง"
      generate_audio "$coach" 32 "เริ่มยกเข่า" "ท่ายกเข่าสลับค่ะ ยกให้สูงเลย"
      generate_audio "$coach" 33 "เริ่มสควอตยกแขน" "สควอตพร้อมยกแขนค่ะ ย่อให้ลึก"
      generate_audio "$coach" 34 "เริ่มวิดพื้น" "วิดพื้นค่ะ ทำให้เต็มที่ทุกครั้ง"
      generate_audio "$coach" 35 "เริ่มลันจ์" "ท่าลันจ์ยืนค่ะ ควบคุมการทรงตัวให้ดี"
      generate_audio "$coach" 36 "เริ่มกระโดดสควอต" "กระโดดสควอตค่ะ กระโดดให้เต็มแรง"
      generate_audio "$coach" 37 "เริ่มแพลงค์" "ท่าแพลงค์ค่ะ ลำตัวต้องตรง"
      generate_audio "$coach" 38 "เริ่มปีนเขา" "ท่าปีนเขาค่ะ เร็วและแม่นยำ"
      generate_audio "$coach" 39 "เริ่มสควอตขาเดียว" "สควอตขาเดียวค่ะ ท่านี้ต้องมีสมาธิ"
      generate_audio "$coach" 40 "เริ่มวิดพื้นแตะไหล่" "วิดพื้นแตะไหล่ค่ะ ห้ามเอียงตัว"
      generate_audio "$coach" 41 "เริ่มเบอร์พี" "ท่าเบอร์พีค่ะ ทำให้ครบทุกจังหวะ"
      ;;
    # ─── Nattakan ♂ ขี้เล่นเป็นกันเอง ────────────────────
    nattakan)
      generate_audio "$coach" 30 "เริ่มยกแขน" "เริ่มท่ายกแขนขึ้นลงกันเลยครับ!"
      generate_audio "$coach" 31 "เริ่มบิดลำตัว" "ท่าบิดลำตัว มาครับมา สนุกเลย!"
      generate_audio "$coach" 32 "เริ่มยกเข่า" "ท่ายกเข่าสลับ ได้เลยครับ!"
      generate_audio "$coach" 33 "เริ่มสควอตยกแขน" "สควอตพร้อมยกแขน ลุยเลยครับ!"
      generate_audio "$coach" 34 "เริ่มวิดพื้น" "มาวิดพื้นกันเลยครับ ทำเต็มที่!"
      generate_audio "$coach" 35 "เริ่มลันจ์" "ท่าลันจ์ยืนครับ ค่อยๆ ทำได้เลย!"
      generate_audio "$coach" 36 "เริ่มกระโดดสควอต" "กระโดดสควอตกันครับ มันส์แน่นอน!"
      generate_audio "$coach" 37 "เริ่มแพลงค์" "มาทำแพลงค์กันครับ ค้างไว้ให้นานๆ นะ!"
      generate_audio "$coach" 38 "เริ่มปีนเขา" "ท่าปีนเขาครับ ขยับเร็วๆ เลย!"
      generate_audio "$coach" 39 "เริ่มสควอตขาเดียว" "สควอตขาเดียวครับ ท้าทายมาก!"
      generate_audio "$coach" 40 "เริ่มวิดพื้นแตะไหล่" "วิดพื้นแตะไหล่ สุดยอดเลยครับ!"
      generate_audio "$coach" 41 "เริ่มเบอร์พี" "ท่าเบอร์พีครับ ท่าเทพเลย ลุย!"
      ;;
    # ─── Bread ♂ ดุ ห้าวหาญ ────────────────────────────
    bread)
      generate_audio "$coach" 30 "เริ่มยกแขน" "ท่ายกแขน ลุยเลยครับ!"
      generate_audio "$coach" 31 "เริ่มบิดลำตัว" "บิดลำตัว เอาให้สุดครับ!"
      generate_audio "$coach" 32 "เริ่มยกเข่า" "ยกเข่าสลับ ยกให้สูงเลยครับ!"
      generate_audio "$coach" 33 "เริ่มสควอตยกแขน" "สควอตยกแขน ห้ามชิลล์นะครับ!"
      generate_audio "$coach" 34 "เริ่มวิดพื้น" "วิดพื้น ลุยให้เต็มแรงเลยครับ!"
      generate_audio "$coach" 35 "เริ่มลันจ์" "ลันจ์ยืน ขาต้องสั่นเลยครับ!"
      generate_audio "$coach" 36 "เริ่มกระโดดสควอต" "กระโดดสควอต กระโดดให้สุดครับ!"
      generate_audio "$coach" 37 "เริ่มแพลงค์" "แพลงค์ ค้างไว้ ห้ามล้มนะครับ!"
      generate_audio "$coach" 38 "เริ่มปีนเขา" "ปีนเขา เร็วขึ้น เร็วขึ้นครับ!"
      generate_audio "$coach" 39 "เริ่มสควอตขาเดียว" "สควอตขาเดียว พิสูจน์ตัวเองเลยครับ!"
      generate_audio "$coach" 40 "เริ่มวิดพื้นแตะไหล่" "วิดพื้นแตะไหล่ ห้ามง่อนะครับ!"
      generate_audio "$coach" 41 "เริ่มเบอร์พี" "เบอร์พี ท่าแห่งความอดทน ลุยครับ!"
      ;;
    # ─── PhuyaiLee ♂ จิตใจดี เฟรนลี่ สำเนียงสุพรรณ ────────
    phuyailee)
      generate_audio "$coach" 30 "เริ่มยกแขน" "เอ้า มายกแขนขึ้นลงกันเถอะครับผม!"
      generate_audio "$coach" 31 "เริ่มบิดลำตัว" "มาบิดลำตัวกันจ้า สบายๆ เลยนะครับ!"
      generate_audio "$coach" 32 "เริ่มยกเข่า" "ท่ายกเข่าสลับจ้า ได้เลยครับผม!"
      generate_audio "$coach" 33 "เริ่มสควอตยกแขน" "สควอตพร้อมยกแขน ค่อยๆ ทำนะครับผม!"
      generate_audio "$coach" 34 "เริ่มวิดพื้น" "มาวิดพื้นกันจ้า ทำเท่าที่ไหวนะครับ!"
      generate_audio "$coach" 35 "เริ่มลันจ์" "ท่าลันจ์ยืนจ้า ค่อยๆ ย่อลงนะครับผม!"
      generate_audio "$coach" 36 "เริ่มกระโดดสควอต" "กระโดดสควอตกันเถอะจ้า สนุกเลยครับ!"
      generate_audio "$coach" 37 "เริ่มแพลงค์" "มาทำแพลงค์กันจ้า ค้างไว้ให้ได้เท่าที่ไหวนะ!"
      generate_audio "$coach" 38 "เริ่มปีนเขา" "ท่าปีนเขาจ้า ขยับตามจังหวะเลยครับผม!"
      generate_audio "$coach" 39 "เริ่มสควอตขาเดียว" "สควอตขาเดียวจ้า ท้าทายดีเลยนะครับ!"
      generate_audio "$coach" 40 "เริ่มวิดพื้นแตะไหล่" "วิดพื้นแตะไหล่จ้า ค่อยๆ ทำนะครับผม!"
      generate_audio "$coach" 41 "เริ่มเบอร์พี" "ท่าเบอร์พีจ้า สุดยอดเลยครับผม!"
      ;;
  esac

  # ═══════════════════════════════════════════════════════════
  # GROUP E: Coach Greeting (1 file)
  # ═══════════════════════════════════════════════════════════
  case "$coach" in
    aiko)     generate_audio "$coach" 42 "คำทักทาย" "มาออกกำลังกายกันเถอะค่ะ สนุกแน่นอนเลย!" ;;
    nadia)    generate_audio "$coach" 42 "คำทักทาย" "พร้อมรึยังคะ วันนี้ต้องทำให้ดีกว่าเดิมนะคะ" ;;
    nattakan) generate_audio "$coach" 42 "คำทักทาย" "มาครับมา ออกกำลังกายให้สนุกกันเลย!" ;;
    bread)    generate_audio "$coach" 42 "คำทักทาย" "ลุยเลยครับ วันนี้ห้ามถอย สู้ให้สุดตัว!" ;;
    phuyailee) generate_audio "$coach" 42 "คำทักทาย" "เอ้า มาออกกำลังกายกันเถอะครับผม สุขภาพดีๆ กันจ้า!" ;;
  esac

  # ═══════════════════════════════════════════════════════════
  # GROUP F: Tempo Feedback (9 files)
  # ═══════════════════════════════════════════════════════════
  case "$coach" in
    # ─── Aiko ♀ ────────────────────────────
    aiko)
      generate_audio "$coach" 43 "จังหวะเร็วเกิน" "เร็วเกินไปค่ะ ช้าลงหน่อยนะคะ"
      generate_audio "$coach" 44 "จังหวะเร็วนิด" "ลองช้าลงอีกนิดนะคะ"
      generate_audio "$coach" 45 "จังหวะช้าเกิน" "ช้าไปนิดค่ะ เพิ่มความเร็วหน่อยนะคะ"
      generate_audio "$coach" 46 "จังหวะช้านิด" "ลองเร็วขึ้นอีกนิดค่ะ"
      generate_audio "$coach" 47 "จังหวะไม่สม่ำเสมอ" "พยายามทำให้จังหวะสม่ำเสมอนะคะ"
      generate_audio "$coach" 48 "จังหวะขึ้นเร็ว" "ลองลดลงช้าๆ เท่ากับขึ้นค่ะ"
      generate_audio "$coach" 49 "จังหวะลงเร็ว" "ลองยกขึ้นช้าๆ เท่ากับลงนะคะ"
      generate_audio "$coach" 50 "จังหวะเพอร์เฟค" "จังหวะสมบูรณ์แบบค่ะ เยี่ยมมากเลย!"
      generate_audio "$coach" 51 "จังหวะดี" "จังหวะดีค่ะ ทำต่อไปนะคะ!"
      ;;
    # ─── Nadia ♀ ────────────────────────────
    nadia)
      generate_audio "$coach" 43 "จังหวะเร็วเกิน" "เร็วเกินไปค่ะ ลดความเร็วลง"
      generate_audio "$coach" 44 "จังหวะเร็วนิด" "ช้าลงอีกนิดค่ะ"
      generate_audio "$coach" 45 "จังหวะช้าเกิน" "ช้าไปค่ะ เร็วขึ้นได้เลย"
      generate_audio "$coach" 46 "จังหวะช้านิด" "เร็วขึ้นอีกนิดค่ะ"
      generate_audio "$coach" 47 "จังหวะไม่สม่ำเสมอ" "ทำจังหวะให้สม่ำเสมอค่ะ"
      generate_audio "$coach" 48 "จังหวะขึ้นเร็ว" "ลดลงช้าๆ เท่ากับขึ้นค่ะ"
      generate_audio "$coach" 49 "จังหวะลงเร็ว" "ยกขึ้นช้าๆ เท่ากับลงค่ะ"
      generate_audio "$coach" 50 "จังหวะเพอร์เฟค" "จังหวะสมบูรณ์แบบค่ะ เยี่ยมมาก"
      generate_audio "$coach" 51 "จังหวะดี" "จังหวะดีค่ะ ทำต่อไป"
      ;;
    # ─── Nattakan ♂ ────────────────────────────
    nattakan)
      generate_audio "$coach" 43 "จังหวะเร็วเกิน" "เร็วเกินไปครับ ลดความเร็วลงหน่อย"
      generate_audio "$coach" 44 "จังหวะเร็วนิด" "ลองช้าลงอีกนิดครับ"
      generate_audio "$coach" 45 "จังหวะช้าเกิน" "ช้าไปครับ เพิ่มความเร็วหน่อย"
      generate_audio "$coach" 46 "จังหวะช้านิด" "ลองเร็วขึ้นอีกนิดครับ"
      generate_audio "$coach" 47 "จังหวะไม่สม่ำเสมอ" "พยายามทำให้จังหวะสม่ำเสมอครับ"
      generate_audio "$coach" 48 "จังหวะขึ้นเร็ว" "ลองลดลงช้าๆ เท่ากับขึ้นครับ"
      generate_audio "$coach" 49 "จังหวะลงเร็ว" "ลองยกขึ้นช้าๆ เท่ากับลงครับ"
      generate_audio "$coach" 50 "จังหวะเพอร์เฟค" "จังหวะสมบูรณ์แบบครับ เยี่ยมมาก!"
      generate_audio "$coach" 51 "จังหวะดี" "จังหวะดีครับ ทำต่อไป!"
      ;;
    # ─── Bread ♂ ดุ ────────────────────────────
    bread)
      generate_audio "$coach" 43 "จังหวะเร็วเกิน" "เร็วเกินครับ ใจเย็น ควบคุมจังหวะ"
      generate_audio "$coach" 44 "จังหวะเร็วนิด" "ช้าลงนิดครับ"
      generate_audio "$coach" 45 "จังหวะช้าเกิน" "ช้าไปครับ เร็วขึ้นสิ ขยับเลย!"
      generate_audio "$coach" 46 "จังหวะช้านิด" "เร็วขึ้นอีกครับ ได้อยู่!"
      generate_audio "$coach" 47 "จังหวะไม่สม่ำเสมอ" "จังหวะต้องสม่ำเสมอครับ ตั้งสติ"
      generate_audio "$coach" 48 "จังหวะขึ้นเร็ว" "ลดลงช้าๆ ควบคุมทุกจังหวะครับ"
      generate_audio "$coach" 49 "จังหวะลงเร็ว" "ยกขึ้นช้าๆ อย่ารีบครับ"
      generate_audio "$coach" 50 "จังหวะเพอร์เฟค" "จังหวะเป๊ะมากครับ สุดยอด!"
      generate_audio "$coach" 51 "จังหวะดี" "จังหวะดีครับ ทำต่อไป!"
      ;;
    # ─── PhuyaiLee ♂ จิตใจดี สุพรรณ ────────────────────
    phuyailee)
      generate_audio "$coach" 43 "จังหวะเร็วเกิน" "เร็วเกินไปจ้า ค่อยๆ ทำนะครับผม"
      generate_audio "$coach" 44 "จังหวะเร็วนิด" "ลองช้าลงอีกหน่อยนะจ้า"
      generate_audio "$coach" 45 "จังหวะช้าเกิน" "ช้าไปนิดจ้า เพิ่มความเร็วหน่อยนะครับผม"
      generate_audio "$coach" 46 "จังหวะช้านิด" "ลองเร็วขึ้นอีกนิดนะจ้า"
      generate_audio "$coach" 47 "จังหวะไม่สม่ำเสมอ" "พยายามทำจังหวะให้สม่ำเสมอนะครับผม"
      generate_audio "$coach" 48 "จังหวะขึ้นเร็ว" "ลองลดลงช้าๆ เท่ากับขึ้นนะจ้า"
      generate_audio "$coach" 49 "จังหวะลงเร็ว" "ลองยกขึ้นช้าๆ เท่ากับลงนะครับผม"
      generate_audio "$coach" 50 "จังหวะเพอร์เฟค" "จังหวะดีม๊ากครับผม สุดยอดเลยจ้า!"
      generate_audio "$coach" 51 "จังหวะดี" "จังหวะดีครับผม ทำต่อไปเลยจ้า!"
      ;;
  esac

  # ═══════════════════════════════════════════════════════════
  # GROUP G: Movement Quality (5 files)
  # ═══════════════════════════════════════════════════════════
  case "$coach" in
    # ─── Aiko ♀ ────────────────────────────
    aiko)
      generate_audio "$coach" 52 "เคลื่อนไหวเร็ว" "เร็วเกินไปค่ะ ลดความเร็วลง ค่อยๆ ทำนะคะ"
      generate_audio "$coach" 53 "เคลื่อนไหวช้า" "ลองเพิ่มความเร็วขึ้นอีกหน่อยนะคะ"
      generate_audio "$coach" 54 "เคลื่อนไหวกระตุก" "พยายามเคลื่อนไหวให้ราบรื่นขึ้นค่ะ"
      generate_audio "$coach" 55 "เคลื่อนไหวดี" "การเคลื่อนไหวราบรื่นดีมากค่ะ เก่งเลย!"
      generate_audio "$coach" 56 "ไม่เคลื่อนไหว" "เริ่มเคลื่อนไหวได้เลยค่ะ สู้ๆ นะคะ!"
      ;;
    # ─── Nadia ♀ ────────────────────────────
    nadia)
      generate_audio "$coach" 52 "เคลื่อนไหวเร็ว" "เร็วเกินไปค่ะ ลดความเร็วลง ควบคุมการเคลื่อนไหว"
      generate_audio "$coach" 53 "เคลื่อนไหวช้า" "เพิ่มความเร็วขึ้นอีกหน่อยค่ะ"
      generate_audio "$coach" 54 "เคลื่อนไหวกระตุก" "เคลื่อนไหวให้ราบรื่นกว่านี้ค่ะ"
      generate_audio "$coach" 55 "เคลื่อนไหวดี" "การเคลื่อนไหวราบรื่นดีมากค่ะ"
      generate_audio "$coach" 56 "ไม่เคลื่อนไหว" "เริ่มเคลื่อนไหวได้เลยค่ะ"
      ;;
    # ─── Nattakan ♂ ────────────────────────────
    nattakan)
      generate_audio "$coach" 52 "เคลื่อนไหวเร็ว" "เร็วเกินไปครับ ลดความเร็วลง ค่อยๆ ทำนะ"
      generate_audio "$coach" 53 "เคลื่อนไหวช้า" "ลองเพิ่มความเร็วขึ้นอีกหน่อยครับ"
      generate_audio "$coach" 54 "เคลื่อนไหวกระตุก" "พยายามเคลื่อนไหวให้ราบรื่นขึ้นครับ"
      generate_audio "$coach" 55 "เคลื่อนไหวดี" "การเคลื่อนไหวราบรื่นดีมากครับ เยี่ยม!"
      generate_audio "$coach" 56 "ไม่เคลื่อนไหว" "เริ่มเคลื่อนไหวได้เลยครับ สู้ๆ!"
      ;;
    # ─── Bread ♂ ดุ ────────────────────────────
    bread)
      generate_audio "$coach" 52 "เคลื่อนไหวเร็ว" "เร็วเกินครับ ใจเย็น ควบคุมร่างกาย!"
      generate_audio "$coach" 53 "เคลื่อนไหวช้า" "เร็วขึ้นครับ ขยับเลย!"
      generate_audio "$coach" 54 "เคลื่อนไหวกระตุก" "เคลื่อนไหวให้นิ่งกว่านี้ครับ"
      generate_audio "$coach" 55 "เคลื่อนไหวดี" "เคลื่อนไหวดีมากครับ สุดยอด!"
      generate_audio "$coach" 56 "ไม่เคลื่อนไหว" "ขยับเลยครับ อย่าอยู่เฉย!"
      ;;
    # ─── PhuyaiLee ♂ จิตใจดี สุพรรณ ────────────────────
    phuyailee)
      generate_audio "$coach" 52 "เคลื่อนไหวเร็ว" "เร็วไปหน่อยจ้า ค่อยๆ ทำนะครับผม"
      generate_audio "$coach" 53 "เคลื่อนไหวช้า" "ลองเพิ่มความเร็วอีกนิดนะจ้า"
      generate_audio "$coach" 54 "เคลื่อนไหวกระตุก" "พยายามเคลื่อนไหวให้ราบรื่นขึ้นนะครับผม"
      generate_audio "$coach" 55 "เคลื่อนไหวดี" "การเคลื่อนไหวดีม๊ากเลยครับผม เก่งจ้า!"
      generate_audio "$coach" 56 "ไม่เคลื่อนไหว" "เริ่มเคลื่อนไหวได้เลยจ้า สู้ๆ นะครับผม!"
      ;;
  esac

  # ═══════════════════════════════════════════════════════════
  # GROUP J: Session Messages (4 files)
  # ═══════════════════════════════════════════════════════════
  case "$coach" in
    # ─── Aiko ♀ ────────────────────────────
    aiko)
      generate_audio "$coach" 57 "ยินดีต้อนรับ" "สวัสดีค่ะ พร้อมออกกำลังกายกันเถอะ!"
      generate_audio "$coach" 58 "ผ่านครึ่งทาง" "ผ่านไปครึ่งทางแล้วนะคะ สู้ๆ ค่ะ!"
      generate_audio "$coach" 59 "เกือบเสร็จแล้ว" "เหลืออีกนิดเดียวค่ะ สู้ๆ นะคะ!"
      generate_audio "$coach" 60 "จบเซสชั่น" "ยอดเยี่ยมค่ะ ออกกำลังกายครบทุกท่าแล้ว!"
      ;;
    # ─── Nadia ♀ ────────────────────────────
    nadia)
      generate_audio "$coach" 57 "ยินดีต้อนรับ" "สวัสดีค่ะ พร้อมออกกำลังกายกันเถอะ"
      generate_audio "$coach" 58 "ผ่านครึ่งทาง" "ผ่านครึ่งทางแล้วค่ะ ทำต่อให้จบ"
      generate_audio "$coach" 59 "เกือบเสร็จแล้ว" "เหลืออีกนิดเดียวค่ะ อย่ายอมแพ้"
      generate_audio "$coach" 60 "จบเซสชั่น" "ยอดเยี่ยมค่ะ ออกกำลังกายครบทุกท่าแล้ว"
      ;;
    # ─── Nattakan ♂ ────────────────────────────
    nattakan)
      generate_audio "$coach" 57 "ยินดีต้อนรับ" "สวัสดีครับ พร้อมออกกำลังกายกันเลย!"
      generate_audio "$coach" 58 "ผ่านครึ่งทาง" "ผ่านไปครึ่งทางแล้วครับ สู้ๆ!"
      generate_audio "$coach" 59 "เกือบเสร็จแล้ว" "เหลืออีกนิดเดียวครับ สู้ๆ!"
      generate_audio "$coach" 60 "จบเซสชั่น" "ยอดเยี่ยมครับ ออกกำลังกายครบทุกท่าแล้ว!"
      ;;
    # ─── Bread ♂ ดุ ────────────────────────────
    bread)
      generate_audio "$coach" 57 "ยินดีต้อนรับ" "พร้อมรึยังครับ วันนี้ต้องสู้ให้สุด!"
      generate_audio "$coach" 58 "ผ่านครึ่งทาง" "ครึ่งทางแล้วครับ ห้ามหยุดนะ!"
      generate_audio "$coach" 59 "เกือบเสร็จแล้ว" "เหลืออีกนิดครับ สู้ อย่ายอมแพ้!"
      generate_audio "$coach" 60 "จบเซสชั่น" "จบแล้วครับ สุดยอดมาก ทำได้ดี!"
      ;;
    # ─── PhuyaiLee ♂ จิตใจดี สุพรรณ ────────────────────
    phuyailee)
      generate_audio "$coach" 57 "ยินดีต้อนรับ" "สวัสดีครับผม พร้อมออกกำลังกายกันเถอะจ้า!"
      generate_audio "$coach" 58 "ผ่านครึ่งทาง" "ผ่านไปครึ่งทางแล้วจ้า สู้ๆ นะครับผม!"
      generate_audio "$coach" 59 "เกือบเสร็จแล้ว" "เหลืออีกนิดเดียวจ้า สู้ๆ นะครับผม!"
      generate_audio "$coach" 60 "จบเซสชั่น" "ยอดเยี่ยมครับผม ออกกำลังกายครบแล้วจ้า เก่งมาก!"
      ;;
  esac
}

# =============================================================================
# MAIN
# =============================================================================

echo "🚀 KAYA Coach Audio Generator"
echo "================================="
echo "Target: ${BASE_DIR}"
echo ""

for coach in aiko nadia nattakan bread phuyailee; do
  generate_for_coach "$coach"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 DONE! Total: ${TOTAL} | ✅ Success: ${SUCCESS} | ❌ Failed: ${FAIL}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
