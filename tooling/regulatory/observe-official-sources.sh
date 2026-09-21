#!/usr/bin/env bash
set -u

root_dir="${1:-.}"
output_dir="${2:-ci-evidence/regulatory-observation}"
config_path="${root_dir}/config/regulatory/source-observation.json"
mkdir -p "${output_dir}/payloads"

observed_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
platform="$(uname -s)-$(uname -m)"
results_file="${output_dir}/results.ndjson"
: > "${results_file}"

python3 - "${config_path}" <<'PY' | while IFS=$'\t' read -r id source url file maximum_bytes timeout_seconds; do
import json
import sys

config = json.load(open(sys.argv[1], encoding="utf-8"))
for target in config["targets"]:
    print("\t".join([
        target["id"],
        target["source"],
        target["url"],
        target["file"],
        str(config["policy"]["maximumBytes"]),
        str(config["policy"]["timeoutSeconds"]),
    ]))
PY
  temporary="${output_dir}/payloads/.${file}.partial"
  destination="${output_dir}/payloads/${file}"
  error_file="${output_dir}/payloads/${file}.error.txt"
  rm -f "${temporary}" "${destination}" "${error_file}"
  if curl --fail --silent --show-error --proto '=https' --max-redirs 0 \
      --max-time "${timeout_seconds}" --max-filesize "${maximum_bytes}" \
      --output "${temporary}" "${url}" 2>"${error_file}"; then
    size="$(wc -c < "${temporary}" | tr -d ' ')"
    if [ "${size}" -gt 0 ] && [ "${size}" -le "${maximum_bytes}" ]; then
      mv "${temporary}" "${destination}"
      sha256="$(shasum -a 256 "${destination}" | cut -d ' ' -f 1)"
      status="captured"
      error=""
    else
      status="failed"
      sha256=""
      error="SIZE_BOUND"
      rm -f "${temporary}"
    fi
  else
    status="failed"
    size=0
    sha256=""
    error="$(tr '\n\r' '  ' < "${error_file}" | cut -c 1-500)"
    rm -f "${temporary}"
  fi
  python3 - "${id}" "${source}" "${url}" "${file}" "${status}" "${size}" "${sha256}" "${error}" >> "${results_file}" <<'PY'
import json
import sys

keys = ["id", "source", "url", "file", "status", "bytes", "sha256", "error"]
values = sys.argv[1:]
values[5] = int(values[5])
print(json.dumps(dict(zip(keys, values)), ensure_ascii=False, sort_keys=True))
PY
done

python3 - "${results_file}" "${output_dir}/manifest.json" "${observed_at}" "${platform}" <<'PY'
import json
import sys

results = [json.loads(line) for line in open(sys.argv[1], encoding="utf-8") if line.strip()]
manifest = {
    "schemaVersion": 1,
    "observer": "REGULATORY-SOURCE-OBSERVER-0001",
    "observedAt": sys.argv[3],
    "platform": sys.argv[4],
    "tls": "platform-default verification; no bypass or weakened policy",
    "results": results,
}
with open(sys.argv[2], "w", encoding="utf-8", newline="\n") as handle:
    json.dump(manifest, handle, ensure_ascii=False, indent=2, sort_keys=True)
    handle.write("\n")
PY

rm -f "${results_file}" "${output_dir}"/payloads/*.error.txt
