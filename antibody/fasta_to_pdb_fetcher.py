from __future__ import annotations

from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Dict, List, Optional
import re

import requests


RCSB_SEARCH_URL = "https://search.rcsb.org/rcsbsearch/v2/query"
RCSB_MMCIF_DOWNLOAD = "https://files.rcsb.org/download/{entry_id}.cif"
RCSB_PDB_DOWNLOAD = "https://files.rcsb.org/download/{entry_id}.pdb"


class RCSBSearchError(RuntimeError):
    pass


class StructureDownloadError(RuntimeError):
    pass


@dataclass
class SequenceMatch:
    identifier: str
    score: float
    entry_id: str
    polymer_entity_id: Optional[str] = None


@dataclass
class FetchResult:
    query_sequence_length: int
    entry_id: str
    identifier: str
    score: float
    download_path: str
    file_format: str
    search_hits_considered: int

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def clean_fasta_sequence(text: str) -> str:
    lines = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith(">"):
            continue
        lines.append(stripped)

    seq = "".join(lines).upper()
    seq = re.sub(r"[^A-Z]", "", seq)
    return seq


def build_sequence_query(
    sequence: str,
    identity_cutoff: float = 0.3,
    evalue_cutoff: float = 10.0,
    sequence_type: str = "protein",
    return_type: str = "polymer_entity",
) -> Dict[str, Any]:
    return {
        "query": {
            "type": "terminal",
            "service": "sequence",
            "parameters": {
                "evalue_cutoff": evalue_cutoff,
                "identity_cutoff": identity_cutoff,
                "target": "pdb_protein_sequence",
                "value": sequence,
                "sequence_type": sequence_type,
            },
        },
        "return_type": return_type,
        "request_options": {
            "results_verbosity": "minimal",
            "paginate": {"start": 0, "rows": 25},
        },
    }


def search_rcsb_by_sequence(
    sequence: str,
    identity_cutoff: float = 0.3,
    evalue_cutoff: float = 10.0,
    timeout: int = 30,
) -> List[SequenceMatch]:
    if not sequence:
        raise ValueError("Sequence is empty after FASTA cleaning")

    payload = build_sequence_query(
        sequence=sequence,
        identity_cutoff=identity_cutoff,
        evalue_cutoff=evalue_cutoff,
        sequence_type="protein",
        return_type="polymer_entity",
    )

    try:
        resp = requests.post(RCSB_SEARCH_URL, json=payload, timeout=timeout)

        if resp.status_code == 204:
            return []

        resp.raise_for_status()
    except requests.RequestException as exc:
        raise RCSBSearchError(f"RCSB sequence search failed: {exc}") from exc

    try:
        data = resp.json()
    except ValueError as exc:
        raise RCSBSearchError("RCSB sequence search returned non-JSON data") from exc

    if not isinstance(data, dict):
        raise RCSBSearchError(f"Unexpected RCSB response type: {type(data).__name__}")

    results = data.get("result_set", [])
    matches: List[SequenceMatch] = []

    for item in results:
        if isinstance(item, dict):
            identifier = item.get("identifier", "")
            score = float(item.get("score", 0.0))
        elif isinstance(item, str):
            identifier = item
            score = 0.0
        else:
            continue

        entry_id = identifier.split("_")[0] if identifier else ""
        polymer_entity_id = identifier.split("_")[1] if "_" in identifier else None

        if entry_id:
            matches.append(
                SequenceMatch(
                    identifier=identifier,
                    score=score,
                    entry_id=entry_id,
                    polymer_entity_id=polymer_entity_id,
                )
            )

    return matches


def choose_best_match(matches: List[SequenceMatch]) -> SequenceMatch:
    if not matches:
        raise RCSBSearchError("No matching structures found in RCSB PDB")

    matches = sorted(matches, key=lambda m: (m.score, m.entry_id), reverse=True)
    return matches[0]


def download_structure_file(
    entry_id: str,
    out_dir: str | Path,
    file_format: str = "pdb",
    timeout: int = 60,
) -> Path:
    fmt = file_format.lower().strip()
    if fmt not in {"cif", "pdb"}:
        raise ValueError("file_format must be 'cif' or 'pdb'")

    url = (
        RCSB_MMCIF_DOWNLOAD.format(entry_id=entry_id)
        if fmt == "cif"
        else RCSB_PDB_DOWNLOAD.format(entry_id=entry_id)
    )

    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    file_path = out_path / f"{entry_id}.{fmt}"

    try:
        resp = requests.get(url, timeout=timeout)
        resp.raise_for_status()
    except requests.RequestException as exc:
        raise StructureDownloadError(f"Failed to download {fmt} for {entry_id}: {exc}") from exc

    file_path.write_bytes(resp.content)
    return file_path


def fetch_best_structure_for_sequence(
    sequence: str,
    out_dir: str | Path,
    identity_cutoff: float = 0.3,
    evalue_cutoff: float = 10.0,
    file_format: str = "pdb",
) -> Dict[str, Any]:
    cleaned = clean_fasta_sequence(sequence)
    if not cleaned:
        raise RCSBSearchError("No valid amino-acid sequence found after FASTA cleaning")

    matches = search_rcsb_by_sequence(
        sequence=cleaned,
        identity_cutoff=identity_cutoff,
        evalue_cutoff=evalue_cutoff,
    )
    best = choose_best_match(matches)
    path = download_structure_file(best.entry_id, out_dir=out_dir, file_format=file_format)

    result = FetchResult(
        query_sequence_length=len(cleaned),
        entry_id=best.entry_id,
        identifier=best.identifier,
        score=best.score,
        download_path=str(path),
        file_format=file_format,
        search_hits_considered=len(matches),
    )
    return result.to_dict()
